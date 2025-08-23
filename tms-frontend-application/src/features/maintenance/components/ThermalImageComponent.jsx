// import '../styles/thermal-images.css';
// import React, { useState, useCallback, useEffect } from 'react';
// import { Upload, X, AlertTriangle } from 'lucide-react';
// import ThermalImageComparison from './ThermalImageComparison';
// import { inspectionService } from '../services/InspectionService';

// const ThermalImageComponent = ({ inspectionId, onImageUpload, onImageDelete }) => {
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [weatherCondition, setWeatherCondition] = useState('sunny');
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [baselineImage, setBaselineImage] = useState(null);
//   const [currentImage, setCurrentImage] = useState(null);
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [hasExistingImage, setHasExistingImage] = useState(false);
//   const [inspectionData, setInspectionData] = useState(null);

//   const weatherOptions = [
//     { value: 'sunny', label: 'Sunny' },
//     { value: 'cloudy', label: 'Cloudy' },
//     { value: 'rainy', label: 'Rainy' },
//   ];

//   // Check for existing images when component mounts or inspectionId changes
//   useEffect(() => {
//     if (inspectionId) {
//       checkAndLoadExistingImage();
//     } else {
//       setIsLoading(false);
//     }
    
//     // Cleanup function to revoke blob URLs
//     return () => {
//       if (currentImage && currentImage.startsWith('blob:')) {
//         URL.revokeObjectURL(currentImage);
//       }
//       if (baselineImage && baselineImage.startsWith('blob:')) {
//         URL.revokeObjectURL(baselineImage);
//       }
//     };
//   }, [inspectionId]);

//   const checkAndLoadExistingImage = async () => {
//     try {
//       setIsLoading(true);
//       setError(null);
//       console.log('Checking for existing image for inspection:', inspectionId);
      
//       const hasImage = await inspectionService.checkIfInspectionHasImage(inspectionId);
//       console.log('Has existing image:', hasImage);
      
//       if (hasImage) {
//         setHasExistingImage(true);
//         console.log('Setting hasExistingImage to true');
//         try {
//           const imageData = await inspectionService.getInspectionImage(inspectionId);
//           console.log('Loaded existing image data:', imageData);
          
//           // Check if imageData is a Blob
//           if (imageData instanceof Blob) {
//             // Create object URL from blob
//             const imageUrl = URL.createObjectURL(imageData);
//             console.log('Created URL from blob:', imageUrl);
            
//             setCurrentImage(imageUrl);
//             setBaselineImage(imageUrl); // Same image for now
            
//             // Create inspection data object with blob info
//             setInspectionData({
//               imageUrl: imageUrl,
//               uploadDate: new Date().toLocaleString(),
//               hasAnomaly: true, // You can set this based on analysis
//               currentTemperature: '89.2°F',
//               baselineTemperature: '73.0°F',
//               temperatureDiff: '+16.2°F',
//               weatherCondition: 'Sunny'
//             });
//           } else if (imageData && typeof imageData === 'object') {
//             // Handle object response with URL properties
//             setInspectionData(imageData);
            
//             if (imageData.imageUrl) {
//               setCurrentImage(imageData.imageUrl);
//               setBaselineImage(imageData.imageUrl); // Same image for now
//             }
            
//             // If backend provides separate URLs in the future:
//             // if (imageData.baselineImageUrl) setBaselineImage(imageData.baselineImageUrl);
//             // if (imageData.currentImageUrl) setCurrentImage(imageData.currentImageUrl);
//           } else if (typeof imageData === 'string') {
//             // Handle direct URL string
//             setCurrentImage(imageData);
//             setBaselineImage(imageData);
            
//             setInspectionData({
//               imageUrl: imageData,
//               uploadDate: new Date().toLocaleString(),
//               hasAnomaly: true,
//               currentTemperature: '89.2°F',
//               baselineTemperature: '73.0°F',
//               temperatureDiff: '+16.2°F',
//               weatherCondition: 'Sunny'
//             });
//           }
          
