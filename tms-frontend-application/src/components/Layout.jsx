import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import UserCorner from './UserCorner.jsx';
import '../styles/layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Header Bar with Toggle Button, Title, and User Corner */}
      <div className="top-header">
        <div className="header-left">
          {/* Toggle Button */}
          <button 
            className="sidebar-toggle" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#5d6979',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '18px',
              marginRight: '15px'
            }}
          >
            ☰
          </button>

          {/* Main Title */}
          <h1 className="app-title">Transformer Maintenance</h1>
        </div>

        {/* User Corner on the right */}
        <div className="header-right">
          <UserCorner />
        </div>
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content area */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;