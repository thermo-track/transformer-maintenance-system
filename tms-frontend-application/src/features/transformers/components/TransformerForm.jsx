import { useEffect, useMemo, useState } from 'react';
import { REGION_OPTIONS, TYPE_OPTIONS } from '../constants.js';
import { useMetaOptions } from '../hooks.js';

export default function TransformerForm({ mode = 'create', initial = null, onSubmit, submitting }) {
  const [values, setValues] = useState(() => ({
    transformerNo: initial?.transformerNo || '',
    poleNo: initial?.poleNo || '',
    region: initial?.region || '', // Empty by default for placeholder
    type: initial?.type || '', // Empty by default for placeholder
    locationDetails: initial?.locationDetails || ''
  }));

  const [validationError, setValidationError] = useState('');

  const { data: meta } = useMetaOptions(REGION_OPTIONS, TYPE_OPTIONS);
  const regions = meta?.regions || REGION_OPTIONS;
  const types = meta?.types || TYPE_OPTIONS;

  useEffect(() => {
    if (initial) {
      setValues(v => ({
        ...v,
        transformerNo: initial.transformerNo || '',
        poleNo: initial.poleNo || '',
        region: initial.region || '',
        type: initial.type || '',
        locationDetails: initial.locationDetails || ''
      }));
    }
  }, [initial]);

  const disabledFields = useMemo(() => ({
    transformerNo: mode === 'edit' // unique; usually not editable
  }), [mode]);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues(v => ({ ...v, [name]: value }));
    
    // Clear validation error when user starts filling fields
    if (validationError) {
      setValidationError('');
    }
  }

  function validateForm() {
    const requiredFields = {
      transformerNo: 'Transformer No',
      poleNo: 'Pole No',
      region: 'Region',
      type: 'Type'
    };

    const emptyFields = [];
    
    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!values[field] || values[field].trim() === '') {
        emptyFields.push(label);
      }
    });

    if (emptyFields.length > 0) {
      if (emptyFields.length === 1) {
        setValidationError(`Please fill in the ${emptyFields[0]} field.`);
      } else if (emptyFields.length === 2) {
        setValidationError(`Please fill in the ${emptyFields.join(' and ')} fields.`);
      } else {
        const lastField = emptyFields.pop();
        setValidationError(`Please fill in the ${emptyFields.join(', ')}, and ${lastField} fields.`);
      }
      return false;
    }

    return true;
  }

  function submit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const payload = { ...values };
    if (mode === 'edit') {
      // On update, backend ignores nulls, only send editable fields
      delete payload.transformerNo;
    }
    onSubmit(payload);
  }

  return (
    <form onSubmit={submit} className="grid cols-2" style={{gap:'1rem'}}>
      {validationError && (
        <div 
          className="validation-error" 
          style={{
            gridColumn: '1 / -1',
            padding: '0.75rem',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '0.9rem',
            marginBottom: '0.5rem'
          }}
        >
          ⚠️ {validationError}
        </div>
      )}

      <div>
        <label className="label">Transformer No *</label>
        <input 
          className="input" 
          name="transformerNo" 
          value={values.transformerNo}
          onChange={handleChange} 
          disabled={disabledFields.transformerNo} 
          required 
          style={{
            borderColor: !values.transformerNo && validationError ? '#dc2626' : undefined
          }}
        />
      </div>

      <div>
        <label className="label">Pole No *</label>
        <input 
          className="input" 
          name="poleNo" 
          value={values.poleNo}
          onChange={handleChange} 
          required 
          style={{
            borderColor: !values.poleNo && validationError ? '#dc2626' : undefined
          }}
        />
      </div>

      <div>
        <label className="label">Region *</label>
        <select 
          className="select" 
          name="region" 
          value={values.region} 
          onChange={handleChange}
          style={{
            fontStyle: !values.region ? 'italic' : 'normal',
            color: !values.region ? '#9ca3af' : 'inherit',
            borderColor: !values.region && validationError ? '#dc2626' : undefined
          }}
        >
          <option value="" disabled style={{fontStyle: 'italic', color: '#9ca3af'}}>
            Select a region
          </option>
          {regions.map(r => (
            <option key={r} value={r} style={{fontStyle: 'normal', color: 'inherit'}}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Type *</label>
        <select 
          className="select" 
          name="type" 
          value={values.type} 
          onChange={handleChange}
          style={{
            fontStyle: !values.type ? 'italic' : 'normal',
            color: !values.type ? '#9ca3af' : 'inherit',
            borderColor: !values.type && validationError ? '#dc2626' : undefined
          }}
        >
          <option value="" disabled style={{fontStyle: 'italic', color: '#9ca3af'}}>
            Select a type
          </option>
          {types.map(t => (
            <option key={t} value={t} style={{fontStyle: 'normal', color: 'inherit'}}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid cols-2" style={{gridColumn:'1 / -1'}}>
        <div style={{gridColumn:'1 / -1'}}>
          <label className="label">Location details</label>
          <textarea 
            className="textarea" 
            rows={3} 
            name="locationDetails"
            value={values.locationDetails} 
            onChange={handleChange}
            placeholder="Enter additional location details"
          />
        </div>
      </div>

      <div className="actions" style={{gridColumn:'1 / -1'}}>
        <button className="btn" type="button" onClick={() => history.back()}>Cancel</button>
        <button className="btn primary" disabled={submitting}>
          {submitting ? 'Saving…' : (mode === 'create' ? 'Create' : 'Save changes')}
        </button>
      </div>
    </form>
  );
}