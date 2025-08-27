import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, X, AlertTriangle, Camera, Trash2, Edit } from 'lucide-react';
import { baselineImageService } from '../services/BaselineImageService';
import '../styles/baseline-image-page.css';
import { transformerService } from '../services/TransformerService';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';

const BaselineImagePage = () => {
  // Changed from transformerNo to transformerId
  const { transformerId } = useParams();
  const navigate = useNavigate();
  
  const [baselineImages, setBaselineImages] = useState({
    sunny: null,
    cloudy: null,
    rainy: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingCondition, setUploadingCondition] = useState(null);
  const [transformer, setTransformer] = useState(null);
  const [isLoadingTransformer, setIsLoadingTransformer] = useState(false);

  const weatherConditions = [
    { value: 'sunny', label: 'Sunny', icon: '☀️', color: '#FFA500' },
    { value: 'cloudy', label: 'Cloudy', icon: '☁️', color: '#87CEEB' },
    { value: 'rainy', label: 'Rainy', icon: '🌧️', color: '#4682B4' },
  ];

  useEffect(() => {
    console.log('Component mounted with transformerId:', transformerId);
    
    if (transformerId) {
      loadBaselineImages();
      loadTransformerDetails();
    } else {
      console.warn('No transformerId provided in params');
      setError('No transformer ID provided');
    }
  }, [transformerId]);

  const loadTransformerDetails = async () => {
    try {
      console.log('Starting to load transformer details...');
      setIsLoadingTransformer(true);
      setError(null);
      console.log('🙂 Fetching transformer with ID:', transformerId);

      // Changed to use transformerId instead of transformerNo
      const t = await transformerService.getTransformerById(transformerId);
      console.log('Transformer loaded successfully:', t);
      
      if (t) {
        setTransformer(t);
      } else {
        console.warn('No transformer found for ID:', transformerId);
        setError(`No transformer found with ID: ${transformerId}`);
      }
      
    } catch (error) {
      console.error("Error loading transformer:", error);
      setError("Failed to load transformer details: " + error.message);
    } finally {
      setIsLoadingTransformer(false);
    }
  };

  const loadBaselineImages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading baseline images for transformer:', transformerId);
      
      // Using the updated service with transformerId
      const images = await baselineImageService.getAllBaselineImages(transformerId);
      
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
      
      // Using the updated service with transformerId
      await baselineImageService.uploadBaselineImage(transformerId, file, weatherCondition);
      
      // Reload images after successful upload
      await loadBaselineImages();
      
      console.log(`Successfully uploaded ${weatherCondition} baseline image`);
      
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
      
      // Using the updated service with transformerId
      await baselineImageService.deleteBaselineImage(transformerId, weatherCondition);
      
      // Update local state
      setBaselineImages(prev => ({
        ...prev,
        [weatherCondition]: null
      }));
      
      console.log(`Successfully deleted ${weatherCondition} baseline image`);
      
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
      <div key={condition.value} className="weather-boxB" style={{borderColor: condition.color}}>
        <div className="weather-headerB" style={{backgroundColor: condition.color + '20'}}>
          <span className="weather-iconB">{condition.icon}</span>
          <h3 className="weather-titleB">{condition.label}</h3>
        </div>

        <div className="image-containerB">
          {hasImage ? (
            <>
              <img 
                src={hasImage} 
                alt={`${condition.value} baseline`}
                className="baseline-imageB"
                onError={(e) => {
                  console.error(`Failed to load ${condition.value} image:`, hasImage);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="image-overlayB">
                <div className="image-actionsB">
                  <button 
                    onClick={() => handleUpdateImage(condition.value)}
                    className="action-btnB update-btnB"
                    disabled={isLoading || isUploading}
                    title="Update Image"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteImage(condition.value)}
                    className="action-btnB delete-btnB"
                    disabled={isLoading || isUploading}
                    title="Delete Image"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {/* Fallback div for failed image loads */}
              <div className="upload-areaB" style={{display: 'none'}}>
                <Camera size={48} className="upload-iconB" />
                <p className="upload-textB">Image failed to load</p>
                <label htmlFor={`file-input-${condition.value}`} className="upload-buttonB">
                  <Upload size={16} />
                  Upload New Image
                </label>
              </div>
            </>
          ) : (
            <div className="upload-areaB">
              {isUploading ? (
                <div className="uploading-stateB">
                  <div className="spinnerB"></div>
                  <p>Uploading to cloud...</p>
                </div>
              ) : (
                <>
                  <Camera size={48} className="upload-iconB" />
                  <p className="upload-textB">No baseline image</p>
                  <label htmlFor={`file-input-${condition.value}`} className="upload-buttonB">
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

  const renderTransformerInfo = () => {
    if (isLoadingTransformer) {
      return <p className="transformer-details">Loading transformer details...</p>;
    }
    
    if (!transformer) {
      return (
        <p className="transformer-details" style={{color: '#ff6b6b'}}>
          No transformer data available
        </p>
      );
    }

    console.log('Rendering transformer info:', transformer);

    return (
      <p className="transformer-detailsB">
        {transformer.locationDetails || 'Unknown Location'} - 
        Region: {transformer.region || 'N/A'}, 
        Pole No: {transformer.poleNo || 'N/A'}, 
        Type: {transformer.type || 'N/A'}
      </p>
    );
  };

  return (
    <div className="baseline-image-pageB">
      {/* Page Header */}
      <div className="page-headerB">
        <div className="header-contentB">
          <div className="header-leftB">
            <button 
              onClick={() => navigate(-1)} 
              className="back-buttonB"
            >
              <ArrowLeftIcon />
            </button>
            <div className="header-infoB">
              <h1 className="page-titleB">Baseline Images</h1>
              <div className="transformer-infoB">
                <h2 className="transformer-numberB">
                  {transformer?.transformerNo || transformerId}
                </h2>
                {renderTransformerInfo()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-bannerB">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-closeB">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="main-contentB">
        <div className="weather-gridB">
          {weatherConditions.map(condition => renderWeatherBox(condition))}
        </div>

        {isLoading && (
          <div className="loading-overlayB">
            <div className="spinnerB"></div>
            <p>Processing...</p>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default BaselineImagePage;