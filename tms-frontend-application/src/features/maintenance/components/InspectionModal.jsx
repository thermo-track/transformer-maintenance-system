// components/InspectionModal.js
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import '../styles/modal.css';

const InspectionModal = ({ title, inspection, branches, transformerNo, onSubmit, onClose }) => {
  const isEdit = !!inspection;

  const [formData, setFormData] = useState({
    branch: '',
    dateOfInspection: '',
    timeOfInspection: '',
    transformerNo: transformerNo || '' // keep in state so submit is consistent
  });

  const [errors, setErrors] = useState({});

  // Hydrate form
  useEffect(() => {
    if (isEdit) {
      setFormData({
        branch: inspection.branch || '',
        dateOfInspection: inspection.dateOfInspection || '',
        timeOfInspection: inspection.timeOfInspection || '',
        transformerNo: transformerNo || inspection.transformerNo || ''
      });
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');

      setFormData({
        branch: '',
        dateOfInspection: today,
        timeOfInspection: `${hh}:${mm}`,
        transformerNo: transformerNo || ''
      });
    }
  }, [isEdit, inspection, transformerNo]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.branch.trim()) newErrors.branch = 'Branch is required';
    if (!formData.transformerNo.trim()) newErrors.transformerNo = 'Transformer No is required';
    if (!formData.dateOfInspection) newErrors.dateOfInspection = 'Date of inspection is required';
    if (!formData.timeOfInspection) newErrors.timeOfInspection = 'Time of inspection is required';

    // Date cannot be in the future
    if (formData.dateOfInspection) {
      const selectedDate = new Date(formData.dateOfInspection);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) newErrors.dateOfInspection = 'Inspection date cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    // Always submit transformerNo from frozen state/prop
    onSubmit({
      branch: formData.branch.trim(),
      dateOfInspection: formData.dateOfInspection,
      timeOfInspection: formData.timeOfInspection,
      transformerNo: transformerNo || formData.transformerNo
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'transformerNo') return; // frozen; ignore
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

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

            {/* Frozen Transformer No */}
            <div className="form-group">
              <label className="form-label">Transformer No *</label>
              <input
                type="text"
                name="transformerNo"
                value={transformerNo || formData.transformerNo || ''}
                readOnly
                disabled
                className={`form-input ${errors.transformerNo ? 'error' : ''}`}
              />
              {errors.transformerNo && <span className="error-message">{errors.transformerNo}</span>}
            </div>

            {/* Branch */}
            <div className="form-group">
              <label className="form-label">Branch *</label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className={`form-select ${errors.branch ? 'error' : ''}`}
              >
                <option value="">Select Branch</option>
                {branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {errors.branch && <span className="error-message">{errors.branch}</span>}
            </div>

            {/* Date */}
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

            {/* Time */}
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
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="button" onClick={handleSubmit} className="btn-primary">
              {isEdit ? 'Update Inspection' : 'Create Inspection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionModal;
