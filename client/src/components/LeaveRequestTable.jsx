import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle2, XCircle, Info, Inbox } from 'lucide-react';

export default function LeaveRequestTable({ requests, showEmployeeCol = false, title = "Leave Requests" }) {
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'All') return true;
    return r.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="badge badge-approved">
            <CheckCircle2 size={13} />
            <span>Approved</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="badge badge-rejected">
            <XCircle size={13} />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-pending">
            <Clock size={13} />
            <span>Pending</span>
          </span>
        );
    }
  };

  const getTypeBadge = (type) => {
    return (
      <span className={`badge badge-${type.toLowerCase()}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="content-section">
      <div className="section-header">
        <div className="section-title">
          <Calendar size={18} color="#6366f1" />
          <span>{title}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            ({filteredRequests.length})
          </span>
        </div>

        {/* Filter Chips */}
        <div className="filter-bar">
          {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
            <button
              key={status}
              type="button"
              className={`filter-chip ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Inbox size={42} />
          </div>
          <p>No leave requests found for filter: <strong>{statusFilter}</strong></p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table" id="leave-requests-table">
            <thead>
              <tr>
                {showEmployeeCol && <th>Employee</th>}
                <th>Type</th>
                <th>Date Range</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Manager Comments</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req._id}>
                  {showEmployeeCol && (
                    <td>
                      <div>
                        <strong>{req.employeeName || req.employeeId}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {req.department} ({req.employeeId})
                        </div>
                      </div>
                    </td>
                  )}
                  <td>{getTypeBadge(req.leaveType)}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {req.startDate} <span style={{ color: 'var(--text-muted)' }}>to</span> {req.endDate}
                    </div>
                  </td>
                  <td>
                    <div className="days-badge">
                      <span className="days-main">{req.workingDays} working days</span>
                      <span className="days-sub">
                        {req.totalDays} cal days ({req.weekendDays} weekend days)
                      </span>
                    </div>
                  </td>
                  <td style={{ maxWidth: '240px', wordBreak: 'break-word' }}>
                    <span title={req.reason}>{req.reason}</span>
                  </td>
                  <td>{getStatusBadge(req.status)}</td>
                  <td>
                    {req.managerComments ? (
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        "{req.managerComments}"
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
