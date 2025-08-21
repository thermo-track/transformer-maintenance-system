// components/PageHeaderST.js
import React from 'react';
import { useEffect, useState } from "react";
import { Eye, Trash2, Plus } from 'lucide-react';
import '../styles/page-header-st.css';
import transformers from "../data/transformers";

const PageHeaderST = ({ onNewInspection, transformerId = 0 }) => {
  // Get the transformer data - using the first transformer or specified by ID
  useEffect(() => {
          console.log("Transformer ID passed:", transformerId);
      }, [transformerId]);
  const transformer = transformers.find(t => t.id === transformerId) || transformers[0];

  return (
    <div>
    <h1 className="page-title">Power Grid Inspections</h1>
    <div className="page-header-container">
      {/* Left Section */}
      <div className="header-left-section">
        <h2 className="transformer-title">{transformer.id}</h2>
        <p className="transformer-location">{transformer.location}</p>
        <p className="transformer-landmark">
          📍 {transformer.landmark}
        </p>
        
        {/* Badges */}
        <div className="badges-container">
          <span className="badge">
            {transformer.poleNo}
            <span className="badge-label">Pole No</span>
          </span>
          
          <span className="badge">
            {transformer.capacity}
            <span className="badge-label">Capacity</span>
          </span>
          
          <span className="badge">
            {transformer.type}
            <span className="badge-label">Type</span>
          </span>
          
          <span className="badge">
            {transformer.feeders}
            <span className="badge-label">No. of Feeders</span>
          </span>
        </div>
      </div>
      
      {/* Right Section */}
      <div className="header-right-section">
        <p className="last-inspected-text">
          Last Inspected Date: {transformer.lastInspected}
        </p>
        
        {/* First row of buttons */}
        <div className="button-group">
          <button className="baseline-button">
            📷 Baseline Image
          </button>
          <Eye className="icon-button icon-view" size={20} />
          <Trash2 className="icon-button icon-delete" size={20} />
        </div>
        
        {/* New button row */}
        <div className="button-group">
          <button
            onClick={onNewInspection}
            className="new-element-button"
          >
            <Plus className="icon-plus" />
            New Element
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default PageHeaderST;