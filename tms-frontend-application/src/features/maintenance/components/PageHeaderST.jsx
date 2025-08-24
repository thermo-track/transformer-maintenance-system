import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { baselineImageService } from '../services/BaselineImageService';
import '../styles/page-header-st.css';

const PageHeaderST = ({
  transformerNo,
  transformerLocation,
  transformerRegion,
  transformerPoleno,
  transformerType
}) => {
  const navigate = useNavigate();
  const [lastUpdatedInfo, setLastUpdatedInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLastUpdatedInfo = async () => {
      if (!transformerNo) return;
      
      try {
        setLoading(true);
        const lastUpdatedData = await baselineImageService.getTransformerLastUpdated(transformerNo);
        setLastUpdatedInfo(lastUpdatedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching last updated info:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLastUpdatedInfo();
  }, [transformerNo]); // Remove transformerService from dependencies

  const handleBaselineImagesClick = () => {
    navigate(`/transformer/${transformerNo}/baseimage`);
  };

  const formatLastUpdatedText = () => {
    if (loading) {
      return "Loading last updated date...";
    }
    
    if (error) {
      return "Unable to fetch last updated date";
    }

    if (!lastUpdatedInfo || !lastUpdatedInfo.lastImageUpdatedAt) {
      return "No images uploaded yet";
    }

    const date = new Date(lastUpdatedInfo.lastImageUpdatedAt);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const weatherCondition = lastUpdatedInfo.lastUpdatedWeatherCondition?.toLowerCase() || '';
    const uploadedBy = lastUpdatedInfo.lastImageUploadedBy || 'Unknown';

    return `${formattedDate}`;
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
              {transformerType}
              <span className="badge-label">Type</span>
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="header-right-section">
          <p className="last-inspected-text">
            Last Updated Date: {formatLastUpdatedText()}
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