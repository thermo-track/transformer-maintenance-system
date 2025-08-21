// components/InspectionsTable.js
import React, { useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Eye, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import '../styles/inspections-table.css';

const InspectionsTableST = ({ inspections, onEdit, onDelete, startIndex }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const navigate = useNavigate();

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

  return (
    <div className="inspections-table-container">
      <div className="table-header">
        <h2 className="table-title">Inspections</h2>
      </div>

      <div className="table-wrapper">
        <table className="inspections-table">
          <thead>
            <tr>
              <th></th>
              <th>#</th>
              <th>Inspection No</th>
              <th>Inspected Date</th>
              <th>Maintenance Date</th>
              <th>Inspector</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Actions</th>
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
                      {expandedRows.has(inspection.inspectionId) ? 
                        <ChevronDown className="icon-sm" /> : 
                        <ChevronRight className="icon-sm" />
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
                      {inspection.inspectedDateTime 
                        ? new Date(inspection.inspectedDateTime).toLocaleString('en-GB', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })
                        : `${inspection.dateOfInspection} ${inspection.timeOfInspection}`
                      }
                    </td>
                  <td className="maintenance-datetime">
                    {inspection.maintenanceDateTime}
                  </td>
                  <td className="inspector">
                    {inspection.inspectorName}
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
                        onClick={() => navigate("image")} >
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
                        onClick={() => onDelete(inspection.inspectionId)}
                      >
                        <Trash2 className="icon-xs" />
                      </button>
                    </div>
                  </td>
                </tr>
                
                {expandedRows.has(inspection.inspectionId) && (
                  <tr className="expanded-row">
                    <td colSpan="11">
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
    </div>
  );
};

export default InspectionsTableST;