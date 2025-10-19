import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../config/api';
import avatar from '../assets/pic.jpg';

function UserCorner() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    // Only fetch profile if user is authenticated
    if (user) {
      fetchUserProfile();
    }

    // Listen for profile updates
    const handleProfileUpdate = (event) => {
      if (event.detail?.profilePhotoUrl) {
        setProfilePhoto(event.detail.profilePhotoUrl);
      } else {
        // If photo was removed, refetch profile
        fetchUserProfile();
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [user]);

  const fetchUserProfile = async () => {
    // Don't fetch if user is not authenticated or localStorage is cleared
    if (!user || !localStorage.getItem('user') || !localStorage.getItem('auth')) {
      return;
    }
    
    try {
      const response = await authAPI.getUserProfile();
      if (response.data.profilePhotoUrl) {
        setProfilePhoto(response.data.profilePhotoUrl);
      }
    } catch (err) {
      // Silently handle errors - interceptor will handle 401
      if (err.response?.status !== 401) {
        console.error('Failed to fetch user profile:', err);
      }
      // Keep default avatar if fetch fails
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="user-corner" onMouseLeave={() => setShowDropdown(false)}>
      <div 
        className="user-profile-button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <img
          src={profilePhoto || avatar}
          alt="User"
          className="user-avatar"
          onError={(e) => {
            e.target.src = avatar; // Fallback to default if photo fails to load
          }}
        />
      </div>
      
      {showDropdown && (
        <div className="user-dropdown">
          <div className="dropdown-header">
            <span className="dropdown-username">{user?.username || 'User'}</span>
          </div>
          <div className="dropdown-item" onClick={handleLogout}>
            <span>🚪 Logout</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserCorner;