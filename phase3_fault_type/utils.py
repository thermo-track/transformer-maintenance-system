"""Shared helpers for the incremental feedback pipeline."""

from __future__ import annotations

import os
import random
import shutil
from pathlib import Path
from typing import List, Sequence, Tuple

from . import config


def link_file(src: Path, dst: Path, *, strategy: str = "hardlink") -> str:
    """Create a file at dst using the chosen strategy.

    Returns the strategy actually used: 'hardlink', 'symlink', or 'copy'.
    """
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists():
        try:
            dst.unlink()
        except OSError:
            pass

    chosen = strategy.lower()
    if chosen == "symlink":
        try:
            os.symlink(src, dst)
            return "symlink"
        except OSError:
            # fall back to hardlink
            chosen = "hardlink"

    if chosen == "hardlink":
        try:
            os.link(src, dst)
            return "hardlink"
        except OSError:
            # fall back to copy
            pass

    shutil.copy2(src, dst)
    return "copy"


def sample_original_dataset(count: int, *, seed: int = 42) -> List[Tuple[Path, Path]]:
    """Return (image_path, label_path) pairs from the original annotated dataset."""
    dataset_dir = config.ANNOTATED_DATASET_DIR
    labels_dir = dataset_dir / "train" / "labels"
    images_dir = dataset_dir / "train" / "images"
    label_files = sorted(labels_dir.glob("*.txt"))
    if not label_files:
        raise FileNotFoundError(f"No label files found in {labels_dir}")
    rng = random.Random(seed)
    chosen = rng.sample(label_files, k=min(count, len(label_files)))
    pairs: List[Tuple[Path, Path]] = []
    for label_path in chosen:
        stem = label_path.stem
        # YOLO naming convention: same stem between images/labels
        candidates = list(images_dir.glob(f"{stem}.*"))
        if not candidates:
            continue
        image_path = candidates[0]
        pairs.append((image_path, label_path))
    return pairs


def unique_stem(prefix: str, existing: Sequence[str]) -> str:
    idx = 1
    stem = f"{prefix}_{idx:03d}"
    existing_set = set(existing)
    while stem in existing_set:
        idx += 1
        stem = f"{prefix}_{idx:03d}"
    return stem
