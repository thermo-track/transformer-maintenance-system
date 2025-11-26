import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inspectionService } from '../services/InspectionService';
import '../styles/maintenance-history.css';

const MaintenanceHistoryViewer = ({ transformerId, transformerNo }) => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (transformerNo) {
      fetchInspectionHistory();
    }
  }, [transformerNo]);

  const fetchInspectionHistory = async () => {
    try {
      setLoading(true);
      const data = await inspectionService.getInspectionsByTransformer(transformerNo);
      
      // Sort by date, most recent first
      const sortedData = data.sort((a, b) => 
        new Date(b.inspectionTimestamp || b.date) - new Date(a.inspectionTimestamp || a.date)
      );
      
      setInspections(sortedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching inspection history:', err);
      setError('Failed to load inspection history');
    } finally {
      setLoading(false);
    }
  };

  const fetchInspectionDetails = async (inspectionId) => {
    try {
      const data = await inspectionService.getDigitalFormData(inspectionId);
      setFormData(data);
      setSelectedInspection(inspections.find(i => i.inspectionId === inspectionId));
    } catch (err) {
      console.error('Error fetching inspection details:', err);
      setFormData(null);
    }
  };

  const handleViewDetails = (inspectionId) => {
    fetchInspectionDetails(inspectionId);
  };

  const handleCloseDetails = () => {
    setSelectedInspection(null);
    setFormData(null);
  };

  const handleEditRecord = (inspectionId) => {
    navigate(`/maintenance/transformer/${transformerNo}/digital-form?inspection=${inspectionId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'COMPLETED': 'status-completed',
      'IN_PROGRESS': 'status-in-progress',
      'SCHEDULED': 'status-scheduled',
      'PENDING': 'status-pending'
    };
    return statusClasses[status] || 'status-default';
  };

  if (loading) {
    return (
      <div className="history-loading">
        <div className="spinner"></div>
        <p>Loading maintenance history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-error">
        <p>{error}</p>
        <button onClick={fetchInspectionHistory}>Retry</button>
      </div>
    );
  }

  if (inspections.length === 0) {
    return (
      <div className="history-empty">
        <p>No maintenance records found for this transformer.</p>
      </div>
    );
  }

  return (
    <div className="maintenance-history-viewer">
      <div className="history-header">
        <h2>Maintenance Record History</h2>
        <p className="transformer-info">
          Transformer: <strong>{transformerNo}</strong> | 
          Total Records: <strong>{inspections.length}</strong>
        </p>
      </div>

      <div className="history-content">
        {/* Left panel - List of inspections */}
        <div className="history-list">
          {inspections.map((inspection) => (
            <div 
              key={inspection.inspectionId}
              className={`history-item ${selectedInspection?.inspectionId === inspection.inspectionId ? 'selected' : ''}`}
              onClick={() => handleViewDetails(inspection.inspectionId)}
            >
              <div className="history-item-header">
                <span className="inspection-id">#{inspection.inspectionId}</span>
                <span className={`status-badge ${getStatusBadge(inspection.status)}`}>
                  {inspection.status}
                </span>
              </div>
              <div className="history-item-body">
                <p className="inspection-date">
                  📅 {formatDate(inspection.inspectionTimestamp || inspection.date)}
                </p>
                <p className="inspection-branch">
                  📍 {inspection.branch}
                </p>
                {inspection.inspectedBy && (
                  <p className="inspection-inspector">
                    👤 {inspection.inspectedBy}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right panel - Details view */}
        <div className="history-details">
          {!selectedInspection ? (
            <div className="details-placeholder">
              <p>Select an inspection record to view details</p>
            </div>
          ) : (
            <div className="details-content">
              <div className="details-header">
                <h3>Inspection #{selectedInspection.inspectionId}</h3>
              </div>

              <div className="details-info">
                <div className="info-section">
                  <h4>Basic Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Date & Time:</label>
                      <span>{formatDate(selectedInspection.inspectionTimestamp)}</span>
                    </div>
                    <div className="info-item">
                      <label>Status:</label>
                      <span className={`status-badge ${getStatusBadge(selectedInspection.status)}`}>
                        {selectedInspection.status}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Branch:</label>
                      <span>{selectedInspection.branch}</span>
                    </div>
                    {selectedInspection.inspectedBy && (
                      <div className="info-item">
                        <label>Inspected By:</label>
                        <span>{selectedInspection.inspectedBy}</span>
                      </div>
                    )}
                  </div>
                </div>

                {formData && (
                  <>
                    {/* Work Data Sheet Information */}
                    {formData.workOrderNo && (
                      <div className="info-section">
                        <h4>Maintenance Record</h4>
                        <div className="info-grid">
                          <div className="info-item">
                            <label>Work Order No:</label>
                            <span>{formData.workOrderNo}</span>
                          </div>
                          <div className="info-item">
                            <label>Nature of Work:</label>
                            <span>{formData.natureOfWork}</span>
                          </div>
                          {formData.startTime && (
                            <div className="info-item">
                              <label>Start Time:</label>
                              <span>{formData.startTime}</span>
                            </div>
                          )}
                          {formData.completionTime && (
                            <div className="info-item">
                              <label>Completion Time:</label>
                              <span>{formData.completionTime}</span>
                            </div>
                          )}
                          {formData.supervisedBy && (
                            <div className="info-item">
                              <label>Supervised By:</label>
                              <span>{formData.supervisedBy}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Inspection & Rectification Log */}
                    {formData.inspectedByWds && (
                      <div className="info-section">
                        <h4>Inspection & Rectification Log</h4>
                        <div className="info-grid">
                          <div className="info-item">
                            <label>Inspected By:</label>
                            <span>{formData.inspectedByWds}</span>
                          </div>
                          {formData.inspectedDate && (
                            <div className="info-item">
                              <label>Inspected Date:</label>
                              <span>{formData.inspectedDate}</span>
                            </div>
                          )}
                          {formData.rectifiedBy && (
                            <div className="info-item">
                              <label>Rectified By:</label>
                              <span>{formData.rectifiedBy}</span>
                            </div>
                          )}
                          {formData.rectifiedDate && (
                            <div className="info-item">
                              <label>Rectified Date:</label>
                              <span>{formData.rectifiedDate}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!formData && (
                  <div className="loading-details">
                    <p>Loading detailed information...</p>
                  </div>
                )}
              </div>

              <button 
                className="btn-close"
                onClick={handleCloseDetails}
              >
                Close Details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceHistoryViewer;
