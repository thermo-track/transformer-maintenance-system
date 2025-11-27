import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(''); // 'auth', 'validation', 'server'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  // Redirect if already authenticated
  if (isAuthenticated()) {
    return <Navigate to="/transformers" replace />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing again
    if (error) {
      setError('');
      setErrorType('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorType('');

    // Validation
    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      setErrorType('validation');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        // Clear attempt count on successful login
        setAttemptCount(0);
        navigate('/transformers');
      } else {
        // Increment attempt count
        setAttemptCount(prev => prev + 1);
        
        // Determine error type and provide helpful message
        const errorMsg = result.error || 'Login failed';
        
        if (errorMsg.toLowerCase().includes('invalid') || 
            errorMsg.toLowerCase().includes('password') || 
            errorMsg.toLowerCase().includes('credentials')) {
          setErrorType('auth');
          setError('Invalid username or password. Please check your credentials and try again.');
        } else if (errorMsg.toLowerCase().includes('server') || 
                   errorMsg.toLowerCase().includes('500')) {
          setErrorType('server');
          setError('Server error. Please try again in a few moments.');
        } else if (errorMsg.toLowerCase().includes('email') && 
                   errorMsg.toLowerCase().includes('verify')) {
          setErrorType('verification');
          setError('Please verify your email address before logging in.');
        } else {
          setErrorType('general');
          setError(errorMsg);
        }
      }
    } catch (err) {
      setAttemptCount(prev => prev + 1);
      setErrorType('general');
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearForm = () => {
    setFormData({ username: '', password: '' });
    setError('');
    setErrorType('');
    setShowPassword(false);
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Transformer Maintenance System</h1>
        <h2 className="auth-subtitle">Login</h2>
        
        {error && (
          <div className={`auth-error ${errorType === 'auth' ? 'auth-error-warning' : ''}`}>
            <div className="auth-error-icon">
              {errorType === 'auth' && '⚠️'}
              {errorType === 'server' && '🔧'}
              {errorType === 'verification' && '📧'}
              {(errorType === 'validation' || errorType === 'general') && '❌'}
            </div>
            <div className="auth-error-content">
              <div className="auth-error-message">{error}</div>
              {errorType === 'auth' && attemptCount > 0 && (
                <div className="auth-error-suggestions">
                  <p className="auth-error-suggestion-title">Suggestions:</p>
                  <ul>
                    <li>Double-check your username and password</li>
                    <li>Make sure Caps Lock is off</li>
                    {attemptCount >= 2 && <li>Try using a different browser or clearing cache</li>}
                    {attemptCount >= 3 && <li>Contact your administrator if you continue having issues</li>}
                  </ul>
                  <button 
                    type="button" 
                    className="auth-clear-button"
                    onClick={handleClearForm}
                  >
                    Clear Form & Try Again
                  </button>
                </div>
              )}
              {errorType === 'verification' && (
                <div className="auth-error-suggestions">
                  <p>Check your email inbox for the verification link.</p>
                  <Link to="/verify-otp" className="auth-inline-link">Go to verification page</Link>
                </div>
              )}
              {errorType === 'server' && (
                <div className="auth-error-suggestions">
                  <p>The server is temporarily unavailable. Please wait a moment and try again.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="password">Password</label>
            <div className="auth-password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}