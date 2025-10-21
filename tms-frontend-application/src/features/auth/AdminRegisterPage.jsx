import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AuthPages.css';

export default function AdminRegisterPage() {
  const navigate = useNavigate();
  const { registerAdmin, isAuthenticated, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    employeeId: '',
    department: '',
    phoneNumber: '',
    adminSecretKey: '',
    justification: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated()) {
    return <Navigate to="/transformers" replace />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user types
  };

  const validateForm = () => {
    console.log('Validating form...'); // DEBUG
    
    if (!formData.username || !formData.email || !formData.password || 
        !formData.confirmPassword || !formData.fullName || !formData.employeeId || 
        !formData.department || !formData.adminSecretKey) {
      console.log('Missing required fields:', { // DEBUG
        username: !!formData.username,
        email: !!formData.email,
        password: !!formData.password,
        confirmPassword: !!formData.confirmPassword,
        fullName: !!formData.fullName,
        employeeId: !!formData.employeeId,
        department: !!formData.department,
        adminSecretKey: !!formData.adminSecretKey
      });
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.username.length < 3) {
      console.log('Username too short'); // DEBUG
      setError('Username must be at least 3 characters long');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.log('Invalid email format'); // DEBUG
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      console.log('Password too short'); // DEBUG
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      console.log('Passwords do not match'); // DEBUG
      setError('Passwords do not match');
      return false;
    }

    console.log('Validation successful'); // DEBUG
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Form data:', formData);

    if (!validateForm()) {
      console.log('Validation failed');
      return;
    }

    console.log('Validation passed');
    setIsSubmitting(true);
    
    try {
      console.log('Calling registerAdmin with data:', formData);
      const result = await registerAdmin(formData);
      console.log('Registration API returned:', JSON.stringify(result, null, 2));
      
      if (result && result.success) {
        console.log('Success! Navigating to OTP page...');
        navigate('/admin/verify-otp', { 
          state: { 
            email: formData.email,
            isAdmin: true 
          } 
        });
      } else {
        console.log('Registration failed:', result);
        setError(result?.error || 'Admin registration failed. Please check your credentials and try again.');
      }
    } catch (err) {
      console.error('Registration exception:', err);
      console.error('Error details:', err.message);
      console.error('Error stack:', err.stack);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      console.log('Setting isSubmitting to false');
      setIsSubmitting(false);
    }
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
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <h1 className="auth-title">Transformer Maintenance System</h1>
          <h2 className="auth-subtitle">Admin Registration</h2>
          <p className="auth-description">
            Register for administrator access. You will need to verify your email and may require approval from existing administrators.
          </p>
        </div>
        
        {error && (
          <div className="auth-error">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-row">
            <div className="auth-form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username (min 3 characters)"
                disabled={isSubmitting}
                required
                minLength={3}
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="auth-form-row">
            <div className="auth-form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="employeeId">Employee ID *</label>
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="EMP001"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="auth-form-row">
            <div className="auth-form-group">
              <label htmlFor="department">Department *</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="IT Operations"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+94771234567"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="auth-form-row">
            <div className="auth-form-group">
              <label htmlFor="password">Password *</label>
              <div className="auth-password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  disabled={isSubmitting}
                  required
                  minLength={6}
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

            <div className="auth-form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <div className="auth-password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
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
          </div>

          <div className="auth-form-group">
            <label htmlFor="adminSecretKey">Admin Secret Key *</label>
            <div className="auth-password-input-wrapper">
              <input
                type={showSecretKey ? "text" : "password"}
                id="adminSecretKey"
                name="adminSecretKey"
                value={formData.adminSecretKey}
                onChange={handleChange}
                placeholder="Enter the admin secret key"
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowSecretKey(!showSecretKey)}
                tabIndex={-1}
              >
                {showSecretKey ? (
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
            <small className="auth-field-hint">Contact your system administrator for the secret key</small>
          </div>

          <div className="auth-form-group">
            <label htmlFor="justification">Justification (Optional)</label>
            <textarea
              id="justification"
              name="justification"
              value={formData.justification}
              onChange={handleChange}
              placeholder="Briefly explain why you need admin access..."
              disabled={isSubmitting}
              rows="3"
              maxLength="1000"
              style={{ resize: 'vertical' }}
            />
            <small className="auth-field-hint">
              {formData.justification.length}/1000 characters
            </small>
          </div>

          <button 
            type="submit" 
            className="auth-button auth-button-admin"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="auth-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registering...
              </>
            ) : (
              'Register as Admin'
            )}
          </button>
        </form>

        <div className="auth-links">
          <p className="auth-link">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
          <p className="auth-link">
            Regular user? <Link to="/register">Register as user</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
