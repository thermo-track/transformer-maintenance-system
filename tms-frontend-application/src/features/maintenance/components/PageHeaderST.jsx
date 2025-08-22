import React, { useEffect } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import '../styles/page-header-st.css';
import transformers from '../data/transformers';

const PageHeaderST = ({
  transformerNo,
  transformerLocation,
  transformerRegion,
  transformerPoleno,
  transformerType,
}) => {
  useEffect(() => {
    console.log('Transformer No passed:', transformerNo);
  }, [transformerNo]);

  // NOTE: demo-only local data (capacity/feeders/lastInspected)
  const transformer = transformers.find(t => t.id === transformerNo) || transformers[0];

  return (
    <div>
      <h2 className="page-title2">Transformer</h2>
      <div className="page-header-container">
        {/* Left Section */}
        <div className="header-left-section">
          <h2 className="transformer-title">{transformerNo}</h2>
          <p className="transformer-location">{transformerLocation}</p>
          <p className="transformer-landmark">📍 {transformerRegion}</p>

          {/* Badges */}
          <div className="badges-container">
            <span className="badge">
              {transformerPoleno}
              <span className="badge-label">Pole No</span>
            </span>

            <span className="badge">
              {transformer?.capacity}
              <span className="badge-label">Capacity</span>
            </span>

            <span className="badge">
              {transformerType}
              <span className="badge-label">Type</span>
            </span>

            <span className="badge">
              {transformer?.feeders}
              <span className="badge-label">No. of Feeders</span>
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="header-right-section">
          <p className="last-inspected-text">
            Last Updated Date: {transformer?.lastInspected}
          </p>

          {/* First row of buttons */}
          <div className="button-group">
            <button className="baseline-button">
              📷 Baseline Image
              <Eye className="icon-button icon-view" size={20} />
              <Trash2 className="icon-button icon-delete" size={20} />
            </button>
          </div>

          {/* (New Element button moved to InspectionsST) */}
        </div>
      </div>
    </div>
  );
};

export default PageHeaderST;
