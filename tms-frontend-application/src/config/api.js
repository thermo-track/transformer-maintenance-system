import axios from 'axios';
import { API_BASE_URL } from './env';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
});

// Add request interceptor to include auth credentials
apiClient.interceptors.request.use(
  (config) => {
    const auth = localStorage.getItem('auth');
    if (auth) {
      const { username, password } = JSON.parse(auth);
      const credentials = btoa(`${username}:${password}`);
      config.headers.Authorization = `Basic ${credentials}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on 401
      localStorage.removeItem('auth');
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Auth API endpoints
export const authAPI = {
  register: async (username, email, password, role = 'ROLE_USER') => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      username,
      email,
      password,
      role,
    });
    return response.data;
  },

  verifyOtp: async (email, otpCode) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
      email,
      otpCode,
    });
    return response.data;
  },

  resendOtp: async (email) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/resend-otp`, null, {
      params: { email },
    });
    return response.data;
  },

  login: async (username, password) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      username,
      password,
    });
    return response.data;
  },

  logout: async () => {
    try {
      const response = await apiClient.post('/api/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  getUserProfile: async () => {
    const response = await apiClient.get('/api/auth/profile');
    return response;
  },

  updateUserProfile: async (profileData) => {
    const response = await apiClient.put('/api/auth/profile', profileData);
    return response.data;
  },

  deleteAccount: async (password) => {
    const response = await apiClient.delete('/api/auth/account', {
      data: { password },
    });
    return response.data;
  },
};
