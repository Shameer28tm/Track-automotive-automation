import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach authorization token from sessionStorage if present
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response interceptor for unified error formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 unauthorized
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => apiClient.post('/auth/login/', data),
  register: (data) => apiClient.post('/auth/register/', data),
  logout: () => apiClient.post('/auth/logout/'),
  getMe: () => apiClient.get('/auth/me/'),
  updateMe: (data) => apiClient.patch('/auth/me/', data),
  googleAuth: (data) => apiClient.post('/auth/google/', data),
  getMechanics: () => apiClient.get('/auth/mechanics/'),
  getUsers: (params) => apiClient.get('/auth/users/', { params }),
  createStaffUser: (data) => apiClient.post('/auth/users/', data),
};

export const vehiclesApi = {
  list: (params) => apiClient.get('/vehicles/', { params }),
  get: (id) => apiClient.get(`/vehicles/${id}/`),
  create: (data) => apiClient.post('/vehicles/', data),
  update: (id, data) => apiClient.patch(`/vehicles/${id}/`, data),
  delete: (id) => apiClient.delete(`/vehicles/${id}/`),
};

export const appointmentsApi = {
  list: (params) => apiClient.get('/appointments/', { params }),
  get: (id) => apiClient.get(`/appointments/${id}/`),
  create: (data) => apiClient.post('/appointments/', data),
  update: (id, data) => apiClient.patch(`/appointments/${id}/`, data),
  cancel: (id) => apiClient.post(`/appointments/${id}/cancel/`),
};

export const servicesApi = {
  listJobs: (params) => apiClient.get('/services/jobs/', { params }),
  getJob: (id) => apiClient.get(`/services/jobs/${id}/`),
  createJob: (data) => apiClient.post('/services/jobs/', data),
  updateJob: (id, data) => apiClient.patch(`/services/jobs/${id}/`, data),
  addPart: (id, data) => apiClient.post(`/services/jobs/${id}/add_part/`, data),
  addInspection: (id, data) => apiClient.post(`/services/jobs/${id}/add_inspection/`, data),
  getReceipt: (id) => apiClient.get(`/services/jobs/${id}/receipt/`),
  getDashboardSummary: () => apiClient.get('/services/dashboard/summary/'),
};

export const faultsApi = {
  list: (params) => apiClient.get('/services/faults/', { params }),
  get: (id) => apiClient.get(`/services/faults/${id}/`),
  create: (data) => apiClient.post('/services/faults/', data),
  update: (id, data) => apiClient.patch(`/services/faults/${id}/`, data),
};

export const notificationsApi = {
  list: () => apiClient.get('/notifications/'),
  markRead: (id) => apiClient.post(`/notifications/${id}/read/`),
  markAllRead: () => apiClient.post('/notifications/mark-all-read/'),
  getUnreadCount: () => apiClient.get('/notifications/unread-count/'),
};

export const chatbotApi = {
  sendMessage: (message, history = []) => apiClient.post('/chatbot/chat/', { message, history }),
};

export default apiClient;
