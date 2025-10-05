import React, { useState, useEffect, useRef } from 'react';
import { useParams } from "react-router-dom";
import { ZoomIn, ZoomOut, X, RotateCcw, AlertTriangle } from 'lucide-react';
import '../styles/thermal-image-comparison.css';
import { baselineImageService } from '../services/BaselineImageService';
import { cloudinaryService } from '../services/CloudinaryService';

const ThermalImageComparison = ({ 
  transformerId,
  baselineImage, 
  currentImage, 
  inspectionData,
  onDelete, 
  onUploadNew,
  onRefresh 
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { transformerNo } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weatherBasedBaselineImage, setWeatherBasedBaselineImage] = useState(null);
  const [notes, setNotes] = useState('');
  const [anomalies, setAnomalies] = useState([]);
  const [detections, setDetections] = useState([]);
  const [inspectionId, setInspectionId] = useState(null);
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const [zoom, setZoom] = useState({ baseline: 1, current: 1 });
  const [position, setPosition] = useState({ 
    baseline: { x: 0, y: 0 }, 
    current: { x: 0, y: 0 } 
  });
  const [isDragging, setIsDragging] = useState({ baseline: false, current: false });

  const displayCurrentImage = currentImage || baselineImage;

  // Update inspectionId when inspectionData changes
  useEffect(() => {
    if (inspectionData?.inspectionId) {
      console.log('Setting inspection ID:', inspectionData.inspectionId);
      setInspectionId(inspectionData.inspectionId);
    }
  }, [inspectionData]);

  // Fetch anomalies when inspectionId changes
  useEffect(() => {
    if (inspectionId) {
      console.log('Fetching anomalies for inspection:', inspectionId);
      fetchAnomalies(inspectionId);
    }
  }, [inspectionId]);

  // Draw bounding boxes when anomalies or image changes
  useEffect(() => {
    if (imageRef.current && canvasRef.current && (anomalies.length > 0 || detections.length > 0)) {
      console.log('Drawing bounding boxes:', { anomalies: anomalies.length, detections: detections.length });
      drawBoundingBoxes();
    }
  }, [anomalies, detections, zoom.current, position.current]);

  const fetchAnomalies = async (inspId) => {
    try {
      console.log('Fetching anomalies from backend for:', inspId);
      const result = await cloudinaryService.getInspectionAnomalies(inspId);
      console.log('Anomalies result:', result);
      
      setAnomalies(result.anomalies || []);
      
      const detectionData = (result.anomalies || []).filter(a => a.faultType);
      setDetections(detectionData);
      
      console.log('Set anomalies:', result.anomalies?.length || 0, 'detections:', detectionData.length);
      
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    }
  };

  const drawBoundingBoxes = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !image.complete) {
      console.log('Canvas or image not ready');
      return;
    }

    const ctx = canvas.getContext('2d');
    
    canvas.width = image.width;
    canvas.height = image.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const scaleX = image.width / image.naturalWidth;
    const scaleY = image.height / image.naturalHeight;
    
    console.log('Drawing boxes with scale:', { scaleX, scaleY, imageWidth: image.width, imageHeight: image.height });
    
    ctx.save();
    ctx.scale(zoom.current, zoom.current);
    ctx.translate(position.current.x / zoom.current, position.current.y / zoom.current);

    // Draw unsupervised anomalies (yellow boxes)
    anomalies.forEach((anomaly, index) => {
      if (!anomaly.faultType && anomaly.bboxX !== null) {
        const x = anomaly.bboxX * scaleX;
        const y = anomaly.bboxY * scaleY;
        const width = anomaly.bboxWidth * scaleX;
        const height = anomaly.bboxHeight * scaleY;
        
        console.log(`Drawing anomaly ${index}:`, { x, y, width, height });
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.fillRect(x, y - 25, 120, 25);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Anomaly ${index + 1}`, x + 5, y - 8);
      }
    });

    // Draw YOLO detections (red boxes)
    detections.forEach((detection, index) => {
      if (detection.bboxX !== null) {
        const x = detection.bboxX * scaleX;
        const y = detection.bboxY * scaleY;
        const width = detection.bboxWidth * scaleX;
        const height = detection.bboxHeight * scaleY;
        
        console.log(`Drawing detection ${index}:`, detection.faultType, { x, y, width, height });
        
        const confidence = detection.faultConfidence || 0;
        const color = confidence > 0.7 ? '#FF0000' : '#FFA500';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        
        const label = `${detection.faultType} (${(confidence * 100).toFixed(0)}%)`;
        const textWidth = ctx.measureText(label).width + 10;
        
        ctx.fillStyle = `rgba(${confidence > 0.7 ? '255,0,0' : '255,165,0'}, 0.8)`;
        ctx.fillRect(x, y - 25, textWidth, 25);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(label, x + 5, y - 8);
      }
    });

    ctx.restore();
    console.log('Finished drawing bounding boxes');
  };

  const handleZoom = (imageType, delta) => {
    setZoom(prev => ({
      ...prev,
      [imageType]: Math.max(1, Math.min(3, prev[imageType] + delta))
    }));
  };

  const handleDragStart = (imageType, e) => {
    setIsDragging(prev => ({ ...prev, [imageType]: true }));
  };

  const handleDragMove = (imageType, e) => {
    if (!isDragging[imageType]) return;
    
    setPosition(prev => ({
      ...prev,
      [imageType]: {
        x: prev[imageType].x + e.movementX,
        y: prev[imageType].y + e.movementY
      }
    }));
  };

  const handleDragEnd = (imageType) => {
    setIsDragging(prev => ({ ...prev, [imageType]: false }));
  };

  const resetImage = (imageType) => {
    setZoom(prev => ({ ...prev, [imageType]: 1 }));
    setPosition(prev => ({ ...prev, [imageType]: { x: 0, y: 0 } }));
  };

  const loadWeatherBasedBaselineImage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const weatherCondition = inspectionData?.weatherCondition?.toLowerCase() || 'sunny';
      const imageUrl = await baselineImageService.getBaselineImage(transformerId, weatherCondition);
      
      if (imageUrl) {
        setWeatherBasedBaselineImage(imageUrl);
      } else {
        setWeatherBasedBaselineImage(null);
        setError(`No baseline image available for ${weatherCondition} condition`);
      }
    } catch (error) {
      setError('Failed to load baseline image: ' + error.message);
      setWeatherBasedBaselineImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (transformerId && inspectionData?.weatherCondition) {
      loadWeatherBasedBaselineImage();
    }
  }, [transformerId, inspectionData?.weatherCondition]);

  const handleRefreshClick = () => {
    console.log('Refresh clicked, fetching anomalies for:', inspectionId);
    if (inspectionId) {
      fetchAnomalies(inspectionId);
    }
    if (onRefresh) {
      onRefresh();
    }
  };

  const ImagePanel = ({ type, image, date }) => (
    <div className={`image-panel ${type}-panel`}>
      <div className="image-header">
        <div className="image-label-section">
          <span className="image-label">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
        </div>
        <span className="image-date">{date}</span>
      </div>
      
      <div className="thermal-image-wrapper">
        <div className="image-controls">
          <button onClick={() => handleZoom(type, 0.1)} title="Zoom in">
            <ZoomIn size={16} />
          </button>
          <button onClick={() => handleZoom(type, -0.1)} title="Zoom out">
            <ZoomOut size={16} />
          </button>
          <button onClick={() => resetImage(type)} title="Reset view">
            <RotateCcw size={16} />
          </button>
        </div>

        {image ? (
          <div 
            className="draggable-container"
            onMouseDown={(e) => handleDragStart(type, e)}
            onMouseMove={(e) => handleDragMove(type, e)}
            onMouseUp={() => handleDragEnd(type)}
            onMouseLeave={() => handleDragEnd(type)}
            style={{ cursor: isDragging[type] ? 'grabbing' : 'grab', position: 'relative' }}
          >
            <img 
              ref={type === 'current' ? imageRef : null}
              src={image} 
              alt={`${type} thermal image`}
              className="thermal-image"
              style={{
                transform: `translate(${position[type].x}px, ${position[type].y}px) scale(${zoom[type]})`,
                transition: isDragging[type] ? 'none' : 'transform 0.3s'
              }}
              onError={() => setError(`Failed to load ${type} image`)}
              onLoad={() => {
                console.log(`${type} image loaded`);
                if (type === 'current') {
                  setTimeout(() => drawBoundingBoxes(), 100);
                }
              }}
            />
            {type === 'current' && (
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                  transform: `translate(${position[type].x}px, ${position[type].y}px) scale(${zoom[type]})`,
                  transition: isDragging[type] ? 'none' : 'transform 0.3s'
                }}
              />
            )}
          </div>
        ) : (
          <div className="image-placeholder">
            <span>No {type} image available</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="thermal-comparison-container">
      <div className="comparison-header">
        <h3 className="comparison-title">Thermal Image Comparison</h3>
        <div className="comparison-actions">
          <button onClick={handleRefreshClick} className="action-btnT refresh-btnT">
            <RotateCcw size={16} />
            Refresh
          </button>
          <button onClick={onUploadNew} className="action-btnT upload-new-btnT">
            Upload New
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="action-btnT delete-btnT">
            <X size={16} />
            Delete
          </button>
        </div>
      </div>

      <div className="image-comparison-grid">
        <ImagePanel 
          type="baseline"
          image={weatherBasedBaselineImage}
          date={inspectionData?.baselineDate || '1/9/2025 9:10:03 PM'}
        />
        <ImagePanel 
          type="current"
          image={displayCurrentImage}
          date={inspectionData?.currentDate || new Date().toLocaleString()}
        />
      </div>

      <div className="analysis-sections">
        <div className="anomalies-section">
          <h4 style={{color: "black"}}>Anomalies Detected</h4>
          <div className="anomaly-list">
            {detections.length > 0 ? (
              detections.map((detection, index) => (
                <div key={index} className="anomaly-item">
                  <span className="anomaly-location">{detection.faultType}</span>
                  <span className="anomaly-temp">{(detection.faultConfidence * 100).toFixed(0)}%</span>
                  <span className={`anomaly-severity ${detection.faultConfidence > 0.7 ? 'critical' : 'high'}`}>
                    {detection.faultConfidence > 0.7 ? 'Critical' : 'High'}
                  </span>
                </div>
              ))
            ) : (
              <p>No anomalies detected</p>
            )}
          </div>
        </div>

        <div className="notes-section">
          <h4 style={{color: "black"}}>Notes</h4>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="notes-textarea"
            placeholder="Type here to add notes..."
            rows={4}
          />
          <div className="notes-actions">
            <button className="cancel-btn" onClick={() => setNotes('')}>
              Cancel
            </button>
            <button className="confirm-btn" onClick={() => console.log('Notes saved:', notes)}>
              Save Notes
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <AlertTriangle size={24} color="#dc3545" />
              <h3>Delete Thermal Images</h3>
            </div>
            <p>Are you sure you want to delete these thermal images? This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteConfirm(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={() => { onDelete?.(); setShowDeleteConfirm(false); }} className="confirm-delete-btn">
                <X size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThermalImageComparison;