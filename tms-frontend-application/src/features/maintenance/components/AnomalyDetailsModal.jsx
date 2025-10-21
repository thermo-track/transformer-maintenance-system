import React from 'react';
import { X, AlertTriangle, Calendar, MapPin, User, TrendingUp } from 'lucide-react';
import '../styles/anomaly-details-modal.css';

const AnomalyDetailsModal = ({ anomaly, inspectionData, onClose }) => {
  if (!anomaly) return null;

  const formatDate = (date) =>
    new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getSeverityColor = (faultType, confidence) => {
    // Check if it's a normal detection
    if (faultType && faultType.toLowerCase().includes('normal')) {
      return '#28a745'; // Green for normal
    }
    // For actual faults, use confidence-based colors
    if (confidence > 0.7) return '#dc3545'; // Red for critical
    if (confidence > 0.5) return '#fd7e14'; // Orange for high
    return '#ffc107'; // Yellow for medium
  };

  const getSeverityLabel = (faultType, confidence) => {
    // Check if it's a normal detection
    if (faultType && faultType.toLowerCase().includes('normal')) {
      return 'Normal';
    }
    // For actual faults, use confidence-based labels
    if (confidence > 0.7) return 'Critical';
    if (confidence > 0.5) return 'High';
    return 'Medium';
  };

  return (
    <div className="anomaly-modal-overlay" onClick={onClose}>
      <div className="anomaly-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="anomaly-modal-header">
          <div
            className="header-icon"
            style={{ backgroundColor: getSeverityColor(anomaly.faultType, anomaly.faultConfidence) }}
          >
            <AlertTriangle size={24} color="white" />
          </div>
          <h2>Detection Details</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="anomaly-modal-body">
          <div className="detail-section">
            <h3>Detection Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Detection Type</label>
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
                        backgroundColor: getSeverityColor(anomaly.faultType, anomaly.faultConfidence),
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
                  style={{ backgroundColor: getSeverityColor(anomaly.faultType, anomaly.faultConfidence) }}
                >
                  {getSeverityLabel(anomaly.faultType, anomaly.faultConfidence)}
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
                <p>
                  X: {anomaly.bboxX}px, Y: {anomaly.bboxY}px
                </p>
              </div>

              <div className="detail-item">
                <div className="detail-icon-label">
                  <TrendingUp size={16} />
                  <label>Dimensions</label>
                </div>
                <p>
                  Width: {anomaly.bboxWidth}px, Height: {anomaly.bboxHeight}px
                </p>
              </div>

              {anomaly.centroidX && anomaly.centroidY && (
                <div className="detail-item">
                  <label>Centroid</label>
                  <p>
                    ({anomaly.centroidX.toFixed(1)}, {anomaly.centroidY.toFixed(1)})
                  </p>
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
                <p>
                  {anomaly.detectedAt ? formatDate(anomaly.detectedAt) : formatDate(new Date())}
                </p>
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
            </div>
          </div>

          {/* Classification section removed */}
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
