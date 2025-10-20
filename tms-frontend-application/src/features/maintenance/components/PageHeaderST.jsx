import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { baselineImageService } from '../services/BaselineImageService';
import '../styles/page-header-st.css';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';

const PageHeaderST = ({
  transformerId,
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

  const capacity = ['102.76', '78.77', '96.99', '123.33', '107.20'];
  const randomtransformerCapacity = capacity[Math.floor(Math.random() * capacity.length)];

  const feeders = ['2', '3', '4', '5', '6'];
  const randomtransformerFeeders = feeders[Math.floor(Math.random() * feeders.length)];

  useEffect(() => {
    const fetchLastUpdatedInfo = async () => {
      // Validate that we have the required transformerId before making API call
      if (!transformerId) {
        console.warn('PageHeaderST: transformerId is undefined, skipping last updated fetch');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const lastUpdatedData = await baselineImageService.getTransformerLastUpdated(transformerId);
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
  }, [transformerId]); // Use transformerId in dependency array since that's what we're using in the API call

  const handleBaselineImagesClick = () => {
    navigate(`/transformer/${transformerId}/baseimage`);
  };

  const formatLastUpdatedText = () => {
    if (loading) {
      return "Loading last updated date...";
    }
    
    if (error) {
      return "Unable to fetch last updated date";
    }

    if (!lastUpdatedInfo) {
      return "No update information available";
    }

    // Use lastImageUpdatedAt if available, otherwise fall back to transformerUpdatedAt, then transformerCreatedAt
    const dateToUse = lastUpdatedInfo.lastImageUpdatedAt 
      || lastUpdatedInfo.transformerUpdatedAt 
      || lastUpdatedInfo.transformerCreatedAt;

    if (!dateToUse) {
      return "No date information available";
    }

    const date = new Date(dateToUse);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // If we have image data, show full details
    if (lastUpdatedInfo.lastImageUpdatedAt) {
      const weatherCondition = lastUpdatedInfo.lastUpdatedCondition?.toLowerCase() || '';
      const uploadedBy = lastUpdatedInfo.lastUploadedBy || 'Unknown';
      return `Last updated: ${formattedDate} (${weatherCondition}) by ${uploadedBy}`;
    }

    // Otherwise, just show when the transformer was last updated/created
    const source = lastUpdatedInfo.transformerUpdatedAt ? 'Transformer updated' : 'Transformer created';
    return `${source}: ${formattedDate}`;
  };

  return (
    <div>
      <h2 className="page-title2">Transformer</h2>
      <div className="page-header-container">
        {/* Left Section */}
        <div className="header-left-section">
          <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="back-btn"
            onClick={() => navigate(-1)}
            style={{ marginBottom: "1rem" }}
          >
            <ArrowLeftIcon />
          </button>
          <h2 className="transformer-title">{transformerNo}</h2>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span className="transformer-landmark">{transformerRegion}</span>
            <span className="transformer-location">📍 {transformerLocation}</span>
          </div>

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

            <span className="badge">
              {randomtransformerCapacity}
              <span className="badge-label">Capacity</span>
            </span>

            <span className="badge">
              {randomtransformerFeeders}
              <span className="badge-label">No. of Feeders</span>
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