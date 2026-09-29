import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import EmployeeDashboard from './components/EmployeeDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import ToastContainer from './components/Toast';
import { api } from './api';

export default function App() {
  const [currentView, setCurrentView] = useState('employee');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('EMP001');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch initial employees & requests
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [empRes, reqRes] = await Promise.all([
        api.getEmployees(),
        api.getLeaveRequests()
      ]);

      if (empRes.success) {
        setEmployees(empRes.data);
        if (!selectedEmployeeId && empRes.data.length > 0) {
          setSelectedEmployeeId(empRes.data[0].employeeId);
        }
      }

      if (reqRes.success) {
        setRequests(reqRes.data);
      }
    } catch (err) {
      console.error('Failed to load portal data:', err);
      showToast('Error connecting to backend server: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResetBalances = async () => {
    if (!window.confirm('Reset all employee leave balances to default quotas (10 days)?')) {
      return;
    }
    try {
      const res = await api.resetBalances();
      showToast(res.message || 'Balances reset successfully.', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to reset balances: ' + err.message, 'error');
    }
  };

  const currentEmployee =
    employees.find((e) => e.employeeId === selectedEmployeeId) || employees[0];
  const managerProfile =
    employees.find((e) => e.role === 'manager') || employees[1] || employees[0];

  return (
    <div className="app-container">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        employees={employees}
        selectedEmployeeId={selectedEmployeeId}
        setSelectedEmployeeId={setSelectedEmployeeId}
        onResetBalances={handleResetBalances}
      />

      <main className="main-content">
        {loading && employees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Loading Leave Management System...
            </div>
          </div>
        ) : currentView === 'employee' ? (
          <EmployeeDashboard
            employee={currentEmployee}
            requests={requests}
            onRefresh={fetchData}
            showToast={showToast}
          />
        ) : (
          <ManagerDashboard
            requests={requests}
            onRefresh={fetchData}
            showToast={showToast}
            manager={managerProfile}
          />
        )}
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}
      >
        Mini Leave Request Application &bull; Built with Node.js, Express, MongoDB & React
      </footer>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
