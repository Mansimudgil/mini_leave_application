import React from 'react';
import { Calendar, User, Shield, RefreshCw } from 'lucide-react';

export default function Navbar({
  currentView,
  setCurrentView,
  employees,
  selectedEmployeeId,
  setSelectedEmployeeId,
  onResetBalances
}) {
  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-icon">
          <Calendar size={20} color="#ffffff" />
        </div>
        <div>
          <span className="brand-name">Leave Management System</span>
        </div>
      </div>

      <div className="nav-controls">
        {/* View Switcher */}
        <div className="view-switcher" role="tablist" aria-label="Portal Mode">
          <button
            id="tab-employee-view"
            className={`view-btn ${currentView === 'employee' ? 'active' : ''}`}
            onClick={() => setCurrentView('employee')}
            type="button"
          >
            <User size={15} />
            <span>Employee Portal</span>
          </button>
          <button
            id="tab-manager-view"
            className={`view-btn ${currentView === 'manager' ? 'active' : ''}`}
            onClick={() => setCurrentView('manager')}
            type="button"
          >
            <Shield size={15} />
            <span>Manager Portal</span>
          </button>
        </div>

        {/* Employee Switcher (Dropdown for easy evaluation) */}
        <div className="user-selector" title="Select active employee profile">
          <User size={15} color="#94a3b8" />
          <select
            id="select-employee"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            aria-label="Active Employee"
          >
            {employees.map((emp) => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.name} ({emp.department} - {emp.employeeId})
              </option>
            ))}
          </select>
        </div>

        {/* Reset Quota / Balances button */}
        <button
          id="btn-reset-balances"
          className="btn btn-secondary btn-sm"
          onClick={onResetBalances}
          title="Reset leave quotas to initial defaults"
          type="button"
        >
          <RefreshCw size={13} />
          <span>Reset Demo</span>
        </button>
      </div>
    </header>
  );
}
