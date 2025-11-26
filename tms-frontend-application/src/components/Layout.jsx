/* export default function Layout({ children }) {
return (
<div className="container">
<header className="row" style={{justifyContent:'space-between'}}>
<h1 style={{margin:0}}>Transformer Maintenance</h1>
</header>
<main className="card" style={{marginTop:'1rem'}}>{children}</main>
</div>
);
}


 */


import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import UserCorner from './UserCorner.jsx';
import '../styles/layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Header Bar with Toggle Button, Title, and User Corner */}
      <div className="top-header print-header-first">
        <div className="header-left">
          {/* Toggle Button - hidden in print */}
          <button 
            className="sidebar-toggle no-print" 
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

          {/* Main Title - hidden in print */}
          <h1 className="app-title">POWER GRID</h1>
        </div>

        {/* User Corner on the right */}
        <div className="header-right">
          <div className="no-print">
            <UserCorner />
          </div>
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