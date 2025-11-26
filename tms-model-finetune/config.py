"""Configuration helpers for the feedback-driven YOLO fine-tuning pipeline."""

from __future__ import annotations

import os
from pathlib import Path
from typing import List

# In Docker, the working directory is /app, and dataset is mounted at /app/Annotated_dataset
# In local dev, we need to go up one level from tms-model-finetune
if os.path.exists("/app/Annotated_dataset"):
    # Running in Docker
    REPO_ROOT: Path = Path("/app")
    MODULE_ROOT: Path = Path("/app")
else:
    # Running locally
    REPO_ROOT: Path = Path(__file__).resolve().parents[1]
    MODULE_ROOT: Path = REPO_ROOT / "tms-model-finetune"

# Support Docker environment variables
PRETRAINED_WEIGHTS: Path = Path(os.getenv("PRETRAINED_WEIGHTS_PATH", REPO_ROOT / "tms-fault-detection-model" / "weights" / "best.pt"))
OUTPUT_WEIGHTS_DIR: Path = Path(os.getenv("OUTPUT_WEIGHTS_PATH", MODULE_ROOT / "finetune_weight" / "best_finetune.pt")).parent

ANNOTATED_DATASET_ROOT: Path = REPO_ROOT / "Annotated_dataset"
TRAIN_IMAGES_DIR: Path = ANNOTATED_DATASET_ROOT / "train" / "images"
TRAIN_LABELS_DIR: Path = ANNOTATED_DATASET_ROOT / "train" / "labels"
VALID_IMAGES_DIR: Path = ANNOTATED_DATASET_ROOT / "valid" / "images"
TEST_IMAGES_DIR: Path = ANNOTATED_DATASET_ROOT / "test" / "images"

WORK_DIR: Path = MODULE_ROOT / "workdir"
DOWNLOAD_CACHE_DIR: Path = MODULE_ROOT / "feedback_cache"
RUNS_DIR: Path = MODULE_ROOT / "runs"
LOGS_DIR: Path = MODULE_ROOT / "logs"
LAST_METRICS_PATH: Path = OUTPUT_WEIGHTS_DIR / "last_metrics.json"

DEFAULT_EPOCHS: int = 8
DEFAULT_BATCH_SIZE: int = 4
DEFAULT_IMAGE_SIZE: int = 640
DEFAULT_LR: float = 1e-4
DEFAULT_WEIGHT_DECAY: float = 1e-4
DEFAULT_MOMENTUM: float = 0.937
DEFAULT_FREEZE: int = 10
DEFAULT_TRAIN_REPLAY: int = 0
DEFAULT_RANDOM_SEED: int = 1337

_CLASS_NAMES: List[str] | None = None


def ensure_directories() -> None:
    for path in (
        MODULE_ROOT,
        WORK_DIR,
        DOWNLOAD_CACHE_DIR,
        RUNS_DIR,
        LOGS_DIR,
        OUTPUT_WEIGHTS_DIR,
    ):
        path.mkdir(parents=True, exist_ok=True)


def get_class_names() -> List[str]:
    """Load the class name list from the phase-2 dataset description."""
    global _CLASS_NAMES
    if _CLASS_NAMES is not None:
        return list(_CLASS_NAMES)

    data_yaml = ANNOTATED_DATASET_ROOT / "data.yaml"
    if not data_yaml.exists():  # pragma: no cover - configuration guard
        raise FileNotFoundError(f"Expected data.yaml at {data_yaml}")

    names: List[str] = []
    with data_yaml.open("r", encoding="utf-8") as handle:
        for raw in handle:
            stripped = raw.strip()
            if stripped.startswith("names:"):
                _, rhs = stripped.split(":", 1)
                rhs = rhs.strip()
                if rhs.startswith("[") and rhs.endswith("]"):
                    rhs = rhs[1:-1]
                    items = [item.strip().strip("'\"") for item in rhs.split(",") if item.strip()]
                    names = items
                break

    if not names:
        raise ValueError("Could not parse class names from Annotated_dataset/data.yaml")

    _CLASS_NAMES = names
    return list(_CLASS_NAMES)


ensure_directories()
