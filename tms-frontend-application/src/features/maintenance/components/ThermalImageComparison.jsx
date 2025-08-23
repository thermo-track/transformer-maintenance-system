// import React, { useState, useEffect } from 'react';
// import { useParams, useLocation } from "react-router-dom";
// import { X, RotateCcw, AlertTriangle } from 'lucide-react';
// import '../styles/thermal-image-comparison.css';
// import { baselineImageService } from '../services/BaselineImageService';
// const ThermalImageComparison = ({ 
//   baselineImage, 
//   currentImage, 
//   inspectionData,
//   onDelete, 
//   onUploadNew,
//   onRefresh 
// }) => {
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const { transformerNo } = useParams();
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [baselineImages, setBaselineImages] = useState({
//       sunny: null,
//       cloudy: null,
//       rainy: null
//     });
  
//   // For now, we'll display the same image side by side until backend provides separate images
//   const displayBaselineImage = baselineImage || currentImage;
//   const displayCurrentImage = currentImage || baselineImage;

//   const handleDeleteClick = () => {
//     setShowDeleteConfirm(true);
//   };

//   const handleCancelDelete = () => {
//     setShowDeleteConfirm(false);
//   };

//   const handleConfirmDelete = () => {
//     setShowDeleteConfirm(false);
//     if (onDelete) {
//       onDelete();
//     }
//   };
//       useEffect(() => {
//         console.log('🚀 Component mounted with transformerNo:', transformerNo);
        
//         if (transformerNo) {
//           loadBaselineImages();
//         } else {
//           console.warn('⚠️ No transformerNo provided in params');
//           setError('No transformer number provided');
//         }
//       }, [transformerNo]);

//       const loadBaselineImages = async () => {
//       try {
//         setIsLoading(true);
//         setError(null);
        
//         console.log('Loading baseline images for transformer:', transformerNo);
//         console.log('❤️ Weather baseline images for transformer:', inspectionData?.weatherCondition);
        
//         // Use the simpler approach to load all images directly
//         const images = await baselineImageService.getAllBaselineImages(transformerNo);
        
//         console.log('Loaded images:', images);
//         setBaselineImages(images);
        
//       } catch (error) {
//         console.error('Error loading baseline images:', error);
//         setError('Failed to load baseline images: ' + error.message);
//       } finally {
//         setIsLoading(false);
//       }
//     };


//   return (
//     <div className="thermal-comparison-container">
//       <div className="comparison-header">
//         <h3 className="comparison-title">Thermal Image Comparison</h3>
//         <div className="comparison-actions">
//           <button 
//             onClick={onRefresh}
//             className="action-btnT refresh-btnT"
//             title="Refresh images"
//           >
//             <RotateCcw size={16} />
//             Refresh
//           </button>
//           <button 
//             onClick={onUploadNew}
//             className="action-btnT upload-new-btnT"
//             title="Upload new image"
//           >
//             📤 Upload New
//           </button>
//           <button 
//             onClick={handleDeleteClick}
//             className="action-btnT delete-btnT"
//             title="Delete images"
//           >
//             <X size={16} />
//             Delete
//           </button>
//         </div>
//       </div>
      
//       <div className="image-comparison-grid">
//         {/* Baseline Image Panel */}
//         <div className="image-panel baseline-panel">
//           <div className="image-header">
//             <div className="image-label-section">
//               <span className="image-label">Baseline</span>
//               <span className="image-status normal">Normal</span>
//             </div>
//             <span className="image-date">
//               {inspectionData?.baselineDate || '1/9/2025 9:10:03 PM'}
//             </span>
//           </div>
          
//           <div className="thermal-image-wrapper">
//             {displayBaselineImage ? (
//               <img 
//                 src={displayBaselineImage} 
//                 alt="Baseline thermal image" 
//                 className="thermal-image"
//               />
//             ) : (
//               <div className="image-placeholder">
//                 <span>No baseline image</span>
//               </div>
//             )}
            
//             {/* Temperature Scale */}
//             <div className="temperature-scale">
//               <div className="scale-bar">
//                 <div className="scale-gradient"></div>
//                 <div className="scale-labels">
//                   <span className="temp-max">45°C</span>
//                   <span className="temp-mid">25°C</span>
//                   <span className="temp-min">5°C</span>
//                 </div>
//               </div>
//             </div>
            
//             {/* Temperature Reading */}
//             <div className="temperature-reading baseline-temp">
//               {inspectionData?.baselineTemperature || '73.0°F'}
//             </div>
//           </div>
//         </div>

//         {/* Current Image Panel */}
//         <div className="image-panel current-panel">
//           <div className="image-header">
//             <div className="image-label-section">
//               <span className="image-label">Current</span>
//               {inspectionData?.hasAnomaly !== false && (
//                 <span className="image-status anomaly">
//                   ⚠️ Anomaly Detected
//                 </span>
//               )}
//             </div>
//             <span className="image-date">
//               {inspectionData?.currentDate || '5/7/2025 6:34:21 PM'}
//             </span>
//           </div>
          
//           <div className="thermal-image-wrapper">
//             {displayCurrentImage ? (
//               <img 
//                 src={displayCurrentImage} 
//                 alt="Current thermal image" 
//                 className="thermal-image"
//               />
//             ) : (
//               <div className="image-placeholder">
//                 <span>No current image</span>
//               </div>
//             )}
            
//             {/* Temperature Scale */}
//             <div className="temperature-scale">
//               <div className="scale-bar">
//                 <div className="scale-gradient"></div>
//                 <div className="scale-labels">
//                   <span className="temp-max">45°C</span>
//                   <span className="temp-mid">25°C</span>
//                   <span className="temp-min">5°C</span>
//                 </div>
//               </div>
//             </div>
            
//             {/* Temperature Reading */}
//             <div className="temperature-reading current-temp">
//               {inspectionData?.currentTemperature || '89.2°F'}
//             </div>
            
//             {/* Anomaly Detection Boxes - Show only if anomalies detected */}
//             {inspectionData?.hasAnomaly !== false && (
//               <div className="anomaly-boxes">
//                 <div className="anomaly-box box-1" title="Hot spot detected">
//                   <span className="anomaly-temp">38.1°C</span>
//                 </div>
//                 <div className="anomaly-box box-2" title="Hot spot detected">
//                   <span className="anomaly-temp">41.7°C</span>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Delete Confirmation Modal */}
//       {showDeleteConfirm && (
//         <div className="modal-overlay" onClick={handleCancelDelete}>
//           <div className="delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-header">
//               <div className="warning-icon">
//                 <AlertTriangle size={24} color="#dc3545" />
//               </div>
//               <h3 className="modal-title">Delete Thermal Images</h3>
//             </div>
            
//             <div className="modal-content">
//               <p className="warning-text">
//                 Are you sure you want to delete inspection thermal image? <br /> This action cannot be undone.
//               </p>
//             </div>
            
//             <div className="modal-actions">
//               <button 
//                 onClick={handleCancelDelete}
//                 className="cancel-btn"
//               >
//                 Cancel
//               </button>
//               <button 
//                 onClick={handleConfirmDelete}
//                 className="confirm-delete-btn"
//               >
//                 <X size={16} />
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Analysis Summary */}
//       <div className="analysis-summary">
//         <div className="summary-stats">
//           <div className="stat-item">
//             <span className="stat-label">Temperature Difference:</span>
//             <span className="stat-value">
//               {inspectionData?.temperatureDiff || '+16.2°F'}
//             </span>
//           </div>
//           <div className="stat-item">
//             <span className="stat-label">Analysis Status:</span>
//             <span className={`stat-value ${inspectionData?.hasAnomaly !== false ? 'anomaly' : 'normal'}`}>
//               {inspectionData?.hasAnomaly !== false ? 'Anomaly Detected' : 'Normal'}
//             </span>
//           </div>
//           <div className="stat-item">
//             <span className="stat-label">Weather Condition:</span>
//             <span className="stat-value">
//               {inspectionData?.weatherCondition || 'Sunny'}
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ThermalImageComparison;



import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from "react-router-dom";
import { X, RotateCcw, AlertTriangle } from 'lucide-react';
import '../styles/thermal-image-comparison.css';
import { baselineImageService } from '../services/BaselineImageService';

const ThermalImageComparison = ({ 
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
    console.log('🚀 Component mounted with transformerNo:', transformerNo);
    
    if (transformerNo && inspectionData?.weatherCondition) {
      loadWeatherBasedBaselineImage();
    } else {
      console.warn('⚠️ No transformerNo or weatherCondition provided');
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
      console.log('Loading baseline image for transformer:', transformerNo, 'weather:', weatherCondition);
      
      // Use the specific weather condition method
      const imageBlob = await baselineImageService.getImage(transformerNo, weatherCondition);
      
      if (imageBlob) {
        // Convert blob to URL for display
        const imageUrl = URL.createObjectURL(imageBlob);
        setWeatherBasedBaselineImage(imageUrl);
        console.log('✅ Baseline image loaded for weather condition:', weatherCondition);
      } else {
        console.log('No baseline image found for weather condition:', weatherCondition);
        setWeatherBasedBaselineImage(null);
      }
      
    } catch (error) {
      console.error('Error loading weather-based baseline image:', error);
      setError('Failed to load baseline image: ' + error.message);
      setWeatherBasedBaselineImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup blob URL when component unmounts or image changes
  useEffect(() => {
    return () => {
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
                <span>Loading baseline image...</span>
              </div>
            ) : weatherBasedBaselineImage ? (
              <img 
                src={weatherBasedBaselineImage} 
                alt={`Baseline thermal image (${inspectionData?.weatherCondition || 'unknown'} condition)`}
                className="thermal-image"
              />
            ) : (
              <div className="image-placeholder">
                <span>No baseline image available for {inspectionData?.weatherCondition || 'current weather'} condition</span>
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

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <AlertTriangle size={16} />
          {error}
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
              {inspectionData?.weatherCondition || 'Sunny'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalImageComparison;