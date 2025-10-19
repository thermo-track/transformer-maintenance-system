"""Incremental fine-tuning entry point leveraging annotated feedback."""

from __future__ import annotations

import argparse
import json
import shutil
import tempfile
from datetime import datetime, timezone
import logging
import sys
from pathlib import Path
from typing import Dict, List, Tuple

from ultralytics import YOLO

from .annotation_store import AnnotationStore
from .feedback_dataset import register_feedback, list_feedback_samples
from .utils import link_file, sample_original_dataset
from . import config


def _setup_logger(run_name: str) -> tuple[logging.Logger, Path]:
    logs_dir = config.RUNS_DIR / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_path = logs_dir / f"{run_name}.log"
    logger = logging.getLogger(f"phase3.finetune.{run_name}")
    logger.setLevel(logging.INFO)
    # Clear existing handlers to avoid duplicates when re-running in notebooks
    while logger.handlers:
        logger.handlers.pop()
    fmt = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")
    fh = logging.FileHandler(log_path, encoding="utf-8")
    fh.setFormatter(fmt)
    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(fmt)
    logger.addHandler(fh)
    logger.addHandler(sh)
    return logger, log_path


def _normalize_annotations(annotations: List[Dict]) -> List[Dict]:
    """Ensure bounding boxes expose xyxy and class info."""
    normalized: List[Dict] = []
    for ann in annotations:
        entry = dict(ann)
        if entry.get("bbox_xyxy") is None:
            bbox = entry.get("bbox") or entry.get("bbox_xywh")
            if bbox is None:
                raise ValueError("Each annotation must include bbox[_xyxy|_xywh]")
            x, y, w, h = bbox
            entry["bbox_xyxy"] = [x, y, x + w, y + h]
        normalized.append(entry)
    return normalized


def _load_final_state(store: AnnotationStore, args: argparse.Namespace) -> Dict:
    if args.final_state:
        path = Path(args.final_state)
        with path.open("r", encoding="utf-8") as f:
            payload = json.load(f)
        if "image_id" not in payload:
            payload["image_id"] = path.stem
        return payload
    if not args.image_id:
        raise ValueError("Either --image-id or --final-state must be provided")
    return store.load_final_state(args.image_id)


def _prepare_training_pairs(
    feedback_limit: int,
    original_limit: int,
    *,
    seed: int,
) -> Tuple[List[Tuple[Path, Path]], List[Tuple[Path, Path]]]:
    feedback_samples = list_feedback_samples(limit=feedback_limit)
    feedback_pairs: List[Tuple[Path, Path]] = []
    for sample in feedback_samples:
        if not sample.label_path.exists():
            continue
        feedback_pairs.append((sample.image_path, sample.label_path))

    original_pairs = sample_original_dataset(original_limit, seed=seed) if original_limit > 0 else []
    return feedback_pairs, original_pairs


def _materialize_dataset(
    pairs: List[Tuple[Path, Path]],
    tmp_root: Path,
    prefix: str,
    *,
    link_strategy: str = "hardlink",
) -> Dict[str, int]:
    images_dir = tmp_root / "images"
    labels_dir = tmp_root / "labels"
    images_dir.mkdir(parents=True, exist_ok=True)
    labels_dir.mkdir(parents=True, exist_ok=True)
    used: Dict[str, int] = {"hardlink": 0, "symlink": 0, "copy": 0}
    for idx, (image_path, label_path) in enumerate(pairs):
        stem = f"{prefix}_{idx:03d}"
        image_dst = images_dir / f"{stem}{image_path.suffix.lower()}"
        label_dst = labels_dir / f"{stem}.txt"
        method_img = link_file(image_path, image_dst, strategy=link_strategy)
        method_lbl = link_file(label_path, label_dst, strategy=link_strategy)
        used[method_img] = used.get(method_img, 0) + 1
        used[method_lbl] = used.get(method_lbl, 0) + 1
    return used


def _write_dataset_yaml(tmp_root: Path) -> Path:
    yaml_path = tmp_root / "dataset.yaml"
    lines = [
        f"path: {tmp_root.as_posix()}",
        "train: images",
        f"val: { (config.ANNOTATED_DATASET_DIR / 'valid' / 'images').as_posix() }",
        f"test: { (config.ANNOTATED_DATASET_DIR / 'test' / 'images').as_posix() }",
        f"nc: {len(config.get_class_names())}",
        "names: [" + ", ".join(f"'{name}'" for name in config.get_class_names()) + "]",
    ]
    yaml_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return yaml_path


