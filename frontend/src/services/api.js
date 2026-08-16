import axios from 'axios';

const getBaseApiUrl = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  return '';
};

const API_URL = getBaseApiUrl();

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  checkEmail: (email) => api.post('/auth/check-email', { email }),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  updatePassword: (data) => api.put('/auth/update-password', data),
  getCoordinators: () => api.get('/auth/coordinators'),
  saveCoordinator: (data) => api.post('/auth/coordinators', data),
};

// Complaints API
export const complaintAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (formData) => api.post('/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  approve: (id, data) => api.put(`/complaints/${id}/approve`, data),
  reject: (id, data) => api.put(`/complaints/${id}/reject`, data),
  updatePriority: (id, priority) => api.put(`/complaints/${id}/priority`, { priority }),
  getUpdates: (id) => api.get(`/complaints/${id}/updates`),
  addUpdate: (id, formData) => api.post(`/complaints/${id}/updates`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  addRemarks: (id, remarks) => api.post(`/complaints/${id}/remarks`, { remarks }),
  getStats: () => api.get('/complaints/stats'),
};

// Notifications API
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Admin API
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getSettings: () => api.get('/admin/settings'),
  saveSettings: (settingsPayload) => api.post('/admin/settings', settingsPayload),
  getAnalytics: () => api.get('/admin/analytics'),
  getAuditLogs: () => api.get('/admin/audit-logs'),
};

export default api;

