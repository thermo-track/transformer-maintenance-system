import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, adminAPI } from '../config/api';

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

  // Periodically check for role updates (every 30 seconds)
  useEffect(() => {
    if (!user) {
      console.log('[AuthContext] No user logged in, skipping role check');
      return;
    }

    console.log('[AuthContext] Setting up role check interval for user:', user.username, 'current role:', user.role);

    const checkRoleUpdate = async () => {
      try {
        console.log('[AuthContext] Checking for role updates...');
        const response = await authAPI.getCurrentUser();
        console.log('[AuthContext] getCurrentUser response:', response);
        
        if (response.success) {
          const newRole = response.role;
          const currentRole = user.role;
          
          console.log('[AuthContext] Current role:', currentRole, ', Server role:', newRole);
          
          // If role changed, update the user
          if (newRole !== currentRole) {
            console.log(`[AuthContext] 🎉 Role updated: ${currentRole} -> ${newRole}`);
            const userData = {
              username: response.username,
              role: newRole,
            };
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
          } else {
            console.log('[AuthContext] Role unchanged:', currentRole);
          }
        } else {
          console.warn('[AuthContext] getCurrentUser returned success: false');
        }
      } catch (err) {
        // Silently fail - don't log out user on network errors
        console.error('[AuthContext] Failed to check role update:', err);
      }
    };

    // Check immediately on mount if user exists
    console.log('[AuthContext] Running immediate role check...');
    checkRoleUpdate();

    // Then check every 30 seconds
    const interval = setInterval(() => {
      console.log('[AuthContext] Running scheduled role check (30s interval)...');
      checkRoleUpdate();
    }, 30000);

    return () => {
      console.log('[AuthContext] Cleaning up role check interval');
      clearInterval(interval);
    };
  }, [user]);

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

  const registerAdmin = async (adminData) => {
    console.log('[AuthContext] registerAdmin called with:', adminData);
    try {
      setError(null);
      setLoading(true);
      
      console.log('[AuthContext] Calling adminAPI.registerAdmin...');
      const response = await adminAPI.registerAdmin(adminData);
      console.log('[AuthContext] API response:', response);
      
      if (response.success) {
        console.log('[AuthContext] Registration successful, returning:', { success: true, email: response.email });
        return { success: true, email: response.email };
      } else {
        console.log('[AuthContext] Registration not successful, response:', response);
        throw new Error(response.message || 'Admin registration failed');
      }
    } catch (err) {
      console.error('[AuthContext] Registration error:', err);
      console.error('[AuthContext] Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Admin registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
      console.log('[AuthContext] registerAdmin complete');
    }
  };

  const verifyAdminOtp = async (email, otpCode) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await adminAPI.verifyAdminOtp(email, otpCode);
      
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

  /**
   * Refresh user data from backend.
   * Useful when user's role or profile changes on the server.
   */
  const refreshUser = async () => {
    try {
      const auth = localStorage.getItem('auth');
      if (!auth) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await authAPI.getCurrentUser();
      
      if (response.success) {
        const userData = {
          username: response.username,
          role: response.role,
        };
        
        // Update localStorage and state
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { success: true, user: userData };
      } else {
        return { success: false, error: 'Failed to fetch user data' };
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
      return { success: false, error: err.message };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    registerAdmin,
    verifyOtp,
    verifyAdminOtp,
    logout,
    isAuthenticated,
    hasRole,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
