# Phase 2: Fault-Type Pipeline (Unsupervised + YOLO + Fusion)

This folder contains the code-first pipeline used by the web application. It compares a baseline (normal) thermal image with a maintenance (current) image using an unsupervised method, runs a YOLO detector on the maintenance image, and fuses both via IoU to assign fault types to detected anomaly regions.

What’s included:
- Unsupervised comparison: registration, histogram matching, fused difference (AbsDiff + 1−SSIM), thresholding, morphology, and region extraction.
- YOLO detection wrapper: loads `.pt` weights and runs detection on the maintenance image.
- Fusion: attaches `fault_type` and `fault_confidence` to unsupervised regions by IoU with YOLO boxes.

## Folder structure

```
phase2_fault_type/
├─ pipeline/
│  ├─ run_pair.py           # CLI entrypoint: end-to-end for one (baseline, maintenance) pair
│  ├─ unsupervised.py       # image processing + region extraction
│  ├─ detector.py           # YOLO inference helper (Ultralytics)
│  └─ __init__.py
├─ fuse_detections.py       # IoU fusion + overlay utility
├─ requirements.txt         # runtime dependencies
├─ weights/
│  └─ .gitkeep              # place best.pt here at runtime (not committed)
├─ README.md                # you are here
└─ __init__.py
```

Optional (not required by the web app at runtime):
- `train_yolo.py` — script to train a YOLO model on `Annotated_dataset` (keep only if you plan to retrain inside this repo).

## Quick start (single pair)

1) Install dependencies (inside your virtual environment):

```powershell
pip install -r phase2_fault_type\requirements.txt
```

2) Place your trained YOLO weights at `phase2_fault_type\weights\best.pt`.

3) Run the end-to-end pipeline for a selected pair (Windows PowerShell example):

```powershell
python -m phase2_fault_type.pipeline.run_pair `
	--baseline "Sample_Thermal_Images\T8\normal\T8_normal_001.jpg" `
	--maintenance "Sample_Thermal_Images\T8\faulty\T8_faulty_001.jpg" `
	--weights "phase2_fault_type\weights\best.pt" `
	--out-json "outputs\json\t8_pair_fused.json" `
	--out-viz "outputs\viz\t8_pair_overlay.png" `
	--iou-thresh 0.35 `
	--conf-thresh 0.25
```

Outputs:
- Fused JSON at `--out-json` with unsupervised regions enriched by YOLO `fault_type` and `fault_confidence` when overlap IoU ≥ threshold.
- Optional overlay PNG at `--out-viz` showing regions and labels.

## JSON fields (anomaly items)

Each anomaly in the fused JSON typically includes:
- `bbox_xyxy`: [x1, y1, x2, y2] in maintenance image coordinates.
- `area` / `score`: region area and internal score from the unsupervised map (names may vary by config).
- `fault_type`: integer class id (or `null` if no matching detection).
- `fault_confidence`: YOLO confidence for the matched detection (or `null`).
- `fault_iou`: IoU between the region and the matched detection.

The JSON root also contains `detector_summary` with the weights path, image name, parameters, and raw detections.

## Notes and tips
- Weights are not committed; download or mount `best.pt` at runtime into `phase2_fault_type/weights/`.
- The pipeline runs on CPU if no CUDA is available; Ultralytics automatically falls back.
- Adjust `--iou-thresh` (fusion strictness) and `--conf-thresh` (minimum detection confidence) per your data.

## Next steps (optional)
- Batch processing: add a CSV-driven runner to process many pairs and write a manifest. Not included here to keep the runtime footprint small.
- Retraining: if you need to retrain YOLO, keep `train_yolo.py` and the `Annotated_dataset/` folder; otherwise they’re not required for web deployment.
