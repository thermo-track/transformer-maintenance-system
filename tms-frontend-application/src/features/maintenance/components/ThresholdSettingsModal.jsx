import React, { useState } from 'react';
import { X, Settings, AlertCircle } from 'lucide-react';
import '../styles/threshold-settings-modal.css';

const ThresholdSettingsModal = ({ onClose, onApply, currentSettings }) => {
  const [thresholds, setThresholds] = useState({
    thresholdPct: currentSettings?.thresholdPct || 5.0,
    iouThresh: currentSettings?.iouThresh || 1.0,
    confThresh: currentSettings?.confThresh || 0.50
  });

  const handleChange = (field, value) => {
    // Allow empty string for better UX when clearing
    if (value === '' || value === null) {
      setThresholds(prev => ({
        ...prev,
        [field]: ''
      }));
      return;
    }

    const numValue = parseFloat(value);
    
    // Validate and enforce limits
    if (!isNaN(numValue)) {
      let validatedValue = numValue;
      
      // Enforce max limit for thresholdPct
      if (field === 'thresholdPct') {
        validatedValue = Math.min(Math.max(0, numValue), 100);
      } else if (field === 'iouThresh' || field === 'confThresh') {
        validatedValue = Math.min(Math.max(0, numValue), 1);
      }
      
      setThresholds(prev => ({
        ...prev,
        [field]: validatedValue
      }));
    }
  };

  const handleBlur = (field) => {
    // Ensure we have a valid number when field loses focus
    if (thresholds[field] === '' || thresholds[field] === null) {
      const defaults = {
        thresholdPct: 2.0,
        iouThresh: 0.35,
        confThresh: 0.25
      };
      setThresholds(prev => ({
        ...prev,
        [field]: defaults[field]
      }));
    }
  };

  const handleApply = () => {
    // Ensure all values are valid before applying
    const validatedThresholds = {
      thresholdPct: thresholds.thresholdPct === '' ? 5.0 : thresholds.thresholdPct,
      iouThresh: thresholds.iouThresh === '' ? 1.0 : thresholds.iouThresh,
      confThresh: thresholds.confThresh === '' ? 0.50 : thresholds.confThresh
    };
    
    onApply(validatedThresholds);
    onClose();
  };

  const handleReset = () => {
    setThresholds({
      thresholdPct: 5.0,
      iouThresh: 1.0,
      confThresh: 0.50
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="threshold-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <Settings size={24} color="#007bff" />
            <h3>Error Ruleset</h3>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="info-banner">
            <AlertCircle size={16} />
            <span>Adjusting these thresholds will re-run anomaly detection with new parameters</span>
          </div>

          <div className="threshold-group">
            <label className="threshold-label">
              <span className="label-title">Threshold Percentage (threshold_pct)</span>
              <span className="label-description">
                Percentage threshold for detecting thermal anomalies. Areas with temperature 
                differences greater than this value compared to baseline are flagged.
              </span>
            </label>
            <div className="input-group">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={thresholds.thresholdPct}
                onChange={(e) => handleChange('thresholdPct', e.target.value)}
                onBlur={() => handleBlur('thresholdPct')}
                className="threshold-input"
              />
              <span className="input-suffix">%</span>
            </div>
            <span className="range-info">Range: 0-100% (Default: 5.0%)</span>
          </div>

          <div className="threshold-group">
            <label className="threshold-label">
              <span className="label-title">IoU Threshold (iou_thresh)</span>
              <span className="label-description">
                Intersection over Union threshold for merging overlapping detections. 
                Boxes overlapping by at least this percentage are merged to prevent duplicate detections.
              </span>
            </label>
            <div className="input-group">
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={thresholds.iouThresh}
                onChange={(e) => handleChange('iouThresh', e.target.value)}
                onBlur={() => handleBlur('iouThresh')}
                className="threshold-input"
              />
            </div>
            <span className="range-info">Range: 0-1 (Default: 1.0)</span>
          </div>

          <div className="threshold-group">
            <label className="threshold-label">
              <span className="label-title">Confidence Threshold (conf_thresh)</span>
              <span className="label-description">
                Minimum confidence score for YOLO model detections. 
                Only detections above this threshold are kept, filtering out low-confidence predictions.
              </span>
            </label>
            <div className="input-group">
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={thresholds.confThresh}
                onChange={(e) => handleChange('confThresh', e.target.value)}
                onBlur={() => handleBlur('confThresh')}
                className="threshold-input"
              />
            </div>
            <span className="range-info">Range: 0-1 (Default: 0.50)</span>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={handleReset} className="reset-btn">
            Reset to Defaults
          </button>
          <div className="action-buttons">
            <button onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button onClick={handleApply} className="apply-btn">
              Apply & Re-analyze
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThresholdSettingsModal;