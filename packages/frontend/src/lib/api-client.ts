import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  auth: {
    register: (data: { email: string; password: string; name?: string }) =>
      apiClient.post('/auth/register', data),
    login: (data: { email: string; password: string }) =>
      apiClient.post('/auth/login', data),
    logout: () => apiClient.post('/auth/logout'),
  },

  // Agent
  agent: {
    chat: (message: string, conversationHistory: any[] = []) =>
      apiClient.post('/agent/chat', { message, conversation_history: conversationHistory }),
    action: (action: any) => apiClient.post('/agent/action', action),
  },

  // Capabilities
  capabilities: {
    list: () => apiClient.get('/capabilities'),
    get: (id: string) => apiClient.get(`/capabilities/${id}`),
  },

  // Weights
  weights: {
    list: (limit = 30) => apiClient.get(`/weights?limit=${limit}`),
    get: (id: string) => apiClient.get(`/weights/${id}`),
  },

  // Approvals
  approvals: {
    listPending: () => apiClient.get('/approvals/pending'),
    approve: (id: string) => apiClient.post(`/approvals/${id}/approve`),
    deny: (id: string) => apiClient.post(`/approvals/${id}/deny`),
  },
};
