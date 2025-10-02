// components/PageHeader.js
import React from 'react';
import { Plus } from 'lucide-react';
import '../styles/page-header.css';

const PageHeader = ({ onNewInspection }) => {
  return (
    <div className="page-header">
      <h1 className="page-title">Inspections</h1>

      <div className="header-actions">
        <button 
          onClick={onNewInspection}
          className="btn-primary"
        >
          Add Inspection
        </button>
      </div>
    </div>
  );
};

export default PageHeader;