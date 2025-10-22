import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../config/api';
import * as XLSX from 'xlsx';
import * as XLSX from 'xlsx';
import './ModelRetraining.css';

/**
 * Model Retraining Page
 * Displays anomaly annotations and allows triggering model retraining (admin only)
 * Regular users can view annotation history but cannot retrain
 */
export default function ModelRetrainingPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [retrainingStatus, setRetrainingStatus] = useState(null);
  const [inspectionGroups, setInspectionGroups] = useState([]);
  const [expandedInspections, setExpandedInspections] = useState(new Set());
  const [stats, setStats] = useState({
    total: 0,
    added: 0,
    edited: 0,
    deleted: 0,
    inspections: 0
  });
  
  // Retraining progress states
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainingProgress, setRetrainingProgress] = useState(0);
  const [retrainingStep, setRetrainingStep] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Check if user is admin (for hiding retrain button)
  const isAdmin = hasRole('ROLE_ADMIN');

  // Load annotations and stats
  useEffect(() => {
    loadAnnotations();
    if (isAdmin) {
      checkRetrainingStatus();
    }
  }, [isAdmin]);

  const loadAnnotations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use admin endpoint if admin, otherwise user endpoint
      const endpoint = isAdmin 
        ? '/api/admin/retraining/annotations'
        : '/api/annotations/history';
      
      const response = await apiClient.get(endpoint);
      
      if (response.data.success) {
        const grouped = groupByInspection(response.data.annotations || []);
        setInspectionGroups(grouped);
        calculateStats(response.data.annotations || [], grouped.length);
      } else {
        const errorMsg = response.data.error || response.data.message || 'Failed to load annotations';
        console.error('Backend returned error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Error loading annotations:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load annotation data';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Group annotations by inspection ID
  const groupByInspection = (annotations) => {
    const grouped = {};
    
    annotations.forEach(action => {
      const inspId = action.inspectionId;
      if (!grouped[inspId]) {
        grouped[inspId] = {
          inspectionId: inspId,
          transformerId: action.transformerId || 'N/A',
          transformerName: action.transformerName || 'Unknown',
          actions: [],
          stats: {
            created: 0,
            edited: 0,
            deleted: 0,
            commented: 0,
            approved: 0,
            rejected: 0
          }
        };
      }
      grouped[inspId].actions.push(action);
      
      // Count action types
      const actionType = action.actionType || action.action;
      if (actionType === 'CREATED') grouped[inspId].stats.created++;
      else if (actionType === 'EDITED') grouped[inspId].stats.edited++;
      else if (actionType === 'DELETED') grouped[inspId].stats.deleted++;
      else if (actionType === 'COMMENTED') grouped[inspId].stats.commented++;
      else if (actionType === 'APPROVED') grouped[inspId].stats.approved++;
      else if (actionType === 'REJECTED') grouped[inspId].stats.rejected++;
    });

    // Sort actions within each group by timestamp (newest first)
    Object.values(grouped).forEach(group => {
      group.actions.sort((a, b) => 
        new Date(b.actionTimestamp || b.timestamp) - new Date(a.actionTimestamp || a.timestamp)
      );
    });

    // Convert to array and sort by most recent activity
    return Object.values(grouped).sort((a, b) => {
      const aTime = new Date(a.actions[0]?.actionTimestamp || a.actions[0]?.timestamp || 0);
      const bTime = new Date(b.actions[0]?.actionTimestamp || b.actions[0]?.timestamp || 0);
      return bTime - aTime;
    });
  };

  const checkRetrainingStatus = async () => {
    // Only check retraining status for admins
    if (!isAdmin) return;
    
    try {
      const response = await apiClient.get('/api/admin/model/retraining/status');
      if (response.data.success) {
        setRetrainingStatus(response.data.status);
      }
    } catch (err) {
      console.error('Error checking retraining status:', err);
    }
  };

  const calculateStats = (data, inspectionCount) => {
    const stats = {
      total: data.length,
      added: data.filter(a => (a.actionType || a.action) === 'CREATED').length,
      edited: data.filter(a => (a.actionType || a.action) === 'EDITED').length,
      deleted: data.filter(a => (a.actionType || a.action) === 'DELETED').length,
      inspections: inspectionCount
    };
    setStats(stats);
  };

  const toggleInspection = (inspectionId) => {
    setExpandedInspections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(inspectionId)) {
        newSet.delete(inspectionId);
      } else {
        newSet.add(inspectionId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedInspections(new Set(inspectionGroups.map(g => g.inspectionId)));
  };

  const collapseAll = () => {
    setExpandedInspections(new Set());
  };

  const handleStartRetraining = async () => {
    setShowConfirmModal(true);
  };

  const confirmRetraining = async () => {
    setShowConfirmModal(false);

    try {
      setIsRetraining(true);
      setRetrainingProgress(0);
      setRetrainingStep('Preparing training data...');
      setError(null);
      setSuccess(null);

      // Simulate progress steps
      setTimeout(() => {
        setRetrainingProgress(20);
        setRetrainingStep('Validating annotations...');
      }, 500);

      setTimeout(() => {
        setRetrainingProgress(40);
        setRetrainingStep('Sending data to training service...');
      }, 1500);

      // Get username from auth context or localStorage
      const username = localStorage.getItem('username') || 'admin';

      const response = await apiClient.post('/api/admin/retraining/trigger', null, {
        headers: {
          'X-Username': username
        }
      });
      
      if (response.data.success) {
        const runId = response.data.runId;
        setRetrainingProgress(60);
        setRetrainingStep('Training model in progress...');
        setRetrainingStatus('RUNNING');
        // Poll for status updates
        pollRetrainingStatus(runId);
      } else {
        setError(response.data.message || 'Failed to start retraining');
        setIsRetraining(false);
      }
    } catch (err) {
      console.error('Error starting retraining:', err);
      setError(err.response?.data?.message || 'Failed to start model retraining');
      setIsRetraining(false);
      setRetrainingProgress(0);
      setRetrainingStep('');
    }
  };

  const cancelRetraining = () => {
    setShowConfirmModal(false);
  };

  const pollRetrainingStatus = (runId) => {
    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get(`/api/admin/retraining/status/${runId}`);
        if (response.data) {
          setRetrainingStatus(response.data.status);
          
          // Update progress based on status
          if (response.data.status === 'RUNNING') {
            // Gradually increase progress while training
            setRetrainingProgress(prev => Math.min(prev + 5, 90));
            setRetrainingStep('Training model... This may take a few minutes.');
          }
          
          // Stop polling if completed or failed
          if (response.data.status === 'COMPLETED' || response.data.status === 'FAILED') {
            clearInterval(interval);
            
            if (response.data.status === 'COMPLETED') {
              setRetrainingProgress(100);
              setRetrainingStep('Retraining completed successfully!');
              setTimeout(() => {
                setSuccess('Model retraining completed successfully! The page will now show only new actions.');
                setIsRetraining(false);
                setRetrainingProgress(0);
                setRetrainingStep('');
                loadAnnotations(); // This will now show only new actions (page may be empty)
              }, 1500);
            } else if (response.data.status === 'FAILED') {
              setError(`Model retraining failed: ${response.data.errorMessage || 'Unknown error'}`);
              setIsRetraining(false);
              setRetrainingProgress(0);
              setRetrainingStep('');
            }
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
        // Don't stop polling on network errors
      }
    }, 5000); // Poll every 5 seconds

    // Cleanup after 10 minutes
    setTimeout(() => clearInterval(interval), 600000);
  };

  const handleExportCSV = () => {
    try {
      // Flatten all actions from all inspection groups
      const allActions = [];
      
      inspectionGroups.forEach(group => {
        group.actions.forEach(action => {
          allActions.push({
            'Inspection ID': group.inspectionId,
            'Transformer ID': group.transformerId,
            'Transformer Name': group.transformerName,
            'Anomaly ID': action.anomalyId,
            'Action Type': action.actionType || action.action,
            'Username': action.username || action.modifiedBy,
            'Timestamp': formatDate(action.actionTimestamp || action.timestamp),
            'Fault Type (Before)': action.previousClassification?.faultType || '',
            'Confidence (Before)': action.previousClassification?.confidence 
              ? (action.previousClassification.confidence * 100).toFixed(1) + '%' 
              : '',
            'BBox (Before)': action.previousBbox 
              ? `[${action.previousBbox.x},${action.previousBbox.y},${action.previousBbox.width}×${action.previousBbox.height}]`
              : '',
            'Fault Type (After)': action.newClassification?.faultType || '',
            'Confidence (After)': action.newClassification?.confidence 
              ? (action.newClassification.confidence * 100).toFixed(1) + '%' 
              : '',
            'BBox (After)': action.newBbox 
              ? `[${action.newBbox.x},${action.newBbox.y},${action.newBbox.width}×${action.newBbox.height}]`
              : '',
            'Comment': action.comment || ''
          });
        });
      });

      // Convert to CSV
      const headers = [
        'Inspection ID', 'Transformer ID', 'Transformer Name', 'Anomaly ID', 
        'Action Type', 'Username', 'Timestamp', 
        'Fault Type (Before)', 'Confidence (Before)', 'BBox (Before)',
        'Fault Type (After)', 'Confidence (After)', 'BBox (After)', 'Comment'
      ];
      
      const csvContent = [
        headers.join(','),
        ...allActions.map(action => 
          headers.map(header => {
            const value = action[header] || '';
            // Escape commas and quotes in CSV
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.setAttribute('href', url);
      link.setAttribute('download', `annotation_history_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess(`Exported ${allActions.length} annotation actions to CSV`);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export CSV file');
    }
  };

  const handleExportExcel = () => {
    try {
      // Prepare data for Excel with multiple sheets
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Summary Statistics
      const summaryData = [
        ['Annotation History Summary'],
        ['Generated:', new Date().toLocaleString()],
        [],
        ['Statistics'],
        ['Total Actions:', stats.total],
        ['Total Inspections:', stats.inspections],
        ['Created:', stats.added],
        ['Edited:', stats.edited],
        ['Deleted:', stats.deleted],
        [],
        ['Breakdown by Inspection'],
        ['Inspection ID', 'Transformer ID', 'Transformer', 'Total Actions', 'Created', 'Edited', 'Deleted', 'Approved', 'Rejected', 'Commented']
      ];
      
      inspectionGroups.forEach(group => {
        summaryData.push([
          group.inspectionId,
          group.transformerId,
          group.transformerName,
          group.actions.length,
          group.stats.created,
          group.stats.edited,
          group.stats.deleted,
          group.stats.approved,
          group.stats.rejected,
          group.stats.commented
        ]);
      });
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Set column widths for summary sheet
      summarySheet['!cols'] = [
        { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, 
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, 
        { wch: 10 }, { wch: 10 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Sheet 2: Detailed Actions
      const allActions = [];
      
      inspectionGroups.forEach(group => {
        group.actions.forEach(action => {
          allActions.push({
            'Inspection ID': group.inspectionId,
            'Transformer ID': group.transformerId,
            'Transformer Name': group.transformerName,
            'Anomaly ID': action.anomalyId,
            'Action Type': action.actionType || action.action,
            'Username': action.username || action.modifiedBy,
            'Timestamp': formatDate(action.actionTimestamp || action.timestamp),
            'Fault Type (Before)': action.previousClassification?.faultType || '',
            'Confidence (Before)': action.previousClassification?.confidence 
              ? (action.previousClassification.confidence * 100).toFixed(1) + '%' 
              : '',
            'BBox X (Before)': action.previousBbox?.x || '',
            'BBox Y (Before)': action.previousBbox?.y || '',
            'BBox Width (Before)': action.previousBbox?.width || '',
            'BBox Height (Before)': action.previousBbox?.height || '',
            'Fault Type (After)': action.newClassification?.faultType || '',
            'Confidence (After)': action.newClassification?.confidence 
              ? (action.newClassification.confidence * 100).toFixed(1) + '%' 
              : '',
            'BBox X (After)': action.newBbox?.x || '',
            'BBox Y (After)': action.newBbox?.y || '',
            'BBox Width (After)': action.newBbox?.width || '',
            'BBox Height (After)': action.newBbox?.height || '',
            'Comment': action.comment || ''
          });
        });
      });

      const detailsSheet = XLSX.utils.json_to_sheet(allActions);
      
      // Set column widths for details sheet
      detailsSheet['!cols'] = [
        { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, 
        { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
        { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, 
        { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, detailsSheet, 'All Actions');
      
      // Sheet 3: Actions by Type
      const actionsByType = {
        'CREATED': [],
        'EDITED': [],
        'DELETED': [],
        'APPROVED': [],
        'REJECTED': [],
        'COMMENTED': []
      };
      
      allActions.forEach(action => {
        const type = action['Action Type'];
        if (actionsByType[type]) {
          actionsByType[type].push(action);
        }
      });
      
      Object.keys(actionsByType).forEach(type => {
        if (actionsByType[type].length > 0) {
          const typeSheet = XLSX.utils.json_to_sheet(actionsByType[type]);
          typeSheet['!cols'] = detailsSheet['!cols']; // Same column widths
          XLSX.utils.book_append_sheet(workbook, typeSheet, type);
        }
      });
      
      // Generate and download file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `annotation_history_${timestamp}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      
      setSuccess(`Exported ${allActions.length} annotation actions to Excel with ${Object.keys(actionsByType).filter(k => actionsByType[k].length > 0).length + 2} sheets`);
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setError('Failed to export Excel file');
    }
  };

  const handleExportJSON = () => {
    try {
      // Create a comprehensive JSON structure
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: 'Annotation History System',
          totalActions: stats.total,
          totalInspections: stats.inspections,
          version: '1.0'
        },
        summary: {
          statistics: {
            total: stats.total,
            created: stats.added,
            edited: stats.edited,
            deleted: stats.deleted,
            inspections: stats.inspections
          },
          inspectionBreakdown: inspectionGroups.map(group => ({
            inspectionId: group.inspectionId,
            transformerId: group.transformerId,
            transformerName: group.transformerName,
            totalActions: group.actions.length,
            actionCounts: {
              created: group.stats.created,
              edited: group.stats.edited,
              deleted: group.stats.deleted,
              approved: group.stats.approved,
              rejected: group.stats.rejected,
              commented: group.stats.commented
            },
            lastActivity: group.actions[0]?.actionTimestamp || group.actions[0]?.timestamp
          }))
        },
        inspections: inspectionGroups.map(group => ({
          inspectionId: group.inspectionId,
          transformerId: group.transformerId,
          transformerName: group.transformerName,
          actions: group.actions.map(action => ({
            id: action.id,
            anomalyId: action.anomalyId,
            actionType: action.actionType || action.action,
            username: action.username || action.modifiedBy,
            timestamp: action.actionTimestamp || action.timestamp,
            before: {
              classification: action.previousClassification ? {
                faultType: action.previousClassification.faultType,
                confidence: action.previousClassification.confidence,
                classId: action.previousClassification.classId
              } : null,
              boundingBox: action.previousBbox ? {
                x: action.previousBbox.x,
                y: action.previousBbox.y,
                width: action.previousBbox.width,
                height: action.previousBbox.height
              } : null
            },
            after: {
              classification: action.newClassification ? {
                faultType: action.newClassification.faultType,
                confidence: action.newClassification.confidence,
                classId: action.newClassification.classId
              } : null,
              boundingBox: action.newBbox ? {
                x: action.newBbox.x,
                y: action.newBbox.y,
                width: action.newBbox.width,
                height: action.newBbox.height
              } : null
            },
            comment: action.comment || null
          }))
        })),
        actionsByType: {
          created: [],
          edited: [],
          deleted: [],
          approved: [],
          rejected: [],
          commented: []
        }
      };

      // Populate actions by type
      inspectionGroups.forEach(group => {
        group.actions.forEach(action => {
          const actionType = (action.actionType || action.action).toLowerCase();
          const actionData = {
            inspectionId: group.inspectionId,
            transformerId: group.transformerId,
            transformerName: group.transformerName,
            anomalyId: action.anomalyId,
            username: action.username || action.modifiedBy,
            timestamp: action.actionTimestamp || action.timestamp,
            before: {
              classification: action.previousClassification,
              boundingBox: action.previousBbox
            },
            after: {
              classification: action.newClassification,
              boundingBox: action.newBbox
            },
            comment: action.comment
          };

          if (exportData.actionsByType[actionType]) {
            exportData.actionsByType[actionType].push(actionData);
          }
        });
      });

      // Convert to pretty-printed JSON (2-space indentation)
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create and download file
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.setAttribute('href', url);
      link.setAttribute('download', `annotation_history_${timestamp}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess(`Exported ${stats.total} annotation actions to formatted JSON`);
    } catch (err) {
      console.error('Error exporting JSON:', err);
      setError('Failed to export JSON file');
    }
  };

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'CREATED': return 'badge-created';
      case 'EDITED': return 'badge-edited';
      case 'DELETED': return 'badge-deleted';
      case 'COMMENTED': return 'badge-commented';
      case 'APPROVED': return 'badge-approved';
      case 'REJECTED': return 'badge-rejected';
      default: return 'badge-default';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATED': return '➕';
      case 'EDITED': return '✏';
      case 'DELETED': return '🗑';
      case 'COMMENTED': return '💬';
      case 'APPROVED': return '✅';
      case 'REJECTED': return '❌';
      default: return '📝';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  if (loading && inspectionGroups.length === 0) {
    return (
      <div className="retraining-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading annotation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="retraining-container">
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={cancelRetraining}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">⚠️</div>
            <h2>Start Model Retraining?</h2>
            <p className="modal-message">
              This will start the model retraining process using all the annotation data below. 
              The process may take several minutes to complete.
            </p>
            <div className="modal-info">
              <div className="info-item">
                <span className="info-label">Total Actions:</span>
                <span className="info-value">{stats.total}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Inspections:</span>
                <span className="info-value">{stats.inspections}</span>
              </div>
            </div>
            <p className="modal-warning">
              ⏱️ Please do not close this window during the retraining process.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={cancelRetraining}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={confirmRetraining}>
                 Start Retraining
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retraining Loading Overlay */}
      {isRetraining && (
        <div className="retraining-overlay">
          <div className="retraining-modal">
            <div className="retraining-spinner">
              <div className="spinner-large"></div>
            </div>
            <h2> Model Retraining in Progress</h2>
            <p className="retraining-message">{retrainingStep}</p>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${retrainingProgress}%` }}>
                <span className="progress-text">{retrainingProgress}%</span>
              </div>
            </div>
            <p className="retraining-hint">
              ☕ This process may take several minutes. Please don't close this window.
            </p>
          </div>
        </div>
      )}

      <div className="retraining-header">
        <h1>🧠 {isAdmin ? 'Model Retraining' : 'Annotation History'}</h1>
        <p className="subtitle">
          {isAdmin 
            ? 'Manage anomaly annotations and retrain the detection model' 
            : 'View annotation history and user feedback on anomaly detections'}
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="alert alert-error">
          <span>❌</span>
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>✅</span>
          <p>{success}</p>
        </div>
      )}

      {/* Retraining Status - Admin only */}
      {isAdmin && retrainingStatus && (
        <div className={`status-banner status-${retrainingStatus.toLowerCase()}`}>
          <h3>Current Status: {retrainingStatus}</h3>
          {retrainingStatus === 'RUNNING' && (
            <div className="status-progress">
              <div className="spinner-small"></div>
              <span>Retraining in progress...</span>
            </div>
          )}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Actions</p>
          </div>
        </div>
        <div className="stat-card stat-inspections">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.inspections}</h3>
            <p>Inspections</p>
          </div>
        </div>
        <div className="stat-card stat-added">
          <div className="stat-icon">➕</div>
          <div className="stat-content">
            <h3>{stats.added}</h3>
            <p>Created</p>
          </div>
        </div>
        <div className="stat-card stat-edited">
          <div className="stat-icon">✏</div>
          <div className="stat-content">
            <h3>{stats.edited}</h3>
            <p>Edited</p>
          </div>
        </div>
        <div className="stat-card stat-deleted">
          <div className="stat-icon">🗑</div>
          <div className="stat-content">
            <h3>{stats.deleted}</h3>
            <p>Deleted</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-section">
        {isAdmin && (
          <button
            onClick={handleStartRetraining}
            disabled={loading || retrainingStatus === 'RUNNING' || stats.total === 0}
            className="btn-primary btn-retrain"
          >
            {retrainingStatus === 'RUNNING' ? '⏳ Retraining...' : ' Start Retraining'}
          </button>
        )}
        <button
          onClick={loadAnnotations}
          disabled={loading}
          className="btn-secondary"
        >
          🔄 Refresh Data
        </button>
        <button
          onClick={handleExportCSV}
          disabled={loading || inspectionGroups.length === 0}
          className="btn-secondary"
        >
          📥 Export CSV
        </button>
        <button
          onClick={handleExportExcel}
          disabled={loading || inspectionGroups.length === 0}
          className="btn-secondary"
        >
          📊 Export Excel
        </button>
        <button
          onClick={handleExportJSON}
          disabled={loading || inspectionGroups.length === 0}
          className="btn-secondary"
        >
          📄 Export JSON
        </button>
      </div>

      {/* Inspection Groups - Annotation History */}
      <div className="annotations-section">
        <div className="section-header">
          <h2>📋 Annotation History by Inspection</h2>
          {inspectionGroups.length > 0 && (
            <div className="expand-controls">
              <button onClick={expandAll} className="btn-text">Expand All</button>
              <span className="separator">|</span>
              <button onClick={collapseAll} className="btn-text">Collapse All</button>
            </div>
          )}
        </div>
        
        {inspectionGroups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>No annotations found. Annotations are created when users add, edit, or delete anomalies during inspections.</p>
          </div>
        ) : (
          <div className="inspection-groups">
            {inspectionGroups.map((group) => (
              <div key={group.inspectionId} className="inspection-card">
                {/* Inspection Header */}
                <div 
                  className="inspection-header"
                  onClick={() => toggleInspection(group.inspectionId)}
                >
                  <div className="inspection-info">
                    <div className="inspection-title">
                      <span className="expand-icon">
                        {expandedInspections.has(group.inspectionId) ? '▼' : '▶'}
                      </span>
                      <h3>Inspection #{group.inspectionId}</h3>
                      <span className="transformer-tag">
                        {group.transformerId} - {group.transformerName}
                      </span>
                    </div>
                    <div className="inspection-stats">
                      {group.stats.created > 0 && (
                        <span className="stat-badge stat-created">
                          ➕ {group.stats.created} Created
                        </span>
                      )}
                      {group.stats.edited > 0 && (
                        <span className="stat-badge stat-edited">
                          ✏ {group.stats.edited} Edited
                        </span>
                      )}
                      {group.stats.deleted > 0 && (
                        <span className="stat-badge stat-deleted">
                          🗑 {group.stats.deleted} Deleted
                        </span>
                      )}
                      {group.stats.approved > 0 && (
                        <span className="stat-badge stat-approved">
                          ✅ {group.stats.approved} Approved
                        </span>
                      )}
                      {group.stats.rejected > 0 && (
                        <span className="stat-badge stat-rejected">
                          ❌ {group.stats.rejected} Rejected
                        </span>
                      )}
                      {group.stats.commented > 0 && (
                        <span className="stat-badge stat-commented">
                          💬 {group.stats.commented} Comments
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="action-count">
                    {group.actions.length} {group.actions.length === 1 ? 'Action' : 'Actions'}
                  </div>
                </div>

                {/* Actions Timeline (Expandable) */}
                {expandedInspections.has(group.inspectionId) && (
                  <div className="actions-timeline">
                    {group.actions.map((action, idx) => (
                      <div key={idx} className="action-item">
                        <div className="action-header">
                          <div className="action-meta">
                            <span className={`action-badge ${getActionBadgeClass(action.actionType || action.action)}`}>
                              {getActionIcon(action.actionType || action.action)} {action.actionType || action.action}
                            </span>
                            <span className="action-user">
                              👤 {action.username || action.modifiedBy}
                            </span>
                            <span className="action-time" title={formatDate(action.actionTimestamp || action.timestamp)}>
                              ⏰ {formatRelativeTime(action.actionTimestamp || action.timestamp)}
                            </span>
                          </div>
                          <div className="anomaly-ref">
                            Anomaly #{action.anomalyId}
                          </div>
                        </div>

                        {/* Action Details */}
                        <div className="action-details">
                          {/* For EDITED actions - show before/after */}
                          {(action.actionType === 'EDITED' || action.action === 'EDITED') && (
                            <div className="edit-comparison">
                              {(action.previousBbox || action.previousClassification) && (
                                <div className="comparison-section before">
                                  <strong>Before:</strong>
                                  {action.previousClassification && (
                                    <div className="classification-info">
                                      <span>Type: {action.previousClassification.faultType || 'N/A'}</span>
                                      {action.previousClassification.confidence && (
                                        <span>Confidence: {(action.previousClassification.confidence * 100).toFixed(1)}%</span>
                                      )}
                                    </div>
                                  )}
                                  {action.previousBbox && (
                                    <div className="bbox-info">
                                      BBox: [{action.previousBbox.x}, {action.previousBbox.y}, 
                                      {action.previousBbox.width}×{action.previousBbox.height}]
                                    </div>
                                  )}
                                </div>
                              )}
                              {(action.newBbox || action.newClassification) && (
                                <div className="comparison-section after">
                                  <strong>After:</strong>
                                  {action.newClassification && (
                                    <div className="classification-info">
                                      <span>Type: {action.newClassification.faultType || 'N/A'}</span>
                                      {action.newClassification.confidence && (
                                        <span>Confidence: {(action.newClassification.confidence * 100).toFixed(1)}%</span>
                                      )}
                                    </div>
                                  )}
                                  {action.newBbox && (
                                    <div className="bbox-info">
                                      BBox: [{action.newBbox.x}, {action.newBbox.y}, 
                                      {action.newBbox.width}×{action.newBbox.height}]
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* For DELETED actions - show what was deleted */}
                          {(action.actionType === 'DELETED' || action.action === 'DELETED') && action.previousClassification && (
                            <div className="deleted-info">
                              <strong>Deleted:</strong> {action.previousClassification.faultType}
                              {action.previousClassification.confidence && (
                                <span> (Confidence: {(action.previousClassification.confidence * 100).toFixed(1)}%)</span>
                              )}
                            </div>
                          )}

                          {/* For CREATED actions - show what was added */}
                          {(action.actionType === 'CREATED' || action.action === 'CREATED') && action.newClassification && (
                            <div className="created-info">
                              <strong>Added:</strong> {action.newClassification.faultType}
                              {action.newClassification.confidence && (
                                <span> (Confidence: {(action.newClassification.confidence * 100).toFixed(1)}%)</span>
                              )}
                            </div>
                          )}

                          {/* Comment */}
                          {action.comment && (
                            <div className="action-comment">
                              <strong>💬 Comment:</strong> {action.comment}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}