import '../styles/thermal-images.css';
import React, { useState, useCallback, useEffect } from 'react';
import { Upload, X, AlertTriangle } from 'lucide-react';
import ThermalImageComparison from './ThermalImageComparison';
import { inspectionService } from '../services/InspectionService';
import { cloudinaryService } from '../services/CloudinaryService';

const ThermalImageComponent = ({ inspectionId, onImageUpload, onImageDelete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [weatherCondition, setWeatherCondition] = useState('sunny');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [baselineImage, setBaselineImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingImage, setHasExistingImage] = useState(false);
  const [inspectionData, setInspectionData] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const weatherOptions = [
    { value: 'sunny', label: 'Sunny' },
    { value: 'cloudy', label: 'Cloudy' },
    { value: 'rainy', label: 'Rainy' },
  ];

  // Fetch weather condition and check for existing images when component mounts
  useEffect(() => {
    if (inspectionId) {
      fetchWeatherConditionAndLoadImages();
    } else {
      setIsLoading(false);
    }
    
    // Cleanup function to revoke blob URLs
    return () => {
      if (currentImage && currentImage.startsWith('blob:')) {
        URL.revokeObjectURL(currentImage);
      }
      if (baselineImage && baselineImage.startsWith('blob:')) {
        URL.revokeObjectURL(baselineImage);
      }
    };
  }, [inspectionId]);

  const fetchWeatherConditionAndLoadImages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching weather condition for inspection:', inspectionId);
      
      // Fetch weather condition from database FIRST
      let finalWeatherCondition = 'sunny'; // default
      
      try {
        setIsLoadingWeather(true);
        const weatherFromDB = await inspectionService.getInspectionWeatherCondition(inspectionId);
        console.log('Weather condition from database:', weatherFromDB);
        
        if (weatherFromDB) {
          finalWeatherCondition = weatherFromDB.toLowerCase();
          setWeatherCondition(finalWeatherCondition);
          console.log('Weather condition set to:', weatherFromDB);
        } else {
          console.warn('No weather condition returned, using default: sunny');
          setWeatherCondition('sunny');
        }
      } catch (weatherError) {
        console.error('Error fetching weather condition:', weatherError);
        console.warn('Using default weather condition: sunny');
        setWeatherCondition('sunny');
      } finally {
        setIsLoadingWeather(false);
      }
      
      // Check for existing cloud images only
      await checkAndLoadExistingCloudImage(finalWeatherCondition);
      
    } catch (error) {
      console.error('Error in fetchWeatherConditionAndLoadImages:', error);
      setError('Failed to load data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAndLoadExistingCloudImage = async (weatherConditionParam) => {
    try {
      console.log('Checking for existing cloud image for inspection:', inspectionId);
      
      const hasImage = await cloudinaryService.hasCloudImage(inspectionId);
      console.log('Has existing cloud image:', hasImage);
      
      if (hasImage) {
        setHasExistingImage(true);
        console.log('Setting hasExistingImage to true');
        
        try {
          // Get cloud image URL from backend
          const cloudImageUrl = await cloudinaryService.getCloudImageUrlFromBackend(inspectionId);
          console.log('Loaded cloud image URL:', cloudImageUrl);
          
          if (cloudImageUrl) {
            const correctWeatherCondition = weatherConditionParam || weatherCondition || 'sunny';
            console.log('Using weather condition for inspection data:', correctWeatherCondition);
            
            setCurrentImage(cloudImageUrl);
            setBaselineImage(cloudImageUrl); // Same image for comparison
            
            // Create inspection data object with cloud image
            setInspectionData({
              imageUrl: cloudImageUrl,
              uploadDate: new Date().toLocaleString(),
              hasAnomaly: true, // Dummy data - replace with actual analysis
              currentTemperature: '89.2°F', // Dummy data
              baselineTemperature: '73.0°F', // Dummy data
              temperatureDiff: '+16.2°F', // Dummy data
              weatherCondition: correctWeatherCondition,
              baselineDate: '1/9/2025 9:10:03 PM', // Dummy data
              currentDate: new Date().toLocaleString()
            });
          }
        } catch (imageLoadError) {
          console.error('Error loading existing cloud image:', imageLoadError);
          setError('Found existing cloud image but failed to load it');
          setHasExistingImage(false);
        }
      } else {
        console.log('No existing cloud image found');
        setHasExistingImage(false);
        setBaselineImage(null);
        setCurrentImage(null);
        setInspectionData(null);
      }
    } catch (error) {
      console.error('Error checking existing cloud image:', error);
      setError('Failed to check for existing cloud images');
      setHasExistingImage(false);
    }
  };

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a valid image file');
      }
    }
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please select a valid image file');
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 300);
    return interval;
  };

  const uploadImage = async () => {
    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }
    
    if (!inspectionId) {
      setError('Inspection ID is missing. Please ensure you are in a valid inspection context.');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    const progressInterval = simulateUploadProgress();

    try {
      console.log('Starting cloud upload for inspection:', inspectionId, 'with weather condition:', weatherCondition);

      // Upload to cloud only using the parent's handler
      if (onImageUpload) {
        await onImageUpload(selectedFile, weatherCondition);
      }
      
      setUploadProgress(100);
      
      // After successful upload, reload the image data
      await checkAndLoadExistingCloudImage(weatherCondition);
      
      setTimeout(() => {
        setSelectedFile(null);
        setIsUploading(false);
        setUploadProgress(0);
        clearInterval(progressInterval);
      }, 500);

    } catch (error) {
      console.error('Upload failed:', error);
      setError(`Failed to upload image: ${error.message || 'Please try again.'}`);
      setIsUploading(false);
      setUploadProgress(0);
      clearInterval(progressInterval);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const handleDelete = async () => {
    try {
      if (inspectionId && onImageDelete) {
        await onImageDelete();
      }
      
      setBaselineImage(null);
      setCurrentImage(null);
      setHasExistingImage(false);
      setInspectionData(null);
      
    } catch (error) {
      console.error('Error deleting images:', error);
      setError('Failed to delete image. Please try again.');
    }
  };

  const handleUploadNew = () => {
    setHasExistingImage(false);
    setBaselineImage(null);
    setCurrentImage(null);
    setInspectionData(null);
    setError(null);
  };

  const handleRefresh = () => {
    fetchWeatherConditionAndLoadImages(); // This will refetch weather condition AND cloud images
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="thermal-image-container">
        <div className="thermal-header">
          <h2 className="thermal-title">Loading Thermal Images...</h2>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading weather condition and checking for existing cloud thermal images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="thermal-image-container">
      {/* Show comparison view if images exist and not uploading */}
      {hasExistingImage && !isUploading && (baselineImage || currentImage) ? (
        <ThermalImageComparison
          baselineImage={baselineImage}
          currentImage={currentImage}
          inspectionData={inspectionData}
          onDelete={handleDelete}
          onUploadNew={handleUploadNew}
          onRefresh={handleRefresh}
        />
      ) : (
        <>
          {/* Upload Interface */}
          <div className="thermal-header">
            <h2 className="thermal-title">Upload Thermal Image to Cloud</h2>
          </div>

          {!isUploading && (
            <div className="upload-section">
              <div 
                className={`upload-area ${selectedFile ? 'has-file' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {selectedFile ? (
                  <div className="file-preview">
                    <img 
                      src={URL.createObjectURL(selectedFile)} 
                      alt="Preview" 
                      className="preview-image"
                    />
                    <div className="file-info">
                      <span className="file-name">{selectedFile.name}</span>
                      <button 
                        onClick={removeSelectedFile}
                        className="remove-file-btn"
                        type="button"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <Upload size={48} className="upload-icon" />
                    <p className="upload-text">
                      Drag and drop an image here, or{' '}
                      <label htmlFor="file-input" className="upload-link">
                        browse to upload
                      </label>
                    </p>
                    <input
                      id="file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden-input"
                    />
                  </div>
                )}
              </div>

              <div className="weather-section">
                <label htmlFor="weather-select" className="weather-label">
                  Weather Condition
                  {!isLoadingWeather && (
                    <span className="weather-label-note"> (loaded from database)</span>
                  )}
                </label>
                <select
                  id="weather-select"
                  value={weatherCondition}
                  onChange={(e) => setWeatherCondition(e.target.value)}
                  className="weather-select"
                  disabled={isUploading || isLoadingWeather}
                >
                  {weatherOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                      {weatherCondition === option.value ? ' ✓' : ''}
                    </option>
                  ))}
                </select>
                {isLoadingWeather && (
                  <p className="weather-loading">Loading weather condition...</p>
                )}
              </div>

              {error && (
                <div className="error-message">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <div className="upload-btn-container">
                <button
                  onClick={uploadImage}
                  disabled={!selectedFile || isUploading}
                  className="upload-btn"
                >
                  Upload & Analyze Thermal Image to Cloud
                </button>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="upload-progress-section">
              <div className="progress-header">
                <h3>Processing Thermal Image</h3>
                <p>Uploading to cloud and analyzing thermal patterns...</p>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="progress-text">{Math.round(uploadProgress)}%</div>
              <button 
                onClick={() => {
                  setIsUploading(false);
                  setSelectedFile(null);
                  setUploadProgress(0);
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ThermalImageComponent;