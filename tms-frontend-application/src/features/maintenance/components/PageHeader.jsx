// components/PageHeader.js
import React from 'react';
import { Plus } from 'lucide-react';
import '../styles/page-header.css';

const PageHeader = ({ onNewInspection }) => {
  return (
    <div className="page-header">
      <h1 className="page-title">Power Grid Inspections</h1>
      
      <div className="navigation-tabs">
        <div className="nav-tab active">
          Inspections
        </div>
        <button className="nav-tab inactive">
          New Inspection
        </button>
      </div>

      <div className="header-actions">
        <button 
          onClick={onNewInspection}
          className="btn-primary"
        >
          <Plus className="icon" />
          New
        </button>
      </div>
    </div>
  );
};

export default PageHeader;