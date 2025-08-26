import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from "react-router-dom";
import { X, RotateCcw, AlertTriangle } from 'lucide-react';
import '../styles/thermal-image-comparison.css';
import { baselineImageService } from '../services/BaselineImageService';

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
  const { transformerNo, inspectionId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weatherBasedBaselineImage, setWeatherBasedBaselineImage] = useState(null);
  
  console.log('📊 Full inspectionData:', inspectionData);
  console.log('🌤️ Weather condition from inspectionData:', inspectionData?.weatherCondition);
  
  // Use current image for display (second panel remains unchanged)
  const displayCurrentImage = currentImage || baselineImage;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    if (onDelete) {
      onDelete();
    }
  };

  useEffect(() => {
    console.log('🚀 ThermalImageComparison mounted with:');
    console.log('  - transformerNo:', transformerNo);
    console.log('  - inspectionData?.weatherCondition:', inspectionData?.weatherCondition);
    
    if (transformerNo && inspectionData?.weatherCondition) {
      console.log('✅ All required data available, loading weather-based baseline image');
      loadWeatherBasedBaselineImage();
    } else {
      console.warn('⚠️ Missing required data:');
      console.warn('  - transformerNo:', !!transformerNo);
      console.warn('  - weatherCondition:', !!inspectionData?.weatherCondition);
      
      if (!transformerNo) {
        setError('No transformer number provided');
      }
    }
  }, [transformerNo, inspectionData?.weatherCondition]);

  const loadWeatherBasedBaselineImage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const weatherCondition = inspectionData?.weatherCondition?.toLowerCase() || 'sunny';
      console.log('🎯 Loading baseline image for:');
      console.log('  - transformer:', transformerNo);
      console.log('  - weather:', weatherCondition);
      
      // Use the correct method from BaselineImageService
      const imageUrl = await baselineImageService.getBaselineImage(transformerId, weatherCondition);
      
      if (imageUrl) {
        setWeatherBasedBaselineImage(imageUrl);
        console.log('✅ Baseline image loaded successfully for weather condition:', weatherCondition);
      } else {
        console.log('❌ No baseline image found for weather condition:', weatherCondition);
        setWeatherBasedBaselineImage(null);
        setError(`No baseline image available for ${weatherCondition} condition`);
      }
      
    } catch (error) {
      console.error('💥 Error loading weather-based baseline image:', error);
      setError('Failed to load baseline image: ' + error.message);
      setWeatherBasedBaselineImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  // No need to cleanup blob URL since we're getting direct URLs from Cloudinary
  useEffect(() => {
    return () => {
      // Only cleanup if it's a blob URL (which shouldn't happen with the new service)
      if (weatherBasedBaselineImage && weatherBasedBaselineImage.startsWith('blob:')) {
        URL.revokeObjectURL(weatherBasedBaselineImage);
      }
    };
  }, [weatherBasedBaselineImage]);

  return (
    <div className="thermal-comparison-container">
      <div className="comparison-header">
        <h3 className="comparison-title">Thermal Image Comparison</h3>
        <div className="comparison-actions">
          <button 
            onClick={onRefresh}
            className="action-btnT refresh-btnT"
            title="Refresh images"
          >
            <RotateCcw size={16} />
            Refresh
          </button>
          <button 
            onClick={onUploadNew}
            className="action-btnT upload-new-btnT"
            title="Upload new image"
          >
            📤 Upload New
          </button>
          <button 
            onClick={handleDeleteClick}
            className="action-btnT delete-btnT"
            title="Delete images"
          >
            <X size={16} />
            Delete
          </button>
        </div>
      </div>
      
      <div className="image-comparison-grid">
        {/* Baseline Image Panel */}
        <div className="image-panel baseline-panel">
          <div className="image-header">
            <div className="image-label-section">
              <span className="image-label">Baseline</span>
              <span className="image-status normal">Normal</span>
            </div>
            <span className="image-date">
              {inspectionData?.baselineDate || '1/9/2025 9:10:03 PM'}
            </span>
          </div>
          
          <div className="thermal-image-wrapper">
            {isLoading ? (
              <div className="image-placeholder">
                <div className="loading-spinner"></div>
                <span>Loading baseline image...</span>
              </div>
            ) : error ? (
              <div className="image-placeholder error">
                <AlertTriangle size={24} />
                <span>{error}</span>
                <button 
                  onClick={loadWeatherBasedBaselineImage}
                  className="retry-btn"
                >
                  Retry
                </button>
              </div>
            ) : weatherBasedBaselineImage ? (
              <img 
                src={weatherBasedBaselineImage} 
                alt={`Baseline thermal image (${inspectionData?.weatherCondition || 'unknown'} condition)`}
                className="thermal-image"
                onError={(e) => {
                  console.error('Failed to load baseline image:', e);
                  setError('Failed to display baseline image');
                }}
              />
            ) : (
              <div className="image-placeholder">
                <span>No baseline image available for {inspectionData?.weatherCondition || 'current weather'} condition</span>
                <button 
                  onClick={onUploadNew}
                  className="upload-baseline-btn"
                >
                  Upload Baseline
                </button>
              </div>
            )}
            
            {/* Temperature Scale */}
            <div className="temperature-scale">
              <div className="scale-bar">
                <div className="scale-gradient"></div>
                <div className="scale-labels">
                  <span className="temp-max">45°C</span>
                  <span className="temp-mid">25°C</span>
                  <span className="temp-min">5°C</span>
                </div>
              </div>
            </div>
            
            {/* Temperature Reading */}
            <div className="temperature-reading baseline-temp">
              {inspectionData?.baselineTemperature || '73.0°F'}
            </div>
          </div>
        </div>

        {/* Current Image Panel - UNCHANGED */}
        <div className="image-panel current-panel">
          <div className="image-header">
            <div className="image-label-section">
              <span className="image-label">Current</span>
              {inspectionData?.hasAnomaly !== false && (
                <span className="image-status anomaly">
                  ⚠️ Anomaly Detected
                </span>
              )}
            </div>
            <span className="image-date">
              {inspectionData?.currentDate || '5/7/2025 6:34:21 PM'}
            </span>
          </div>
          
          <div className="thermal-image-wrapper">
            {displayCurrentImage ? (
              <img 
                src={displayCurrentImage} 
                alt="Current thermal image" 
                className="thermal-image"
              />
            ) : (
              <div className="image-placeholder">
                <span>No current image</span>
              </div>
            )}
            
            {/* Temperature Scale */}
            <div className="temperature-scale">
              <div className="scale-bar">
                <div className="scale-gradient"></div>
                <div className="scale-labels">
                  <span className="temp-max">45°C</span>
                  <span className="temp-mid">25°C</span>
                  <span className="temp-min">5°C</span>
                </div>
              </div>
            </div>
            
            {/* Temperature Reading */}
            <div className="temperature-reading current-temp">
              {inspectionData?.currentTemperature || '89.2°F'}
            </div>
            
            {/* Anomaly Detection Boxes - Show only if anomalies detected */}
            {inspectionData?.hasAnomaly !== false && (
              <div className="anomaly-boxes">
                <div className="anomaly-box box-1" title="Hot spot detected">
                  <span className="anomaly-temp">38.1°C</span>
                </div>
                <div className="anomaly-box box-2" title="Hot spot detected">
                  <span className="anomaly-temp">41.7°C</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="warning-icon">
                <AlertTriangle size={24} color="#dc3545" />
              </div>
              <h3 className="modal-title">Delete Thermal Images</h3>
            </div>
            
            <div className="modal-content">
              <p className="warning-text">
                Are you sure you want to delete inspection thermal image? <br /> This action cannot be undone.
              </p>
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={handleCancelDelete}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="confirm-delete-btn"
              >
                <X size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Summary */}
      <div className="analysis-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Temperature Difference:</span>
            <span className="stat-value">
              {inspectionData?.temperatureDiff || '+16.2°F'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Analysis Status:</span>
            <span className={`stat-value ${inspectionData?.hasAnomaly !== false ? 'anomaly' : 'normal'}`}>
              {inspectionData?.hasAnomaly !== false ? 'Anomaly Detected' : 'Normal'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Weather Condition:</span>
            <span className="stat-value">
              {inspectionData?.weatherCondition ? 
                inspectionData.weatherCondition.charAt(0).toUpperCase() + inspectionData.weatherCondition.slice(1) : 
                'Sunny'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalImageComparison;