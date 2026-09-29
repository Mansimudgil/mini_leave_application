const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: `Server returned ${response.status} ${response.statusText}`
  }));

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Employees
  getEmployees: () => request('/api/employees'),
  getEmployee: (id) => request(`/api/employees/${id}`),
  resetBalances: () => request('/api/employees/reset-balances', { method: 'POST' }),

  // Leave Requests
  getLeaveRequests: (params = {}) => {
    const query = new URLSearchParams();
    if (params.employeeId) query.append('employeeId', params.employeeId);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/api/leaves${qs}`);
  },

  previewLeave: (payload) =>
    request('/api/leaves/preview', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  applyLeave: (payload) =>
    request('/api/leaves/apply', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  reviewLeave: (id, payload) =>
    request(`/api/leaves/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })
};
