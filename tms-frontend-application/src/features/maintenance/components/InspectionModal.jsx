// components/InspectionModal.js
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TimePicker } from 'antd';
import dayjs from 'dayjs';
import authFetch from '../../../lib/authFetch.js';
import '../styles/modal.css';

const InspectionModal = ({ title, inspection, branches, transformerNo, onSubmit, onClose }) => {
  const isEdit = !!inspection;
  const isPerTransformerPage = !!transformerNo;
  const timeFormat = 'HH:mm';

  const [formData, setFormData] = useState({
    branch: '',
    dateOfInspection: '',
    timeOfInspection: '',
    transformerNo: transformerNo || '' 
  });

  const [errors, setErrors] = useState({});
  const [transformerOptions, setTransformerOptions] = useState([]);
  const [loadingTransformers, setLoadingTransformers] = useState(false);

  // Helper function to convert backend timestamp to separate date and time
  const parseInspectionTimestamp = (timestamp) => {
    if (!timestamp) return { date: '', time: '' };
    
    try {
      console.log('🔍 Original timestamp from backend:', timestamp);
      
      // If the timestamp has timezone info (like +05:30), use it directly
      // If it's UTC (ends with Z), convert to local timezone
      let date;
      
      if (timestamp.includes('+') || timestamp.includes('-')) {
        // Timestamp already has timezone info - parse directly
        date = new Date(timestamp);
        console.log('📍 Timestamp with timezone info detected');
      } else if (timestamp.endsWith('Z')) {
        // UTC timestamp - need to convert to local timezone
        date = new Date(timestamp);
        console.log('🌍 UTC timestamp detected, converting to local');
      } else {
        // No timezone info - assume it's already in local timezone
        date = new Date(timestamp);
        console.log('⚠️ No timezone info - assuming local');
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return { date: '', time: '' };
      }
      
      console.log('🕐 Parsed Date object:', date.toString());
      console.log('🌍 UTC time:', date.toISOString());
      console.log('📍 Local time:', date.toLocaleString());
      
      // Extract local date and time components
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      const localDate = `${year}-${month}-${day}`;
      const localTime = `${hours}:${minutes}`;
      
      console.log('✅ Final local values for form:', { localDate, localTime });
      console.log('📅 Timezone offset (minutes):', date.getTimezoneOffset());
      
      return { date: localDate, time: localTime };
    } catch (error) {
      console.error('Error parsing timestamp:', error);
      return { date: '', time: '' };
    }
  };

  // Helper function to convert separate date and time to UTC timestamp
  const createInspectionTimestamp = (date, time) => {
    if (!date || !time) return null;
    
    try {
      // Combine date and time in local timezone
      const dateTimeString = `${date}T${time}:00`;
      const localDateTime = new Date(dateTimeString);
      
      if (isNaN(localDateTime.getTime())) {
        console.warn('Invalid date/time combination:', dateTimeString);
        return null;
      }
      
      // Get timezone offset in minutes and convert to ISO format
      const timezoneOffset = localDateTime.getTimezoneOffset();
      const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
      const offsetMinutes = Math.abs(timezoneOffset) % 60;
      const offsetSign = timezoneOffset <= 0 ? '+' : '-';
      const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
      
      // Create ISO string with proper timezone offset
      const year = localDateTime.getFullYear();
      const month = String(localDateTime.getMonth() + 1).padStart(2, '0');
      const day = String(localDateTime.getDate()).padStart(2, '0');
      const hours = String(localDateTime.getHours()).padStart(2, '0');
      const minutes = String(localDateTime.getMinutes()).padStart(2, '0');
      const seconds = String(localDateTime.getSeconds()).padStart(2, '0');
      
      const utcTimestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000${offsetString}`;
      
      console.log('🌍 Created timestamp:', dateTimeString, '→', utcTimestamp);
      console.log('🕐 Local DateTime:', localDateTime.toString());
      console.log('⏰ Timezone offset:', timezoneOffset, 'minutes');
      
      return utcTimestamp;
    } catch (error) {
      console.error('Error creating timestamp:', error);
      return null;
    }
  };

  // Hydrate form
  useEffect(() => {
    if (inspection) {
      // Parse timestamp from backend into separate date and time
      const { date, time } = parseInspectionTimestamp(
        inspection.inspectionTimestamp || 
        (inspection.dateOfInspection && inspection.timeOfInspection ? 
          `${inspection.dateOfInspection}T${inspection.timeOfInspection}:00.000Z` : null)
      );
      
      setFormData({
        branch: inspection.branch || '',
        dateOfInspection: date,
        timeOfInspection: time,
        transformerNo: inspection.transformerNo || ''
      });
    } else {
      setFormData({
        branch: '',
        transformerNo: isPerTransformerPage ? transformerNo : '',
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
        const res = await authFetch(`/api/transformers/numbers${qs}`);
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
      } else {
        console.log("✅ Validation Passed: DateTime is in the past or now");
      }
    } else if (formData.dateOfInspection && !formData.timeOfInspection) {
      // If only date is provided, we can still do a basic check
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
    
    // Convert separate date and time to UTC timestamp for backend
    const inspectionTimestamp = createInspectionTimestamp(
      formData.dateOfInspection, 
      formData.timeOfInspection
    );
    
    if (!inspectionTimestamp) {
      console.error('Failed to create inspection timestamp');
      return;
    }
    
    console.log('🚀 Submitting with timestamp:', inspectionTimestamp);
    
    // Submit with the new timestamp format expected by backend
    onSubmit({
      branch: formData.branch.trim(),
      inspectionTimestamp: inspectionTimestamp, // Send as single timestamp
      transformerNo: transformerNo || formData.transformerNo
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'transformerNo' && isPerTransformerPage) return; // frozen; ignore
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Handle time picker change
  const handleTimeChange = (time) => {
    const timeString = time ? time.format(timeFormat) : '';
    setFormData(prev => ({ ...prev, timeOfInspection: timeString }));
    if (errors.timeOfInspection) {
      setErrors(prev => ({ ...prev, timeOfInspection: '' }));
    }
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
                Transformer ID {isPerTransformerPage && <span className="text-muted"></span>}
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
              <label className="form-label">Branch</label>
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
              <label className="form-label">Date of Inspection</label>
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

            {/* Time - Updated with Ant Design TimePicker */}
            <div className="form-group">
              <label className="form-label">Time of Inspection</label>
              <TimePicker
                value={formData.timeOfInspection ? dayjs(formData.timeOfInspection, timeFormat) : null}
                format={timeFormat}
                onChange={handleTimeChange}
                placeholder="Select time"
                className={`form-input ${errors.timeOfInspection ? 'error' : ''}`}
                style={{ width: '100%' }}
                allowClear
                use12Hours={false}
                inputReadOnly={false}
                showNow={true}
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