import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../config/api';
import './UserSettings.css';

const UserSettings = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    department: '',
    phoneNumber: '',
    profilePhotoUrl: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getUserProfile();
      setUserProfile(response.data);
      setFormData({
        employeeId: response.data.employeeId || '',
        fullName: response.data.fullName || '',
        department: response.data.department || '',
        phoneNumber: response.data.phoneNumber || '',
        profilePhotoUrl: response.data.profilePhotoUrl || ''
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Get Cloudinary config from environment
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary configuration is missing');
      }

      // Create form data for Cloudinary
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('upload_preset', uploadPreset);
      formDataUpload.append('folder', 'profile_photos');

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formDataUpload
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      
      // Update form data with new photo URL
      setFormData({
        ...formData,
        profilePhotoUrl: data.secure_url
      });

      setSuccess('Photo uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Photo upload error:', err);
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await authAPI.updateUserProfile(formData);
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh profile data
      await fetchUserProfile();
      
      // Dispatch custom event to notify other components (like UserCorner) to refresh
      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: { profilePhotoUrl: formData.profilePhotoUrl } 
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setError('Please enter your password to confirm deletion');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Delete account from backend
      await authAPI.deleteAccount(deletePassword);
      
      // IMMEDIATELY clear auth data to prevent any further requests
      localStorage.removeItem('auth');
      localStorage.removeItem('user');
      
      // Show success message briefly
      setSuccess('Account deleted successfully. Redirecting...');
      
      // Small delay to show success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Complete logout (this will clear context state)
      await logout();
      
      // Redirect to login page
      navigate('/login', { replace: true });
    } catch (err) {
      // Handle different error types
      let errorMessage = 'Failed to delete account';
      
      if (err.response) {
        // Server responded with an error
        if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.status === 400) {
          errorMessage = 'Invalid password. Please try again.';
        } else if (err.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setSaving(false);
      setSuccess('');
    }
  };

  if (loading) {
    return (
      <div className="user-settings">
        <div className="settings-header">
          <h2>User Settings</h2>
        </div>
        <div className="settings-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="user-settings">
      <div className="settings-header">
        <h2>User Settings</h2>
      </div>

      <div className="settings-content">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Account Info Section */}
        <section className="settings-section">
          <h3>Account Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Username</label>
              <span>{userProfile?.username}</span>
            </div>
            <div className="info-item">
              <label>Email</label>
              <span>{userProfile?.email}</span>
            </div>
            <div className="info-item">
              <label>Role</label>
              <span className="badge_role">{userProfile?.role}</span>
            </div>
            <div className="info-item">
              <label>Account Status</label>
              <span className={`status ${userProfile?.enabled ? 'active' : 'inactive'}`}>
                {userProfile?.enabled ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </section>

        {/* Profile Form */}
        <section className="settings-section">
          <h3>Profile Details</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="employeeId">Employee ID</label>
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="Enter your employee ID"
                maxLength="50"
              />
            </div>

            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                maxLength="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Enter your department"
                maxLength="50"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter your phone number"
                maxLength="20"
              />
            </div>

            <div className="form-group">
              <label htmlFor="profilePhoto">Profile Photo</label>
              <div className="photo-upload-section">
                <input
                  type="file"
                  id="profilePhoto"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="profilePhoto" className="btn btn-secondary upload-btn">
                  {uploading ? 'Uploading...' : '📷 Choose Photo'}
                </label>
                {formData.profilePhotoUrl && (
                  <button
                    type="button"
                    className="btn btn-danger remove-photo-btn"
                    onClick={() => setFormData({ ...formData, profilePhotoUrl: '' })}
                  >
                    Remove
                  </button>
                )}
              </div>
              {formData.profilePhotoUrl && (
                <div className="photo-preview">
                  <img src={formData.profilePhotoUrl} alt="Profile preview" />
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </section>

        {/* Danger Zone */}
        <section className="settings-section danger-zone">
          <h3>Danger Zone</h3>
          <p className="warning-text">
            Once you delete your account, there is no going back. Please be certain.
          </p>

          {!showDeleteConfirm ? (
            <button 
              className="btn btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          ) : (
            <div className="delete-confirm">
              <p><strong>Please enter your password to confirm account deletion:</strong></p>
              
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '12px' }}>
                  {error}
                </div>
              )}
              
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  // Clear error when user types
                  if (error) setError('');
                }}
                placeholder="Enter your password"
                className="password-input"
              />
              <div className="delete-actions">
                <button 
                  className="btn btn-danger"
                  onClick={handleDeleteAccount}
                  disabled={saving}
                >
                  {saving ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                    setError('');
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserSettings;
