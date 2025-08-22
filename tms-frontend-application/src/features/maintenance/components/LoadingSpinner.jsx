// components/LoadingSpinner.js
import React from 'react';
import { Loader2 } from 'lucide-react';
import '../styles/loading-spinner.css';

const LoadingSpinner = ({ message = "Loading inspections..." }) => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <Loader2 className="loading-spinner" />
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;