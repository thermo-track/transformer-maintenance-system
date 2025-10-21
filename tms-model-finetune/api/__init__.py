"""Expose FastAPI application for running fine-tuning as a service."""

from .app import app

__all__ = ["app"]
