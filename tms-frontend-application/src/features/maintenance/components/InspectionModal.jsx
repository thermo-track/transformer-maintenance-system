// components/InspectionModal.js
import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import '../styles/modal.css';

const InspectionModal = ({ title, inspection, branches, onSubmit, onClose }) => {
  const isEdit = !!inspection;

  const [formData, setFormData] = useState({
    branch: '',
    transformerNo: '',
    dateOfInspection: '',
    timeOfInspection: ''
  });

  const [errors, setErrors] = useState({});
  const [transformerOptions, setTransformerOptions] = useState([]);
  const [loadingTransformers, setLoadingTransformers] = useState(false);

  // Hydrate form when editing
  useEffect(() => {
    if (inspection) {
      setFormData({
        branch: inspection.branch || '',
        transformerNo: inspection.transformerNo || '',
        dateOfInspection: inspection.dateOfInspection || '',
        timeOfInspection: inspection.timeOfInspection || ''
      });
    } else {
      // ensure clean slate in create
      setFormData({
        branch: '',
        transformerNo: '',
        dateOfInspection: '',
        timeOfInspection: ''
      });
    }
  }, [inspection]);

  // Fetch transformer list:
  // - On initial open (all)
  // - Whenever branch changes (branch-scoped)
  useEffect(() => {
    const fetchTransformers = async () => {
      try {
        setLoadingTransformers(true);
        const qs = formData.branch ? `?region=${encodeURIComponent(formData.branch)}` : '';
        const res = await fetch(`/api/transformers/numbers${qs}`);
        if (!res.ok) throw new Error('Failed to load transformer numbers');
        const data = await res.json();

        let options = Array.isArray(data) ? data : [];

        // If editing and current transformerNo is not in the fetched list,
        // prepend it so it remains visible/selected.
        if (isEdit && formData.transformerNo && !options.includes(formData.transformerNo)) {
          options = [formData.transformerNo, ...options];
        }

        setTransformerOptions(options);
      } catch (e) {
        console.error(e);
        // Still ensure the current value is available in edit mode even if fetch fails
        if (isEdit && formData.transformerNo) {
          setTransformerOptions([formData.transformerNo]);
        } else {
          setTransformerOptions([]);
        }
      } finally {
        setLoadingTransformers(false);
      }
    };
    fetchTransformers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.branch, isEdit]); // depends on branch + mode

  const validateForm = () => {
    const newErrors = {};
    if (!formData.branch.trim()) newErrors.branch = 'Branch is required';
    if (!formData.transformerNo.trim()) newErrors.transformerNo = 'Transformer ID is required';
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
    if (validateForm()) onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => {
      if (name === 'branch') {
        // In CREATE: reset transformer when branch changes.
        // In EDIT: keep the currently selected transformer unless user changes it explicitly.
        return isEdit
          ? { ...prev, branch: value }
          : { ...prev, branch: value, transformerNo: '' };
      }
      return { ...prev, [name]: value };
    });

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && e.ctrlKey) handleSubmit();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); };
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
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
              {errors.branch && <span className="error-message">{errors.branch}</span>}
            </div>

            {/* Transformer ID (dropdown) */}
            <div className="form-group">
              <label className="form-label">Transformer ID *</label>
              <select
                name="transformerNo"
                value={formData.transformerNo}
                onChange={handleChange}
                className={`form-select ${errors.transformerNo ? 'error' : ''}`}
                disabled={loadingTransformers || transformerOptions.length === 0}
              >
                {/* Show placeholder ONLY in Create */}
                {!isEdit && (
                  <option value="">
                    {loadingTransformers ? 'Loading…' : 'Select Transformer'}
                  </option>
                )}
                {transformerOptions.map(no => (
                  <option key={no} value={no}>{no}</option>
                ))}
              </select>
              {errors.transformerNo && <span className="error-message">{errors.transformerNo}</span>}
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
              {inspection ? 'Update Inspection' : 'Create Inspection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionModal;
