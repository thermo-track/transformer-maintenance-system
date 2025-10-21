"""Utilities for composing YOLO training datasets from feedback payloads."""

from __future__ import annotations

import hashlib
import logging
import random
import shutil
import sys
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import List, Sequence
from urllib.parse import urlparse

MODULE_ROOT = Path(__file__).resolve().parent
if str(MODULE_ROOT) not in sys.path:
    sys.path.insert(0, str(MODULE_ROOT))

import requests
from PIL import Image

import config
from schemas import FeedbackImage


@dataclass
class ImageLabelPair:
    image_path: Path
    label_path: Path


@dataclass
class DatasetBuildResult:
    dataset_root: Path
    yaml_path: Path
    feedback_pairs: List[ImageLabelPair]
    replay_pairs: List[ImageLabelPair]


def _safe_stem_from_url(url: str) -> str:
    parsed = urlparse(url)
    candidate = Path(parsed.path).stem or "download"
    digest = hashlib.sha1(url.encode("utf-8")).hexdigest()[:10]
    return f"{candidate}_{digest}"


def _download_image(url: str, target_path: Path, timeout: int = 30) -> Path:
    response = requests.get(url, timeout=timeout)
    response.raise_for_status()
    image_bytes = BytesIO(response.content)
    image = Image.open(image_bytes)
    mode = "RGB" if image.mode not in ("RGB", "L") else image.mode
    image = image.convert(mode)
    target_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(target_path)
    return target_path


def _write_feedback_label(detections, image_size, label_path: Path) -> None:
    width, height = image_size
    lines: List[str] = []
    for det in detections:
        bbox = det.box
        x_min = max(0.0, min(float(bbox.x_min), float(width)))
        y_min = max(0.0, min(float(bbox.y_min), float(height)))
        x_max = max(0.0, min(float(bbox.x_max), float(width)))
        y_max = max(0.0, min(float(bbox.y_max), float(height)))
        if x_max <= x_min or y_max <= y_min:
            continue
        x_center = ((x_min + x_max) / 2.0) / width
        y_center = ((y_min + y_max) / 2.0) / height
        box_width = (x_max - x_min) / width
        box_height = (y_max - y_min) / height
        lines.append(f"{det.class_id} {x_center:.6f} {y_center:.6f} {box_width:.6f} {box_height:.6f}")
    label_path.parent.mkdir(parents=True, exist_ok=True)
    if not lines:
        raise ValueError(f"No valid detections for label {label_path.name}")
    label_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _discover_training_pairs() -> List[ImageLabelPair]:
    pairs: List[ImageLabelPair] = []
    for image_path in sorted(config.TRAIN_IMAGES_DIR.glob("*")):
        if not image_path.is_file():
            continue
        label_path = config.TRAIN_LABELS_DIR / f"{image_path.stem}.txt"
        if not label_path.exists():
            continue
        pairs.append(ImageLabelPair(image_path=image_path, label_path=label_path))
    return pairs


def _copy_pair(pair: ImageLabelPair, target_images: Path, target_labels: Path, prefix: str, index: int) -> ImageLabelPair:
    image_ext = pair.image_path.suffix.lower() or ".jpg"
    image_dst = target_images / f"{prefix}_{index:04d}{image_ext}"
    label_dst = target_labels / f"{prefix}_{index:04d}.txt"
    shutil.copy2(pair.image_path, image_dst)
    shutil.copy2(pair.label_path, label_dst)
    return ImageLabelPair(image_path=image_dst, label_path=label_dst)


def build_dataset(
    *,
    feedback_images: Sequence[FeedbackImage],
    run_id: str,
    original_sample_count: int,
    seed: int,
    logger: logging.Logger,
) -> DatasetBuildResult:
    config.ensure_directories()

    dataset_root = config.WORK_DIR / run_id
    if dataset_root.exists():
        shutil.rmtree(dataset_root, ignore_errors=True)
    images_dir = dataset_root / "images" / "train"
    labels_dir = dataset_root / "labels" / "train"
    images_dir.mkdir(parents=True, exist_ok=True)
    labels_dir.mkdir(parents=True, exist_ok=True)

    feedback_pairs: List[ImageLabelPair] = []
    for idx, feedback in enumerate(feedback_images):
        stem = _safe_stem_from_url(str(feedback.image_url))
        extension = Path(urlparse(str(feedback.image_url)).path).suffix.lower() or ".jpg"
        image_path = images_dir / f"feedback_{idx:03d}_{stem}{extension}"
        downloaded_path = _download_image(str(feedback.image_url), image_path)
        with Image.open(downloaded_path) as img:
            width, height = img.size
        label_path = labels_dir / f"feedback_{idx:03d}_{stem}.txt"
        _write_feedback_label(feedback.detections, (width, height), label_path)
        feedback_pairs.append(ImageLabelPair(image_path=downloaded_path, label_path=label_path))
        logger.info("Registered feedback sample %s with %d detections", downloaded_path.name, len(feedback.detections))

    all_pairs = _discover_training_pairs()
    rng = random.Random(seed)
    if original_sample_count > len(all_pairs):
        logger.warning(
            "Requested %d replay samples but only %d available; using all",
            original_sample_count,
            len(all_pairs),
        )
        original_sample_count = len(all_pairs)

    replay_pairs: List[ImageLabelPair] = []
    for index, pair in enumerate(rng.sample(all_pairs, original_sample_count)):
        copied = _copy_pair(pair, images_dir, labels_dir, prefix="replay", index=index)
        replay_pairs.append(copied)

    yaml_path = dataset_root / "dataset.yaml"
    class_names = config.get_class_names()
    yaml_lines = [
        f"path: {dataset_root.as_posix()}",
        "train: images/train",
        f"val: {config.VALID_IMAGES_DIR.as_posix()}",
        f"test: {config.TEST_IMAGES_DIR.as_posix()}",
        f"nc: {len(class_names)}",
        "names: [" + ", ".join(f"'{name}'" for name in class_names) + "]",
    ]
    yaml_path.write_text("\n".join(yaml_lines) + "\n", encoding="utf-8")

    return DatasetBuildResult(
        dataset_root=dataset_root,
        yaml_path=yaml_path,
        feedback_pairs=feedback_pairs,
        replay_pairs=replay_pairs,
    )
