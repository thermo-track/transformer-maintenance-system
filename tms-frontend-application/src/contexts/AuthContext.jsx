import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../config/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAuth = localStorage.getItem('auth');
    
    if (storedUser && storedAuth) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.login(username, password);
      
      if (response.success) {
        const userData = {
          username: response.username,
          role: response.role,
        };
        
        // Store user data and credentials
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('auth', JSON.stringify({ username, password }));
        
        setUser(userData);
        return { success: true };
      } else {
        // Backend returned success: false
        const errorMessage = response.message || 'Login failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      // Handle HTTP errors (401, 500, etc.)
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.response) {
        // Server responded with error status
        if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.status === 401) {
          errorMessage = 'Invalid username or password';
        } else if (err.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password, role = 'ROLE_USER') => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.register(username, email, password, role);
      
      if (response.success) {
        // Don't auto-login - user needs to verify email first
        return { success: true, email: response.email };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email, otpCode) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.verifyOtp(email, otpCode);
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Verification failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local data regardless of API call success
      localStorage.removeItem('user');
      localStorage.removeItem('auth');
      setUser(null);
    }
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    verifyOtp,
    logout,
    isAuthenticated,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
