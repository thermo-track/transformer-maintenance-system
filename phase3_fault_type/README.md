# Phase 3 – Feedback Loop Utilities

This package contains the ML-side deliverables for Phase 3: capturing human feedback on anomaly detections, converting the annotations into a replayable dataset, and triggering incremental fine-tuning runs of the YOLO detector.

## Components

- `config.py` – shared path helpers and defaults (points to Phase 2 weights and annotated dataset).
- `annotation_store.py` – append-only action log plus storage for the final accepted annotations per image.
- `feedback_dataset.py` – converts accepted annotations into YOLO-format labels and maintains a manifest for sampling.
- `utils.py` – helper utilities (sampling original data, link-or-copy semantics).
- `incremental_finetune.py` – command line entry point that bundles recent feedback samples with a rehearsal buffer from the original dataset, launches Ultralytics fine-tuning, and records evaluation metrics in `runs/history.jsonl`.

The directories created alongside these modules are:

```
phase3_fault_type/
├── annotations/          # actions.jsonl, actions.csv, final/<image>.json, exports/
├── feedback_dataset/     # manifest + YOLO label files (images referenced in place)
├── weights/              # new fine-tuned checkpoints (Ultralytics training outputs)
├── runs/                 # incremental run metadata (history.jsonl)
└── data_configs/         # reserved for ad-hoc dataset YAMLs if needed
```

## Incremental Fine-Tune Script

Example usage:

```powershell
python -m phase3_fault_type.incremental_finetune --image-id T6_faulty_002 \
    --epochs 8 --feedback-replay 4 --original-replay 24 --device 0
```

The script performs the following steps:

1. Loads the final annotation state for the specified image (via `AnnotationStore`).
2. Registers/updates that annotation inside the feedback dataset (writes a YOLO label file).
3. Builds a temporary dataset mixing the latest feedback sample, a window of previous feedback samples, and a rehearsal subset from the original annotated training set.
4. Runs Ultralytics fine-tuning starting from `tms-fault-detection-model/weights/best.pt`.
5. Evaluates the resulting weights on the held-out Phase 2 test set and appends the metrics to `runs/history.jsonl`.

Temporary training datasets are stored under `phase3_fault_type/phase3_ft_*`. By default they are deleted; pass `--keep-temp` to inspect them manually.

## Exports

Use `AnnotationStore.export_actions(fmt="csv")` or `AnnotationStore.export_final_states(fmt="json")` to produce submission-ready logs containing:

- Image metadata (ID, transformer ID, absolute image path)
- Original detections and user-adjusted annotations
- User metadata and timestamps
- Optional comments captured in the UI

## Notebook Workflow

The accompanying notebook `phase3_feedback_pipeline.ipynb` demonstrates the end-to-end loop:

1. Run Phase 2 inference to obtain model detections.
2. Interactively adjust/add/delete bounding boxes.
3. Persist the feedback into the annotations log and feedback dataset.
4. Trigger `incremental_finetune.py` from the notebook and monitor metrics.
5. Export JSON/CSV logs for auditability.

Refer to the notebook for detailed usage instructions and demo cells.
