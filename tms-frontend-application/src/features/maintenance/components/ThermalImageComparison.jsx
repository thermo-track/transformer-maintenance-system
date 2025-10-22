import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { ZoomIn, ZoomOut, X, RotateCcw, AlertTriangle, Settings, Edit3, Trash2, Edit } from 'lucide-react';
import '../styles/thermal-image-comparison.css';
import { baselineImageService } from '../services/BaselineImageService';
import { cloudinaryService } from '../services/CloudinaryService';
import anomalyNoteService from '../services/AnomalyNoteService';
import AnomalyDetailsModal from './AnomalyDetailsModal';
import ThresholdSettingsModal from './ThresholdSettingsModal';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';

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
  const [showNotesView, setShowNotesView] = useState(false);
  const [anomalyNotes, setAnomalyNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [currentUser, setCurrentUser] = useState('System User');
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState({ isOpen: false, noteId: null });

  const navigate = useNavigate();
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentThresholds, setCurrentThresholds] = useState({
    thresholdPct: 5.0,
    iouThresh: 1.0,
    confThresh: 0.50
  });
  const [isRerunLoading, setIsRerunLoading] = useState(false);

  const weatherLabel =
    inspectionData?.weatherCondition
      ? inspectionData.weatherCondition.charAt(0).toUpperCase() +
        inspectionData.weatherCondition.slice(1)
      : null;

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

  useEffect(() => {
    if (imageRef.current && canvasRef.current && detections.length > 0) {
      const timeoutId = setTimeout(() => {
        drawBoundingBoxes();
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [detections, zoom.current, position.current]);

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
      // Filter only active annotations with faultType
      const detectionData = (result.anomalies || []).filter(a => a.faultType && a.isActive !== false);
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
    
    const containerRect = container.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    
    const containerAspect = containerWidth / containerHeight;
    const imageAspect = naturalWidth / naturalHeight;
    
    let renderedWidth, renderedHeight, offsetX, offsetY;
    
    if (imageAspect > containerAspect) {
      renderedHeight = containerHeight;
      renderedWidth = renderedHeight * imageAspect;
      offsetX = (containerWidth - renderedWidth) / 2;
      offsetY = 0;
    } else {
      renderedWidth = containerWidth;
      renderedHeight = renderedWidth / imageAspect;
      offsetX = 0;
      offsetY = (containerHeight - renderedHeight) / 2;
    }
    
    const currentZoom = zoom.current;
    const zoomedWidth = renderedWidth * currentZoom;
    const zoomedHeight = renderedHeight * currentZoom;
    
    const zoomOffsetX = (renderedWidth - zoomedWidth) / 2;
    const zoomOffsetY = (renderedHeight - zoomedHeight) / 2;
    
    const finalX = offsetX + zoomOffsetX + position.current.x;
    const finalY = offsetY + zoomOffsetY + position.current.y;
    
    const scaleX = zoomedWidth / naturalWidth;
    const scaleY = zoomedHeight / naturalHeight;

    detections.forEach((detection) => {
      if (detection.bboxX === null || detection.bboxY === null) return;
      
      const x = (detection.bboxX * scaleX) + finalX;
      const y = (detection.bboxY * scaleY) + finalY;
      const width = detection.bboxWidth * scaleX;
      const height = detection.bboxHeight * scaleY;
      
      if (x + width < 0 || y + height < 0 || 
          x > containerWidth || y > containerHeight) {
        return;
      }
      
      const confidence = detection.faultConfidence || 0;
      const faultType = detection.faultType || '';
      
      // Determine color based on fault type and confidence
      let color;
      if (faultType.toLowerCase().includes('normal')) {
        color = '#28a745'; // Green for normal detections
      } else {
        color = confidence > 0.7 ? '#FF0000' : '#FFA500'; // Red/Orange for faults
      }
      
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, Math.min(5, 3 * currentZoom));
      ctx.strokeRect(x, y, width, height);
      
      const baseFontSize = Math.max(12, Math.min(18, Math.sqrt(width * height) / 20));
      const fontSize = Math.max(10, Math.min(24, baseFontSize));
      
      const label = `${detection.faultType} (${(confidence * 100).toFixed(0)}%)`;
      ctx.font = `bold ${fontSize}px Arial`;
      const textMetrics = ctx.measureText(label);
      const textWidth = textMetrics.width + 10;
      const labelHeight = fontSize + 10;
      
      let labelX = x;
      let labelY = y;
      
      if (labelX + textWidth > containerWidth) {
        labelX = containerWidth - textWidth - 4;
      }
      if (labelX < 4) {
        labelX = 4;
      }
      
      if (labelY - labelHeight > 4) {
        labelY = labelY - 2;
      } else {
        labelY = y + height + labelHeight - 2;
      }
      
      // Background color for label - match the detection type
      const bgAlpha = 0.9;
      if (faultType.toLowerCase().includes('normal')) {
        ctx.fillStyle = `rgba(40, 167, 69, ${bgAlpha})`; // Green background for normal
      } else {
        ctx.fillStyle = confidence > 0.7 
          ? `rgba(255, 0, 0, ${bgAlpha})` 
          : `rgba(255, 165, 0, ${bgAlpha})`;
      }
      ctx.fillRect(labelX, labelY - labelHeight, textWidth, labelHeight);
      
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
    setShowAnomalyModal(true);
  };

  const handleViewNotesClick = async (anomaly, e) => {
    e.stopPropagation();
    setSelectedAnomaly(anomaly);
    setShowNotesView(true);
    
    try {
      const result = await anomalyNoteService.getAnomalyNotes(inspectionId, anomaly.id);
      setAnomalyNotes(result.notes || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setAnomalyNotes([]);
    }
  };

  const handleAddNewNote = () => {
    setNotes('');
    setEditingNoteId('new');
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.note);
  };

  const handleSaveEditedNote = async (noteId) => {
    const noteText = noteId === 'new' ? notes : editingNoteText;
    
    if (!noteText.trim()) {
      alert('Please enter note text');
      return;
    }

    try {
      if (noteId === 'new') {
        await anomalyNoteService.addAnomalyNote(
          inspectionId, 
          selectedAnomaly.id, 
          noteText, 
          currentUser
        );
      } else {
        await anomalyNoteService.updateAnomalyNote(
          inspectionId, 
          selectedAnomaly.id, 
          noteId, 
          noteText
        );
      }
      
      const result = await anomalyNoteService.getAnomalyNotes(inspectionId, selectedAnomaly.id);
      setAnomalyNotes(result.notes || []);
      
      setEditingNoteId(null);
      setEditingNoteText('');
      setNotes('');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
    setNotes('');
  };

  const handleDeleteNote = (noteId) => {
    setDeleteNoteConfirm({ isOpen: true, noteId });
  };

  const confirmDeleteNote = async () => {
    const { noteId } = deleteNoteConfirm;
    setDeleteNoteConfirm({ isOpen: false, noteId: null });

    try {
      await anomalyNoteService.deleteAnomalyNote(inspectionId, selectedAnomaly.id, noteId);
      
      const result = await anomalyNoteService.getAnomalyNotes(inspectionId, selectedAnomaly.id);
      setAnomalyNotes(result.notes || []);
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note: ' + (error.message || 'Unknown error'));
    }
  };

  const cancelDeleteNote = () => {
    setDeleteNoteConfirm({ isOpen: false, noteId: null });
  };

  const handleCancelNotes = () => {
    setNotes('');
    setSelectedAnomaly(null);
    setShowAnomalyModal(false);
    setShowNotesView(false);
    setEditingNoteId(null);
    setEditingNoteText('');
    setAnomalyNotes([]);
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
      {error && (
        <div className="error-banner" style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#dc2626'
        }}>
          <AlertTriangle size={16} />
          <span style={{ flex: 1 }}>{error}</span>
          <button 
            onClick={() => setError(null)} 
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              padding: '2px',
              borderRadius: '2px'
            }}
            className="error-close"
          >
            <X size={14} />
          </button>
        </div>
      )}
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
          <button onClick={onUploadNew} className="action-btnT upload-new-btnT" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Upload New'}
          </button>
          <button 
            onClick={() => navigate(`/annotations/${inspectionId}`)} 
            className="action-btnT edit-annotation-btnT" 
            disabled={!inspectionId}
          >
            <Edit size={16} />
            Edit Annotations
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="action-btnT delete-btnT" disabled={isLoading}>
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
        {weatherLabel && (
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '6px 10px',
                borderRadius: 999,
                background: '#e8f0fe',
                color: '#1a56db',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Weather Condition: {weatherLabel}
            </span>
          </div>
        )}
        <div className="anomalies-section">
          <h4 style={{color: "black"}}>Detected Faults</h4>
          <div className="anomaly-list">
            {detections.length > 0 ? (
              detections.map((detection, index) => (
                <div key={index}>
                  <div 
                    className="anomaly-item"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: '8px',
                      backgroundColor: selectedAnomaly?.id === detection.id ? '#e3f2fd' : 'transparent',
                      border: selectedAnomaly?.id === detection.id ? '2px solid #2196f3' : '1px solid #e0e0e0'
                    }}
                  >
                    <div 
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleAnomalyClick(detection)}
                    >
                      <span className="anomaly-location">{detection.faultType}</span>
                      <span className="anomaly-temp">{(detection.faultConfidence * 100).toFixed(0)}%</span>
                      <span 
                        className={`anomaly-severity ${
                          detection.faultType.toLowerCase().includes('normal') 
                            ? 'normal' 
                            : detection.faultConfidence > 0.7 
                              ? 'critical' 
                              : 'high'
                        }`}
                        style={{
                          backgroundColor: detection.faultType.toLowerCase().includes('normal') 
                            ? '#28a745' 
                            : detection.faultConfidence > 0.7 
                              ? '#dc3545' 
                              : '#fd7e14',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        {detection.faultType.toLowerCase().includes('normal') 
                          ? 'Normal' 
                          : detection.faultConfidence > 0.7 
                            ? 'Critical' 
                            : 'High'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleViewNotesClick(detection, e)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: selectedAnomaly?.id === detection.id ? '#fff' : '#2196f3',
                        backgroundColor: selectedAnomaly?.id === detection.id ? '#2196f3' : '#fff',
                        border: '2px solid #2196f3',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedAnomaly?.id !== detection.id) {
                          e.target.style.backgroundColor = '#e3f2fd';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedAnomaly?.id !== detection.id) {
                          e.target.style.backgroundColor = '#fff';
                        }
                      }}
                    >
                      View Notes
                    </button>
                  </div>
                  
                  {selectedAnomaly?.id === detection.id && showNotesView && (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f5f9ff',
                      border: '2px solid #2196f3',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      marginTop: '-1px'
                    }}>
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#1976d2'
                      }}>
                        <span>Notes for: {detection.faultType} ({(detection.faultConfidence * 100).toFixed(0)}%)</span>
                        <button
                          onClick={handleAddNewNote}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          + Add Note
                        </button>
                      </div>
                      
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {anomalyNotes.map((note, index) => (
                          <div key={note.id || index} style={{
                            marginBottom: '8px',
                            padding: '8px',
                            backgroundColor: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}>
                            {editingNoteId === note.id ? (
                              <div>
                                <textarea
                                  value={editingNoteText}
                                  onChange={(e) => setEditingNoteText(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '6px',
                                    border: '1px solid #2196f3',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    resize: 'vertical'
                                  }}
                                  rows={2}
                                  autoFocus
                                />
                                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                  <button
                                    onClick={() => handleSaveEditedNote(note.id)}
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '11px',
                                      backgroundColor: '#4caf50',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '11px',
                                      backgroundColor: '#f44336',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '13px', marginBottom: '4px' }}>{note.note}</div>
                                  <div style={{ fontSize: '11px', color: '#666' }}>
                                    By {note.createdBy} • {new Date(note.createdAt).toLocaleString()}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                                  <button
                                    onClick={() => handleEditNote(note)}
                                    style={{
                                      padding: '4px',
                                      fontSize: '11px',
                                      backgroundColor: 'transparent',
                                      border: '1px solid #2196f3',
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      color: '#2196f3',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    title="Edit note"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    style={{
                                      padding: '4px',
                                      fontSize: '11px',
                                      backgroundColor: 'transparent',
                                      border: '1px solid #f44336',
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      color: '#f44336',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    title="Delete note"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {editingNoteId === 'new' && (
                          <div style={{
                            marginBottom: '8px',
                            padding: '8px',
                            backgroundColor: 'white',
                            border: '2px solid #4caf50',
                            borderRadius: '4px'
                          }}>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Type your new note here..."
                              style={{
                                width: '100%',
                                padding: '6px',
                                border: '1px solid #4caf50',
                                borderRadius: '4px',
                                fontSize: '13px',
                                resize: 'vertical'
                              }}
                              rows={2}
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                              <button
                                onClick={() => handleSaveEditedNote('new')}
                                disabled={!notes.trim()}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  backgroundColor: notes.trim() ? '#4caf50' : '#ccc',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: notes.trim() ? 'pointer' : 'not-allowed'
                                }}
                              >
                                Add Note
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  backgroundColor: '#f44336',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {anomalyNotes.length === 0 && editingNoteId !== 'new' && (
                          <div style={{
                            textAlign: 'center',
                            color: '#666',
                            fontSize: '13px',
                            padding: '16px'
                          }}>
                            No notes yet. Click "Add Note" to create the first note.
                          </div>
                        )}
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end',
                        marginTop: '12px'
                      }}>
                        <button 
                          onClick={handleCancelNotes}
                          style={{
                            padding: '6px 16px',
                            fontSize: '13px',
                            backgroundColor: '#666',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>No faults detected</p>
            )}
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
              <button 
                onClick={() => { 
                  if (onDelete) onDelete(); 
                  setShowDeleteConfirm(false); 
                }} 
                className="confirm-delete-btn" 
                disabled={isLoading}
              >
                <X size={16} />
                {isLoading ? 'Deleting...' : 'Delete'}
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

      {/* Confirmation Dialog for Note Deletion */}
      <ConfirmDialog
        isOpen={deleteNoteConfirm.isOpen}
        onConfirm={confirmDeleteNote}
        onCancel={cancelDeleteNote}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="danger"
        icon="🗑️"
      />
    </div>
  );
};

export default ThermalImageComparison;