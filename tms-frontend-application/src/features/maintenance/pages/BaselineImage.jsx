import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, X, AlertTriangle, Camera, Trash2, Edit } from 'lucide-react';
import transformers from '../data/transformers';
import { baselineImageService } from '../services/BaselineImageService';
import '../styles/baseline-image-page.css';

const BaselineImagePage = () => {
  const { transformerNo } = useParams();
  const navigate = useNavigate();
  
  const [baselineImages, setBaselineImages] = useState({
    sunny: null,
    cloudy: null,
    rainy: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingCondition, setUploadingCondition] = useState(null);

  const weatherConditions = [
    { value: 'sunny', label: 'Sunny', icon: '☀️', color: '#FFA500' },
    { value: 'cloudy', label: 'Cloudy', icon: '☁️', color: '#87CEEB' },
    { value: 'rainy', label: 'Rainy', icon: '🌧️', color: '#4682B4' },
  ];

  // Get transformer details
  const transformer = transformers.find(t => t.id === transformerNo) || transformers[0];

  useEffect(() => {
    if (transformerNo) {
      loadBaselineImages();
    }
  }, [transformerNo]);

  const loadBaselineImages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading baseline images for transformer:', transformerNo);
      
      // Use the simpler approach to load all images directly
      const images = await baselineImageService.getAllBaselineImages(transformerNo);
      
      console.log('Loaded images:', images);
      setBaselineImages(images);
      
    } catch (error) {
      console.error('Error loading baseline images:', error);
      setError('Failed to load baseline images: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event, weatherCondition) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    try {
      setUploadingCondition(weatherCondition);
      setError(null);
      
      await baselineImageService.uploadBaselineImage(transformerNo, file, weatherCondition);
      
      // Reload images after successful upload
      await loadBaselineImages();
      
    } catch (error) {
      console.error('Error uploading baseline image:', error);
      setError(`Failed to upload ${weatherCondition} baseline image: ${error.message}`);
    } finally {
      setUploadingCondition(null);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleUpdateImage = async (weatherCondition) => {
    // Trigger file input for the specific weather condition
    const fileInput = document.getElementById(`file-input-${weatherCondition}`);
    fileInput.click();
  };

  const handleDeleteImage = async (weatherCondition) => {
    if (!window.confirm(`Are you sure you want to delete the ${weatherCondition} baseline image?`)) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await baselineImageService.deleteBaselineImage(transformerNo, weatherCondition);
      
      // Update local state
      setBaselineImages(prev => ({
        ...prev,
        [weatherCondition]: null
      }));
      
    } catch (error) {
      console.error('Error deleting baseline image:', error);
      setError(`Failed to delete ${weatherCondition} baseline image: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderWeatherBox = (condition) => {
    const hasImage = baselineImages[condition.value];
    const isUploading = uploadingCondition === condition.value;

    return (
      <div key={condition.value} className="weather-box" style={{borderColor: condition.color}}>
        <div className="weather-header" style={{backgroundColor: condition.color + '20'}}>
          <span className="weather-icon">{condition.icon}</span>
          <h3 className="weather-title">{condition.label}</h3>
        </div>

        <div className="image-container">
          {hasImage ? (
            <>
              <img 
                src={hasImage} 
                alt={`${condition.value} baseline`}
                className="baseline-image"
              />
              <div className="image-overlay">
                <div className="image-actions">
                  <button 
                    onClick={() => handleUpdateImage(condition.value)}
                    className="action-btn update-btn"
                    disabled={isLoading || isUploading}
                    title="Update Image"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteImage(condition.value)}
                    className="action-btn delete-btn"
                    disabled={isLoading || isUploading}
                    title="Delete Image"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="upload-area">
              {isUploading ? (
                <div className="uploading-state">
                  <div className="spinner"></div>
                  <p>Uploading...</p>
                </div>
              ) : (
                <>
                  <Camera size={48} className="upload-icon" />
                  <p className="upload-text">No baseline image</p>
                  <label htmlFor={`file-input-${condition.value}`} className="upload-button">
                    <Upload size={16} />
                    Upload Image
                  </label>
                </>
              )}
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          id={`file-input-${condition.value}`}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e, condition.value)}
          style={{ display: 'none' }}
          disabled={isLoading || isUploading}
        />
      </div>
    );
  };

  return (
    <div className="baseline-image-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              onClick={() => navigate(-1)} 
              className="back-button"
            >
              ← Back
            </button>
            <div className="header-info">
              <h1 className="page-title">Baseline Images</h1>
              <div className="transformer-info">
                <h2 className="transformer-number">{transformerNo}</h2>
                <p className="transformer-details">
                  {transformer?.location} • {transformer?.region}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        <div className="weather-grid">
          {weatherConditions.map(condition => renderWeatherBox(condition))}
        </div>

        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BaselineImagePage;