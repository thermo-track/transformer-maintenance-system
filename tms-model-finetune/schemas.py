"""Pydantic schemas describing the fine-tuning payload."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl, validator


class BoundingBox(BaseModel):
    x_min: float = Field(..., description="Left coordinate in pixels")
    y_min: float = Field(..., description="Top coordinate in pixels")
    x_max: float = Field(..., description="Right coordinate in pixels")
    y_max: float = Field(..., description="Bottom coordinate in pixels")

    @validator("x_max")
    def _validate_x(cls, v: float, values):  # type: ignore[override]
        x_min = values.get("x_min")
        if x_min is not None and v <= x_min:
            raise ValueError("x_max must be greater than x_min")
        return v

    @validator("y_max")
    def _validate_y(cls, v: float, values):  # type: ignore[override]
        y_min = values.get("y_min")
        if y_min is not None and v <= y_min:
            raise ValueError("y_max must be greater than y_min")
        return v


class Detection(BaseModel):
    box: BoundingBox
    class_id: int = Field(..., ge=0)


class FeedbackImage(BaseModel):
    image_url: HttpUrl
    detections: List[Detection]

    @validator("detections")
    def _ensure_detections(cls, v: List[Detection]):  # type: ignore[override]
        if not v:
            raise ValueError("Each image must include at least one detection")
        return v


class FineTuneRequest(BaseModel):
    images: List[FeedbackImage]
    train_replay: Optional[int] = Field(
        None,
        ge=0,
        description="Number of baseline training samples to replay alongside feedback",
    )
    epochs: Optional[int] = Field(None, ge=1)
    batch_size: Optional[int] = Field(None, ge=1)
    image_size: Optional[int] = Field(None, ge=32)
    learning_rate: Optional[float] = Field(None, gt=0)
    weight_decay: Optional[float] = Field(None, ge=0)
    momentum: Optional[float] = Field(None, gt=0)
    freeze: Optional[int] = Field(None, ge=0)
    seed: Optional[int] = Field(None, ge=0)
    device: Optional[str] = Field(None, description="Torch device string (e.g. 'cpu', '0', '0,1', 'auto')")

    @validator("images")
    def _ensure_images(cls, v: List[FeedbackImage]):  # type: ignore[override]
        if not v:
            raise ValueError("Payload must include at least one feedback image")
        return v
