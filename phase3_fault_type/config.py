"""Centralized paths and configuration helpers for Phase 3 workflows."""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List

_REPO_ROOT = Path(__file__).resolve().parents[1]
PHASE3_ROOT: Path = _REPO_ROOT / "phase3_fault_type"
ANNOTATIONS_DIR: Path = PHASE3_ROOT / "annotations"
ACTIONS_LOG_PATH: Path = ANNOTATIONS_DIR / "actions.jsonl"
FINAL_STATE_DIR: Path = ANNOTATIONS_DIR / "final"
EXPORT_DIR: Path = ANNOTATIONS_DIR / "exports"

FEEDBACK_DATASET_DIR: Path = PHASE3_ROOT / "feedback_dataset"
FEEDBACK_LABELS_DIR: Path = FEEDBACK_DATASET_DIR / "labels"
FEEDBACK_MANIFEST_PATH: Path = FEEDBACK_DATASET_DIR / "manifest.jsonl"

DATA_CONFIG_DIR: Path = PHASE3_ROOT / "data_configs"
WEIGHTS_DIR: Path = PHASE3_ROOT / "weights"
RUNS_DIR: Path = PHASE3_ROOT / "runs"
RUN_HISTORY_PATH: Path = RUNS_DIR / "history.jsonl"

PHASE2_WEIGHTS_PATH: Path = _REPO_ROOT / "tms-fault-detection-model" / "weights" / "best.pt"
ANNOTATED_DATASET_DIR: Path = _REPO_ROOT / "Annotated_dataset"

# Cached class names from phase 2 data yaml
_CLASS_NAMES: List[str] | None = None


def get_repo_root() -> Path:
    return _REPO_ROOT


def get_class_names() -> List[str]:
    global _CLASS_NAMES
    if _CLASS_NAMES is None:
        data_yaml = ANNOTATED_DATASET_DIR / "data.yaml"
        if not data_yaml.exists():
            raise FileNotFoundError(f"Expected data.yaml at {data_yaml!s}")
        names: List[str] = []
        with data_yaml.open("r", encoding="utf-8") as f:
            for line in f:
                stripped = line.strip()
                if stripped.startswith("names:"):
                    # Expect format: names: ['a', 'b']
                    _, rhs = stripped.split(":", 1)
                    rhs = rhs.strip()
                    if rhs.startswith("[") and rhs.endswith("]"):
                        rhs = rhs[1:-1]
                        items = [item.strip().strip("'\"") for item in rhs.split(",") if item.strip()]
                        names = items
                    break
        if not names:
            raise ValueError("Failed to parse class names from data.yaml")
        _CLASS_NAMES = names
    return list(_CLASS_NAMES)


def ensure_directories() -> None:
    for path in (
        PHASE3_ROOT,
        ANNOTATIONS_DIR,
        FINAL_STATE_DIR,
        EXPORT_DIR,
        FEEDBACK_DATASET_DIR,
        FEEDBACK_LABELS_DIR,
        DATA_CONFIG_DIR,
        WEIGHTS_DIR,
        RUNS_DIR,
    ):
        path.mkdir(parents=True, exist_ok=True)


ensure_directories()
