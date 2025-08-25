import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import '../styles/global.css';
import '../styles/inspections.css';
import InspectionModal from '../components/InspectionModal';
import ThermalImageComponent from '../components/ThermalImageComponent';
import { inspectionService } from '../services/InspectionService';
import PageHeaderIns from "../components/PageHeaderIns";
import { transformerService } from '../services/TransformerService';
import { baselineImageService } from '../services/BaselineImageService';

function InspectionsSTImage() {
  const { transformerNo, inspectionId } = useParams();
  const location = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentInspection, setCurrentInspection] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState(inspectionId); // Track selected inspection
  const [imageCheckLoading, setImageCheckLoading] = useState(false); // New state for image check loading
  const [transformer, setTransformer] = useState(null);
  const [isLoadingTransformer, setIsLoadingTransformer] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [baselineImages, setBaselineImages] = useState({
      sunny: null,
      cloudy: null,
      rainy: null
    });

  const branches = ['KANDY', 'COLOMBO', 'GALLE', 'JAFFNA', 'MATARA', 'KURUNEGALA', 'ANURADHAPURA'];

  useEffect(() => {
    console.log("Transformer ID:", transformerNo, "Inspection ID:", inspectionId);
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

  // New useEffect to check for existing images when currentInspection changes
  useEffect(() => {
    if (currentInspection) {
      checkExistingImage(currentInspection.inspectionId);
    }
  }, [currentInspection]);

  // New function to check if inspection has existing image
  const checkExistingImage = async (inspectionId) => {
    try {
      setImageCheckLoading(true);
      const hasImage = await inspectionService.checkIfInspectionHasImage(inspectionId);
      
      if (hasImage) {
        // If image exists, you might want to set a flag or update the UI accordingly
        // This could trigger the ThermalImageComponent to show the existing image
        console.log('Inspection has existing image:', inspectionId);
        // You can set additional state here if needed for the UI
      } else {
        console.log('No existing image for inspection:', inspectionId);
      }
    } catch (error) {
      console.error('Error checking existing image:', error);
    } finally {
      setImageCheckLoading(false);
    }
  };

  // Mock data function
  const getMockData = () => {
    return [
      {
        inspectionId: `mock_${Date.now()}`, // Changed from 'id' to 'inspectionId'
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
        // loadBaselineImages();
        loadTransformerDetails();
      } else {
        console.warn('⚠️ No transformerNo provided in params');
        setError('No transformer number provided');
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

  const loadTransformerDetails = async () => {
      try {
        console.log('🔄 Starting to load transformer details...');
        setIsLoadingTransformer(true);
        setError(null); // Clear any previous errors
        
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
      // Call the service method with transformer ID
      const data = await inspectionService.getInspectionsByTransformer(transformerNo);
      
      console.log('Raw data from backend:', data); // Debug log
      
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
        message: 'Inspection created successfully. You can now upload thermal images.' 
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

  const handleImageUpload = async (imageData) => {
    try {
      if (!currentInspection) {
        setUploadStatus({ 
          type: 'error', 
          message: 'No inspection selected. Please create or select an inspection first.' 
        });
        return;
      }

      console.log('Image uploaded for inspection:', currentInspection.inspectionId, imageData);
      setUploadStatus({ 
        type: 'success', 
        message: 'Thermal image uploaded and analysis completed successfully!' 
      });
      
      // Refresh inspection data if needed
      await fetchInspectionsByTransformer(transformerNo);
      
      // Check the image status again to update the UI properly
      await checkExistingImage(currentInspection.inspectionId);
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error('Error handling image upload:', error);
      setUploadStatus({ 
        type: 'error', 
        message: 'Failed to upload image. Please try again.' 
      });
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  const handleImageDelete = async () => {
    try {
      if (!currentInspection) return;
      
      await inspectionService.deleteInspectionImage(currentInspection.inspectionId);
      console.log('Image deleted for inspection:', currentInspection.inspectionId);
      
      setUploadStatus({ 
        type: 'success', 
        message: 'Thermal image deleted successfully.' 
      });
      
      // Refresh inspection data
      await fetchInspectionsByTransformer(transformerNo);
      
      // Check the image status again to update the UI properly
      await checkExistingImage(currentInspection.inspectionId);
      
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error('Error deleting image:', error);
      setUploadStatus({ 
        type: 'error', 
        message: 'Failed to delete image. Please try again.' 
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
        />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading inspections for Transformer {transformerNo}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inspections-page">
        <PageHeaderIns
        onNewInspection={() => setShowCreateModal(true)}
        transformerNo={transformer?.transformerNo}
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
            Upload and analyze thermal images to detect potential issues and anomalies in transformer components
          </p>
        </div>

        {/* Status Messages */}
        {uploadStatus && (
          <div className={`status-message status-${uploadStatus.type}`}>
            <div className="status-content">
              {uploadStatus.type === 'loading' && <div className="status-spinner"></div>}
              {uploadStatus.type === 'success' && <span className="status-icon">✓</span>}
              {uploadStatus.type === 'error' && <span className="status-icon">✗</span>}
              {uploadStatus.type === 'info' && <span className="status-icon">ℹ</span>}
              <span>{uploadStatus.message}</span>
            </div>
          </div>
        )}

        {/* Thermal Image Component */}
        {currentInspection ? (
          <div className="thermal-section">
            {imageCheckLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Checking for existing thermal images...</p>
              </div>
            ) : (
              <ThermalImageComponent
                inspectionId={currentInspection.inspectionId}
                onImageUpload={handleImageUpload}
                onImageDelete={handleImageDelete}
                key={currentInspection.inspectionId} // Force re-render when inspection changes
              />
            )}
          </div>
        ) : (
          <div className="thermal-section-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">🔥</div>
              <h3>Thermal Image Analysis</h3>
              <p>Select or create an inspection above to begin thermal image analysis.</p>
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
                        borderRadius: '3px' 
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