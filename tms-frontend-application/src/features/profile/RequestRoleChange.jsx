import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authFetch from '../../lib/authFetch';
import './RequestRoleChange.css';

const RequestRoleChange = () => {
  const navigate = useNavigate();
  const { user, refreshUser, roleChangeNotification, clearRoleChangeNotification } = useAuth();
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [reason, setReason] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'ROLE_USER': return 'User';
      case 'ROLE_MAINTENANCE_ENGINEER': return 'Maintenance Engineer';
      case 'ROLE_SENIOR_ENGINEER': return 'Senior Engineer';
      case 'ROLE_TEAM_LEAD': return 'Team Lead';
      case 'ROLE_SUPERVISOR': return 'Supervisor';
      case 'ROLE_ADMIN': return 'Administrator';
      default: return role;
    }
  };

  // Redirect admins to user management page
  useEffect(() => {
    if (user?.role === 'ROLE_ADMIN') {
      navigate('/admin/user-management', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    // Define available roles for upgrade (excluding current role and admin)
    const roles = [
      { value: 'ROLE_MAINTENANCE_ENGINEER', label: 'Maintenance Engineer' },
      { value: 'ROLE_SENIOR_ENGINEER', label: 'Senior Engineer' },
      { value: 'ROLE_TEAM_LEAD', label: 'Team Lead' },
      { value: 'ROLE_SUPERVISOR', label: 'Supervisor' }
    ];
    
    // Filter out user's current role and admin role
    const filteredRoles = roles.filter(r => r.value !== user?.role);
    setAvailableRoles(filteredRoles);
    
    // Load user's previous requests
    loadMyRequests();
  }, [user]);

  // Show notification when role changes
  useEffect(() => {
    if (roleChangeNotification) {
      setShowNotification(true);
      loadMyRequests(); // Refresh requests when role changes
      
      // Auto-hide notification after 10 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
        setTimeout(() => clearRoleChangeNotification(), 500); // Clear after fade out
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [roleChangeNotification]);

  const loadMyRequests = async () => {
    try {
      const response = await authFetch('/api/role-change-requests/my-requests');
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setMyRequests(data);
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRole || !reason.trim()) {
      setError('Please select a role and provide a reason');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authFetch('/api/role-change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedRole: selectedRole,
          reason: reason.trim()
        })
      });

      if (!response.ok) throw new Error('Failed to submit request');

      setSuccess('Role change request submitted successfully! An administrator will review your request.');
      setSelectedRole('');
      setReason('');
      loadMyRequests(); // Reload requests
    } catch (err) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) {
      return;
    }

    try {
      const response = await authFetch(`/api/role-change-requests/${requestId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to cancel request');
      setSuccess('Request cancelled successfully');
      loadMyRequests();
    } catch (err) {
      setError(err.message || 'Failed to cancel request');
    }
  };

  const handleRefreshRole = async () => {
    setRefreshing(true);
    setError(null);
    setSuccess(null);
    try {
      console.log('[RequestRoleChange] Refreshing user role...');
      const result = await refreshUser();
      console.log('[RequestRoleChange] Refresh result:', result);
      
      if (result && result.success) {
        setSuccess('Role information updated!');
        // Reload requests to reflect any changes
        await loadMyRequests();
        
        // Force re-render by updating available roles
        const roles = [
          { value: 'ROLE_MAINTENANCE_ENGINEER', label: 'Maintenance Engineer' }
        ];
        const filteredRoles = roles.filter(r => r.value !== result.user?.role);
        setAvailableRoles(filteredRoles);
      } else {
        setError(result?.error || 'Failed to refresh role information');
      }
    } catch (err) {
      console.error('[RequestRoleChange] Refresh error:', err);
      setError('Failed to refresh role information: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDismissNotification = () => {
    setShowNotification(false);
    setTimeout(() => clearRoleChangeNotification(), 500); // Clear after fade out
  };

  const getStatusBadgeClass = (status) => {
    switch(status.toUpperCase()) {
      case 'PENDING': return 'badge-pending';
      case 'APPROVED': return 'badge-approved';
      case 'REJECTED': return 'badge-rejected';
      default: return '';
    }
  };

  return (
    <div className="request-role-change-container">
      <div className="page-header">
        <h1>Request Role Change</h1>
        <p>Request additional permissions by applying for a new role</p>
      </div>

      {/* Role Change Notification */}
      {showNotification && roleChangeNotification && (
        <div className="role-change-notification">
          <div className="notification-icon">🎉</div>
          <div className="notification-content">
            <h3>Your Role Has Been Updated!</h3>
            <p>
              An administrator has changed your role from{' '}
              <strong className="old-role">{getRoleDisplayName(roleChangeNotification.oldRole)}</strong>
              {' '}to{' '}
              <strong className="new-role">{getRoleDisplayName(roleChangeNotification.newRole)}</strong>
            </p>
            <p className="notification-subtext">
              You now have access to features associated with your new role.
            </p>
          </div>
          <button className="notification-close" onClick={handleDismissNotification}>
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess(null)} className="alert-close">×</button>
        </div>
      )}

      <div className="content-grid">
        {/* Request Form */}
        <div className="card request-form-card">
          <h2>Submit New Request</h2>
          
          <div className="current-role-info">
            <span className="label">Your Current Role:</span>
            <span className="role-badge current-role">{getRoleDisplayName(user?.role)}</span>
            <button 
              type="button"
              onClick={handleRefreshRole} 
              disabled={refreshing}
              className="refresh-button"
              title="Refresh role information"
            >
              {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="requestedRole">
                Role You Want to Request <span className="required">*</span>
              </label>
              <select
                id="requestedRole"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={loading || availableRoles.length === 0}
                required
              >
                <option value="">-- Select a role --</option>
                {availableRoles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {availableRoles.length === 0 && (
                <p className="form-help">No additional roles available to request</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="reason">
                Reason for Request <span className="required">*</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why you need this role and how you plan to use it..."
                rows="6"
                disabled={loading}
                required
              />
              <p className="form-help">
                Provide a detailed explanation to help administrators review your request
              </p>
            </div>

            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading || availableRoles.length === 0}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* My Requests */}
        <div className="card my-requests-card">
          <h2>My Requests</h2>
          
          {myRequests.length === 0 ? (
            <div className="empty-state">
              <p>You haven't submitted any role change requests yet.</p>
            </div>
          ) : (
            <div className="requests-list">
              {myRequests.map(request => (
                <div key={request.id} className="request-item">
                  <div className="request-header">
                    <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                      {request.status}
                    </span>
                    <span className="request-date">
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="request-body">
                    <div className="request-info-row">
                      <span className="info-label">Requested Role:</span>
                      <span className="info-value requested-role">
                        {getRoleDisplayName(request.requestedRole)}
                      </span>
                    </div>
                    
                    <div className="request-info-row">
                      <span className="info-label">Reason:</span>
                      <span className="info-value">{request.reason}</span>
                    </div>
                    
                    {request.reviewedAt && (
                      <>
                        <div className="request-info-row">
                          <span className="info-label">Reviewed By:</span>
                          <span className="info-value">{request.reviewedByUsername || 'N/A'}</span>
                        </div>
                        <div className="request-info-row">
                          <span className="info-label">Reviewed On:</span>
                          <span className="info-value">
                            {new Date(request.reviewedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {request.reviewComment && (
                          <div className="request-info-row">
                            <span className="info-label">Admin Comment:</span>
                            <span className="info-value review-comment">
                              {request.reviewComment}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {request.status === 'PENDING' && (
                    <div className="request-footer">
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="btn-cancel-request"
                      >
                        Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestRoleChange;
