# Use Python 3.11 slim image as base
FROM python:3.11-slim

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy only API requirements (inference doesn't need training dependencies)
COPY api/requirements.txt api/

# Install Python dependencies
RUN pip install --no-cache-dir -r api/requirements.txt

# Copy the entire tms-fault-detection-model directory
COPY . .

# Create necessary directories
RUN mkdir -p outputs/json outputs/viz weights

# Expose port for FastAPI
EXPOSE 8001

# Set Python path to include the app directory
ENV PYTHONPATH=/app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8001/health')" || exit 1

# Run the FastAPI application
CMD ["python", "-m", "uvicorn", "api.inference_api:app", "--host", "0.0.0.0", "--port", "8001"]
