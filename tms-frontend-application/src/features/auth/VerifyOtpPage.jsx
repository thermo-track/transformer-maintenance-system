import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AuthPages.css';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp } = useAuth();
  
  const email = location.state?.email;
  
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtpCode(value);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await verifyOtp(email, otpCode);
      
      if (result.success) {
        setSuccess('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.error || 'Invalid or expired verification code.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setIsResending(true);

    try {
      const response = await fetch(`http://localhost:8080/api/auth/resend-otp?email=${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Verification code has been resent to your email.');
      } else {
        setError('Failed to resend code. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred while resending code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Verify Your Email</h1>
        <p className="auth-subtitle-text">
          We've sent a 6-digit verification code to<br />
          <strong>{email}</strong>
        </p>
        
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="otpCode">Verification Code</label>
            <input
              type="text"
              id="otpCode"
              name="otpCode"
              value={otpCode}
              onChange={handleChange}
              placeholder="Enter 6-digit code"
              disabled={isSubmitting}
              required
              maxLength={6}
              className="auth-otp-input"
              autoComplete="off"
            />
            <small className="auth-form-hint">Code expires in 10 minutes</small>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isSubmitting || otpCode.length !== 6}
          >
            {isSubmitting ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="auth-actions">
          <button 
            onClick={handleResend}
            disabled={isResending}
            className="auth-resend-button"
          >
            {isResending ? 'Resending...' : "Didn't receive code? Resend"}
          </button>
        </div>

        <p className="auth-link">
          Wrong email? <Link to="/register">Register again</Link>
        </p>
      </div>
    </div>
  );
}
