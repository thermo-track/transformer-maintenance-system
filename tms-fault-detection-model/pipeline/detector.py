from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Tuple

from ultralytics import YOLO
try:
    import torch
except Exception:
    torch = None


def xyxy_to_xywh(box: List[float]) -> Tuple[float, float, float, float]:
    x1, y1, x2, y2 = box
    return (x1, y1, max(0.0, x2 - x1), max(0.0, y2 - y1))


def run_yolo(weights: Path, image_path: Path, conf: float = 0.25, imgsz: int = 640, device: str | int = "auto") -> List[Dict[str, Any]]:
    model = YOLO(str(weights))
    # Resolve device for CPU-only environments
    resolved_device: str | int
    if device == "auto":
        if torch is not None and hasattr(torch, "cuda") and torch.cuda.is_available():
            resolved_device = 0
        else:
            resolved_device = "cpu"
    else:
        resolved_device = device

    results = model.predict(
        source=[str(image_path)],
        conf=conf,
        imgsz=imgsz,
        device=resolved_device,
        save=False,
        verbose=False,
    )
    dets: List[Dict[str, Any]] = []
    if not results:
        return dets
    res = results[0]
    names = res.names if hasattr(res, 'names') else getattr(model, 'names', {})
    if res.boxes is None:
        return dets
    for b in res.boxes:
        xyxy = b.xyxy[0].tolist()
        conf = float(b.conf[0].item()) if hasattr(b, 'conf') else 0.0
        cls_id = int(b.cls[0].item()) if hasattr(b, 'cls') else -1
        cls_name = names.get(cls_id, str(cls_id)) if isinstance(names, dict) else str(cls_id)
        dets.append({
            'bbox_xyxy': xyxy,
            'bbox_xywh': list(xyxy_to_xywh(xyxy)),
            'conf': conf,
            'class_id': cls_id,
            'class_name': cls_name,
        })
    return dets
