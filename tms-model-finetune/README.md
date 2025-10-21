# TMS Model Fine-Tuning Service

This package fine-tunes the transformer maintenance YOLO detector with freshly annotated feedback supplied by the web application. It exposes the core training routine as a Python API and as a FastAPI microservice so feedback batches can be pushed from production without manual intervention.

## Features
- **Feedback ingestion**: Accepts a JSON payload of image URLs and trusted detections (see `test.json` for the schema).
- **Dynamic dataset assembly**: Downloads feedback imagery, converts bounding boxes to YOLO labels, and optionally mixes in replay samples from `Annotated_dataset/train`.
- **Incremental training**: Loads the previously fine-tuned weights (if present) or the baseline model (`tms-fault-detection-model/weights/best.pt`), then runs a lightweight Ultralytics training session.
- **Result management**: Exports the updated weights to `tms-model-finetune/finetune_weight/best_finetune.pt`, logs metrics to JSON, and keeps only the most recent run artifacts.
- **REST interface**: FastAPI application under `api/` exposes `/api/finetune` and `/health` endpoints for orchestration.

## Requirements
Install dependencies into a fresh virtual environment:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

> **Note:** `torch` and `ultralytics` wheels are hardware-dependent. Adjust the installation command if a CUDA-enabled build is required.

## Usage
### 1. Direct Python Call
```python
from pathlib import Path
import json
from schemas import FineTuneRequest
from trainer import run_finetune

payload = FineTuneRequest(**json.loads(Path("test.json").read_text()))
summary = run_finetune(payload)
print(summary)
```

### 2. FastAPI Service
```powershell
python -m tms-model-finetune.api.app
```
Default port is `8002`. Submit feedback with:

```bash
curl -X POST http://localhost:8002/api/finetune \
     -H "Content-Type: application/json" \
     -d @tms-model-finetune/test.json
```

### 3. Health Check
```bash
curl http://localhost:8002/health
```

## Configuration
Core tunables live in `config.py`:
- `DEFAULT_*` hyperparameters control epochs, replay size, learning rate, etc.
- Path constants locate the baseline weights and Annotated_dataset directories.

Override defaults per request via optional fields in the JSON payload (`train_replay`, `epochs`, `learning_rate`, and so on).

## Outputs
- `finetune_weight/best_finetune.pt`: latest checkpoint consumed by the inference service.
- `finetune_weight/last_metrics.json`: run metadata and evaluation metrics.
- `logs/<run-id>.log`: consolidated training logs.
- `runs/<run-id>/`: Ultralytics-generated artifacts (cleared before each new run).

Keep these directories tracked in `.gitignore` to avoid accidentally committing large binaries.