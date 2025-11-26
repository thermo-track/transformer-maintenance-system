# Reuse inference-api image as base (already has PyTorch + Ultralytics installed)

FROM transformer-maintenance-system-inference-api:latest AS base

# Switch to root to install additional packages
USER root

# Install finetune-specific packages only (fastapi, pydantic are not in inference)
RUN pip install --no-cache-dir --timeout 300 \
    fastapi>=0.110 \
    uvicorn[standard]>=0.30 \
    "pydantic>=1.10,<2.0"

WORKDIR /app

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/shared_weights \
             /app/feedback_cache \
             /app/logs \
             /app/runs \
             /app/workdir

# Expose finetune API port
EXPOSE 8002

# Run the finetune API
CMD ["python", "-m", "uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8002"]
