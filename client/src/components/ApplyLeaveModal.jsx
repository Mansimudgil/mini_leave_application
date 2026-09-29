import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { api } from '../api';

export default function ApplyLeaveModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
  showToast
}) {
  const [leaveType, setLeaveType] = useState('Casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live preview state
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  // Set default dates to upcoming Monday - Tuesday on open
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      // Format YYYY-MM-DD
      const format = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const afterTomorrow = new Date(today);
      afterTomorrow.setDate(today.getDate() + 2);

      setStartDate(format(tomorrow));
      setEndDate(format(afterTomorrow));
      setReason('');
      setPreview(null);
      setPreviewError(null);
    }
  }, [isOpen]);

  // Fetch live preview whenever dates or leave type change
  useEffect(() => {
    if (!isOpen || !startDate || !endDate || !employee) return;

    if (startDate > endDate) {
      setPreview(null);
      setPreviewError('Start date cannot be after end date.');
      return;
    }

    let isMounted = true;
    setPreviewLoading(true);
    setPreviewError(null);

    api.previewLeave({
      employeeId: employee.employeeId,
      leaveType,
      startDate,
      endDate
    })
      .then((res) => {
        if (isMounted) {
          setPreview(res.data);
          setPreviewLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setPreviewError(err.message || 'Failed to calculate leave duration');
          setPreview(null);
          setPreviewLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, startDate, endDate, leaveType, employee]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      showToast('Please provide a reason for your leave request.', 'error');
      return;
    }

    if (preview && !preview.hasSufficientBalance) {
      showToast('Cannot submit: Insufficient leave balance.', 'error');
      return;
    }

    if (preview && preview.hasZeroWorkingDays) {
      showToast('Cannot submit: Selected range contains only weekend days.', 'error');
      return;
    }

    if (preview && preview.overlapConflict) {
      showToast('Cannot submit: Date range overlaps with an existing leave request.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.applyLeave({
        employeeId: employee.employeeId,
        leaveType,
        startDate,
        endDate,
        reason: reason.trim()
      });

      showToast(res.message || 'Leave request submitted successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to submit leave request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuota = employee?.leaveBalances?.[leaveType.toLowerCase()] ?? 0;
  const isSubmitDisabled =
    isSubmitting ||
    previewLoading ||
    !startDate ||
    !endDate ||
    startDate > endDate ||
    !reason.trim() ||
    (preview && (!preview.hasSufficientBalance || preview.hasZeroWorkingDays || preview.overlapConflict));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={20} color="#6366f1" />
            <h2 id="modal-title">Apply for Leave</h2>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Employee Quick Info */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.6rem 0.85rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                border: '1px solid var(--border-color)'
              }}
            >
              <span>
                Employee: <strong>{employee?.name}</strong> ({employee?.employeeId})
              </span>
              <span>
                Available {leaveType}: <strong>{currentQuota} days</strong>
              </span>
            </div>

            {/* Leave Type Selector */}
            <div className="form-group">
              <label className="form-label" htmlFor="leave-type-select">
                <span>Leave Type</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  Casual (Personal) / Sick (Medical)
                </span>
              </label>
              <select
                id="leave-type-select"
                className="form-select"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
              >
                <option value="Casual">Casual Leave ({employee?.leaveBalances?.casual ?? 0} days remaining)</option>
                <option value="Sick">Sick Leave ({employee?.leaveBalances?.sick ?? 0} days remaining)</option>
              </select>
            </div>

            {/* Date Range Inputs */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="start-date-input">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start-date-input"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="end-date-input">
                  End Date
                </label>
                <input
                  type="date"
                  id="end-date-input"
                  className="form-input"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Interactive Preview & Edge-Case Validator */}
            {preview && (
              <div
                className={`preview-card ${
                  preview.hasSufficientBalance && !preview.hasZeroWorkingDays && !preview.overlapConflict
                    ? 'valid'
                    : 'invalid'
                }`}
                id="leave-preview-box"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                    Calculation Breakdown
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Weekends Excluded
                  </span>
                </div>

                <div className="preview-stats">
                  <div className="preview-stat-box">
                    <div className="stat-box-val">{preview.totalDays}</div>
                    <div className="stat-box-label">Calendar Days</div>
                  </div>
                  <div className="preview-stat-box" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
                    <div className="stat-box-val" style={{ color: '#a5b4fc' }}>{preview.workingDays}</div>
                    <div className="stat-box-label">Working Days (To Deduct)</div>
                  </div>
                  <div className="preview-stat-box">
                    <div className="stat-box-val" style={{ color: '#f59e0b' }}>{preview.weekendDays}</div>
                    <div className="stat-box-label">Weekend Off-Days</div>
                  </div>
                </div>

                {/* Day breakdown chips */}
                {preview.dayBreakdown && preview.dayBreakdown.length <= 10 && (
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {preview.dayBreakdown.map((item) => (
                      <span
                        key={item.date}
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: item.isWorkingDay ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: item.isWorkingDay ? '#c7d2fe' : '#fcd34d',
                          border: `1px solid ${item.isWorkingDay ? 'rgba(99, 102, 241, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                        }}
                        title={`${item.date} (${item.reason})`}
                      >
                        {item.dayName}: {item.isWorkingDay ? '1d' : 'Off'}
                      </span>
                    ))}
                  </div>
                )}

                {/* Edge Case 1: Zero Working Days */}
                {preview.hasZeroWorkingDays && (
                  <div className="alert-box danger" id="alert-weekend-only">
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Weekend Only Date Range:</strong> The selected dates are non-working weekend days (Saturday/Sunday). Leaves are only deducted for official working days.
                    </div>
                  </div>
                )}

                {/* Edge Case 2: Insufficient Balance */}
                {!preview.hasSufficientBalance && (
                  <div className="alert-box danger" id="alert-insufficient-balance">
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Insufficient Balance:</strong> You requested {preview.workingDays} working days, but you only have {preview.currentBalance} {leaveType} day(s) available.
                    </div>
                  </div>
                )}

                {/* Edge Case 3: Overlapping Leave */}
                {preview.overlapConflict && (
                  <div className="alert-box danger" id="alert-overlapping">
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Overlapping Leave Detected:</strong> You already have a {preview.overlapConflict.status.toLowerCase()} {preview.overlapConflict.leaveType} leave from {preview.overlapConflict.startDate} to {preview.overlapConflict.endDate}.
                    </div>
                  </div>
                )}

                {/* Valid Projection */}
                {preview.hasSufficientBalance && !preview.hasZeroWorkingDays && !preview.overlapConflict && (
                  <div className="alert-box info">
                    <CheckCircle size={18} style={{ flexShrink: 0, color: '#34d399' }} />
                    <div>
                      Deducting <strong>{preview.workingDays} day(s)</strong> once approved. Balance will adjust from {preview.currentBalance} to <strong>{preview.projectedBalance} days</strong>.
                    </div>
                  </div>
                )}
              </div>
            )}

            {previewError && (
              <div className="alert-box danger">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{previewError}</span>
              </div>
            )}

            {/* Reason Textarea */}
            <div className="form-group">
              <label className="form-label" htmlFor="leave-reason-input">
                <span>Reason for Leave</span>
                <span style={{ color: 'var(--text-muted)' }}>Required</span>
              </label>
              <textarea
                id="leave-reason-input"
                className="form-textarea"
                placeholder="e.g. Attending sister's wedding / Routine medical checkup..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-leave"
              className="btn btn-primary"
              disabled={isSubmitDisabled}
            >
              {isSubmitting ? (
                <>
                  <Clock size={16} />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Request</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
