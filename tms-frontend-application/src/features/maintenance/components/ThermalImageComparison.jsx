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
  const containerRef = useRef(null);

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

      await cloudinaryService.rerunInferenceWithThresholds(
        inspectionId,
        newThresholds
      );
      
      if (inspectionId) {
        await fetchAnomalies(inspectionId);
      }
    } catch (error) {
      console.error('Error applying thresholds:', error);
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

  // Redraw bounding boxes when detections, zoom, or position changes
  useEffect(() => {
    if (imageRef.current && canvasRef.current && detections.length > 0) {
      const timeoutId = setTimeout(() => {
        drawBoundingBoxes();
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [detections, zoom.current, position.current]);

  // Redraw on container resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (detections.length > 0 && imageRef.current?.complete) {
        requestAnimationFrame(() => drawBoundingBoxes());
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, [detections]);

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
    const container = containerRef.current;
    
    if (!canvas || !image || !container || !image.complete || !image.naturalWidth) {
      return;
    }

    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match container
    const containerRect = container.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    
    // Calculate how object-fit: cover displays the image
    const containerAspect = containerWidth / containerHeight;
    const imageAspect = naturalWidth / naturalHeight;
    
    let renderedWidth, renderedHeight, offsetX, offsetY;
    
    if (imageAspect > containerAspect) {
      // Image is wider - height matches container, width overflows
      renderedHeight = containerHeight;
      renderedWidth = renderedHeight * imageAspect;
      offsetX = (containerWidth - renderedWidth) / 2;
      offsetY = 0;
    } else {
      // Image is taller - width matches container, height overflows
      renderedWidth = containerWidth;
      renderedHeight = renderedWidth / imageAspect;
      offsetX = 0;
      offsetY = (containerHeight - renderedHeight) / 2;
    }
    
    // Apply zoom transformation
    const currentZoom = zoom.current;
    const zoomedWidth = renderedWidth * currentZoom;
    const zoomedHeight = renderedHeight * currentZoom;
    
    // Calculate the position after zoom (zoom centers on the image)
    const zoomOffsetX = (renderedWidth - zoomedWidth) / 2;
    const zoomOffsetY = (renderedHeight - zoomedHeight) / 2;
    
    // Final position = base offset + zoom centering + user pan
    const finalX = offsetX + zoomOffsetX + position.current.x;
    const finalY = offsetY + zoomOffsetY + position.current.y;
    
    // Scale factor from original image coordinates to displayed coordinates
    const scaleX = zoomedWidth / naturalWidth;
    const scaleY = zoomedHeight / naturalHeight;

    // Draw each detection
    detections.forEach((detection) => {
      if (detection.bboxX === null || detection.bboxY === null) return;
      
      // Transform bbox from original image space to displayed canvas space
      const x = (detection.bboxX * scaleX) + finalX;
      const y = (detection.bboxY * scaleY) + finalY;
      const width = detection.bboxWidth * scaleX;
      const height = detection.bboxHeight * scaleY;
      
      // Only draw if at least partially visible in viewport
      if (x + width < 0 || y + height < 0 || 
          x > containerWidth || y > containerHeight) {
        return;
      }
      
      const confidence = detection.faultConfidence || 0;
      const color = confidence > 0.7 ? '#FF0000' : '#FFA500';
      
      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, Math.min(5, 3 * currentZoom));
      ctx.strokeRect(x, y, width, height);
      
      // Calculate font size that scales with zoom but stays readable
      const baseFontSize = Math.max(12, Math.min(18, Math.sqrt(width * height) / 20));
      const fontSize = Math.max(10, Math.min(24, baseFontSize));
      
      const label = `${detection.faultType} (${(confidence * 100).toFixed(0)}%)`;
      ctx.font = `bold ${fontSize}px Arial`;
      const textMetrics = ctx.measureText(label);
      const textWidth = textMetrics.width + 10;
      const labelHeight = fontSize + 10;
      
      // Position label above the box, but keep within canvas bounds
      let labelX = x;
      let labelY = y;
      
      // Keep label within horizontal bounds
      if (labelX + textWidth > containerWidth) {
        labelX = containerWidth - textWidth - 4;
      }
      if (labelX < 4) {
        labelX = 4;
      }
      
      // Put label above box if space available, otherwise below
      if (labelY - labelHeight > 4) {
        labelY = labelY - 2;
      } else {
        labelY = y + height + labelHeight - 2;
      }
      
      // Draw label background
      const bgAlpha = confidence > 0.7 ? 0.9 : 0.85;
      ctx.fillStyle = confidence > 0.7 
        ? `rgba(255, 0, 0, ${bgAlpha})` 
        : `rgba(255, 165, 0, ${bgAlpha})`;
      ctx.fillRect(labelX, labelY - labelHeight, textWidth, labelHeight);
      
      // Draw label text
      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'top';
      ctx.fillText(label, labelX + 5, labelY - labelHeight + 5);
    });
  };

  const handleZoom = (imageType, delta) => {
    setZoom(prev => ({
      ...prev,
      [imageType]: Math.max(1, Math.min(3, prev[imageType] + delta))
    }));
  };

  const handleDragStart = (imageType, e) => {
    e.preventDefault();
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
    setNotes(anomaly.notes || ''); // Load existing notes if any
    setShowAnomalyModal(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedAnomaly) {
      alert('Please select an anomaly from the detected faults list');
      return;
    }

    if (!notes.trim()) {
      alert('Please enter notes before saving');
      return;
    }

    try {
      await cloudinaryService.updateAnomalyNotes(inspectionId, selectedAnomaly.id, notes);
      setShowAnomalyModal(false);
      setSelectedAnomaly(null);
      setNotes('');
      
      // Refresh anomalies list
      if (inspectionId) {
        await fetchAnomalies(inspectionId);
      }
      alert('Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    }
  };

  const handleCancelNotes = () => {
    setNotes('');
    setSelectedAnomaly(null);
    setShowAnomalyModal(false);
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
            ref={type === 'current' ? containerRef : null}
            className="draggable-container"
            onMouseDown={(e) => handleDragStart(type, e)}
            onMouseMove={(e) => handleDragMove(type, e)}
            onMouseUp={() => handleDragEnd(type)}
            onMouseLeave={() => handleDragEnd(type)}
            style={{ 
              cursor: isDragging[type] ? 'grabbing' : 'grab', 
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <img 
              ref={type === 'current' ? imageRef : null}
              src={image} 
              alt={`${type} thermal image`}
              className="thermal-image"
              style={{
                transform: `translate(${position[type].x}px, ${position[type].y}px) scale(${zoom[type]})`,
                transition: isDragging[type] ? 'none' : 'transform 0.3s ease',
                objectFit: 'cover',
                width: '100%',
                height: '100%'
              }}
              onError={() => setError(`Failed to load ${type} image`)}
              onLoad={() => {
                if (type === 'current' && detections.length > 0) {
                  setTimeout(() => drawBoundingBoxes(), 100);
                }
              }}
              draggable={false}
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
                  pointerEvents: 'none'
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{color: "black", margin: 0}}>Notes</h4>
            {selectedAnomaly && (
              <div style={{ 
                padding: '4px 12px', 
                backgroundColor: selectedAnomaly.faultConfidence > 0.7 ? '#fee' : '#fff3e0',
                border: `2px solid ${selectedAnomaly.faultConfidence > 0.7 ? '#dc3545' : '#ff9800'}`,
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 'bold',
                color: selectedAnomaly.faultConfidence > 0.7 ? '#dc3545' : '#f57c00'
              }}>
                {selectedAnomaly.faultType} ({(selectedAnomaly.faultConfidence * 100).toFixed(0)}%)
              </div>
            )}
          </div>
          {!selectedAnomaly && (
            <div style={{ 
              padding: '8px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '4px', 
              marginBottom: '8px',
              fontSize: '13px',
              color: '#666',
              textAlign: 'center'
            }}>
              👆 Click on a detected fault above to add notes
            </div>
          )}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="notes-textarea"
            placeholder={selectedAnomaly ? "Type notes for the selected anomaly..." : "Select an anomaly first..."}
            rows={4}
            disabled={!selectedAnomaly}
            style={{
              opacity: selectedAnomaly ? 1 : 0.6,
              cursor: selectedAnomaly ? 'text' : 'not-allowed'
            }}
          />
          <div className="notes-actions">
            <button 
              className="cancel-btn" 
              onClick={handleCancelNotes}
              disabled={!selectedAnomaly}
            >
              Cancel
            </button>
            <button 
              className="confirm-btn" 
              onClick={handleSaveNotes}
              disabled={!selectedAnomaly || !notes.trim()}
            >
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