//         } catch (imageLoadError) {
//           console.error('Error loading existing image:', imageLoadError);
//           setError('Found existing image but failed to load it');
//           setHasExistingImage(false); // Reset if loading fails
//         }
//       } else {
//         console.log('No existing image found');
//         setHasExistingImage(false);
//         setBaselineImage(null);
//         setCurrentImage(null);
//         setInspectionData(null);
//       }
//     } catch (error) {
//       console.error('Error checking existing image:', error);
//       setError('Failed to check for existing images');
//       setHasExistingImage(false);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleFileSelect = useCallback((event) => {
//     const file = event.target.files[0];
//     if (file) {
//       if (file.type.startsWith('image/')) {
//         setSelectedFile(file);
//         setError(null);
//       } else {
//         setError('Please select a valid image file');
//       }
//     }
//   }, []);

//   const handleDrop = useCallback((event) => {
//     event.preventDefault();
//     const file = event.dataTransfer.files[0];
//     if (file && file.type.startsWith('image/')) {
//       setSelectedFile(file);
//       setError(null);
//     } else {
//       setError('Please select a valid image file');
//     }
//   }, []);

//   const handleDragOver = useCallback((event) => {
//     event.preventDefault();
//   }, []);

//   const simulateUploadProgress = () => {
//     setUploadProgress(0);
//     const interval = setInterval(() => {
//       setUploadProgress(prev => {
//         if (prev >= 90) {
//           clearInterval(interval);
//           return 90;
//         }
//         return prev + Math.random() * 10;
//       });
//     }, 300);
//     return interval;
//   };

//   const uploadImage = async () => {
//     if (!selectedFile) {
//       setError('Please select an image file');
//       return;
//     }
    
//     if (!inspectionId) {
//       setError('Inspection ID is missing. Please ensure you are in a valid inspection context.');
//       return;
//     }

//     setIsUploading(true);
//     setError(null);
    
//     const progressInterval = simulateUploadProgress();

//     try {
//       console.log('Starting upload for inspection:', inspectionId);
      
//       const response = await inspectionService.uploadInspectionImage(
//         inspectionId, 
//         selectedFile, 
//         weatherCondition
//       );
      
//       console.log('Upload successful:', response);
//       setUploadProgress(100);
      
//       // Store the response data
//       setInspectionData({
//         ...response,
//         weatherCondition,
//         uploadDate: new Date().toLocaleString()
//       });
      
//       // For now, use the same image for both sides until backend provides separate images
//       const imageUrl = response.imageUrl || URL.createObjectURL(selectedFile);
//       setCurrentImage(imageUrl);
//       setBaselineImage(imageUrl); // Same image for now
//       setHasExistingImage(true);
      
//       setTimeout(() => {
//         setSelectedFile(null);
//         setIsUploading(false);
//         setUploadProgress(0);
//         clearInterval(progressInterval);
        
//         if (onImageUpload) {
//           onImageUpload({
//             baseline: imageUrl,
//             current: imageUrl,
//             response: response
//           });
//         }
//       }, 500);

//     } catch (error) {
//       console.error('Upload failed:', error);
//       setError(`Failed to upload image: ${error.message || 'Please try again.'}`);
//       setIsUploading(false);
//       setUploadProgress(0);
//       clearInterval(progressInterval);
//     }
//   };

//   const removeSelectedFile = () => {
//     setSelectedFile(null);
//     setError(null);
//   };

//   const handleDelete = async () => {
//     try {
//       if (inspectionId && onImageDelete) {
//         await onImageDelete();
//       }
      
//       setBaselineImage(null);
//       setCurrentImage(null);
//       setHasExistingImage(false);
//       setInspectionData(null);
      
//     } catch (error) {
//       console.error('Error deleting images:', error);
//       setError('Failed to delete image. Please try again.');
//     }
//   };

