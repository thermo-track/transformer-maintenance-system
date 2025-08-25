import React, { useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Eye, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import '../styles/inspections-table.css';
import ConfirmDialog from '../../../components/ConfirmDialog';
import StatusDropdown from './StatusDropdown';
import { formatInspectedDateTime } from '../utils/dataUtils';
import { formatMaintenanceDate } from '../utils/dataUtils';
import { inspectionService } from '../services/InspectionService';

const InspectionsTableST = ({ inspections, onEdit, onDelete, onStatusUpdate, startIndex }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);      
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [currentInspections, setCurrentInspections] = useState(inspections);
  const [updatingStatuses, setUpdatingStatuses] = useState(new Set());
  const { transformerNo } = useParams();
  const navigate = useNavigate();

  // Update inspections when prop changes
  React.useEffect(() => {
    setCurrentInspections(inspections);
  }, [inspections]);

  const toggleRowExpansion = (inspectionId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(inspectionId)) {
      newExpanded.delete(inspectionId);
    } else {
      newExpanded.add(inspectionId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusClass = (status) => {
    if (!status) return 'status-none';
    
    switch (status.toUpperCase().replace('_', ' ')) {
      case 'COMPLETED': return 'status-completed';
      case 'IN PROGRESS': 
      case 'IN_PROGRESS': return 'status-progress';
      case 'PENDING': return 'status-pending';
      case 'SCHEDULED': return 'status-scheduled';
      default: return 'status-default';
    }
  };

  const getPriorityClass = (priority) => {
    if (!priority) return 'priority-default';
    
    switch (priority.toLowerCase()) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-default';
    }
  };

  // Enhanced status update handler with error handling and optimistic updates
  const handleStatusUpdate = async (inspectionId, newStatus) => {
    console.log(`Table: Updating status for inspection ${inspectionId} to ${newStatus}`);
    
    // Add to updating set
    setUpdatingStatuses(prev => new Set(prev).add(inspectionId));
    
    // Store original inspection for rollback
    const originalInspection = currentInspections.find(insp => insp.inspectionId === inspectionId);
    
    try {
      // Optimistic update - Update local state immediately
      setCurrentInspections(prev => 
        prev.map(inspection => 
          inspection.inspectionId === inspectionId 
            ? { ...inspection, status: newStatus }
            : inspection
        )
      );

      // Call parent callback first (for any parent-level updates)
      if (onStatusUpdate) {
        await onStatusUpdate(inspectionId, newStatus);
      }

      console.log(`Status updated successfully for inspection ${inspectionId}`);
      
    } catch (error) {
      console.error('Error updating inspection status:', error);
      
      // Rollback on error - restore original status
      if (originalInspection) {
        setCurrentInspections(prev => 
          prev.map(inspection => 
            inspection.inspectionId === inspectionId 
              ? { ...inspection, status: originalInspection.status }
              : inspection
          )
        );
      }
      
      // You might want to show an error toast here
      console.error('Failed to update status, rolled back to original state');
    } finally {
      // Remove from updating set
      setUpdatingStatuses(prev => {
        const newSet = new Set(prev);
        newSet.delete(inspectionId);
        return newSet;
      });
    }
  };

  // Delete dialog handlers
  const askDelete = (id) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (pendingDeleteId) {
      onDelete(pendingDeleteId);
    }
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  const handleViewInspection = (inspection) => {
    // Navigate to image page using the new route structure with inspectionId parameter
    navigate(`/transformer/${transformerNo}/${inspection.inspectionId}/image`, {
      state: {
        selectedInspection: inspection 
      }
    });
  };

  return (
    <div className="inspections-table-container">
      <div className="table-wrapper">
        <table className="inspections-table">
          <thead>
            <tr>
              <th></th>
              <th></th>
              <th>Inspection No</th>
              <th>Inspected Date & Time</th>
              <th>Maintenance Date</th>
              <th>Status</th>
              <th>Priority</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {currentInspections.map((inspection, index) => (
              <React.Fragment key={inspection.inspectionId}>
                <tr className="table-row">
                  <td>
                    <button
                      className="expand-btn"
                      onClick={() => toggleRowExpansion(inspection.inspectionId)}
                    >
                      {expandedRows.has(inspection.inspectionId)
                        ? <ChevronDown className="icon-sm" />
                        : <ChevronRight className="icon-sm" />
                      }
                    </button>
                  </td>
                  <td className="row-number">
                    {startIndex + index + 1}
                  </td>
                  <td className="inspection-id">
                    {inspection.inspectionId}
                  </td>
                  <td className="inspected-date">
                    {formatInspectedDateTime(inspection)}
                  </td>
                  <td className="maintenance-date">
                    {formatMaintenanceDate(inspection.maintenanceDateTime)}
                  </td>
                  <td className="status-cell">
                    <StatusDropdown 
                      inspection={{
                        ...inspection,
                        status: inspection.status || null
                      }}
                      onStatusUpdate={handleStatusUpdate}
                    />
                    {updatingStatuses.has(inspection.inspectionId) && (
                      <div className="status-updating-indicator">
                        <div className="mini-spinner"></div>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`priority-badge ${getPriorityClass(inspection.priority)}`}>
                      {inspection.priority || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button 
                        className="action-btn view-btn"
                        onClick={() => handleViewInspection(inspection)}
                        title={`View thermal images for inspection ${inspection.inspectionId}`}
                      >
                        <Eye className="icon-xs" />
                      </button>
                      <button
                        className="action-btn edit-btn"
                        onClick={() => onEdit(inspection)}
                      >
                        <Edit className="icon-xs" />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => askDelete(inspection.inspectionId)}
                      >
                        <Trash2 className="icon-xs" />
                      </button>
                    </div>
                  </td>
                </tr>

                {expandedRows.has(inspection.inspectionId) && (
                  <tr className="expanded-row">
                    <td colSpan="8">
                      <div className="expanded-content">
                        <div className="details-grid">
                          <div className="detail-item">
                            <span className="detail-label">Weather:</span>
                            <span className="detail-value">{inspection.weather || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Duration:</span>
                            <span className="detail-value">{inspection.duration || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Next Inspection:</span>
                            <span className="detail-value">{inspection.nextInspectionDate || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Current Status:</span>
                            <span className={`detail-value status-indicator ${getStatusClass(inspection.status)}`}>
                              {inspection.status || 'No Status Set'}
                            </span>
                          </div>
                          <div className="detail-item full-width">
                            <span className="detail-label">Findings:</span>
                            <span className="detail-value">{inspection.findings || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {currentInspections.length === 0 && (
          <div className="empty-state">
            <p>No inspections found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      {confirmOpen && (
        <ConfirmDialog
          title="Delete inspection?"
          text={`Inspection #${pendingDeleteId} will be permanently deleted.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
};

export default InspectionsTableST;