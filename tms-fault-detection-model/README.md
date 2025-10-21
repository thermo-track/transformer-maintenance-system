# Phase 2: Fault-Type Pipeline (Unsupervised + YOLO + Fusion)

This folder contains the code-first pipeline used by the web application. It compares a baseline (normal) thermal image with a maintenance (current) image using an unsupervised method, runs a YOLO detector on the maintenance image, and fuses both via IoU to assign fault types to detected anomaly regions.

What’s included:
- Unsupervised comparison: registration, histogram matching, fused difference (AbsDiff + 1−SSIM), thresholding, morphology, and region extraction.
- YOLO detection wrapper: loads `.pt` weights and runs detection on the maintenance image.
- Fusion: attaches `fault_type` and `fault_confidence` to unsupervised regions by IoU with YOLO boxes.

## Folder structure

```
tms-fault-detection-model/
├─ pipeline/
│  ├─ run_pair.py           # CLI entrypoint: end-to-end for one (baseline, maintenance) pair
│  ├─ unsupervised.py       # image processing + region extraction
│  ├─ detector.py           # YOLO inference helper (Ultralytics)
│  └─ __init__.py
├─ fuse_detections.py       # IoU fusion + overlay utility
├─ requirements.txt         # runtime dependencies
├─ weights/
│  └─ best.pt
├─ README.md                # you are here
└─ __init__.py
```

Optional (not required by the web app at runtime):
- `train_yolo.py` — script to train a YOLO model on `Annotated_dataset` (keep only if you plan to retrain inside this repo).

## Quick start (single pair)

1) Install dependencies (inside your virtual environment):

```powershell
pip install -r tms-fault-detection-model\requirements.txt
```

2) Place your trained YOLO weights at `tms-fault-detection-model\weights\best.pt`.

3) Run the end-to-end pipeline for a selected pair (Windows PowerShell example):

```powershell
python -m tms-fault-detection-model.pipeline.run_pair `
	--baseline "Sample_Thermal_Images\T8\normal\T8_normal_001.jpg" `
	--maintenance "Sample_Thermal_Images\T8\faulty\T8_faulty_001.jpg" `
	--weights "tms-fault-detection-model\weights\best.pt" `
	--out-json "outputs\json\t8_pair_fused.json" `
	--out-viz "outputs\viz\t8_pair_overlay.png" `
	--threshold-pct 2.0 `
	--iou-thresh 0.7 `
	--conf-thresh 0.25
```

Outputs:
- Fused JSON at `--out-json` with unsupervised regions enriched by YOLO `fault_type` and `fault_confidence` when overlap IoU ≥ threshold.
- Optional overlay PNG at `--out-viz` showing regions and labels.

### Arguments
- `--baseline` (path): Baseline/reference image of the same transformer under comparable conditions.
- `--maintenance` (path): Current image to be inspected and compared against the baseline.
- `--weights` (path): YOLO model weights `.pt` used for fault-type detection (place at `tms-fault-detection-model/weights/best.pt`).
- `--out-json` (path): Output path for the fused results JSON. Parent folders are created automatically.
- `--out-viz` (path, optional): Output path for an annotated overlay PNG. Parent folders are created automatically.
- `--threshold-pct` (float, default 2.0): Unsupervised anomaly threshold as a percentile. Keeps the top N% of the fused anomaly map (lower value = stricter, fewer regions).
- `--iou-thresh` (float, default 0.7): Minimum IoU to match a YOLO detection to an unsupervised region during fusion.

  IoU formula:

  $$
  \mathrm{IoU} 
  = \frac{\text{Area of Overlap}}{\text{Area of Union}}
  = \frac{\left| B_{\mathrm{det}} \cap R_{\mathrm{unsup}} \right|}{\left| B_{\mathrm{det}} \cup R_{\mathrm{unsup}} \right|}
  $$

- `--conf-thresh` (float, default 0.25): Minimum YOLO detection confidence to consider a detection for fusion.

## JSON fields (anomaly items)

Each anomaly in the fused JSON typically includes:
- `bbox_xyxy`: [x1, y1, x2, y2] in maintenance image coordinates.
- `area` / `score`: region area and internal score from the unsupervised map (names may vary by config).
- `fault_type`: integer class id (or `null` if no matching detection).
- `fault_confidence`: YOLO confidence for the matched detection (or `null`).
- `fault_iou`: IoU between the region and the matched detection.

The JSON root also contains `detector_summary` with the weights path, image name, parameters, and raw detections.

## Notes and tips
- The pipeline runs on CPU if no CUDA is available; Ultralytics automatically falls back.
- Adjust `--iou-thresh` (fusion strictness) and `--conf-thresh` (minimum detection confidence) per your data.