//   const handleUploadNew = () => {
//     setHasExistingImage(false);
//     setBaselineImage(null);
//     setCurrentImage(null);
//     setInspectionData(null);
//     setError(null);
//   };

//   const handleRefresh = () => {
//     checkAndLoadExistingImage();
//   };

//   // Show loading state
//   if (isLoading) {
//     return (
//       <div className="thermal-image-container">
//         <div className="thermal-header">
//           <h2 className="thermal-title">Loading Thermal Images...</h2>
//         </div>
//         <div className="loading-container">
//           <div className="loading-spinner"></div>
//           <p>Checking for existing thermal images...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="thermal-image-container">
//       {/* Show comparison view if images exist and not uploading */}
//       {hasExistingImage && !isUploading && (baselineImage || currentImage) ? (
//         <ThermalImageComparison
//           baselineImage={baselineImage}
//           currentImage={currentImage}
//           inspectionData={inspectionData}
//           onDelete={handleDelete}
//           onUploadNew={handleUploadNew}
//           onRefresh={handleRefresh}
//         />
//       ) : (
//         <>
//           {/* Upload Interface */}
//           <div className="thermal-header">
//             <h2 className="thermal-title">Upload Thermal Image</h2>
//           </div>

//           {!isUploading && (
//             <div className="upload-section">
//               <div 
//                 className={`upload-area ${selectedFile ? 'has-file' : ''}`}
//                 onDrop={handleDrop}
//                 onDragOver={handleDragOver}
//               >
//                 {selectedFile ? (
//                   <div className="file-preview">
//                     <img 
//                       src={URL.createObjectURL(selectedFile)} 
//                       alt="Preview" 
//                       className="preview-image"
//                     />
//                     <div className="file-info">
//                       <span className="file-name">{selectedFile.name}</span>
//                       <button 
//                         onClick={removeSelectedFile}
//                         className="remove-file-btn"
//                         type="button"
//                       >
//                         <X size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="upload-placeholder">
//                     <Upload size={48} className="upload-icon" />
//                     <p className="upload-text">
//                       Drag and drop an image here, or{' '}
//                       <label htmlFor="file-input" className="upload-link">
//                         browse to upload
//                       </label>
//                     </p>
//                     <input
//                       id="file-input"
//                       type="file"
//                       accept="image/*"
//                       onChange={handleFileSelect}
//                       className="hidden-input"
//                     />
//                   </div>
//                 )}
//               </div>

//               <div className="weather-section">
//                 <label htmlFor="weather-select" className="weather-label">
//                   Weather Condition
//                 </label>
//                 <select
//                   id="weather-select"
//                   value={weatherCondition}
//                   onChange={(e) => setWeatherCondition(e.target.value)}
//                   className="weather-select"
//                   disabled={isUploading}
//                 >
//                   {weatherOptions.map(option => (
//                     <option key={option.value} value={option.value}>
//                       {option.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {error && (
//                 <div className="error-message">
//                   <AlertTriangle size={16} />
//                   {error}
//                 </div>
//               )}

//                 <div className="upload-btn-container">
//                 <button
//                     onClick={uploadImage}
//                     disabled={!selectedFile || isUploading}
//                     className="upload-btn"
//                 >
//                     Upload & Analyze Thermal Image
//                 </button>
//                 </div>

//             </div>
//           )}

//           {/* Upload Progress */}
//           {isUploading && (
//             <div className="upload-progress-section">
//               <div className="progress-header">
//                 <h3>Processing Thermal Image</h3>
//                 <p>Analyzing thermal patterns and detecting anomalies...</p>
//               </div>
//               <div className="progress-bar-container">
//                 <div 
//                   className="progress-bar"
//                   style={{ width: `${uploadProgress}%` }}
//                 />
//               </div>
//               <div className="progress-text">{Math.round(uploadProgress)}%</div>
//               <button 
//                 onClick={() => {
//                   setIsUploading(false);
//                   setSelectedFile(null);
//                   setUploadProgress(0);
//                 }}
//                 className="cancel-btn"
//               >
//                 Cancel
//               </button>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default ThermalImageComponent;