def _log_run(metadata: Dict) -> None:
    record = dict(metadata)
    config.RUN_HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    with config.RUN_HISTORY_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record))
        f.write("\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Incremental fine-tuning using feedback annotations")
    parser.add_argument("--image-id", type=str, help="Identifier of the annotated image")
    parser.add_argument("--final-state", type=str, help="Path to a JSON file with final annotations")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--lr0", type=float, default=5e-4)
    parser.add_argument("--weight-decay", type=float, default=2e-4)
    parser.add_argument("--momentum", type=float, default=0.937)
    parser.add_argument("--freeze", type=int, default=8, help="Number of backbone layers to freeze")
    parser.add_argument("--device", type=str, default="auto")
    parser.add_argument("--feedback-replay", type=int, default=4, help="Number of previous feedback samples to include")
    parser.add_argument("--original-replay", type=int, default=16, help="Number of original training samples to rehearse")
    parser.add_argument("--seed", type=int, default=123)
    parser.add_argument("--project", type=str, default=str(config.WEIGHTS_DIR))
    parser.add_argument("--name", type=str, default=None, help="Override run name")
    parser.add_argument("--keep-temp", action="store_true", help="Keep the temporary dataset for debugging")
    parser.add_argument("--link-strategy", type=str, default="hardlink", choices=["hardlink", "symlink", "copy"],
                        help="How to materialize the mini-dataset files (hardlink avoids extra disk use)")
    args = parser.parse_args()

    config.ensure_directories()
    store = AnnotationStore()
    final_state = _load_final_state(store, args)
    image_id = final_state["image_id"]
    annotations = _normalize_annotations(final_state.get("annotations", []))

    maintenance_image_path = Path(final_state["maintenance_image_path"])
    transformer_id = final_state.get("transformer_id")
    comment = final_state.get("comment")
    metadata = final_state.get("metadata", {})

    # Determine run name and initialize logging
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    run_name = args.name or f"finetune_{image_id}_{timestamp}"
    logger, log_path = _setup_logger(run_name)

    logger.info("Starting incremental fine-tune")
    logger.info("RUN_NAME: %s", run_name)
    logger.info("RUN_LOG: %s", str(log_path))
    logger.info("Base weights: %s", str(config.PHASE2_WEIGHTS_PATH))
    logger.info("Image ID: %s | Transformer: %s", image_id, str(transformer_id))
    logger.info("Hyperparams: epochs=%d batch=%d imgsz=%d lr0=%.6f wd=%.2e freeze=%d device=%s",
                args.epochs, args.batch, args.imgsz, args.lr0, args.weight_decay, args.freeze, args.device)

    register_feedback(
        image_id=image_id,
        maintenance_image_path=maintenance_image_path,
        annotations=annotations,
        transformer_id=transformer_id,
        comment=comment,
        metadata=metadata,
    )

    effective_feedback_limit = max(args.feedback_replay, 0) + 1
    feedback_pairs, original_pairs = _prepare_training_pairs(
        effective_feedback_limit,
        max(args.original_replay, 0),
        seed=args.seed,
    )

    if not feedback_pairs:
        logger.error("No feedback samples available. Aborting.")
        raise RuntimeError("No feedback samples found; annotate at least one image before fine-tuning.")

    tmp_root = Path(tempfile.mkdtemp(prefix="phase3_ft_", dir=str(config.PHASE3_ROOT)))

    try:
        logger.info("Composing temporary dataset at: %s", str(tmp_root))
        logger.info("Feedback samples: %d | Original replay: %d", len(feedback_pairs), len(original_pairs))
        used_fb = _materialize_dataset(feedback_pairs, tmp_root, prefix="fb", link_strategy=args.link_strategy)
        used_orig = _materialize_dataset(original_pairs, tmp_root, prefix="orig", link_strategy=args.link_strategy)
        logger.info("Link strategy used (feedback): %s", json.dumps(used_fb))
        logger.info("Link strategy used (original): %s", json.dumps(used_orig))
        # Estimate temp dir footprint in bytes (hardlinks don't duplicate on-disk data)
        total_bytes = 0
        for p in tmp_root.rglob("*"):
            if p.is_file():
                try:
                    total_bytes += p.stat().st_size
                except OSError:
                    pass
        logger.info("Temporary dataset apparent size: %.2f MB", total_bytes / (1024 * 1024))
        data_yaml = _write_dataset_yaml(tmp_root)
        logger.info("Dataset YAML written to: %s", str(data_yaml))

        base_weights = config.PHASE2_WEIGHTS_PATH
        if not base_weights.exists():
            logger.error("Base weights not found at %s", str(base_weights))
            raise FileNotFoundError(f"Base weights not found: {base_weights}")

        model = YOLO(str(base_weights))
        logger.info("Starting training with Ultralytics...")
        results = model.train(
            data=str(data_yaml),
            epochs=args.epochs,
            batch=args.batch,
            imgsz=args.imgsz,
            lr0=args.lr0,
            momentum=args.momentum,
            weight_decay=args.weight_decay,
            device=args.device,
            freeze=args.freeze,
            seed=args.seed,
            project=args.project,
            name=run_name,
            exist_ok=True,
            patience=max(3, args.epochs // 2),
            verbose=True,
        )
        logger.info("Training finished. Save dir: %s", str(Path(results.save_dir)))
        save_dir = Path(results.save_dir)
        best_weights = save_dir / "weights" / "best.pt"
        eval_model = YOLO(str(best_weights if best_weights.exists() else save_dir / "weights" / "last.pt"))
        logger.info("Evaluating on test split...")
        test_metrics = eval_model.val(data=str(data_yaml), split="test", device=args.device, imgsz=args.imgsz, batch=args.batch)
        metrics_dict = getattr(test_metrics, "results_dict", {}) or {}
        logger.info("Evaluation metrics: %s", json.dumps(metrics_dict))

        history_entry = {
            "run_name": run_name,
            "timestamp": timestamp,
            "image_id": image_id,
            "transformer_id": transformer_id,
            "weights_path": str(best_weights if best_weights.exists() else save_dir / "weights" / "last.pt"),
            "train_samples": len(feedback_pairs) + len(original_pairs),
            "feedback_samples": [str(p[0]) for p in feedback_pairs],
            "original_samples": [str(p[0]) for p in original_pairs],
            "metrics": metrics_dict,
        }
        _log_run(history_entry)

        print(json.dumps({**history_entry, "metrics": metrics_dict}, indent=2))
        # Emit a machine-readable line so the notebook can display the log path.
        print(f"RUN_LOG: {log_path}")
    finally:
        if args.keep_temp:
            msg = f"Temporary dataset preserved at: {tmp_root}"
            logger.info(msg)
            print(msg)
        else:
            shutil.rmtree(tmp_root, ignore_errors=True)
            logger.info("Temporary dataset cleaned up: %s", str(tmp_root))


if __name__ == "__main__":
    main()
