"""Utilities for persisting interactive annotation feedback."""

from __future__ import annotations

import csv
import json
import uuid
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from . import config


@dataclass
class AnnotationAction:
    action_id: str
    image_id: str
    transformer_id: str | None
    action: str
    user_id: str
    timestamp: str
    bbox_before: Optional[List[float]]
    bbox_after: Optional[List[float]]
    detection_id: Optional[str]
    comment: Optional[str]
    extras: Dict[str, Any]


class AnnotationStore:
    """Append-only log for annotation interactions and final accepted states."""

    def __init__(
        self,
        actions_path: Path | None = None,
        final_state_dir: Path | None = None,
        export_dir: Path | None = None,
    ) -> None:
        config.ensure_directories()
        self.actions_path = actions_path or config.ACTIONS_LOG_PATH
        self.csv_path = self.actions_path.with_suffix(".csv")
        self.final_state_dir = final_state_dir or config.FINAL_STATE_DIR
        self.export_dir = export_dir or config.EXPORT_DIR

    # ------------------------------------------------------------------
    # Action logging
    # ------------------------------------------------------------------
    def log_action(
        self,
        *,
        image_id: str,
        transformer_id: str | None,
        action: str,
        user_id: str,
        bbox_before: Optional[Iterable[float]] = None,
        bbox_after: Optional[Iterable[float]] = None,
        detection_id: Optional[str] = None,
        comment: Optional[str] = None,
        **extras: Any,
    ) -> AnnotationAction:
        action_id = uuid.uuid4().hex
        timestamp = datetime.now(timezone.utc).isoformat()
        record = AnnotationAction(
            action_id=action_id,
            image_id=image_id,
            transformer_id=transformer_id,
            action=action,
            user_id=user_id,
            timestamp=timestamp,
            bbox_before=list(bbox_before) if bbox_before is not None else None,
            bbox_after=list(bbox_after) if bbox_after is not None else None,
            detection_id=detection_id,
            comment=comment,
            extras=dict(extras) if extras else {},
        )
        self._append_jsonl(self.actions_path, record)
        self._append_csv(self.csv_path, record)
        return record

    # ------------------------------------------------------------------
    # Final accepted annotation state
    # ------------------------------------------------------------------
    def save_final_state(
        self,
        *,
        image_id: str,
        maintenance_image_path: Path,
        transformer_id: str | None,
        annotations: List[Dict[str, Any]],
        user_id: str,
        comment: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Path:
        payload = {
            "image_id": image_id,
            "transformer_id": transformer_id,
            "maintenance_image_path": str(maintenance_image_path),
            "annotations": annotations,
            "user_id": user_id,
            "comment": comment,
            "metadata": metadata or {},
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        out_path = self.final_state_dir / f"{image_id}.json"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        return out_path

    def load_final_state(self, image_id: str) -> Dict[str, Any]:
        path = self.final_state_dir / f"{image_id}.json"
        if not path.exists():
            raise FileNotFoundError(f"No final state recorded for image {image_id}")
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def list_final_states(self) -> List[Dict[str, Any]]:
        items: List[Dict[str, Any]] = []
        for json_path in sorted(self.final_state_dir.glob("*.json")):
            with json_path.open("r", encoding="utf-8") as f:
                data = json.load(f)
                data.setdefault("image_id", json_path.stem)
                items.append(data)
        return items

    # ------------------------------------------------------------------
    # Exports
    # ------------------------------------------------------------------
    def export_actions(self, *, fmt: str = "json") -> Path:
        fmt = fmt.lower()
        if fmt not in {"json", "csv"}:
            raise ValueError("export format must be 'json' or 'csv'")
        self.export_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        if fmt == "json":
            out_path = self.export_dir / f"actions_{timestamp}.json"
            with out_path.open("w", encoding="utf-8") as f:
                for record in self.iter_actions():
                    json.dump(record, f)
                    f.write("\n")
        else:
            out_path = self.export_dir / f"actions_{timestamp}.csv"
            # Copy existing csv (already headered)
            if self.csv_path.exists():
                data = self.csv_path.read_text(encoding="utf-8")
                out_path.write_text(data, encoding="utf-8")
            else:
                out_path.write_text("", encoding="utf-8")
        return out_path

    def export_final_states(self, *, fmt: str = "json") -> Path:
        fmt = fmt.lower()
        self.export_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        final_states = self.list_final_states()
        out_path = self.export_dir / f"final_states_{timestamp}.{fmt}"
        if fmt == "json":
            with out_path.open("w", encoding="utf-8") as f:
                json.dump(final_states, f, indent=2)
        elif fmt == "csv":
            fieldnames = sorted({
                key
                for state in final_states
                for key in state.keys()
                if not isinstance(state.get(key), list)
            })
            with out_path.open("w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for state in final_states:
                    row = {k: v for k, v in state.items() if not isinstance(v, list)}
                    writer.writerow(row)
        else:
            raise ValueError("Unsupported export format")
        return out_path

    def iter_actions(self) -> Iterable[Dict[str, Any]]:
        if not self.actions_path.exists():
            return
        with self.actions_path.open("r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                yield json.loads(line)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _append_jsonl(path: Path, record: AnnotationAction) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = asdict(record)
        extras = payload.pop("extras", {}) or {}
        payload.update(extras)
        with path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload))
            f.write("\n")

    @staticmethod
    def _append_csv(path: Path, record: AnnotationAction) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        row = {
            "action_id": record.action_id,
            "image_id": record.image_id,
            "transformer_id": record.transformer_id,
            "action": record.action,
            "user_id": record.user_id,
            "timestamp": record.timestamp,
            "bbox_before": json.dumps(record.bbox_before) if record.bbox_before is not None else "",
            "bbox_after": json.dumps(record.bbox_after) if record.bbox_after is not None else "",
            "detection_id": record.detection_id or "",
            "comment": record.comment or "",
        }
        extras = record.extras or {}
        for key, value in extras.items():
            row[f"extra_{key}"] = value if not isinstance(value, (dict, list)) else json.dumps(value)
        fieldnames = list(row.keys())
        file_exists = path.exists()
        with path.open("a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            if not file_exists:
                writer.writeheader()
            writer.writerow(row)
