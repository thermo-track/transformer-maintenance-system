"""
Fuse YOLO detections with unsupervised anomaly regions.

Inputs:
- --weights: Path to YOLO weights (e.g., tms-fault-detection-model/weights/best.pt)
- --image: Maintenance image path used for unsupervised comparison
- --json-in: Unsupervised JSON file to augment
- --json-out: Output JSON path (defaults to overwrite input if omitted)
- --iou-thresh: IoU threshold for associating a detection with a region (default 0.7)
- --conf-thresh: Minimum detector confidence to consider a detection (default 0.25)
- --save-viz: Optional path to save an overlay image with both regions and detections

Behavior:
- For each unsupervised region bbox, find the best-matching detection above thresholds.
- Annotate region with: fault_type, fault_confidence, detector_box.
- Add top-level detector_summary with raw detections and params.

Notes:
- Assumes the unsupervised JSON has a list under key 'anomalies' or 'regions' with 'bbox' in [x, y, w, h] pixels.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any

import numpy as np

try:
    from ultralytics import YOLO
except Exception as e:
    raise SystemExit("Ultralytics not installed. Please install with `pip install ultralytics`." )

try:
    import torch  # type: ignore
except Exception:
    torch = None

try:
    import cv2
except Exception:
    cv2 = None  # viz becomes unavailable


def xywh_to_xyxy(box: List[float]) -> Tuple[float, float, float, float]:
    x, y, w, h = box
    return (x, y, x + w, y + h)


def xyxy_to_xywh(box: List[float]) -> Tuple[float, float, float, float]:
    x1, y1, x2, y2 = box
    return (x1, y1, max(0.0, x2 - x1), max(0.0, y2 - y1))


def iou_xyxy(a: Tuple[float, float, float, float], b: Tuple[float, float, float, float]) -> float:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)
    inter_w = max(0.0, inter_x2 - inter_x1)
    inter_h = max(0.0, inter_y2 - inter_y1)
    inter = inter_w * inter_h
    area_a = max(0.0, ax2 - ax1) * max(0.0, ay2 - ay1)
    area_b = max(0.0, bx2 - bx1) * max(0.0, by2 - by1)
    union = area_a + area_b - inter + 1e-6
    return inter / union if union > 0 else 0.0


def run_detection(weights: Path, image_path: Path, conf_thresh: float) -> List[Dict[str, Any]]:
    model = YOLO(str(weights))
    # Resolve device
    if torch is not None and hasattr(torch, "cuda") and torch.cuda.is_available():
        device = 0
    else:
        device = "cpu"
    results = model.predict(source=[str(image_path)], conf=conf_thresh, imgsz=640, device=device, save=False, verbose=False)
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


def fuse_regions_with_detections(regions: List[Dict[str, Any]], detections: List[Dict[str, Any]], iou_thresh: float) -> None:
    # Modifies regions in place, attaching best-match detection info
    det_used = [False] * len(detections)
    for r in regions:
        bbox_xyxy = r.get('bbox_original_xyxy') or r.get('bbox_xyxy')
        bbox_xywh = r.get('bbox_original_xywh') or r.get('bbox') or r.get('bbox_xywh')
        if not bbox_xyxy and bbox_xywh:
            bbox_xyxy = xywh_to_xyxy(bbox_xywh)
        if not bbox_xyxy:
            continue
        r_xyxy = tuple(bbox_xyxy)
        best_idx, best_iou = -1, 0.0
        for i, d in enumerate(detections):
            d_xyxy = tuple(d['bbox_xyxy'])
            iou = iou_xyxy(r_xyxy, d_xyxy)
            if iou > best_iou:
                best_iou = iou
                best_idx = i
        if best_idx >= 0 and best_iou >= iou_thresh:
            d = detections[best_idx]
            r['fault_type'] = d['class_name']
            r['fault_confidence'] = d['conf']
            r['detector_box'] = d['bbox_xywh']
            r['detector_box_xyxy'] = d['bbox_xyxy']
            r['detector_iou'] = best_iou
            det_used[best_idx] = True
        else:
            # Explicitly mark unmatched
            r.setdefault('fault_type', None)
            r.setdefault('fault_confidence', None)
            r.setdefault('detector_box', None)
            r['detector_iou'] = best_iou


def _abbrev(name: str) -> str:
    m = {
        "Loose Joint -Faulty": "Loose-Faulty",
        "Loose Joint - Faulty": "Loose-Faulty",
        "Loose Joint -Potential": "Loose-Potential",
        "Loose Joint - Potential": "Loose-Potential",
        "Point Overload - Faulty": "Overload-Faulty",
    }
    return m.get(name, name)


def _rect_overlap(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> bool:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    return not (ax2 < bx1 or bx2 < ax1 or ay2 < by1 or by2 < ay1)


def _put_label_with_bg(img: np.ndarray, text: str, x: int, y: int, fg=(255, 255, 255), bg=(0, 0, 0), scale=0.5, thickness=1,
                       used: List[tuple[int, int, int, int]] | None = None) -> tuple[int, int, int, int]:
    # Draw text with a filled background box and try to avoid overlapping previously drawn labels
    used = used or []
    pad = 3
    (tw, th), baseline = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, scale, thickness)
    rect = [x, y - th - baseline - pad, x + tw + 2 * pad, y + pad]
    # Adjust to stay within image and avoid existing labels
    h, w = img.shape[:2]
    # Clamp horizontally
    if rect[2] > w:
        dx = rect[2] - w
        rect[0] -= dx
        rect[2] -= dx
    if rect[0] < 0:
        rect[2] -= rect[0]
        rect[0] = 0
    # If top goes above image, push below
    if rect[1] < 0:
        dy = 0 - rect[1]
        rect[1] += dy
        rect[3] += dy
    # Try to avoid overlaps by nudging downward
    max_shifts = 10
    shifts = 0
    while any(_rect_overlap(tuple(rect), r) for r in used) and shifts < max_shifts:
        shift = th + baseline + 2 * pad + 2
        rect[1] += shift
        rect[3] += shift
        shifts += 1
        if rect[3] >= h:
            break
    # Draw background and text
    cv2.rectangle(img, (rect[0], rect[1]), (rect[2], rect[3]), bg, -1)
    cv2.putText(img, text, (rect[0] + pad, rect[3] - pad), cv2.FONT_HERSHEY_SIMPLEX, scale, fg, thickness, cv2.LINE_AA)
    return tuple(rect)  # x1,y1,x2,y2


def draw_viz(image_path: Path, regions: List[Dict[str, Any]], detections: List[Dict[str, Any]], out_path: Path) -> None:
    if cv2 is None:
        print("OpenCV not available, skipping viz save.")
        return
    img = cv2.imread(str(image_path))
    if img is None:
        print(f"Failed to read image for viz: {image_path}")
        return
    # Draw detections (blue)
    used_label_rects: List[tuple[int, int, int, int]] = []
    for d in detections:
        x, y, x2, y2 = map(int, d['bbox_xyxy'])
        cv2.rectangle(img, (x, y), (x2, y2), (255, 0, 0), 2)
        label = f"{_abbrev(d['class_name'])} {d['conf']:.2f}"
        # Prefer placing above the box; helper will adjust if it overflows or overlaps
        rect = _put_label_with_bg(
            img,
            label,
            x,
            max(0, y - 2),
            fg=(255, 255, 255),
            bg=(60, 90, 200),
            scale=0.5,
            thickness=1,
            used=used_label_rects,
        )
        used_label_rects.append(rect)
    # Draw regions (green) and matched info
    for r in regions:
        if not r.get('bbox') and not r.get('bbox_xywh') and not r.get('bbox_original_xywh'):
            continue
        if not r.get('fault_type'):
            continue
        bbox = r.get('bbox_original_xywh') or r.get('bbox') or r.get('bbox_xywh')
        x, y, w, h = map(int, bbox)
        cv2.rectangle(img, (x, y), (x + w, y + h), (0, 200, 0), 2)
        lbl = r['fault_type']
        if lbl:
            lbl = _abbrev(lbl)
        if r.get('fault_confidence') is not None:
            lbl = f"{lbl} {r['fault_confidence']:.2f}"
        ty = y + 14 if (y + 20) < img.shape[0] else max(0, y - 2)
        rect = _put_label_with_bg(
            img,
            lbl,
            x,
            ty,
            fg=(255, 255, 255),
            bg=(20, 160, 60),
            scale=0.5,
            thickness=1,
            used=used_label_rects,
        )
        used_label_rects.append(rect)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_path), img)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--weights', type=Path, required=True)
    p.add_argument('--image', type=Path, required=True)
    p.add_argument('--json-in', dest='json_in', type=Path, required=True)
    p.add_argument('--json-out', dest='json_out', type=Path, default=None)
    p.add_argument('--iou-thresh', type=float, default=0.7)
    p.add_argument('--conf-thresh', type=float, default=0.25)
    p.add_argument('--save-viz', dest='save_viz', type=Path, default=None)
    args = p.parse_args()

    if not args.json_in.exists():
        raise FileNotFoundError(f"JSON not found: {args.json_in}")
    if not args.image.exists():
        raise FileNotFoundError(f"Image not found: {args.image}")
    if not args.weights.exists():
        raise FileNotFoundError(f"Weights not found: {args.weights}")

    with args.json_in.open('r', encoding='utf-8') as f:
        data = json.load(f)

    detections = run_detection(args.weights, args.image, args.conf_thresh)

    # Find regions key
    regions = None
    if isinstance(data, dict):
        for key in ('anomalies', 'regions'):
            if key in data and isinstance(data[key], list):
                regions = data[key]
                break
    if regions is None:
        # create an empty list if missing to still record detector_summary
        data.setdefault('anomalies', [])
        regions = data['anomalies']

    fuse_regions_with_detections(regions, detections, args.iou_thresh)

    # Append detector summary
    data['detector_summary'] = {
        'weights': str(args.weights),
        'image': str(args.image),
        'params': {
            'conf_thresh': args.conf_thresh,
            'iou_thresh': args.iou_thresh,
        },
        'detections': detections,
    }

    out_path = args.json_out or args.json_in
    with Path(out_path).open('w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"Fused JSON saved to: {out_path}")

    if args.save_viz is not None:
        try:
            draw_viz(args.image, regions, detections, args.save_viz)
            print(f"Saved fusion overlay to: {args.save_viz}")
        except Exception as e:
            print(f"Viz failed: {e}")


if __name__ == '__main__':
    main()
