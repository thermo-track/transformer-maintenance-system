"""FastAPI entry point exposing the fine-tuning pipeline for web use."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException

CURRENT_DIR = Path(__file__).resolve().parent
MODULE_ROOT = CURRENT_DIR.parent
if str(MODULE_ROOT) not in sys.path:
    sys.path.insert(0, str(MODULE_ROOT))

import config  # noqa: E402
from schemas import FineTuneRequest  # noqa: E402
from trainer import FineTuneError, run_finetune  # noqa: E402

app = FastAPI(title="TMS Fine-Tuning API", version="1.0.0")


@app.post("/api/finetune", response_model=Dict[str, Any])
def trigger_finetune(request: FineTuneRequest) -> Dict[str, Any]:
    try:
        summary = run_finetune(request)
        return {
            "run_id": summary.run_id,
            "weights_path": str(summary.weights_path),
            "metrics": summary.metrics,
            "log_path": str(summary.log_path),
            "dataset_size": summary.dataset_size,
            "feedback_samples": summary.feedback_samples,
            "replay_samples": summary.replay_samples,
            "hyperparameters": summary.hyperparams,
        }
    except FineTuneError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "ok",
        "pretrained_weights": str(config.PRETRAINED_WEIGHTS),
        "pretrained_exists": config.PRETRAINED_WEIGHTS.exists(),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8002)
