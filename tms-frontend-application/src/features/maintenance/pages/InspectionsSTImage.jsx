import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import '../styles/global.css';
import '../styles/inspections.css';
import InspectionModal from '../components/InspectionModal';
import ThermalImageComponent from '../components/ThermalImageComponent';
import { inspectionService } from '../services/InspectionService';
import PageHeaderIns from "../components/PageHeaderIns";
import { transformerService } from '../services/TransformerService';
import { cloudinaryService } from '../services/CloudinaryService';

function InspectionsSTImage() {
  const { transformerNo, inspectionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentInspection, setCurrentInspection] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState(inspectionId);
  const [imageCheckLoading, setImageCheckLoading] = useState(false);
  const [transformer, setTransformer] = useState(null);
  const [isLoadingTransformer, setIsLoadingTransformer] = useState(false);
  const [error, setError] = useState(null);
  const [hasCloudImage, setHasCloudImage] = useState(false);
  const [cloudImageUrl, setCloudImageUrl] = useState(null);
  const [inferenceStatus, setInferenceStatus] = useState(null); // Track inference status: SUCCESS, FAILED, SKIPPED

  const branches = ['KANDY', 'COLOMBO', 'GALLE', 'JAFFNA', 'MATARA', 'KURUNEGALA', 'ANURADHAPURA'];

  useEffect(() => {
    console.log("Transformer No:", transformerNo, "Inspection ID:", inspectionId);
    if (transformerNo) {
      fetchInspectionsByTransformer(transformerNo);
    }
    
    // Set the selected inspection ID from URL
    if (inspectionId) {
      setSelectedInspectionId(inspectionId);
    }
  }, [transformerNo, inspectionId]);

  // Check if inspection was passed via navigation state
  useEffect(() => {
    if (location.state?.selectedInspection) {
      console.log('Inspection passed via navigation:', location.state.selectedInspection);
      setCurrentInspection(location.state.selectedInspection);
    }
  }, [location.state]);

  // Check for existing cloud images when currentInspection changes
  useEffect(() => {
    if (currentInspection) {
      checkExistingCloudImage(currentInspection.inspectionId);
    }
  }, [currentInspection]);

  // Function to check if inspection has existing cloud image
  const checkExistingCloudImage = async (inspectionId) => {
    try {
      setImageCheckLoading(true);
      console.log('Checking for existing cloud image for inspection:', inspectionId);
      
      const hasImage = await cloudinaryService.hasCloudImage(inspectionId);
      setHasCloudImage(hasImage);
      
      if (hasImage) {
        console.log('Cloud image exists for inspection:', inspectionId);
        // Fetch the cloud image URL
        const imageUrl = await cloudinaryService.getCloudImageUrlFromBackend(inspectionId);
        setCloudImageUrl(imageUrl);
        console.log('Cloud image URL:', imageUrl);
        // TODO: Also fetch inference status from backend if needed
      } else {
        console.log('No cloud image found for inspection:', inspectionId);
        setCloudImageUrl(null);
        setInferenceStatus(null); // Clear inference status when no image
      }
    } catch (error) {
      console.error('Error checking cloud image:', error);
      setHasCloudImage(false);
      setCloudImageUrl(null);
      setInferenceStatus(null); // Clear inference status on error
    } finally {
      setImageCheckLoading(false);
    }
  };

  // Mock data function
  const getMockData = () => {
    return [
      {
        inspectionId: `mock_${Date.now()}`,
        transformerNo: transformerNo,
        date: new Date().toISOString(),
        status: 'pending',
        branch: 'COLOMBO',
        type: 'thermal_inspection',
        inspector: 'System Admin'
      }
    ];
  };

  useEffect(() => {
    console.log('🚀 Component mounted with transformerNo:', transformerNo);
    
    if (transformerNo) {
      loadTransformerDetails();
    } else {
      console.warn('⚠️ No transformerNo provided in params');
      setError('No transformer number provided');
    }
  }, [transformerNo]);

  const loadTransformerDetails = async () => {
    try {
      console.log('🔄 Starting to load transformer details...');
      setIsLoadingTransformer(true);
      setError(null);
      
      const t = await transformerService.getTransformerByNumber(transformerNo);
      console.log('✅ Transformer loaded successfully:', t);
      
      if (t) {
        setTransformer(t);
      } else {
        console.warn('⚠️ No transformer found for number:', transformerNo);
        setError(`No transformer found with number: ${transformerNo}`);
      }
      
    } catch (error) {
      console.error("❌ Error loading transformer:", error);
      setError("Failed to load transformer details: " + error.message);
    } finally {
      setIsLoadingTransformer(false);
    }
  };

  // Modified fetchInspectionsByTransformer method
  const fetchInspectionsByTransformer = async (transformerNo) => {
    try {
      setLoading(true);
      const data = await inspectionService.getInspectionsByTransformer(transformerNo);
      
      console.log('Raw data from backend:', data);
      
      // Process and enrich the data
      const enrichedData = data.map(inspection => ({
        ...inspection,
        formattedDate: new Date(inspection.date || inspection.dateOfInspection).toLocaleDateString(),
        statusBadge: inspection.status?.charAt(0).toUpperCase() + inspection.status?.slice(1) || 'Unknown'
      }));
      
      setInspections(enrichedData);
      
      // If no inspection is selected yet, auto-select from URL parameter or navigation state
      if (!currentInspection) {
        let inspectionToSelect = null;
        
        // First priority: inspectionId from URL
        if (inspectionId) {
          inspectionToSelect = enrichedData.find(insp => insp.inspectionId === inspectionId);
        }
        
        // Second priority: selectedInspectionId from navigation state
        if (!inspectionToSelect && location.state?.selectedInspectionId) {
          inspectionToSelect = enrichedData.find(insp => insp.inspectionId === location.state.selectedInspectionId);
        }
        
        // Fallback: most recent inspection
        if (!inspectionToSelect && enrichedData.length > 0) {
          inspectionToSelect = enrichedData[0];
        }
        
        if (inspectionToSelect) {
          setCurrentInspection(inspectionToSelect);
          setSelectedInspectionId(inspectionToSelect.inspectionId);
        }
      }
    } catch (error) {
      console.error('Error fetching inspections for transformer:', error);
      // Fallback to filtered mock data if API fails
      const mockData = getMockData();
      const filteredMockData = mockData.filter(inspection =>
        inspection.transformerNo === transformerNo
      );
      setInspections(filteredMockData);
      
      if (filteredMockData.length > 0 && !currentInspection) {
        setCurrentInspection(filteredMockData[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (inspectionData) => {
    try {
      console.log('Creating inspection:', inspectionData);
      setUploadStatus({ type: 'loading', message: 'Creating inspection...' });
      
      // Create the inspection with transformer ID
      const newInspection = await inspectionService.createInspection({
        ...inspectionData,
        transformerNo: transformerNo,
        type: 'thermal_inspection'
      });
      
      console.log('Created inspection:', newInspection);
      
      // Set as current inspection for image upload
      setCurrentInspection(newInspection);
      
      // Refresh inspections list
      await fetchInspectionsByTransformer(transformerNo);
      
      setShowCreateModal(false);
      setUploadStatus({ 
        type: 'success', 
        message: 'Inspection created successfully. You can now upload thermal images to the cloud.' 
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error('Error creating inspection:', error);
      setUploadStatus({ 
        type: 'error', 
        message: 'Failed to create inspection. Please try again.' 
      });
      // Clear error message after 5 seconds
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

// Add this updated handleImageUpload function to your InspectionsSTImage.jsx

const handleImageUpload = async (fileInput, environmentalCondition = 'sunny') => {
  try {
    if (!currentInspection) {
      setUploadStatus({ 
        type: 'error', 
        message: 'No inspection selected. Please create or select an inspection first.' 
      });
      return;
    }

    // Debug the incoming file input
    console.log('🚀 handleImageUpload called with:', {
      fileInput: fileInput,
      inputType: typeof fileInput,
      constructor: fileInput?.constructor?.name,
      environmentalCondition: environmentalCondition,
      inspectionId: currentInspection.inspectionId
    });

    // Additional validation
    if (!fileInput) {
      setUploadStatus({ 
        type: 'error', 
        message: 'No file provided for upload' 
      });
      return;
    }

    console.log('Starting cloud upload for inspection:', currentInspection.inspectionId);
    setUploadStatus({ 
      type: 'loading', 
      message: 'Converting and uploading thermal image to cloud storage...' 
    });

    // Upload image to Cloudinary and save metadata to backend
    // The CloudinaryService will now handle the file conversion automatically
    const result = await cloudinaryService.uploadInspectionImageCloud(
      fileInput,  // Pass the original input (blob URLs, File, etc.)
      currentInspection.inspectionId, 
      environmentalCondition
    );

    console.log('Cloud upload successful:', result);
    
    // Update local state with the uploaded image
    setHasCloudImage(true);
    setCloudImageUrl(result.cloudinary.url);
    setInferenceStatus(result.inferenceStatus); // Store inference status
    
    // Check inference status and show appropriate message
    if (result.inferenceStatus === 'SUCCESS') {
      setUploadStatus({ 
        type: 'success', 
        message: 'Thermal image uploaded to cloud and analysis completed successfully!' 
      });
    } else if (result.inferenceStatus === 'FAILED') {
      setUploadStatus({ 
        type: 'warning', 
        message: `Image uploaded successfully, but analysis failed: ${result.inferenceMessage || result.inferenceError}. You can retry analysis later.` 
      });
    } else if (result.inferenceStatus === 'SKIPPED') {
      setUploadStatus({ 
        type: 'warning', 
        message: `Image uploaded successfully, but analysis was skipped: ${result.inferenceMessage}` 
      });
    } else {
      setUploadStatus({ 
        type: 'success', 
        message: 'Thermal image uploaded to cloud successfully!' 
      });
    }
    
    // Refresh inspection data to show the new image
    await fetchInspectionsByTransformer(transformerNo);
    
    // Check cloud image status again to ensure UI is updated
    await checkExistingCloudImage(currentInspection.inspectionId);
    
    // Clear message after 5 seconds (longer for warnings)
    setTimeout(() => setUploadStatus(null), 5000);
  } catch (error) {
    console.error('❌ Error uploading image to cloud:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      fileInput: fileInput
    });
    setUploadStatus({ 
      type: 'error', 
      message: `Failed to upload image to cloud: ${error.message}` 
    });
    setTimeout(() => setUploadStatus(null), 5000);
  }
};

  const handleImageDelete = async () => {
    try {
      if (!currentInspection) {
        console.warn('❌ handleImageDelete: No current inspection selected');
        return;
      }
      
      console.log('🗑️ ======================================');
      console.log('🗑️ FRONTEND: Starting handleImageDelete');
      console.log('🗑️ Inspection ID:', currentInspection.inspectionId);
      console.log('🗑️ Timestamp:', new Date().toISOString());
      console.log('🗑️ ======================================');
      
      setUploadStatus({ 
        type: 'loading', 
        message: 'Deleting image from cloud storage...' 
      });
      
      // Delete from both Cloudinary and backend
      console.log('🗑️ FRONTEND: Calling cloudinaryService.deleteInspectionImage...');
      const deleteResult = await cloudinaryService.deleteInspectionImage(currentInspection.inspectionId);
      
      console.log('🗑️ FRONTEND: Delete operation completed');
      console.log('🗑️ Delete result:', deleteResult);
      
      // Update local state
      setHasCloudImage(false);
      setCloudImageUrl(null);
      setInferenceStatus(null); // Clear inference status when image is deleted
      
      setUploadStatus({ 
        type: 'success', 
        message: 'Thermal image deleted from cloud successfully.' 
      });
      
      console.log('🗑️ FRONTEND: Refreshing inspection data...');
      // Refresh inspection data
      await fetchInspectionsByTransformer(transformerNo);
      
      // Check cloud image status again
      console.log('🗑️ FRONTEND: Checking cloud image status...');
      await checkExistingCloudImage(currentInspection.inspectionId);
      
      console.log('🗑️ FRONTEND: handleImageDelete completed successfully');
      console.log('🗑️ ======================================');
      
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error('🗑️ ❌ FRONTEND ERROR in handleImageDelete:', error);
      console.error('🗑️ Error stack:', error.stack);
      setUploadStatus({ 
        type: 'error', 
        message: 'Failed to delete image from cloud. Please try again.' 
      });
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  const selectInspection = (inspection) => {
    setCurrentInspection(inspection);
    setUploadStatus({ 
      type: 'info', 
      message: `Selected inspection #${inspection.inspectionId} for thermal imaging.` 
    });
    setTimeout(() => setUploadStatus(null), 2000);
  };

  if (loading) {
    return (
      <div className="inspections-page">
        <PageHeaderIns 
          onNewInspection={() => setShowCreateModal(true)}
          transformerNo={transformerNo}
          transformerId={transformer?.id}
        />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading inspections for Transformer {transformerNo}...</p>
        </div>
      </div>
    );
  }
  console.log('🛑🛑 transformerId in thermal Image Component:', transformer?.id);

  return (
    <div className="inspections-page">
        <PageHeaderIns
        onNewInspection={() => setShowCreateModal(true)}
        transformerNo={transformer?.transformerNo}
        transformerId={transformer?.id}
        transformerPoleno={transformer?.poleNo}
        inspectionId={currentInspection?.inspectionId}
        inspectionTimestamp={currentInspection?.inspectionTimestamp}
        inspectionBranch={currentInspection?.branch}
      />


      {showCreateModal && (
        <InspectionModal
          title="Create New Inspection"
          inspection={null}
          branches={branches}
          transformerNo={transformerNo}
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      <div className="page-content">
        <div className="page-header">
          <h2 className="page-title">
            Thermal Image Analysis </h2>
          <p className="page-subtitle">
            Upload thermal images to cloud storage and analyze them to detect potential issues and anomalies in transformer components
          </p>
        </div>

        {/* Thermal Image Component */}
        {currentInspection ? (
          <div className="thermal-section">
            {/* Show red warning if inference failed - now at the top */}
            {hasCloudImage && (inferenceStatus === 'FAILED' || inferenceStatus === 'SKIPPED') && (
              <div style={{
                marginTop: '0',
                marginBottom: '15px',
                padding: '12px 20px',
                backgroundColor: '#fff5f5',
                border: '2px solid #ff4444',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{
                  color: '#cc0000',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  margin: 0
                }}>
                  ⚠️ Anomaly Detection {inferenceStatus === 'FAILED' ? 'Failed' : 'Skipped'}
                </p>
                <p style={{
                  color: '#666',
                  fontSize: '14px',
                  marginTop: '8px',
                  marginBottom: 0
                }}>
                  {inferenceStatus === 'FAILED' 
                    ? 'The thermal image was uploaded successfully, but anomaly detection encountered an error. Check whether the python endpoint is reachable.'
                    : 'The thermal image was uploaded successfully, but anomaly detection was skipped. Please ensure a baseline image exists.'}
                </p>
              </div>
            )}
            {imageCheckLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Checking cloud storage for existing thermal images...</p>
              </div>
            ) : (
              <ThermalImageComponent
                inspectionId={currentInspection.inspectionId}
                transformerId={transformer?.id}
                onImageUpload={handleImageUpload}
                onImageDelete={handleImageDelete}
                hasExistingImage={hasCloudImage}
                existingImageUrl={cloudImageUrl}
                key={currentInspection.inspectionId}
              />
            )}
          </div>
        ) : (
          <div className="thermal-section-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">☁️🔥</div>
              <h3>Cloud Thermal Image Analysis</h3>
              <p>Select or create an inspection above to begin cloud-based thermal image analysis.</p>
              <p>Available inspections: {inspections.length}</p>
              {inspections.length > 0 && (
                <div>
                  <h4>Available Inspections:</h4>
                  {inspections.slice(0, 3).map(insp => (
                    <button 
                      key={insp.inspectionId} 
                      onClick={() => selectInspection(insp)}
                      style={{ 
                        margin: '5px', 
                        padding: '10px', 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Select {insp.inspectionId}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InspectionsSTImage;