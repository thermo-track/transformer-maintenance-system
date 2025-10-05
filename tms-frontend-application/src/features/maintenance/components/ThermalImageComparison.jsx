import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { ZoomIn, ZoomOut, X, RotateCcw, AlertTriangle, Settings } from 'lucide-react';
import '../styles/thermal-image-comparison.css';
import { baselineImageService } from '../services/BaselineImageService';
import { cloudinaryService } from '../services/CloudinaryService';
import AnomalyDetailsModal from './AnomalyDetailsModal';
import ThresholdSettingsModal from './ThresholdSettingsModal';

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
  const [detections, setDetections] = useState([]);
  const [inspectionId, setInspectionId] = useState(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [showAnomalyModal, setShowAnomalyModal] = useState(false);

  const navigate = useNavigate();
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentThresholds, setCurrentThresholds] = useState({
    thresholdPct: 2.0,
    iouThresh: 0.35,
    confThresh: 0.25
  });
  const [isRerunLoading, setIsRerunLoading] = useState(false);

  const handleApplyThresholds = async (newThresholds) => {
    try {
      setCurrentThresholds(newThresholds);
      setIsRerunLoading(true);

      // Re-run inference with new thresholds
      await cloudinaryService.rerunInferenceWithThresholds(
        inspectionId,
        newThresholds
      );
      
      // Refresh anomalies
      if (inspectionId) {
        await fetchAnomalies(inspectionId);
      }

      // Optional: set a success banner state if you have one
    } catch (error) {
      console.error('Error applying thresholds:', error);
      // Optional: set an error banner state if you have one
    } finally {
      setIsRerunLoading(false);
    }
  };

  const [zoom, setZoom] = useState({ baseline: 1, current: 1 });
  const [position, setPosition] = useState({ 
    baseline: { x: 0, y: 0 }, 
    current: { x: 0, y: 0 } 
  });
  const [isDragging, setIsDragging] = useState({ baseline: false, current: false });

  const displayCurrentImage = currentImage || baselineImage;

  useEffect(() => {
    if (inspectionData?.inspectionId) {
      setInspectionId(inspectionData.inspectionId);
    }
  }, [inspectionData]);

  useEffect(() => {
    if (inspectionId) {
      fetchAnomalies(inspectionId);
    }
  }, [inspectionId]);

  useEffect(() => {
    if (imageRef.current && canvasRef.current && detections.length > 0) {
      drawBoundingBoxes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detections, zoom.current, position.current]); // kept as in your original

  const fetchAnomalies = async (inspId) => {
    try {
      const result = await cloudinaryService.getInspectionAnomalies(inspId);
      const detectionData = (result.anomalies || []).filter(a => a.faultType);
      setDetections(detectionData);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    }
  };

  const drawBoundingBoxes = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !image.complete) return;

    const ctx = canvas.getContext('2d');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((detection) => {
      if (detection.bboxX !== null) {
        const x = detection.bboxX;
        const y = detection.bboxY;
        const width = detection.bboxWidth;
        const height = detection.bboxHeight;
        
        const confidence = detection.faultConfidence || 0;
        const color = confidence > 0.7 ? '#FF0000' : '#FFA500';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        
        // Dynamic font size based on bounding box size
        const boxArea = width * height;
        const fontSize = Math.max(12, Math.min(24, Math.sqrt(boxArea) / 15));
        
        const label = `${detection.faultType} (${(confidence * 100).toFixed(0)}%)`;
        ctx.font = `bold ${fontSize}px Arial`;
        const textWidth = ctx.measureText(label).width + 10;
        const labelHeight = fontSize + 10;
        
        ctx.fillStyle = `rgba(${confidence > 0.7 ? '255,0,0' : '255,165,0'}, 0.8)`;
        ctx.fillRect(x, y - labelHeight, textWidth, labelHeight);
        
        ctx.fillStyle = '#FFF';
        ctx.fillText(label, x + 5, y - 5);
      }
    });
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
        setError(`No baseline image available for ${weatherCondition} condition`);
      }
    } catch (error) {
      setError('Failed to load baseline image: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (transformerId && inspectionData?.weatherCondition) {
      loadWeatherBasedBaselineImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transformerId, inspectionData?.weatherCondition]);

  const handleRefreshClick = () => {
    if (inspectionId) {
      fetchAnomalies(inspectionId);
    }
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleAnomalyClick = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setShowAnomalyModal(true);
  };

  const handleSaveNotes = async () => {
      if (!selectedAnomaly || !notes) {
          alert('Please select an anomaly and enter notes');
          return;
      }

      try {
          await cloudinaryService.updateAnomalyNotes(inspectionId, selectedAnomaly.id, notes);
          setShowAnomalyModal(false);
          // Refresh anomalies list
          if (inspectionId) {
              await fetchAnomalies(inspectionId);
          }
          alert('Notes saved successfully');
          navigate(-1); // Navigate back after successful save
      } catch (error) {
          console.error('Error saving notes:', error);
          alert('Failed to save notes');
      }
  };

  const handleCancelNotes = () => {
    setNotes('');
    setShowAnomalyModal(false);
    navigate(-1);
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
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  transform: `translate(${position[type].x}px, ${position[type].y}px) scale(${zoom[type]})`,
                  transformOrigin: 'top left',
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
          <button
            disabled={isRerunLoading}
            onClick={() => setShowSettingsModal(true)}
            className="action-btnT settings-btnT"
          >
            <Settings size={16} />
            Settings
          </button>
          <button
            disabled={isRerunLoading}
            onClick={handleRefreshClick}
            className="action-btnT refresh-btnT"
          >
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
          <h4 style={{color: "black"}}>Detected Faults</h4>
          <div className="anomaly-list">
            {detections.length > 0 ? (
              detections.map((detection, index) => (
                <div 
                  key={index} 
                  className="anomaly-item clickable"
                  onClick={() => handleAnomalyClick(detection)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="anomaly-location">{detection.faultType}</span>
                  <span className="anomaly-temp">{(detection.faultConfidence * 100).toFixed(0)}%</span>
                  <span className={`anomaly-severity ${detection.faultConfidence > 0.7 ? 'critical' : 'high'}`}>
                    {detection.faultConfidence > 0.7 ? 'Critical' : 'High'}
                  </span>
                </div>
              ))
            ) : (
              <p>No faults detected</p>
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
            <button className="cancel-btn" onClick={handleCancelNotes}>
              Cancel
            </button>
            <button className="confirm-btn" onClick={handleSaveNotes}>
              Save Notes
            </button>
          </div>
        </div>
      </div>

      {showAnomalyModal && (
        <AnomalyDetailsModal
          anomaly={selectedAnomaly}
          inspectionData={inspectionData}
          onClose={() => setShowAnomalyModal(false)}
        />
      )}

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

      {showSettingsModal && (
        <ThresholdSettingsModal
          onClose={() => setShowSettingsModal(false)}
          onApply={handleApplyThresholds}
          currentSettings={currentThresholds}
        />
      )}

      {/* Rerun loading overlay */}
      {isRerunLoading && (
        <div className="overlay loading-overlay">
          <div className="loading-card">
            <div className="spinner" />
            <div className="loading-text">Re-running analysis…</div>
            <div className="indeterminate-bar">
              <div className="indeterminate-bar-inner" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThermalImageComparison;