import '../styles/thermal-images.css';
import React, { useState, useCallback, useEffect } from 'react';
import { Upload, X, AlertTriangle } from 'lucide-react';
import ThermalImageComparison from './ThermalImageComparison';
import { inspectionService } from '../services/InspectionService';

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
      console.log('🚀 Fetching weather condition for inspection:', inspectionId);
      
      // Fetch weather condition from database FIRST and store in local variable
      let finalWeatherCondition = 'sunny'; // default
      
      try {
        setIsLoadingWeather(true);
        const weatherFromDB = await inspectionService.getInspectionWeatherCondition(inspectionId);
        console.log('🌤️ Weather condition from database:', weatherFromDB);
        
        if (weatherFromDB) {
          finalWeatherCondition = weatherFromDB.toLowerCase();
          setWeatherCondition(finalWeatherCondition);
          console.log('✅ Weather condition set to:', weatherFromDB);
        } else {
          console.warn('⚠️ No weather condition returned, using default: sunny');
          setWeatherCondition('sunny');
        }
      } catch (weatherError) {
        console.error('❌ Error fetching weather condition:', weatherError);
        console.warn('Using default weather condition: sunny');
        setWeatherCondition('sunny');
      } finally {
        setIsLoadingWeather(false);
      }
      
      // Then check for existing images and pass the correct weather condition
      await checkAndLoadExistingImage(finalWeatherCondition);
      
    } catch (error) {
      console.error('❌ Error in fetchWeatherConditionAndLoadImages:', error);
      setError('Failed to load data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAndLoadExistingImage = async (weatherConditionParam) => {
    try {
      console.log('Checking for existing image for inspection:', inspectionId);
      
      const hasImage = await inspectionService.checkIfInspectionHasImage(inspectionId);
      console.log('Has existing image:', hasImage);
      
      if (hasImage) {
        setHasExistingImage(true);
        console.log('Setting hasExistingImage to true');
        try {
          const imageData = await inspectionService.getInspectionImage(inspectionId);
          console.log('Loaded existing image data:', imageData);
          
          // Use the parameter passed from weather fetch (this ensures correct weather condition)
          const correctWeatherCondition = weatherConditionParam || weatherCondition || 'sunny';
          console.log('Using weather condition for inspection data:', correctWeatherCondition);
          
          // Check if imageData is a Blob
          if (imageData instanceof Blob) {
            // Create object URL from blob
            const imageUrl = URL.createObjectURL(imageData);
            console.log('Created URL from blob:', imageUrl);
            
            setCurrentImage(imageUrl);
            setBaselineImage(imageUrl); // Same image for now
            
            // Create inspection data object with CORRECT weather condition
            setInspectionData({
              imageUrl: imageUrl,
              uploadDate: new Date().toLocaleString(),
              hasAnomaly: true, // Dummy data
              currentTemperature: '89.2°F', // Dummy data
              baselineTemperature: '73.0°F', // Dummy data
              temperatureDiff: '+16.2°F', // Dummy data
              weatherCondition: correctWeatherCondition, // Use the correct weather condition!
              baselineDate: '1/9/2025 9:10:03 PM', // Dummy data
              currentDate: new Date().toLocaleString()
            });
          } else if (imageData && typeof imageData === 'object') {
            // Handle object response with URL properties
            const correctWeatherCondition = weatherConditionParam || weatherCondition || 'sunny';
            
            const dummyInspectionData = {
              ...imageData,
              hasAnomaly: true, // Dummy data
              currentTemperature: '89.2°F', // Dummy data
              baselineTemperature: '73.0°F', // Dummy data
              temperatureDiff: '+16.2°F', // Dummy data
              weatherCondition: correctWeatherCondition, // Use the correct weather condition!
              baselineDate: '1/9/2025 9:10:03 PM', // Dummy data
              currentDate: new Date().toLocaleString()
            };
            setInspectionData(dummyInspectionData);
            
            if (imageData.imageUrl) {
              setCurrentImage(imageData.imageUrl);
              setBaselineImage(imageData.imageUrl); // Same image for now
            }
          } else if (typeof imageData === 'string') {
            // Handle direct URL string
            const correctWeatherCondition = weatherConditionParam || weatherCondition || 'sunny';
            
            setCurrentImage(imageData);
            setBaselineImage(imageData);
            
            setInspectionData({
              imageUrl: imageData,
              uploadDate: new Date().toLocaleString(),
              hasAnomaly: true, // Dummy data
              currentTemperature: '89.2°F', // Dummy data
              baselineTemperature: '73.0°F', // Dummy data
              temperatureDiff: '+16.2°F', // Dummy data
              weatherCondition: correctWeatherCondition, // Use the correct weather condition!
              baselineDate: '1/9/2025 9:10:03 PM', // Dummy data
              currentDate: new Date().toLocaleString()
            });
          }
          
        } catch (imageLoadError) {
          console.error('Error loading existing image:', imageLoadError);
          setError('Found existing image but failed to load it');
          setHasExistingImage(false); // Reset if loading fails
        }
      } else {
        console.log('No existing image found');
        setHasExistingImage(false);
        setBaselineImage(null);
        setCurrentImage(null);
        setInspectionData(null);
      }
    } catch (error) {
      console.error('Error checking existing image:', error);
      setError('Failed to check for existing images');
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
      console.log('Starting upload for inspection:', inspectionId, 'with weather condition:', weatherCondition);
      
      const response = await inspectionService.uploadInspectionImage(
        inspectionId, 
        selectedFile, 
        weatherCondition
      );
      
      console.log('Upload successful:', response);
      setUploadProgress(100);
      
      // Store the response data with dummy values BUT real weather condition
      // Use the CURRENT weatherCondition state (which should be correct by now)
      setInspectionData({
        ...response,
        weatherCondition: weatherCondition, // Use current state value
        uploadDate: new Date().toLocaleString(),
        hasAnomaly: true, // Dummy data
        currentTemperature: '89.2°F', // Dummy data
        baselineTemperature: '73.0°F', // Dummy data
        temperatureDiff: '+16.2°F', // Dummy data
        baselineDate: '1/9/2025 9:10:03 PM', // Dummy data
        currentDate: new Date().toLocaleString()
      });
      
      // For now, use the same image for both sides until backend provides separate images
      const imageUrl = response.imageUrl || URL.createObjectURL(selectedFile);
      setCurrentImage(imageUrl);
      setBaselineImage(imageUrl); // Same image for now
      setHasExistingImage(true);
      
      setTimeout(() => {
        setSelectedFile(null);
        setIsUploading(false);
        setUploadProgress(0);
        clearInterval(progressInterval);
        
        if (onImageUpload) {
          onImageUpload({
            baseline: imageUrl,
            current: imageUrl,
            response: response
          });
        }
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
    fetchWeatherConditionAndLoadImages(); // This will refetch weather condition AND images
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
          <p>Loading weather condition and checking for existing thermal images...</p>
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
            <h2 className="thermal-title">Upload Thermal Image</h2>
            {weatherCondition && !isLoadingWeather && (
              <p className="weather-info">
                Current weather condition: <strong>{weatherCondition.charAt(0).toUpperCase() + weatherCondition.slice(1)}</strong>
                <span className="weather-source"> (from database)</span>
              </p>
            )}
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
                  Upload & Analyze Thermal Image
                </button>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="upload-progress-section">
              <div className="progress-header">
                <h3>Processing Thermal Image</h3>
                <p>Analyzing thermal patterns and detecting anomalies...</p>
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