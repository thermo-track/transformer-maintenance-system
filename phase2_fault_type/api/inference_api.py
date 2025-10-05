from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import subprocess
import json
import requests
import tempfile
from pathlib import Path
import shutil
import os
import traceback
import sys
import subprocess

python_executable = sys.executable 
app = FastAPI(title="Thermal Image Inference API")

class InferenceRequest(BaseModel):
    baseline_url: str
    maintenance_url: str
    inspection_id: str
    weights_path: str = "../weights/best.pt"  # Remove the leading slash
    threshold_pct: float = 2.0
    iou_thresh: float = 0.35
    conf_thresh: float = 0.25

def download_image(url: str, save_path: Path):
    """Download image from URL"""
    try:
        print(f"Downloading image from: {url}")
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        save_path.parent.mkdir(parents=True, exist_ok=True)
        with open(save_path, 'wb') as f:
            shutil.copyfileobj(response.raw, f)
        
        print(f"Successfully downloaded to: {save_path}")
        return save_path
    except Exception as e:
        print(f"Download failed: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to download image: {str(e)}")

@app.post("/api/inference/run")
async def run_inference(request: InferenceRequest):
    """Run thermal image inference pipeline"""
    print("\n" + "="*50)
    print(f"New inference request for inspection: {request.inspection_id}")
    print(f"Baseline URL: {request.baseline_url}")
    print(f"Maintenance URL: {request.maintenance_url}")
    print(f"Weights: {request.weights_path}")
    print("="*50 + "\n")
    
    temp_dir = Path(tempfile.mkdtemp())
    
    try:
        # Check if weights file exists
        weights_path = Path(request.weights_path)
        if not weights_path.exists():
            raise HTTPException(
                status_code=404, 
                detail=f"Weights file not found: {weights_path}"
            )
        print(f"Weights file found: {weights_path}")
        
        # Download images
        baseline_path = temp_dir / f"{request.inspection_id}_baseline.jpg"
        maintenance_path = temp_dir / f"{request.inspection_id}_maintenance.jpg"
        
        download_image(request.baseline_url, baseline_path)
        download_image(request.maintenance_url, maintenance_path)
        
        # Verify downloaded files
        if not baseline_path.exists() or baseline_path.stat().st_size == 0:
            raise HTTPException(status_code=500, detail="Baseline image download failed or empty")
        if not maintenance_path.exists() or maintenance_path.stat().st_size == 0:
            raise HTTPException(status_code=500, detail="Maintenance image download failed or empty")
            
        print(f"Baseline size: {baseline_path.stat().st_size} bytes")
        print(f"Maintenance size: {maintenance_path.stat().st_size} bytes")
        
        # Output paths
        output_dir = Path("outputs")
        output_json = output_dir / "json" / f"{request.inspection_id}_result.json"
        output_viz = output_dir / "viz" / f"{request.inspection_id}_overlay.png"
        
        output_json.parent.mkdir(parents=True, exist_ok=True)
        output_viz.parent.mkdir(parents=True, exist_ok=True)
        
        # Run inference pipeline
        cmd = [
            python_executable, "-m", "pipeline.run_pair",  # Run as module, not phase2_fault_type.pipeline.run_pair
            "--baseline", str(baseline_path.absolute()),
            "--maintenance", str(maintenance_path.absolute()),
            "--weights", str(weights_path.absolute()),
            "--out-json", str(output_json.absolute()),
            "--out-viz", str(output_viz.absolute()),
            "--threshold-pct", str(request.threshold_pct),
            "--iou-thresh", str(request.iou_thresh),
            "--conf-thresh", str(request.conf_thresh)
        ]

        print(f"\nRunning command:")
        print(" ".join(cmd))
        print()

        # Set working directory to phase2_fault_type (parent of api)
        parent_dir = Path(os.getcwd()).parent

        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            timeout=300,
            cwd=str(parent_dir)  # Run from phase2_fault_type directory
)
        
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        print("Return code:", result.returncode)
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500, 
                detail=f"Inference failed with code {result.returncode}: {result.stderr}"
            )
        
        # Check if output file exists
        if not output_json.exists():
            raise HTTPException(
                status_code=500,
                detail=f"Output JSON not created: {output_json}"
            )
        
        # Read result JSON
        with open(output_json, 'r') as f:
            inference_result = json.load(f)
        
        print(f"\nInference completed successfully")
        print(f"Anomalies found: {len(inference_result.get('anomalies', []))}")
        print(f"Detections found: {len(inference_result.get('detector_summary', {}).get('detections', []))}")
        
        viz_url = f"file://{output_viz.absolute()}"
        
        return {
            "success": True,
            "inspection_id": request.inspection_id,
            "inference_result": inference_result,
            "visualization_url": viz_url
        }
        
    except subprocess.TimeoutExpired:
        print("ERROR: Inference timeout")
        raise HTTPException(status_code=504, detail="Inference timeout after 300 seconds")
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Unexpected error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
    finally:
        # Cleanup temp files
        shutil.rmtree(temp_dir, ignore_errors=True)
        print(f"Cleaned up temp directory: {temp_dir}\n")

@app.get("/health")
async def health_check():
    weights_exist = Path("weights/best.pt").exists()
    return {
        "status": "healthy",
        "service": "thermal-inference-api",
        "weights_file_exists": weights_exist,
        "cwd": os.getcwd()
    }

if __name__ == "__main__":
    import uvicorn
    print(f"Starting inference API...")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Weights path: {Path('weights/best.pt').absolute()}")
    uvicorn.run(app, host="0.0.0.0", port=8001)