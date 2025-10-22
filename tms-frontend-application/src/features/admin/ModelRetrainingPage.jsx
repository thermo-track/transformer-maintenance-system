import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../config/api';
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

  // Check if user is admin (for hiding retrain button)
  const isAdmin = hasRole('ROLE_ADMIN');

  // Load annotations and stats
  useEffect(() => {
    loadAnnotations();
    checkRetrainingStatus();
  }, []);

  const loadAnnotations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use different endpoint based on user role
      const endpoint = isAdmin 
        ? '/api/admin/retraining/annotations'
        : '/api/annotations/history';
      
      const response = await apiClient.get(endpoint);
      
      if (response.data.success) {
        const grouped = groupByInspection(response.data.annotations || []);
        setInspectionGroups(grouped);
        calculateStats(response.data.annotations || [], grouped.length);
      } else {
        setError(response.data.message || 'Failed to load annotations');
      }
    } catch (err) {
      console.error('Error loading annotations:', err);
      setError(err.response?.data?.message || 'Failed to load annotation data');
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
    if (!window.confirm('Are you sure you want to start model retraining? This may take several minutes.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await apiClient.post('/api/admin/model/retrain');
      
      if (response.data.success) {
        setSuccess('Model retraining started successfully! You will be notified when it completes.');
        setRetrainingStatus('RUNNING');
        // Poll for status updates
        pollRetrainingStatus();
      } else {
        setError(response.data.message || 'Failed to start retraining');
      }
    } catch (err) {
      console.error('Error starting retraining:', err);
      setError(err.response?.data?.message || 'Failed to start model retraining');
    } finally {
      setLoading(false);
    }
  };

  const pollRetrainingStatus = () => {
    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get('/api/admin/model/retraining/status');
        if (response.data.success) {
          setRetrainingStatus(response.data.status);
          
          // Stop polling if completed or failed
          if (response.data.status !== 'RUNNING') {
            clearInterval(interval);
            if (response.data.status === 'COMPLETED') {
              setSuccess('Model retraining completed successfully!');
              loadAnnotations(); // Refresh data
            } else if (response.data.status === 'FAILED') {
              setError('Model retraining failed. Please check logs.');
            }
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
        clearInterval(interval);
      }
    }, 5000); // Poll every 5 seconds

    // Cleanup after 10 minutes
    setTimeout(() => clearInterval(interval), 600000);
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
      case 'EDITED': return '✏️';
      case 'DELETED': return '🗑️';
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
          <div className="stat-icon">✏️</div>
          <div className="stat-content">
            <h3>{stats.edited}</h3>
            <p>Edited</p>
          </div>
        </div>
        <div className="stat-card stat-deleted">
          <div className="stat-icon">🗑️</div>
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
            {retrainingStatus === 'RUNNING' ? '⏳ Retraining...' : '🚀 Start Retraining'}
          </button>
        )}
        <button
          onClick={loadAnnotations}
          disabled={loading}
          className="btn-secondary"
        >
          🔄 Refresh Data
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
                          ✏️ {group.stats.edited} Edited
                        </span>
                      )}
                      {group.stats.deleted > 0 && (
                        <span className="stat-badge stat-deleted">
                          🗑️ {group.stats.deleted} Deleted
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
