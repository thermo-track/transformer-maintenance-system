"""Fine-tuning pipeline orchestrating dataset assembly and YOLO training."""

from __future__ import annotations

import json
import logging
import shutil
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional

MODULE_ROOT = Path(__file__).resolve().parent
if str(MODULE_ROOT) not in sys.path:
    sys.path.insert(0, str(MODULE_ROOT))

import config
from dataset import DatasetBuildResult, build_dataset
from schemas import FineTuneRequest


@dataclass
class TrainingSummary:
    run_id: str
    weights_path: Path
    metrics: Dict[str, float]
    log_path: Path
    dataset_size: int
    feedback_samples: int
    replay_samples: int
    hyperparams: Dict[str, object]


class FineTuneError(RuntimeError):
    """Raised when fine-tuning cannot be completed."""


def _reset_previous_outputs() -> None:
    for path in (config.RUNS_DIR, config.LOGS_DIR):
        if path.exists():
            shutil.rmtree(path, ignore_errors=True)
        path.mkdir(parents=True, exist_ok=True)


def _setup_logger(run_id: str) -> tuple[logging.Logger, Path]:
    log_path = config.LOGS_DIR / f"{run_id}.log"
    logger = logging.getLogger(f"tms_finetune.{run_id}")
    logger.setLevel(logging.INFO)
    while logger.handlers:
        logger.handlers.pop()
    formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")
    fh = logging.FileHandler(log_path, encoding="utf-8")
    fh.setFormatter(formatter)
    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(formatter)
    logger.addHandler(fh)
    logger.addHandler(sh)
    return logger, log_path


def _resolve_device(requested: Optional[str], logger: logging.Logger) -> str:
    import torch

    if not requested or requested.lower() == "auto":
        if torch.cuda.is_available():
            logger.info("Using CUDA device 0")
            return "0"
        logger.info("Falling back to CPU")
        return "cpu"

    if requested.lower() == "cpu":
        return "cpu"

    if not torch.cuda.is_available():
        logger.warning("CUDA unavailable; using CPU instead of '%s'", requested)
        return "cpu"

    devices = [item.strip() for item in requested.split(",") if item.strip()]
    valid_devices = []
    for dev in devices:
        try:
            idx = int(dev)
        except ValueError:
            logger.warning("Invalid CUDA device '%s'; skipping", dev)
            continue
        if idx < 0 or idx >= torch.cuda.device_count():
            logger.warning("CUDA device index %d out of range; skipping", idx)
            continue
        valid_devices.append(str(idx))
    if not valid_devices:
        logger.warning("No valid CUDA devices resolved; using CPU")
        return "cpu"
    return ",".join(valid_devices)


def run_finetune(request: FineTuneRequest) -> TrainingSummary:
    from ultralytics import YOLO

    config.ensure_directories()

    base_weights = config.OUTPUT_WEIGHTS_DIR / "best_finetune.pt"
    if not base_weights.exists():
        base_weights = config.PRETRAINED_WEIGHTS

    if not base_weights.exists():
        raise FineTuneError(f"Base weights not found at {base_weights}")

    run_id = datetime.now(timezone.utc).strftime("finetune_%Y%m%dT%H%M%SZ")

    _reset_previous_outputs()
    logger, log_path = _setup_logger(run_id)

    logger.info("Starting fine-tune run %s", run_id)
    logger.info("Feedback images: %d", len(request.images))
    logger.info("Base weights: %s", base_weights)

    train_replay = request.train_replay if request.train_replay is not None else config.DEFAULT_TRAIN_REPLAY
    epochs = request.epochs if request.epochs is not None else config.DEFAULT_EPOCHS
    batch = request.batch_size if request.batch_size is not None else config.DEFAULT_BATCH_SIZE
    imgsz = request.image_size if request.image_size is not None else config.DEFAULT_IMAGE_SIZE
    lr0 = request.learning_rate if request.learning_rate is not None else config.DEFAULT_LR
    weight_decay = request.weight_decay if request.weight_decay is not None else config.DEFAULT_WEIGHT_DECAY
    momentum = request.momentum if request.momentum is not None else config.DEFAULT_MOMENTUM
    freeze = request.freeze if request.freeze is not None else config.DEFAULT_FREEZE
    seed = request.seed if request.seed is not None else config.DEFAULT_RANDOM_SEED

    device = _resolve_device(request.device, logger)

    dataset: DatasetBuildResult | None = None
    try:
        dataset = build_dataset(
            feedback_images=request.images,
            run_id=run_id,
            original_sample_count=train_replay,
            seed=seed,
            logger=logger,
        )
        logger.info(
            "Dataset ready at %s (feedback=%d, replay=%d)",
            dataset.dataset_root,
            len(dataset.feedback_pairs),
            len(dataset.replay_pairs),
        )

        model = YOLO(str(base_weights))
        results = model.train(
            data=str(dataset.yaml_path),
            epochs=epochs,
            batch=batch,
            imgsz=imgsz,
            lr0=lr0,
            weight_decay=weight_decay,
            momentum=momentum,
            device=device,
            freeze=freeze,
            seed=seed,
            project=str(config.RUNS_DIR),
            name=run_id,
            exist_ok=True,
            patience=max(5, epochs // 3),
            verbose=True,
        )
        save_dir = Path(results.save_dir)
        best_weights = save_dir / "weights" / "best.pt"
        last_weights = save_dir / "weights" / "last.pt"
        chosen_weights = best_weights if best_weights.exists() else last_weights

        destination = config.OUTPUT_WEIGHTS_DIR / "best_finetune.pt"
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(chosen_weights, destination)
        logger.info("Exported fine-tuned weights to %s", destination)

        eval_model = YOLO(str(destination))
        val_results = eval_model.val(
            data=str(dataset.yaml_path),
            split="test",
            device=device,
            imgsz=imgsz,
            batch=batch,
        )
        metrics = getattr(val_results, "results_dict", {}) or {}
        logger.info("Validation metrics: %s", json.dumps(metrics))

        summary = TrainingSummary(
            run_id=run_id,
            weights_path=destination,
            metrics=metrics,
            log_path=log_path,
            dataset_size=len(dataset.feedback_pairs) + len(dataset.replay_pairs),
            feedback_samples=len(dataset.feedback_pairs),
            replay_samples=len(dataset.replay_pairs),
            hyperparams={
                "epochs": epochs,
                "batch": batch,
                "imgsz": imgsz,
                "lr0": lr0,
                "weight_decay": weight_decay,
                "momentum": momentum,
                "freeze": freeze,
                "seed": seed,
                "device": device,
                "train_replay": train_replay,
            },
        )

        config.LAST_METRICS_PATH.write_text(json.dumps(asdict(summary), default=str, indent=2), encoding="utf-8")
        logger.info("Run summary written to %s", config.LAST_METRICS_PATH)
        return summary
    except Exception as exc:
        logger.exception("Fine-tuning run failed: %s", exc)
        raise FineTuneError(str(exc)) from exc
    finally:
        if dataset is not None and dataset.dataset_root.exists():
            shutil.rmtree(dataset.dataset_root, ignore_errors=True)
            logger.info("Cleaned up temporary dataset at %s", dataset.dataset_root)
