import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../config/api';
import './ModelRetraining.css';

/**
 * Model Retraining Page - Admin only
 * Displays anomaly annotations and allows triggering model retraining
 */
export default function ModelRetrainingPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [retrainingStatus, setRetrainingStatus] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    added: 0,
    edited: 0,
    deleted: 0
  });

  // Redirect if not admin
  useEffect(() => {
    if (!hasRole('ROLE_ADMIN')) {
      navigate('/transformers');
    }
  }, [hasRole, navigate]);

  // Load annotations and stats
  useEffect(() => {
    loadAnnotations();
    checkRetrainingStatus();
  }, []);

  const loadAnnotations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/api/admin/model/annotations');
      
      if (response.data.success) {
        setAnnotations(response.data.annotations || []);
        calculateStats(response.data.annotations || []);
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

  const checkRetrainingStatus = async () => {
    try {
      const response = await apiClient.get('/api/admin/model/retraining/status');
      if (response.data.success) {
        setRetrainingStatus(response.data.status);
      }
    } catch (err) {
      console.error('Error checking retraining status:', err);
    }
  };

  const calculateStats = (data) => {
    const stats = {
      total: data.length,
      added: data.filter(a => a.action === 'ADDED').length,
      edited: data.filter(a => a.action === 'EDITED').length,
      deleted: data.filter(a => a.action === 'DELETED').length
    };
    setStats(stats);
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
      case 'ADDED': return 'badge-added';
      case 'EDITED': return 'badge-edited';
      case 'DELETED': return 'badge-deleted';
      default: return 'badge-default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading && annotations.length === 0) {
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
        <h1>🧠 Model Retraining</h1>
        <p className="subtitle">Manage anomaly annotations and retrain the detection model</p>
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

      {/* Retraining Status */}
      {retrainingStatus && (
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
            <p>Total Annotations</p>
          </div>
        </div>
        <div className="stat-card stat-added">
          <div className="stat-icon">➕</div>
          <div className="stat-content">
            <h3>{stats.added}</h3>
            <p>Added</p>
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
        <button
          onClick={handleStartRetraining}
          disabled={loading || retrainingStatus === 'RUNNING' || stats.total === 0}
          className="btn-primary btn-retrain"
        >
          {retrainingStatus === 'RUNNING' ? '⏳ Retraining...' : '🚀 Start Retraining'}
        </button>
        <button
          onClick={loadAnnotations}
          disabled={loading}
          className="btn-secondary"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Annotations Table */}
      <div className="annotations-section">
        <h2>Annotation History</h2>
        
        {annotations.length === 0 ? (
          <div className="empty-state">
            <p>📝 No annotations found. Annotations are created when users add, edit, or delete anomalies during inspections.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="annotations-table">
              <thead>
                <tr>
                  <th>Inspection ID</th>
                  <th>Anomaly ID</th>
                  <th>Action</th>
                  <th>Modified By</th>
                  <th>Timestamp</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {annotations.map((annotation, index) => (
                  <tr key={index}>
                    <td>{annotation.inspectionId}</td>
                    <td className="anomaly-id">{annotation.anomalyId?.substring(0, 8)}...</td>
                    <td>
                      <span className={`action-badge ${getActionBadgeClass(annotation.action)}`}>
                        {annotation.action}
                      </span>
                    </td>
                    <td>{annotation.modifiedBy}</td>
                    <td>{formatDate(annotation.timestamp)}</td>
                    <td className="details-cell">
                      {annotation.oldValue && (
                        <div><strong>Old:</strong> {annotation.oldValue}</div>
                      )}
                      {annotation.newValue && (
                        <div><strong>New:</strong> {annotation.newValue}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
