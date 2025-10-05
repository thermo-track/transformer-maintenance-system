import os
from pathlib import Path
import argparse

# Use ultralytics YOLOv8/YOLO11 API (single package `ultralytics`)
try:
    from ultralytics import YOLO
except ImportError as e:
    raise SystemExit("Ultralytics not installed. Please install with `pip install ultralytics`.")

# Optional: torch for CUDA detection and GPU info
try:
    import torch  # noqa: F401
except Exception:
    torch = None

# Minimal training script
# - Uses pretrained weights (e.g., yolo11s.pt) and trains on Annotated_dataset
# - Saves results to runs (under phase2_fault_type/runs)

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_YAML = REPO_ROOT / "Annotated_dataset" / "data.yaml"
DEFAULT_WEIGHTS = "yolo11s.pt"  # switch to 'yolo11n.pt' for speed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", type=str, default=DEFAULT_WEIGHTS)
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--name", type=str, default="yolo11s_supervised")
    parser.add_argument("--device", type=str, default=None, help="CUDA device index (e.g., '0') or 'cpu'")
    parser.add_argument("--freeze", type=int, default=0, help="Freeze N layers for small-data stability")
    # Tuning knobs for small datasets / Colab T4
    parser.add_argument("--patience", type=int, default=20)
    parser.add_argument("--lr0", type=float, default=0.005)
    parser.add_argument("--weight_decay", type=float, default=5e-4)
    parser.add_argument("--mosaic", type=float, default=0.3)
    parser.add_argument("--mixup", type=float, default=0.0)
    parser.add_argument("--hsv_h", type=float, default=0.015)
    parser.add_argument("--hsv_s", type=float, default=0.7)
    parser.add_argument("--hsv_v", type=float, default=0.4)
    parser.add_argument("--degrees", type=float, default=5.0)
    parser.add_argument("--translate", type=float, default=0.05)
    parser.add_argument("--scale", type=float, default=0.5)
    parser.add_argument("--fliplr", type=float, default=0.5)
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--optimizer", type=str, default="auto", help="Optimizer: auto|SGD|Adam|AdamW")
    parser.add_argument("--rect", type=str, default="False", help="Rectangular training: True|False")
    parser.add_argument("--cache", type=str, default="ram", help="Cache images: ram|disk|False")
    parser.add_argument("--copy_paste", type=float, default=0.0, help="Copy-paste augmentation probability (0-1)")
    args = parser.parse_args()

    # Resolve paths
    data_yaml = str(DATA_YAML)
    if not Path(data_yaml).exists():
        raise FileNotFoundError(f"Dataset YAML not found at {data_yaml}")

    # Create model with pretrained weights
    model = YOLO(args.weights)

    # Optional backbone freezing for small datasets
    if args.freeze and hasattr(model, "model"):
        # Freeze first N layers
        for i, m in enumerate(model.model.modules()):
            if i < args.freeze:
                for p in getattr(m, 'parameters', lambda: [])():
                    p.requires_grad = False

    # Device selection (prefer CUDA if available)
    device = args.device
    if device is None:
        if torch is not None and hasattr(torch, "cuda") and torch.cuda.is_available():
            device = 0  # first CUDA device
        else:
            device = "cpu"

    # Print device info
    try:
        if device != "cpu" and torch is not None and torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            cuda_ver = torch.version.cuda if hasattr(torch, 'version') else 'unknown'
            print(f"Using CUDA device 0: {gpu_name} (CUDA {cuda_ver})")
        else:
            print("Using CPU device")
    except Exception:
        print(f"Using device: {device}")

    # Recommended training args for small datasets
    # Normalize rect and cache args
    rect = str(args.rect).lower() in ("true", "1", "yes")
    cache = args.cache
    if isinstance(cache, str):
        if cache.lower() in ("false", "0", "none"):
            cache = False
        elif cache.lower() in ("ram", "disk"):
            cache = cache.lower()
        else:
            cache = True

    results = model.train(
        data=data_yaml,
        imgsz=args.imgsz,
        epochs=args.epochs,
        batch=args.batch,
        patience=args.patience,
        optimizer=args.optimizer,
        lr0=args.lr0,
        weight_decay=args.weight_decay,
        mosaic=args.mosaic,
        mixup=args.mixup,
        copy_paste=args.copy_paste,
        hsv_h=args.hsv_h,
        hsv_s=args.hsv_s,
        hsv_v=args.hsv_v,
        degrees=args.degrees,
        translate=args.translate,
        scale=args.scale,
        fliplr=args.fliplr,
        seed=42,
        cache=cache,
        rect=rect,
        pretrained=True,
        device=device,
        workers=args.workers,
        project=str(REPO_ROOT / "phase2_fault_type" / "runs"),
        name=args.name,
        exist_ok=True,
    )

    # Export best weights path
    # Ultralytics saves best.pt in runs dir
    best = Path(results.save_dir) / "weights" / "best.pt"
    print(f"Best weights: {best if best.exists() else 'not found'}")


if __name__ == "__main__":
    main()
