import React from 'react';
import { X, AlertTriangle, Calendar, MapPin, User, TrendingUp } from 'lucide-react';
import '../styles/anomaly-details-modal.css';

const AnomalyDetailsModal = ({ anomaly, inspectionData, onClose }) => {
  if (!anomaly) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (confidence) => {
    if (confidence > 0.7) return '#dc3545';
    if (confidence > 0.5) return '#fd7e14';
    return '#ffc107';
  };

  return (
    <div className="anomaly-modal-overlay" onClick={onClose}>
      <div className="anomaly-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="anomaly-modal-header">
          <div className="header-icon" style={{ backgroundColor: getSeverityColor(anomaly.faultConfidence) }}>
            <AlertTriangle size={24} color="white" />
          </div>
          <h2>Fault Detection Details</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="anomaly-modal-body">
          <div className="detail-section">
            <h3>Fault Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Fault Type</label>
                <p className="fault-type-value">{anomaly.faultType}</p>
              </div>
              
              <div className="detail-item">
                <label>Confidence Score</label>
                <div className="confidence-display">
                  <div className="confidence-bar-bg">
                    <div 
                      className="confidence-bar-fill" 
                      style={{ 
                        width: `${anomaly.faultConfidence * 100}%`,
                        backgroundColor: getSeverityColor(anomaly.faultConfidence)
                      }}
                    ></div>
                  </div>
                  <span className="confidence-text">
                    {(anomaly.faultConfidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="detail-item">
                <label>Severity Level</label>
                <span 
                  className="severity-badge" 
                  style={{ backgroundColor: getSeverityColor(anomaly.faultConfidence) }}
                >
                  {anomaly.faultConfidence > 0.7 ? 'Critical' : anomaly.faultConfidence > 0.5 ? 'High' : 'Medium'}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Location & Position</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-icon-label">
                  <MapPin size={16} />
                  <label>Bounding Box Position</label>
                </div>
                <p>X: {anomaly.bboxX}px, Y: {anomaly.bboxY}px</p>
              </div>
              
              <div className="detail-item">
                <div className="detail-icon-label">
                  <TrendingUp size={16} />
                  <label>Dimensions</label>
                </div>
                <p>Width: {anomaly.bboxWidth}px, Height: {anomaly.bboxHeight}px</p>
              </div>

              {anomaly.centroidX && anomaly.centroidY && (
                <div className="detail-item">
                  <label>Centroid</label>
                  <p>({anomaly.centroidX.toFixed(1)}, {anomaly.centroidY.toFixed(1)})</p>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3>Inspection Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-icon-label">
                  <Calendar size={16} />
                  <label>Detection Date</label>
                </div>
                <p>{anomaly.detectedAt ? formatDate(anomaly.detectedAt) : formatDate(new Date())}</p>
              </div>
              
              <div className="detail-item">
                <div className="detail-icon-label">
                  <User size={16} />
                  <label>Inspector</label>
                </div>
                <p>System Admin (AI Detection)</p>
              </div>

              <div className="detail-item">
                <label>Inspection ID</label>
                <p className="inspection-id2">{inspectionData?.inspectionId || 'N/A'}</p>
              </div>

              {inspectionData?.weatherCondition && (
                <div className="detail-item">
                  <label>Weather Condition</label>
                  <p>{inspectionData.weatherCondition.charAt(0).toUpperCase() + inspectionData.weatherCondition.slice(1)}</p>
                </div>
              )}
            </div>
          </div>

          {anomaly.classId !== undefined && (
            <div className="detail-section">
              <h3>Classification</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Class ID</label>
                  <p>{anomaly.classId}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="anomaly-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnomalyDetailsModal;