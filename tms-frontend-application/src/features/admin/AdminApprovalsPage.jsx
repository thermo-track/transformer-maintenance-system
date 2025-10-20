import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../config/api';
import './AdminApprovals.css';

export default function AdminApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getPendingApprovals();
      
      if (response.success) {
        setApprovals(response.approvals || []);
      } else {
        setError('Failed to load pending approvals');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId) => {
    if (!window.confirm('Are you sure you want to approve this admin request?')) {
      return;
    }

    try {
      setProcessingId(approvalId);
      setError('');
      
      const response = await adminAPI.approveAdmin(approvalId);
      
      if (response.success) {
        // Remove from list
        setApprovals(approvals.filter(a => a.id !== approvalId));
        alert('Admin request approved successfully!');
      } else {
        setError(response.message || 'Failed to approve admin request');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve admin request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (approvalId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessingId(approvalId);
      setError('');
      
      const response = await adminAPI.rejectAdmin(approvalId, rejectionReason);
      
      if (response.success) {
        // Remove from list
        setApprovals(approvals.filter(a => a.id !== approvalId));
        setRejectingId(null);
        setRejectionReason('');
        alert('Admin request rejected');
      } else {
        setError(response.message || 'Failed to reject admin request');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject admin request');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="admin-approvals-container">
        <div className="admin-approvals-loading">
          <div className="spinner"></div>
          <p>Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-approvals-container">
      <div className="admin-approvals-header">
        <h1>Admin Approval Requests</h1>
        <p className="admin-approvals-subtitle">
          Review and approve or reject pending administrator access requests
        </p>
      </div>

      {error && (
        <div className="admin-approvals-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}

      {approvals.length === 0 ? (
        <div className="admin-approvals-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <polyline points="17 11 19 13 23 9"></polyline>
          </svg>
          <h3>No Pending Requests</h3>
          <p>There are no admin approval requests at the moment.</p>
        </div>
      ) : (
        <div className="admin-approvals-list">
          {approvals.map((approval) => (
            <div key={approval.id} className="admin-approval-card">
              <div className="admin-approval-header">
                <div className="admin-approval-user-info">
                  <div className="admin-approval-avatar">
                    {approval.fullName?.charAt(0).toUpperCase() || approval.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3>{approval.username}</h3>
                    <p className="admin-approval-email">{approval.email}</p>
                  </div>
                </div>
                <div className="admin-approval-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Pending
                </div>
              </div>

              <div className="admin-approval-details">
                <div className="admin-approval-detail-row">
                  <span className="admin-approval-label">Employee ID:</span>
                  <span className="admin-approval-value">{approval.employeeId}</span>
                </div>
                <div className="admin-approval-detail-row">
                  <span className="admin-approval-label">Department:</span>
                  <span className="admin-approval-value">{approval.department}</span>
                </div>
                <div className="admin-approval-detail-row">
                  <span className="admin-approval-label">Requested:</span>
                  <span className="admin-approval-value">{formatDate(approval.createdAt)}</span>
                </div>
                {approval.justification && (
                  <div className="admin-approval-justification">
                    <span className="admin-approval-label">Justification:</span>
                    <p>{approval.justification}</p>
                  </div>
                )}
              </div>

              {rejectingId === approval.id ? (
                <div className="admin-approval-reject-form">
                  <label htmlFor={`reject-reason-${approval.id}`}>Rejection Reason:</label>
                  <textarea
                    id={`reject-reason-${approval.id}`}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                    rows="3"
                    maxLength="500"
                  />
                  <div className="admin-approval-reject-actions">
                    <button
                      onClick={() => {
                        setRejectingId(null);
                        setRejectionReason('');
                      }}
                      className="admin-approval-btn admin-approval-btn-cancel"
                      disabled={processingId === approval.id}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReject(approval.id)}
                      className="admin-approval-btn admin-approval-btn-reject"
                      disabled={processingId === approval.id || !rejectionReason.trim()}
                    >
                      {processingId === approval.id ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="admin-approval-actions">
                  <button
                    onClick={() => setRejectingId(approval.id)}
                    className="admin-approval-btn admin-approval-btn-reject"
                    disabled={processingId === approval.id}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(approval.id)}
                    className="admin-approval-btn admin-approval-btn-approve"
                    disabled={processingId === approval.id}
                  >
                    {processingId === approval.id ? (
                      <>
                        <div className="btn-spinner"></div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Approve
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
