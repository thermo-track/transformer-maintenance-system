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
    // Skip auth for public endpoints
    const publicEndpoints = [
      '/api/auth/login', 
      '/api/auth/register', 
      '/api/auth/verify-otp', 
      '/api/auth/resend-otp',
      '/api/admin/auth/register',
      '/api/admin/auth/verify-otp'
    ];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (isPublicEndpoint) {
      return config;
    }
    
    // Only add auth header if we have valid auth data
    const auth = localStorage.getItem('auth');
    const user = localStorage.getItem('user');
    const currentPath = window.location.pathname;
    
    // Skip auth header for public pages or if no user data
    if (!user || !auth || currentPath === '/login' || currentPath === '/register') {
      return config;
    }
    
    try {
      const { username, password } = JSON.parse(auth);
      if (username && password) {
        const credentials = btoa(`${username}:${password}`);
        config.headers.Authorization = `Basic ${credentials}`;
      }
    } catch (e) {
      // Invalid auth data, clear it
      localStorage.removeItem('auth');
      localStorage.removeItem('user');
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
      const currentPath = window.location.pathname;
      
      // Only clear and redirect if we're not already on login/register pages
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/verify-otp') {
        // Clear auth data on 401
        localStorage.removeItem('auth');
        localStorage.removeItem('user');
        
        // Small delay to avoid race conditions
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Auth API endpoints
export const authAPI = {
  register: async (username, email, password, role = 'ROLE_USER') => {
    const response = await axios.post('/api/auth/register', {
      username,
      email,
      password,
      role,
    });
    return response.data;
  },

  verifyOtp: async (email, otpCode) => {
    const response = await axios.post('/api/auth/verify-otp', {
      email,
      otpCode,
    });
    return response.data;
  },

  resendOtp: async (email) => {
    const response = await axios.post('/api/auth/resend-otp', null, {
      params: { email },
    });
    return response.data;
  },

  login: async (username, password) => {
    const response = await axios.post('/api/auth/login', {
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

// Admin API endpoints
export const adminAPI = {
  // Admin registration
  registerAdmin: async (adminData) => {
    console.log('[API] registerAdmin called with:', adminData);
    const requestBody = {
      username: adminData.username,
      email: adminData.email,
      password: adminData.password,
      fullName: adminData.fullName,
      employeeId: adminData.employeeId,
      department: adminData.department,
      phoneNumber: adminData.phoneNumber,
      adminSecretKey: adminData.adminSecretKey,
      justification: adminData.justification,
    };
    console.log('[API] Sending POST to /api/admin/auth/register with body:', requestBody);
    const response = await apiClient.post('/api/admin/auth/register', requestBody);
    console.log('[API] Response received:', response);
    console.log('[API] Response data:', response.data);
    return response.data;
  },

  // Verify admin email with OTP
  verifyAdminOtp: async (email, otpCode) => {
    const response = await apiClient.post('/api/admin/auth/verify-otp', {
      email,
      otpCode,
    });
    return response.data;
  },

  // Get pending admin approvals (admin only)
  getPendingApprovals: async () => {
    const response = await apiClient.get('/api/admin/auth/pending-approvals');
    return response.data;
  },

  // Approve admin request (admin only)
  approveAdmin: async (approvalId) => {
    const response = await apiClient.post(`/api/admin/auth/approve/${approvalId}`);
    return response.data;
  },

  // Reject admin request (admin only)
  rejectAdmin: async (approvalId, reason) => {
    const response = await apiClient.post(`/api/admin/auth/reject/${approvalId}`, {
      reason,
    });
    return response.data;
  },
};
