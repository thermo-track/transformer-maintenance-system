import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import avatar from '../assets/pic.jpg';

function UserCorner() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

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
          src={avatar}
          alt="User"
          className="user-avatar"
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