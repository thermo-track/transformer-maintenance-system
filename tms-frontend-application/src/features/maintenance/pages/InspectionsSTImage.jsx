import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import '../styles/global.css';
import '../styles/inspections.css';
import InspectionModal from '../components/InspectionModal';
import ThermalImageComponent from '../components/ThermalImageComponent';
import { inspectionService } from '../services/InspectionService';
import PageHeaderST from '../components/PageHeaderST';

function InspectionsSTImage() {
  const { transformerId, inspectionId } = useParams(); // Get both parameters
  const location = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentInspection, setCurrentInspection] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState(inspectionId); // Track selected inspection
  const [imageCheckLoading, setImageCheckLoading] = useState(false); // New state for image check loading

  const branches = ['KANDY', 'COLOMBO', 'GALLE', 'JAFFNA', 'MATARA', 'KURUNEGALA', 'ANURADHAPURA'];

  useEffect(() => {
    console.log("Transformer ID:", transformerId, "Inspection ID:", inspectionId);
    if (transformerId) {
      fetchInspectionsByTransformer(transformerId);
    }
    
    // Set the selected inspection ID from URL
    if (inspectionId) {
      setSelectedInspectionId(inspectionId);
    }
  }, [transformerId, inspectionId]);

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
        transformerId: transformerId,
        date: new Date().toISOString(),
        status: 'pending',
        branch: 'COLOMBO',
        type: 'thermal_inspection',
        inspector: 'System Admin'
      }
    ];
  };

  // Modified fetchInspectionsByTransformer method
  const fetchInspectionsByTransformer = async (transformerId) => {
    try {
      setLoading(true);
      // Call the service method with transformer ID
      const data = await inspectionService.getInspectionsByTransformer(transformerId);
      
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
        inspection.transformerId === transformerId
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
        transformerId: transformerId,
        type: 'thermal_inspection'
      });
      
      console.log('Created inspection:', newInspection);
      
      // Set as current inspection for image upload
      setCurrentInspection(newInspection);
      
      // Refresh inspections list
      await fetchInspectionsByTransformer(transformerId);
      
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
      await fetchInspectionsByTransformer(transformerId);
      
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
      await fetchInspectionsByTransformer(transformerId);
      
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
        <PageHeaderST 
          onNewInspection={() => setShowCreateModal(true)}
          transformerId={transformerId}
        />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading inspections for Transformer {transformerId}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inspections-page">
      <PageHeaderST 
        onNewInspection={() => setShowCreateModal(true)}
        transformerId={transformerId}
      />

      {showCreateModal && (
        <InspectionModal
          title="Create New Inspection"
          inspection={null}
          branches={branches}
          transformerId={transformerId}
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      <div className="page-content">
        <div className="page-header">
          <h2 className="page-title">
            Thermal Image Analysis - Transformer {transformerId}
          </h2>
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