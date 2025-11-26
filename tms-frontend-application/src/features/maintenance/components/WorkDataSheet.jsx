import React from 'react';
import { TimePicker } from 'antd';
import dayjs from 'dayjs';
import './WorkDataSheet.css';

const WorkDataSheet = ({ formData, onInputChange, canEdit }) => {
  const timeFormat = 'HH:mm';

  // Handle time picker change for time fields
  const handleTimeChange = (fieldName) => (time) => {
    const timeString = time ? time.format(timeFormat) : '';
    // Create a synthetic event to match the onInputChange signature
    onInputChange({
      target: {
        name: fieldName,
        value: timeString
      }
    });
  };

  return (
    <div className="work-data-sheet">
      {/* Section 2: Time & Supervision */}
      <div className="wds-section">
        <div className="wds-three-col-grid">
          <div className="wds-form-field">
            <label>Start Time</label>
            <TimePicker
              value={formData.startTime ? dayjs(formData.startTime, timeFormat) : null}
              format={timeFormat}
              onChange={handleTimeChange('startTime')}
              placeholder="Select time"
              className="form-input"
              style={{ width: '100%' }}
              allowClear
              use12Hours={false}
              showNow={true}
              disabled={!canEdit}
            />
          </div>
          <div className="wds-form-field">
            <label>Completion Time</label>
            <TimePicker
              value={formData.completionTime ? dayjs(formData.completionTime, timeFormat) : null}
              format={timeFormat}
              onChange={handleTimeChange('completionTime')}
              placeholder="Select time"
              className="form-input"
              style={{ width: '100%' }}
              allowClear
              use12Hours={false}
              showNow={true}
              disabled={!canEdit}
            />
          </div>
          <div className="wds-form-field">
            <label>Supervised By</label>
            <input
              type="text"
              name="supervisedBy"
              value={formData.supervisedBy || ''}
              onChange={onInputChange}
              disabled={!canEdit}
              placeholder="A-221"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Gang Composition */}
      <div className="wds-section">
        <h3 className="wds-section-title">Gang Composition</h3>
        <div className="wds-two-col-grid">
          <div className="wds-form-field">
            <label>Tech I</label>
            <input
              type="text"
              name="techI"
              value={formData.techI || ''}
              onChange={onInputChange}
              disabled={!canEdit}
            />
          </div>
          <div className="wds-form-field">
            <label>Tech II</label>
            <input
              type="text"
              name="techII"
              value={formData.techII || ''}
              onChange={onInputChange}
              disabled={!canEdit}
            />
          </div>
          <div className="wds-form-field">
            <label>Tech III</label>
            <input
              type="text"
              name="techIII"
              value={formData.techIII || ''}
              onChange={onInputChange}
              disabled={!canEdit}
            />
          </div>
          <div className="wds-form-field">
            <label>Helpers</label>
            <input
              type="text"
              name="helpers"
              value={formData.helpers || ''}
              onChange={onInputChange}
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Section 4: Inspection & Rectification Log */}
      <div className="wds-section">
        <h3 className="wds-section-title">Inspection & Rectification Log</h3>
        <div className="wds-split-layout">
          {/* Row 1: Inspected By */}
          <div className="wds-split-row">
            <div className="wds-form-field">
              <label>Inspected By</label>
              <input
                type="text"
                name="inspectedByWds"
                value={formData.inspectedByWds || ''}
                onChange={onInputChange}
                disabled={!canEdit}
                placeholder="Enter inspector name"
              />
            </div>
            <div className="wds-form-field">
              <label>Date</label>
              <input
                type="date"
                name="inspectedDate"
                value={formData.inspectedDate || ''}
                onChange={onInputChange}
                disabled={!canEdit}
              />
            </div>
          </div>

          {/* Row 2: Rectified By */}
          <div className="wds-split-row">
            <div className="wds-form-field">
              <label>Rectified By</label>
              <input
                type="text"
                name="rectifiedBy"
                value={formData.rectifiedBy || ''}
                onChange={onInputChange}
                disabled={!canEdit}
                placeholder="Enter technician name"
              />
            </div>
            <div className="wds-form-field">
              <label>Date</label>
              <input
                type="date"
                name="rectifiedDate"
                value={formData.rectifiedDate || ''}
                onChange={onInputChange}
                disabled={!canEdit}
              />
            </div>
          </div>

          {/* Row 3: Re-Inspected By */}
          <div className="wds-split-row">
            <div className="wds-form-field">
              <label>Re-Inspected By</label>
              <input
                type="text"
                name="reInspectedBy"
                value={formData.reInspectedBy || ''}
                onChange={onInputChange}
                disabled={!canEdit}
                placeholder="Enter inspector name"
              />
            </div>
            <div className="wds-form-field">
              <label>Date</label>
              <input
                type="date"
                name="reInspectedDate"
                value={formData.reInspectedDate || ''}
                onChange={onInputChange}
                disabled={!canEdit}
              />
            </div>
          </div>

          {/* Row 4: CSS */}
          <div className="wds-split-row">
            <div className="wds-form-field">
              <label>CSS</label>
              <input
                type="text"
                name="cssPerson"
                value={formData.cssPerson || ''}
                onChange={onInputChange}
                disabled={!canEdit}
                placeholder="Enter CSS name"
              />
            </div>
            <div className="wds-form-field">
              <label>Date</label>
              <input
                type="date"
                name="cssDate"
                value={formData.cssDate || ''}
                onChange={onInputChange}
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Final Verification */}
      <div className="wds-section">
        <h3 className="wds-section-title">All identified spots were corrected</h3>
        <div className="wds-two-col-grid">
          <div className="wds-form-field">
            <label>CSS</label>
            <input
              type="text"
              name="finalCssPerson"
              value={formData.finalCssPerson || ''}
              onChange={onInputChange}
              disabled={!canEdit}
              placeholder="Enter CSS name"
            />
          </div>
          <div className="wds-form-field">
            <label>Date</label>
            <input
              type="date"
              name="finalCssDate"
              value={formData.finalCssDate || ''}
              onChange={onInputChange}
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkDataSheet;
