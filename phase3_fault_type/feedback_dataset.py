"""Manage user-validated annotations as a lightweight replay dataset."""

from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, Iterator, List, Optional

import cv2

from . import config


@dataclass
class FeedbackSample:
    image_id: str
    image_path: Path
    label_path: Path
    transformer_id: str | None
    updated_at: str
    comment: Optional[str]
    metadata: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["image_path"] = str(self.image_path)
        data["label_path"] = str(self.label_path)
        return data


def _class_id_for_name(name: str) -> int:
    names = config.get_class_names()
    if name not in names:
        raise ValueError(f"Unknown class '{name}'. Available: {names}")
    return names.index(name)


def _xyxy_to_yolo(x1: float, y1: float, x2: float, y2: float, width: int, height: int) -> List[float]:
    x_center = ((x1 + x2) / 2.0) / width
    y_center = ((y1 + y2) / 2.0) / height
    w = abs(x2 - x1) / width
    h = abs(y2 - y1) / height
    return [x_center, y_center, w, h]


def _ensure_manifest_header() -> None:
    config.FEEDBACK_MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not config.FEEDBACK_MANIFEST_PATH.exists():
        config.FEEDBACK_MANIFEST_PATH.write_text("", encoding="utf-8")


def _load_manifest_entries() -> List[Dict[str, Any]]:
    if not config.FEEDBACK_MANIFEST_PATH.exists():
        return []
    entries: List[Dict[str, Any]] = []
    with config.FEEDBACK_MANIFEST_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            entries.append(json.loads(line))
    return entries


def _write_manifest_entries(entries: List[Dict[str, Any]]) -> None:
    with config.FEEDBACK_MANIFEST_PATH.open("w", encoding="utf-8") as f:
        for entry in entries:
            f.write(json.dumps(entry))
            f.write("\n")


def register_feedback(
    *,
    image_id: str,
    maintenance_image_path: Path,
    annotations: Iterable[Dict[str, Any]],
    transformer_id: str | None,
    comment: Optional[str],
    metadata: Optional[Dict[str, Any]] = None,
) -> FeedbackSample:
    """Persist validated annotations as YOLO label file + manifest entry."""
    config.ensure_directories()
    if not maintenance_image_path.exists():
        raise FileNotFoundError(f"Maintenance image not found: {maintenance_image_path}")

    image = cv2.imread(str(maintenance_image_path))
    if image is None:
        raise ValueError(f"Failed to load image for {maintenance_image_path}")
    height, width = image.shape[:2]

    label_path = config.FEEDBACK_LABELS_DIR / f"{image_id}.txt"
    label_path.parent.mkdir(parents=True, exist_ok=True)

    lines: List[str] = []
    for ann in annotations:
        if ann.get("class_name") is None and ann.get("class_id") is None:
            raise ValueError("Each annotation must include 'class_name' or 'class_id'")
        if ann.get("bbox_xyxy") is None and ann.get("bbox") is None and ann.get("bbox_xywh") is None:
            raise ValueError("Each annotation must include a bounding box")
        if ann.get("bbox_xyxy"):
            bbox = ann["bbox_xyxy"]
            x1, y1, x2, y2 = bbox
        else:
            x, y, w, h = ann.get("bbox") or ann.get("bbox_xywh")
            x1, y1, x2, y2 = x, y, x + w, y + h
        class_id = ann.get("class_id")
        if class_id is None:
            class_id = _class_id_for_name(ann["class_name"])
        yolo_box = _xyxy_to_yolo(float(x1), float(y1), float(x2), float(y2), width, height)
        line = "{} {:.6f} {:.6f} {:.6f} {:.6f}".format(class_id, *yolo_box)
        lines.append(line)

    label_path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")

    sample = FeedbackSample(
        image_id=image_id,
        image_path=maintenance_image_path,
        label_path=label_path,
        transformer_id=transformer_id,
        updated_at=datetime.now(timezone.utc).isoformat(),
        comment=comment,
        metadata=metadata or {},
    )

    _ensure_manifest_header()
    entries = _load_manifest_entries()
    filtered = [entry for entry in entries if entry.get("image_id") != image_id]
    filtered.insert(0, sample.to_dict())  # Latest first
    _write_manifest_entries(filtered)

    return sample


def iter_feedback_samples() -> Iterator[FeedbackSample]:
    entries = _load_manifest_entries()
    def _gen() -> Iterator[FeedbackSample]:
        for data in entries:
            yield FeedbackSample(
                image_id=data["image_id"],
                image_path=Path(data["image_path"]),
                label_path=Path(data["label_path"]),
                transformer_id=data.get("transformer_id"),
                updated_at=data.get("updated_at"),
                comment=data.get("comment"),
                metadata=data.get("metadata", {}),
            )
    return _gen()


def list_feedback_samples(limit: Optional[int] = None) -> List[FeedbackSample]:
    samples = list(iter_feedback_samples())
    samples.sort(key=lambda s: s.updated_at or "", reverse=True)
    if limit is not None:
        samples = samples[:limit]
    return samples
