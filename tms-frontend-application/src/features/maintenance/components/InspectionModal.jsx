// components/InspectionModal.js
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import '../styles/modal.css';

const InspectionModal = ({ title, inspection, branches, transformerNo, onSubmit, onClose }) => {
  const isEdit = !!inspection;
  const isPerTransformerPage = !!transformerNo;

  const [formData, setFormData] = useState({
    branch: '',
    dateOfInspection: '',
    timeOfInspection: '',
    transformerNo: transformerNo || '' // keep in state so submit is consistent
  });

  const [errors, setErrors] = useState({});
  const [transformerOptions, setTransformerOptions] = useState([]);
  const [loadingTransformers, setLoadingTransformers] = useState(false);

  // Hydrate form
  useEffect(() => {
    if (inspection) {
      setFormData({
        branch: inspection.branch || '',
        dateOfInspection: inspection.dateOfInspection || '',
        timeOfInspection: inspection.timeOfInspection || '',
        transformerNo: inspection.transformerNo || ''
      });
    } else {
      setFormData({
        branch: '',
        transformerNo: isPerTransformerPage ? transformerNo : '', // Pre-fill if on per-transformer page
        dateOfInspection: '',
        timeOfInspection: '',
      });
    }
  }, [inspection, transformerNo, isPerTransformerPage]);

  useEffect(() => {
    // Skip fetching transformers if we're on per-transformer page
    if (isPerTransformerPage) {
      setTransformerOptions([transformerNo]);
      return;
    }

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
  }, [formData.branch, isEdit, isPerTransformerPage]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.branch.trim()) newErrors.branch = 'Branch is required';
    if (!formData.transformerNo.trim()) newErrors.transformerNo = 'Transformer No is required';
    if (!formData.dateOfInspection) newErrors.dateOfInspection = 'Date of inspection is required';
    if (!formData.timeOfInspection) newErrors.timeOfInspection = 'Time of inspection is required';

// Updated validation logic for the validateForm function
// Replace the existing date validation section with this:

// Date and Time validation - combine and convert to UTC
if (formData.dateOfInspection && formData.timeOfInspection) {
  // Combine date and time strings
  const dateTimeString = `${formData.dateOfInspection}T${formData.timeOfInspection}`;
  console.log("🔗 Combined DateTime String:", dateTimeString);
  
  // Create Date object (this will be in user's local timezone)
  const selectedDateTime = new Date(dateTimeString);
  console.log("📅 Selected DateTime (Local):", selectedDateTime.toString());
  console.log("🌍 Selected DateTime (ISO/UTC):", selectedDateTime.toISOString());
  
  // Get current time
  const now = new Date();
  console.log("🕒 Current Time (Local):", now.toString());
  console.log("🌍 Current Time (ISO/UTC):", now.toISOString());
  
  // Convert both to UTC timestamps for comparison
  const selectedUtcTimestamp = selectedDateTime.getTime();
  const currentUtcTimestamp = now.getTime();
  
  console.log("⏰ Selected UTC Timestamp:", selectedUtcTimestamp);
  console.log("⏰ Current UTC Timestamp:", currentUtcTimestamp);
  console.log("📊 Difference (ms):", selectedUtcTimestamp - currentUtcTimestamp);
  console.log("📊 Difference (minutes):", Math.round((selectedUtcTimestamp - currentUtcTimestamp) / (1000 * 60)));
  
  if (selectedUtcTimestamp > currentUtcTimestamp) {
    console.log("❌ Validation Failed: Selected datetime is in the future!");
    newErrors.dateOfInspection = "Inspection date and time cannot be in the future";
    // You might also want to show error on time field
    // newErrors.timeOfInspection = "Inspection date and time cannot be in the future";
  } else {
    console.log("✅ Validation Passed: DateTime is in the past or now");
  }
} else if (formData.dateOfInspection && !formData.timeOfInspection) {
  // If only date is provided, we can still do a basic check
  // but it's less precise since we don't know the exact time
  console.log("⚠️ Only date provided, doing basic date-only validation");
  
  const selectedDate = new Date(formData.dateOfInspection);
  const today = new Date();
  
  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];
  
  console.log("📅 Selected Date (YYYY-MM-DD):", selectedDateStr);
  console.log("📅 Today (YYYY-MM-DD):", todayStr);
  
  if (selectedDateStr > todayStr) {
    console.log("❌ Date-only validation failed: Selected date is in the future!");
    newErrors.dateOfInspection = "Inspection date cannot be in the future";
  } else {
    console.log("✅ Date-only validation passed");
  }
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
              <label className="form-label">
                Transformer ID * {isPerTransformerPage && <span className="text-muted"></span>}
              </label>
              {isPerTransformerPage ? (
                // Show as read-only input on per-transformer page
                <input
                  type="text"
                  name="transformerNo"
                  value={formData.transformerNo}
                  className="form-input readonly"
                  readOnly
                  style={{cursor: 'not-allowed' }}
                />
              ) : (
                // Show as dropdown on all-transformers page
                <select
                  name="transformerNo"
                  value={formData.transformerNo}
                  onChange={handleChange}
                  className={`form-select ${errors.transformerNo ? 'error' : ''}`}
                  disabled={loadingTransformers || transformerOptions.length === 0}
                >
                  {/* Show placeholder ONLY in Create mode on all-transformers page */}
                  {!isEdit && (
                    <option value="">
                      {loadingTransformers ? 'Loading…' : 'Select Transformer'}
                    </option>
                  )}
                  {transformerOptions.map((no) => (
                    <option key={no} value={no}>
                      {no}
                    </option>
                  ))}
                </select>
              )}
              {errors.transformerNo && (
                <span className="error-message">{errors.transformerNo}</span>
              )}
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
