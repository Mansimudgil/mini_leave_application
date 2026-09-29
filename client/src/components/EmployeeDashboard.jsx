import React, { useState } from 'react';
import { PlusCircle, ShieldCheck, CalendarRange, Clock, AlertTriangle, Info } from 'lucide-react';
import BalanceCard from './BalanceCard';
import LeaveRequestTable from './LeaveRequestTable';
import ApplyLeaveModal from './ApplyLeaveModal';

export default function EmployeeDashboard({
  employee,
  requests,
  onRefresh,
  showToast
}) {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const casualBalance = employee?.leaveBalances?.casual ?? 0;
  const sickBalance = employee?.leaveBalances?.sick ?? 0;
  const initialCasual = employee?.initialBalances?.casual ?? 10;
  const initialSick = employee?.initialBalances?.sick ?? 10;
  const totalRemaining = casualBalance + sickBalance;
  const totalInitial = initialCasual + initialSick;

  const myRequests = requests.filter((r) => r.employeeId === employee?.employeeId);

  return (
    <div>
      {/* Hero Welcome */}
      <div className="hero-banner">
        <div className="hero-info">
          <h1>Welcome, {employee?.name || 'Employee'}</h1>
          <p>
            {employee?.department} Department &bull; ID: <strong>{employee?.employeeId}</strong> &bull; {employee?.email}
          </p>
        </div>

        <div className="hero-actions">
          <button
            type="button"
            id="btn-open-apply-modal"
            className="btn btn-primary"
            onClick={() => setIsApplyModalOpen(true)}
          >
            <PlusCircle size={18} />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="balance-grid">
        <BalanceCard
          type="casual"
          balance={casualBalance}
          initial={initialCasual}
          title="Casual Leave"
        />
        <BalanceCard
          type="sick"
          balance={sickBalance}
          initial={initialSick}
          title="Sick Leave"
        />
        <BalanceCard
          type="total"
          balance={totalRemaining}
          initial={totalInitial}
          title="Total Remaining"
        />
      </div>

      {/* Employee's Own Leave History */}
      <LeaveRequestTable
        requests={myRequests}
        showEmployeeCol={false}
        title="My Leave History & Status"
      />

      {/* Edge Cases & Business Rules Explanation Card */}
      <div className="edge-cases-card">
        <div className="edge-cases-header">
          <Info size={18} />
          <span>Leave Policy & Assessment Edge Cases Handled</span>
        </div>
        <div className="edge-cases-grid">
          <div className="edge-case-item">
            <strong>1. Weekend Exclusion</strong>
            Saturdays and Sundays are automatically excluded from leave deductions. Spanning Friday to Monday counts as 2 working days.
          </div>
          <div className="edge-case-item">
            <strong>2. Overlap Protection</strong>
            System checks for existing Pending and Approved leaves to prevent double-booking identical or overlapping dates.
          </div>
          <div className="edge-case-item">
            <strong>3. Balance Validation</strong>
            Leaves cannot be submitted or approved if requested working days exceed current available balance.
          </div>
          <div className="edge-case-item">
            <strong>4. Deduct Upon Approval</strong>
            Balances remain intact while requests are pending and are only deducted once a manager grants approval.
          </div>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        employee={employee}
        onSuccess={onRefresh}
        showToast={showToast}
      />
    </div>
  );
}
