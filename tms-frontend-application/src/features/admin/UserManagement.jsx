import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import authFetch from '../../lib/authFetch';
import './UserManagement.css';

const UserManagement = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    fetchRoleChangeRequests();
  }, [filter]);

  const fetchRoleChangeRequests = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'pending' 
        ? '/api/role-change-requests/pending'
        : '/api/role-change-requests';
      
      const response = await authFetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch requests');
      
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching role change requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId, status) => {
    try {
      const response = await authFetch(`/api/role-change-requests/${requestId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          reviewComment: reviewComment.trim() || null
        })
      });

      if (!response.ok) {
        // Try to get error details
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.text();
          console.error('Review failed - Status:', response.status);
          console.error('Review failed - Response:', errorData);
          if (errorData) {
            try {
              const jsonError = JSON.parse(errorData);
              errorMessage = jsonError.message || jsonError.error || errorMessage;
            } catch {
              errorMessage = errorData;
            }
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      alert(`Request ${status.toLowerCase()} successfully!`);
      setReviewingRequest(null);
      setReviewComment('');
      fetchRoleChangeRequests();
    } catch (error) {
      console.error('Error reviewing request:', error);
      alert(`Failed to review request: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'APPROVED': return 'badge-approved';
      case 'REJECTED': return 'badge-rejected';
      default: return '';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ROLE_USER': return 'User';
      case 'ROLE_MAINTENANCE_ENGINEER': return 'Maintenance Engineer';
      case 'ROLE_ADMIN': return 'Admin';
      default: return role;
    }
  };

  if (!user || user.role !== 'ROLE_ADMIN') {
    return (
      <div className="user-management-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Review and manage role change requests</p>
      </div>

      <div className="user-mgmt-filters">
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending Requests
        </button>
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Requests
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <p>No role change requests found.</p>
        </div>
      ) : (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>User</th>
                <th>Email</th>
                <th>Department</th>
                <th>Current Role</th>
                <th>Requested Role</th>
                <th>Reason</th>
                <th>Requested Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>
                    <div className="user-cell">
                      <strong>{request.username}</strong>
                      {request.fullName && <div className="user-fullname">{request.fullName}</div>}
                    </div>
                  </td>
                  <td>{request.email}</td>
                  <td>{request.department || 'N/A'}</td>
                  <td>
                    <span className="role-badge current-role">
                      {getRoleDisplayName(request.currentRole)}
                    </span>
                  </td>
                  <td>
                    <span className="role-badge requested-role">
                      {getRoleDisplayName(request.requestedRole)}
                    </span>
                  </td>
                  <td>
                    <div className="reason-cell">{request.reason || 'No reason provided'}</div>
                  </td>
                  <td>{formatDate(request.requestedAt)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                      {request.status}
                    </span>
                    {request.reviewedAt && (
                      <div className="review-info">
                        <small>by {request.reviewedByUsername}</small>
                        <small>{formatDate(request.reviewedAt)}</small>
                      </div>
                    )}
                  </td>
                  <td>
                    {request.status === 'PENDING' ? (
                      <div className="action-buttons">
                        <button
                          className="btn-approve"
                          onClick={() => setReviewingRequest(request)}
                        >
                          Review
                        </button>
                      </div>
                    ) : (
                      <div className="completed-action">
                        {request.reviewComment && (
                          <div className="review-comment-preview" title={request.reviewComment}>
                            💬 Comment
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {reviewingRequest && (
        <div className="modal-overlay" onClick={() => setReviewingRequest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Role Change Request</h2>
              <button className="close-btn" onClick={() => setReviewingRequest(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="request-details">
                <div className="detail-row">
                  <span className="detail-label">User:</span>
                  <span className="detail-value">{reviewingRequest.username} ({reviewingRequest.fullName})</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Current Role:</span>
                  <span className="detail-value">{getRoleDisplayName(reviewingRequest.currentRole)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Requested Role:</span>
                  <span className="detail-value requested-role-highlight">
                    {getRoleDisplayName(reviewingRequest.requestedRole)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Reason:</span>
                  <span className="detail-value">{reviewingRequest.reason || 'No reason provided'}</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reviewComment">Review Comment (Optional)</label>
                <textarea
                  id="reviewComment"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Add a comment about your decision..."
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-modal-approve"
                onClick={() => handleReview(reviewingRequest.id, 'APPROVED')}
              >
                ✓ Approve
              </button>
              <button
                className="btn-modal-reject"
                onClick={() => handleReview(reviewingRequest.id, 'REJECTED')}
              >
                ✗ Reject
              </button>
              <button
                className="btn-modal-cancel"
                onClick={() => setReviewingRequest(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
