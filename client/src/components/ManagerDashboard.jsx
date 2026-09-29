import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { api } from '../api';
import LeaveRequestTable from './LeaveRequestTable';

export default function ManagerDashboard({
  requests,
  onRefresh,
  showToast,
  manager
}) {
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    requestId: null,
    action: null, // 'approve' or 'reject'
    comment: '',
    employeeName: '',
    workingDays: 0,
    leaveType: ''
  });

  const pendingRequests = requests.filter((r) => r.status === 'Pending');
  const approvedRequests = requests.filter((r) => r.status === 'Approved');
  const rejectedRequests = requests.filter((r) => r.status === 'Rejected');

  const openReviewModal = (req, action) => {
    setCommentModal({
      isOpen: true,
      requestId: req._id,
      action,
      comment: action === 'approve' ? 'Approved' : 'Rejected due to operational requirements',
      employeeName: req.employeeName,
      workingDays: req.workingDays,
      leaveType: req.leaveType
    });
  };

  const handleConfirmReview = async () => {
    const { requestId, action, comment } = commentModal;
    if (!requestId || !action) return;

    setActionLoadingId(requestId);
    try {
      const res = await api.reviewLeave(requestId, {
        action,
        managerComments: comment.trim(),
        managerId: manager?.employeeId || 'MGR001'
      });

      showToast(res.message || `Request ${action}d successfully.`, 'success');
      setCommentModal({ isOpen: false, requestId: null, action: null, comment: '', employeeName: '', workingDays: 0, leaveType: '' });
      onRefresh();
    } catch (err) {
      showToast(err.message || `Failed to ${action} request.`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div>
      {/* Manager Metric Overview */}
      <div className="manager-stats">
        <div className="stat-metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-metric-info">
            <h4>Pending Reviews</h4>
            <span style={{ color: '#b78103' }}>{pendingRequests.length}</span>
          </div>
          <Clock size={28} color="#f59e0b" />
        </div>

        <div className="stat-metric-card" style={{ borderLeft: '4px solid #2e7d32' }}>
          <div className="stat-metric-info">
            <h4>Approved Requests</h4>
            <span style={{ color: '#2e7d32' }}>{approvedRequests.length}</span>
          </div>
          <CheckCircle2 size={28} color="#2e7d32" />
        </div>

        <div className="stat-metric-card" style={{ borderLeft: '4px solid #c62828' }}>
          <div className="stat-metric-info">
            <h4>Rejected Requests</h4>
            <span style={{ color: '#c62828' }}>{rejectedRequests.length}</span>
          </div>
          <XCircle size={28} color="#c62828" />
        </div>

        <div className="stat-metric-card" style={{ borderLeft: '4px solid #e91e63' }}>
          <div className="stat-metric-info">
            <h4>Total Submissions</h4>
            <span style={{ color: '#c2185b' }}>{requests.length}</span>
          </div>
          <FileCheck size={28} color="#e91e63" />
        </div>
      </div>

      {/* Pending Approvals Action Table */}
      <div className="content-section" style={{ border: '1.5px solid var(--pink-border)' }}>
        <div className="section-header">
          <div className="section-title">
            <Clock size={19} color="#e91e63" />
            <span>Pending Leave Requests Requiring Action</span>
            <span className="badge badge-pending">{pendingRequests.length} awaiting review</span>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 size={36} color="#10b981" style={{ marginBottom: '0.5rem' }} />
            <p>Great job! All leave requests have been reviewed and resolved.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table" id="manager-pending-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Duration</th>
                  <th>Remaining Quota</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req) => (
                  <tr key={req._id}>
                    <td>
                      <div>
                        <strong>{req.employeeName}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {req.department} ({req.employeeId})
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${req.leaveType.toLowerCase()}`}>
                        {req.leaveType}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {req.startDate} <span style={{ color: 'var(--text-muted)' }}>to</span> {req.endDate}
                      </div>
                    </td>
                    <td>
                      <div className="days-badge">
                        <span className="days-main">{req.workingDays} working days</span>
                        <span className="days-sub">
                          {req.weekendDays} weekend days skipped
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        <strong>{req.currentBalance} days</strong> available
                      </div>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <span title={req.reason}>{req.reason}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          id={`btn-approve-${req._id}`}
                          className="btn btn-success btn-sm"
                          onClick={() => openReviewModal(req, 'approve')}
                          disabled={actionLoadingId === req._id}
                        >
                          <CheckCircle size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          id={`btn-reject-${req._id}`}
                          className="btn btn-danger btn-sm"
                          onClick={() => openReviewModal(req, 'reject')}
                          disabled={actionLoadingId === req._id}
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Comment Confirmation Modal */}
      {commentModal.isOpen && (
        <div className="modal-overlay" onClick={() => setCommentModal({ ...commentModal, isOpen: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} color="#e91e63" />
                <h2>
                  Confirm {commentModal.action === 'approve' ? 'Approval' : 'Rejection'}
                </h2>
              </div>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                You are about to{' '}
                <strong style={{ color: commentModal.action === 'approve' ? '#34d399' : '#f87171' }}>
                  {commentModal.action.toUpperCase()}
                </strong>{' '}
                the <strong>{commentModal.workingDays} working day(s)</strong> {commentModal.leaveType} leave request for{' '}
                <strong>{commentModal.employeeName}</strong>.
              </p>

              {commentModal.action === 'approve' && (
                <div className="alert-box info">
                  <CheckCircle size={16} />
                  <span>
                    Upon approval, exactly <strong>{commentModal.workingDays} day(s)</strong> will be deducted from {commentModal.employeeName}'s {commentModal.leaveType} balance.
                  </span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="manager-comment-input">
                  Manager Comments / Reason
                </label>
                <textarea
                  id="manager-comment-input"
                  className="form-textarea"
                  value={commentModal.comment}
                  onChange={(e) => setCommentModal({ ...commentModal, comment: e.target.value })}
                  placeholder="Add any instructions or remarks for the employee..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCommentModal({ ...commentModal, isOpen: false })}
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-review-action"
                className={`btn ${commentModal.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleConfirmReview}
              >
                Confirm {commentModal.action === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Leave Requests History */}
      <LeaveRequestTable
        requests={requests}
        showEmployeeCol={true}
        title="All Organization Requests & Audit Log"
      />
    </div>
  );
}
