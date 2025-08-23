import React from 'react';
import avatar from '../assets/pic.jpg';

function UserCorner() {
  return (
    <div className="user-corner">
      <img
        src={avatar}
        alt="User"
        className="user-avatar"
      />
      <div className="user-info">
        <span className="user-name">Username</span>
        <span className="user-email">user@gmail.com</span>
      </div>
    </div>
  );
}

export default UserCorner;