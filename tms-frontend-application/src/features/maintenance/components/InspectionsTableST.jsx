import React, { useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Eye, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import '../styles/inspections-table.css';
import ConfirmDialog from '../../../components/ConfirmDialog';

const InspectionsTableST = ({ inspections, onEdit, onDelete, startIndex }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);      
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const { transformerNo } = useParams();
  const navigate = useNavigate();

  // Helper function to format inspected date with time - FIXED
  const formatInspectedDateTime = (inspection) => {
    try {
      // Check for the new timestamp field first
      if (inspection.inspectionTimestamp) {
        const date = new Date(inspection.inspectionTimestamp);
        if (isNaN(date.getTime())) {
          console.warn('Invalid inspectionTimestamp:', inspection.inspectionTimestamp);
          return 'Invalid date';
        }
        
        // Convert to local timezone and format - FIXED OPTIONS
        return date.toLocaleString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Colombo' // Explicitly use Sri Lankan timezone
        });
      }
      // Fallback to legacy fields for backward compatibility
      else if (inspection.inspectedDateTime) {
        const date = new Date(inspection.inspectedDateTime);
        if (isNaN(date.getTime())) {
          console.warn('Invalid inspectedDateTime:', inspection.inspectedDateTime);
          return 'Invalid date';
        }
        return date.toLocaleString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Colombo' // Explicitly use Sri Lankan timezone
        });
      } 
      // Legacy separate date and time fields
      else if (inspection.dateOfInspection) {
        const date = new Date(inspection.dateOfInspection);
        if (isNaN(date.getTime())) {
          console.warn('Invalid dateOfInspection:', inspection.dateOfInspection);
          return 'Invalid date';
        }
        
        // Format the date part with 2-digit day
        const formattedDate = date.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          timeZone: 'Asia/Colombo'
        });
        
        // Handle time part
        const timeStr = inspection.timeOfInspection || '00:00';
        if (timeStr.includes(':')) {
          // Convert 24-hour time to 12-hour format with leading zeros
          const [hours, minutes] = timeStr.split(':');
          const hour = parseInt(hours, 10);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          const formattedHour = displayHour.toString().padStart(2, '0');
          const formattedMinutes = minutes.padStart(2, '0');
          return `${formattedDate} ${formattedHour}:${formattedMinutes} ${ampm}`;
        }
        
        return `${formattedDate} ${timeStr}`;
      }
      return 'Not specified';
    } catch (error) {
      console.error('Error formatting inspected date:', error, inspection);
      return 'Invalid date';
    }
  };

  // Helper function to format maintenance date (date only)
  const formatMaintenanceDate = (maintenanceDateTime) => {
    // Handle null, undefined, or empty string
    if (!maintenanceDateTime || maintenanceDateTime === '') {
      return 'Not scheduled';
    }
    
    // Convert to string to handle different data types
    const dateStr = String(maintenanceDateTime).trim();
    
    // Handle empty or whitespace-only strings
    if (!dateStr) {
      return 'Not scheduled';
    }
    
    try {
      // Create date object
      const date = new Date(dateStr);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid maintenance date:', maintenanceDateTime);
        return 'Invalid date';
      }
      
      // Format the valid date in the same style as inspected date (but date only)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Colombo' // Use Sri Lankan timezone
      });
    } catch (error) {
      console.error('Error formatting maintenance date:', error, maintenanceDateTime);
      return 'Invalid date';
    }
  };

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
    switch (status?.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'in progress': return 'status-progress';
      case 'pending': return 'status-pending';
      case 'scheduled': return 'status-scheduled';
      default: return 'status-default';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-default';
    }
  };

  // dialog handlers
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
            {inspections.map((inspection, index) => (
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
                  <td>
                    <span className={`status-badge ${getStatusClass(inspection.status)}`}>
                      {inspection.status}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge ${getPriorityClass(inspection.priority)}`}>
                      {inspection.priority}
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
                            <span className="detail-value">{inspection.weather}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Duration:</span>
                            <span className="detail-value">{inspection.duration}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Next Inspection:</span>
                            <span className="detail-value">{inspection.nextInspectionDate}</span>
                          </div>
                          <div className="detail-item full-width">
                            <span className="detail-label">Findings:</span>
                            <span className="detail-value">{inspection.findings}</span>
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

        {inspections.length === 0 && (
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