import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import '../styles/page-header-st.css';
import transformers from '../data/transformers';

const PageHeaderST = ({
  transformerNo,
  transformerLocation,
  transformerRegion,
  transformerPoleno,
  transformerType,
}) => {
  const navigate = useNavigate();

  // NOTE: demo-only local data (capacity/feeders/lastInspected)
  const transformer = transformers.find(t => t.id === transformerNo) || transformers[0];

  const handleBaselineImagesClick = () => {
    navigate(`/transformer/${transformerNo}/baseimage`);
  };

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

          {/* Baseline Images Navigation Button */}
          <div className="button-group">
            <button 
              onClick={handleBaselineImagesClick}
              className="baseline-images-nav-btn"
            >
              <Camera size={20} />
              Manage Baseline Images
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeaderST;