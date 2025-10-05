from __future__ import annotations

import argparse
import json
from pathlib import Path

from .unsupervised import run_unsupervised_pair, save_json
from .detector import run_yolo
from fuse_detections import fuse_regions_with_detections, draw_viz


def main():
    p = argparse.ArgumentParser(description="Run unsupervised + fuse with YOLO for a single pair")
    p.add_argument('--baseline', type=Path, required=True)
    p.add_argument('--maintenance', type=Path, required=True)
    p.add_argument('--weights', type=Path, required=True, help='YOLO weights .pt')
    p.add_argument('--out-json', type=Path, required=True)
    p.add_argument('--out-viz', type=Path, default=None)
    p.add_argument('--iou-thresh', type=float, default=0.35)
    p.add_argument('--conf-thresh', type=float, default=0.25)
    # Phase-2 requirement: expose threshold as a percentage for unsupervised map
    p.add_argument('--threshold-pct', type=float, default=2.0,
                   help='Percentile threshold for anomaly map (e.g., 2.0 => top 2%% of fused map).')
    args = p.parse_args()

    config = {
        'processing': {'work_size': [640, 640], 'smooth_sigma': 1.0},
        'thresholding': {'mode': 'percentile', 'value': float(args.threshold_pct), 'min_area_pct': 0.002},
        'fuse_weights': [0.6, 0.4],
    }

    # 1) Unsupervised
    result = run_unsupervised_pair(args.baseline, args.maintenance, config)

    # 2) Detector
    detections = run_yolo(args.weights, args.maintenance, conf=args.conf_thresh, imgsz=640)

    # 3) Fuse
    regions = result.get('anomalies', [])
    fuse_regions_with_detections(regions, detections, args.iou_thresh)
    result['detector_summary'] = {
        'weights': str(args.weights),
        'image': str(args.maintenance),
    'params': {'conf_thresh': args.conf_thresh, 'iou_thresh': args.iou_thresh},
        'detections': detections,
    }

    # Save JSON
    save_json(args.out_json, result)
    print(f"Saved fused JSON: {args.out_json}")

    # Optional viz
    if args.out_viz is not None:
        try:
            from ..fuse_detections import xywh_to_xyxy
            # Simple draw using fuse_detections util
            # Convert region bbox to xyxy for drawing
            if result.get('anomalies'):
                pass  # draw_viz handles xyxy conversion internally for detections and regions
            draw_viz(args.maintenance, result.get('anomalies', []), detections, args.out_viz)
            print(f"Saved overlay: {args.out_viz}")
        except Exception as e:
            print(f"Viz failed: {e}")


if __name__ == '__main__':
    main()
