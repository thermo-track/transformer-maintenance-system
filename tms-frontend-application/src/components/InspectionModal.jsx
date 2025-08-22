// components/InspectionModal.js
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import '../styles/modal.css';

const InspectionModal = ({ title, inspection, branches, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    branch: '',
    transformerId: '',
    dateOfInspection: '',
    timeOfInspection: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (inspection) {
      setFormData({
        branch: inspection.branch || '',
        transformerId: inspection.transformerId || '',
        dateOfInspection: inspection.dateOfInspection || '',
        timeOfInspection: inspection.timeOfInspection || ''
      });
    }
  }, [inspection]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.branch.trim()) {
      newErrors.branch = 'Branch is required';
    }
    
    if (!formData.transformerId.trim()) {
      newErrors.transformerId = 'Transformer ID is required';
    }
    
    if (!formData.dateOfInspection) {
      newErrors.dateOfInspection = 'Date of inspection is required';
    }
    
    if (!formData.timeOfInspection) {
      newErrors.timeOfInspection = 'Time of inspection is required';
    }

    // Validate date is not in the future
    if (formData.dateOfInspection) {
      const selectedDate = new Date(formData.dateOfInspection);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        newErrors.dateOfInspection = 'Inspection date cannot be in the future';
      }
    }

    // Validate transformer ID format (optional - adjust pattern as needed)
    if (formData.transformerId.trim()) {
      const transformerIdPattern = /^[A-Z]{1,2}-\d{4}$/;
      if (!transformerIdPattern.test(formData.transformerId.trim())) {
        newErrors.transformerId = 'Transformer ID format should be like AZ-9867';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [formData]);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="icon-sm" />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Branch *</label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className={`form-select ${errors.branch ? 'error' : ''}`}
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
              {errors.branch && <span className="error-message">{errors.branch}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Transformer ID *</label>
              <input
                type="text"
                name="transformerId"
                value={formData.transformerId}
                onChange={handleChange}
                className={`form-input ${errors.transformerId ? 'error' : ''}`}
                placeholder="Enter transformer ID (e.g., AZ-9867)"
                maxLength="10"
              />
              {errors.transformerId && <span className="error-message">{errors.transformerId}</span>}
              <small className="form-hint">Format: Two letters followed by dash and four digits</small>
            </div>

            <div className="form-group">
              <label className="form-label">Date of Inspection *</label>
              <input
                type="date"
                name="dateOfInspection"
                value={formData.dateOfInspection}
                onChange={handleChange}
                className={`form-input ${errors.dateOfInspection ? 'error' : ''}`}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.dateOfInspection && <span className="error-message">{errors.dateOfInspection}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Time of Inspection *</label>
              <input
                type="time"
                name="timeOfInspection"
                value={formData.timeOfInspection}
                onChange={handleChange}
                className={`form-input ${errors.timeOfInspection ? 'error' : ''}`}
              />
              {errors.timeOfInspection && <span className="error-message">{errors.timeOfInspection}</span>}
            </div>
          </div>


        </div>

        <div className="modal-footer">
          <div className="footer-buttons">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary"
            >
              {inspection ? 'Update Inspection' : 'Create Inspection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionModal;