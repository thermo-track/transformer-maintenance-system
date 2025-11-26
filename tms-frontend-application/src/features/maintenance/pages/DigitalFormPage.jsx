import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inspectionService } from '../services/InspectionService';
import { transformerService } from '../services/TransformerService';
import AnnotationService from '../../../services/AnnotationService';
import { useAuth } from '../../../contexts/AuthContext';
import '../styles/digital-form.css';

const DigitalFormPage = () => {
  const { user } = useAuth();
  const { transformerId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [transformer, setTransformer] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState('');
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    inspectionDate: '',
    inspectionTime: '',
    inspectedBy: '',
    baselineRight: '',
    baselineLeft: '',
    baselineFront: '',
    lastMonthKVA: '',
    lastMonthDate: '',
    lastMonthTime: '',
    currentMonthKVA: '',
    baselineCondition: 'Sunny',
    transformerType: '',
    meterSerial: '',
    meterCTRatio: '',
    meterMake: 'Microstar',
    checklist: [
      { no: 1, c: false, cl: false, t: false, r: false, other: '', ok: false, notOk: false, irNos: '' },
      { no: 2, c: false, cl: false, t: false, r: false, other: '', ok: false, notOk: false, irNos: '' },
      { no: 3, c: false, cl: false, t: false, r: false, other: '', ok: false, notOk: false, irNos: '' },
      { no: 4, c: false, cl: false, t: false, r: false, other: '', ok: false, notOk: false, irNos: '' }
    ],
    afterThermalDate: '',
    afterThermalTime: '',
    firstInspection: {
      vR: '', vY: '', vB: '',
      iR: '', iY: '', iB: ''
    },
    secondInspection: {
      vR: '', vY: '', vB: '',
      iR: '', iY: '', iB: ''
    }
  });
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleChecklistChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };
  
  const handleInspectionReadingChange = (inspectionType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [inspectionType]: { ...prev[inspectionType], [field]: value }
    }));
  };

  // Fetch transformer details and inspections on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch transformer details by ID
        const transformerData = await transformerService.getTransformerById(transformerId);
        console.log('Fetched transformer data:', transformerData);
        setTransformer(transformerData);
        
        // Set transformer type from database
        if (transformerData.type) {
          setFormData(prev => ({ ...prev, transformerType: transformerData.type }));
        }

        // Fetch inspections for this transformer using transformerNo
        const inspectionsData = await inspectionService.getInspectionsByTransformer(transformerData.transformerNo);
        console.log('Fetched inspections data:', inspectionsData);
        
        // Sort by date (newest first) - handle both inspectionDate and inspectionTimestamp
        const sortedInspections = inspectionsData.sort((a, b) => {
          const dateA = new Date(a.inspectionDate || a.inspectionTimestamp);
          const dateB = new Date(b.inspectionDate || b.inspectionTimestamp);
          return dateB - dateA;
        });
        
        setInspections(sortedInspections);

        // Auto-select the latest inspection (first in sorted list)
        if (sortedInspections.length > 0) {
          setSelectedInspectionId(sortedInspections[0].inspectionId);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (transformerId) {
      fetchData();
    }
  }, [transformerId]);

  // Fetch inspection details and anomalies when selection changes
  useEffect(() => {
    const fetchInspectionDetails = async () => {
      if (!selectedInspectionId) return;

      try {
        setLoading(true);
        
        // Fetch inspection details
        const inspectionData = await inspectionService.getInspectionById(selectedInspectionId);
        setSelectedInspection(inspectionData);

        // Populate form fields from inspection data
        if (inspectionData) {
          const timestamp = new Date(inspectionData.inspectionTimestamp || inspectionData.inspectionDate);
          const date = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
          const time = timestamp.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
          
          setFormData(prev => ({
            ...prev,
            inspectionDate: date,
            inspectionTime: time,
            inspectedBy: user?.username || savedFormData?.inspectedBy || '', // Use authenticated user
            baselineCondition: inspectionData.environmentalCondition || prev.baselineCondition
          }));
        }

        // Fetch saved digital form data
        const savedFormData = await inspectionService.getDigitalFormData(selectedInspectionId);
        if (savedFormData) {
          console.log('Loaded saved form data:', savedFormData);
          console.log('First inspection readings:', savedFormData.firstInspection);
          console.log('Second inspection readings:', savedFormData.secondInspection);
          
          // Merge saved data with current form data
          setFormData(prev => ({
            ...prev,
            inspectedBy: savedFormData.inspectedBy || prev.inspectedBy,
            baselineRight: savedFormData.baselineRight || prev.baselineRight,
            baselineLeft: savedFormData.baselineLeft || prev.baselineLeft,
            baselineFront: savedFormData.baselineFront || prev.baselineFront,
            lastMonthKVA: savedFormData.lastMonthKVA || prev.lastMonthKVA,
            lastMonthDate: savedFormData.lastMonthDate || prev.lastMonthDate,
            lastMonthTime: savedFormData.lastMonthTime || prev.lastMonthTime,
            currentMonthKVA: savedFormData.currentMonthKVA || prev.currentMonthKVA,
            baselineCondition: savedFormData.baselineCondition || prev.baselineCondition,
            meterSerial: savedFormData.meterSerial || prev.meterSerial,
            meterCTRatio: savedFormData.meterCTRatio || prev.meterCTRatio,
            meterMake: savedFormData.meterMake || prev.meterMake,
            checklist: savedFormData.checklist || prev.checklist,
            afterThermalDate: savedFormData.afterThermalDate || prev.afterThermalDate,
            afterThermalTime: savedFormData.afterThermalTime || prev.afterThermalTime,
            firstInspection: savedFormData.firstInspection ? {
              vR: savedFormData.firstInspection.vR || '',
              vY: savedFormData.firstInspection.vY || '',
              vB: savedFormData.firstInspection.vB || '',
              iR: savedFormData.firstInspection.iR || '',
              iY: savedFormData.firstInspection.iY || '',
              iB: savedFormData.firstInspection.iB || ''
            } : prev.firstInspection,
            secondInspection: savedFormData.secondInspection ? {
              vR: savedFormData.secondInspection.vR || '',
              vY: savedFormData.secondInspection.vY || '',
              vB: savedFormData.secondInspection.vB || '',
              iR: savedFormData.secondInspection.iR || '',
              iY: savedFormData.secondInspection.iY || '',
              iB: savedFormData.secondInspection.iB || ''
            } : prev.secondInspection
          }));
        } else {
          console.log('No saved form data found for this inspection');
        }

        // Fetch anomalies/annotations for this inspection
        const annotationsData = await AnnotationService.getAnnotations(selectedInspectionId);
        
        // Combine AI detections and user annotations
        const allAnomalies = [
          ...(annotationsData.aiDetections || []),
          ...(annotationsData.userAnnotations || [])
        ];
        
        setAnomalies(allAnomalies);
        
        // Draw bounding boxes after anomalies are loaded
        setTimeout(() => drawBoundingBoxes(allAnomalies), 100);

      } catch (err) {
        console.error('Error fetching inspection details:', err);
        setError(`Failed to load inspection details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInspectionDetails();
  }, [selectedInspectionId]);
  
  // Add print event listeners to redraw canvas
  useEffect(() => {
    const handleBeforePrint = () => {
      // Wait for print layout to settle, then redraw
      setTimeout(() => {
        if (imageRef.current && canvasRef.current) {
          drawBoundingBoxes();
        }
      }, 250);
    };
    
    const handleAfterPrint = () => {
      // Redraw after printing to restore screen layout
      setTimeout(() => {
        if (imageRef.current && canvasRef.current) {
          drawBoundingBoxes();
        }
      }, 100);
    };
    
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    
    // Also listen for media query changes
    const printMediaQuery = window.matchMedia('print');
    const handleMediaChange = (e) => {
      if (e.matches) {
        // Switched to print media
        setTimeout(() => drawBoundingBoxes(), 250);
      }
    };
    
    if (printMediaQuery.addEventListener) {
      printMediaQuery.addEventListener('change', handleMediaChange);
    }
    
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      if (printMediaQuery.removeEventListener) {
        printMediaQuery.removeEventListener('change', handleMediaChange);
      }
    };
  }, [anomalies]);

  const handleSave = async () => {
    if (!selectedInspectionId) {
      alert('Please select an inspection first');
      return;
    }

    try {
      setSaving(true);
      setSaveSuccess(false);
      
      console.log('Saving form data:', formData);
      
      // Helper function to convert empty strings to null for proper backend handling
      const cleanInspectionReadings = (readings) => {
        if (!readings) return null;
        return {
          vR: readings.vR && readings.vR.trim() !== '' ? readings.vR : null,
          vY: readings.vY && readings.vY.trim() !== '' ? readings.vY : null,
          vB: readings.vB && readings.vB.trim() !== '' ? readings.vB : null,
          iR: readings.iR && readings.iR.trim() !== '' ? readings.iR : null,
          iY: readings.iY && readings.iY.trim() !== '' ? readings.iY : null,
          iB: readings.iB && readings.iB.trim() !== '' ? readings.iB : null
        };
      };
      
      // Prepare data for backend - explicitly structure all fields
      const dataToSave = {
        inspectionId: selectedInspectionId,
        inspectedBy: formData.inspectedBy,
        baselineRight: formData.baselineRight,
        baselineLeft: formData.baselineLeft,
        baselineFront: formData.baselineFront,
        lastMonthKVA: formData.lastMonthKVA,
        lastMonthDate: formData.lastMonthDate,
        lastMonthTime: formData.lastMonthTime,
        currentMonthKVA: formData.currentMonthKVA,
        baselineCondition: formData.baselineCondition,
        meterSerial: formData.meterSerial,
        meterCTRatio: formData.meterCTRatio,
        meterMake: formData.meterMake,
        checklist: formData.checklist,
        afterThermalDate: formData.afterThermalDate,
        afterThermalTime: formData.afterThermalTime,
        firstInspection: cleanInspectionReadings(formData.firstInspection),
        secondInspection: cleanInspectionReadings(formData.secondInspection)
      };
      
      console.log('Structured data to save:', dataToSave);
      
      await inspectionService.saveDigitalFormData(selectedInspectionId, dataToSave);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // Clear success message after 3 seconds
      
      console.log('Form data saved successfully');
    } catch (error) {
      console.error('Error saving form data:', error);
      alert(`Failed to save form data: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    // Create a custom print sequence that ensures canvas is drawn correctly
    const printSequence = async () => {
      // Step 1: Apply print styles by adding a class
      document.body.classList.add('printing');
      
      // Step 2: Force a complete layout recalculation
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });
      
      // Step 3: Wait for images to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 4: Clear and redraw canvas with print dimensions
      if (canvasRef.current && imageRef.current && containerRef.current) {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        const ctx = canvas.getContext('2d');
        
        // Get the print layout dimensions
        const imageRect = image.getBoundingClientRect();
        
        // Completely recreate the canvas
        canvas.width = imageRect.width;
        canvas.height = imageRect.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Redraw with current dimensions
        drawBoundingBoxes();
      }
      
      // Step 5: Wait a bit more for canvas to render
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Step 6: Trigger print
      window.print();
      
      // Step 7: Cleanup after print dialog closes
      setTimeout(() => {
        document.body.classList.remove('printing');
        // Redraw canvas for screen view
        drawBoundingBoxes();
      }, 500);
    };
    
    printSequence();
  };
  
  const drawBoundingBoxes = (anomalyList = anomalies) => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const container = containerRef.current;
    
    if (!canvas || !image || !container || !image.complete || !image.naturalWidth) {
      return;
    }

    const ctx = canvas.getContext('2d');
    
    // Get the actual rendered dimensions of the image element
    const imageRect = image.getBoundingClientRect();
    
    // Set canvas to match the IMAGE size exactly, not container
    canvas.width = imageRect.width;
    canvas.height = imageRect.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate scale based on actual rendered image size vs natural size
    const scaleX = imageRect.width / image.naturalWidth;
    const scaleY = imageRect.height / image.naturalHeight;

    anomalyList.forEach((detection) => {
      if (detection.bboxX === null || detection.bboxY === null) return;
      
      // No offset needed since canvas matches image exactly
      const x = detection.bboxX * scaleX;
      const y = detection.bboxY * scaleY;
      const width = detection.bboxWidth * scaleX;
      const height = detection.bboxHeight * scaleY;
      
      // Check if the bounding box is within the canvas bounds
      if (x + width < 0 || y + height < 0 || 
          x > canvas.width || y > canvas.height) {
        return;
      }
      
      const confidence = detection.faultConfidence || 0;
      const faultType = detection.faultType || detection.anomalyType || '';
      
      let color = '#ff4444';
      if (confidence >= 0.8) color = '#ff4444';
      else if (confidence >= 0.6) color = '#ffa500';
      else color = '#ffff00';
      
      if (detection.source === 'USER_ADDED') {
        color = '#00ff00';
      }
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(x, y, width, height);
      ctx.globalAlpha = 1.0;
      
      const label = `${faultType} ${(confidence * 100).toFixed(0)}%`;
      ctx.font = '14px Arial';
      const textWidth = ctx.measureText(label).width;
      
      const labelY = y > 25 ? y - 5 : y + height + 20;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, labelY - 18, textWidth + 10, 22);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x + 5, labelY - 3);
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAnomalyTypeColor = (type) => {
    const colors = {
      'HOT_SPOT': '#ef4444',
      'OVERHEATING': '#f97316',
      'TEMPERATURE_ANOMALY': '#f59e0b',
      'DEFECT': '#dc2626',
      'default': '#6b7280'
    };
    return colors[type] || colors.default;
  };

  if (loading && !transformer) {
    return (
      <div className="digital-form-container">
        <div className="loading-state">Loading maintenance form...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="digital-form-container">
        <button onClick={() => navigate(-1)} className="back-button no-print">← Back</button>
        <div className="error-state">{error}</div>
      </div>
    );
  }

  return (
    <div className="digital-form-container">
      {/* Header - hidden in print */}
      <div className="form-header no-print">
        <button onClick={() => navigate(-1)} className="back-button">← Back</button>
        <h1>Digital Maintenance Form</h1>
        <button onClick={handlePrint} className="print-button">🖨️ Print / Save PDF</button>
      </div>

      {/* Main form content */}
      <div className="form-content">
        
        {/* Transformer Metadata Section */}
        <section className="form-section">
          <h2 className="section-title">Transformer Information</h2>
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="metadata-label">Transformer ID:</span>
              <span className="metadata-value">{transformer?.id || 'N/A'}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Transformer No:</span>
              <span className="metadata-value">{transformer?.transformerNo || 'N/A'}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Location:</span>
              <span className="metadata-value">{transformer?.locationDetails || 'N/A'}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Region:</span>
              <span className="metadata-value">{transformer?.region || 'N/A'}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Pole No:</span>
              <span className="metadata-value">{transformer?.poleNo || 'N/A'}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Type:</span>
              <span className="metadata-value">{transformer?.type || 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* Inspection Selection */}
        <section className="form-section">
          <h2 className="section-title">Inspection Details</h2>
          
          {inspections.length === 0 ? (
            <p className="no-data-message">No inspections available for this transformer.</p>
          ) : (
            <>
              <div className="inspection-selector no-print">
                <label htmlFor="inspection-select" className="selector-label">
                  Select Inspection:
                </label>
                <select
                  id="inspection-select"
                  value={selectedInspectionId}
                  onChange={(e) => setSelectedInspectionId(e.target.value)}
                  className="inspection-dropdown"
                >
                  {inspections.map((insp) => (
                    <option key={insp.inspectionId} value={insp.inspectionId}>
                      ID: {insp.inspectionId} | {formatDate(insp.inspectionDate || insp.inspectionTimestamp)} | {insp.status || 'Pending'}
                    </option>
                  ))}
                </select>
                
                <button 
                  onClick={handleSave} 
                  className="save-button"
                  disabled={saving || !selectedInspectionId}
                >
                  {saving ? 'Saving...' : 'Save Form Data'}
                </button>
                
                {saveSuccess && (
                  <span className="save-success-message">✓ Saved successfully!</span>
                )}
              </div>

              {/* Selected inspection info (shown in print) */}
              {selectedInspection && (
                <div className="inspection-info">
                  <div className="metadata-grid">
                    <div className="metadata-item">
                      <span className="metadata-label">Inspection ID:</span>
                      <span className="metadata-value">{selectedInspection.inspectionId}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">Date & Time:</span>
                      <span className="metadata-value">{formatDate(selectedInspection.inspectionDate || selectedInspection.inspectionTimestamp)}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">Environmental Condition:</span>
                      <span className="metadata-value">{selectedInspection.environmentalCondition || 'N/A'}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">Status:</span>
                      <span className="metadata-value status-badge">{selectedInspection.status || 'Pending'}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Thermal Image Section */}
        {selectedInspection && selectedInspection.thermalImageUrl && (
          <section className="form-section">
            <h2 className="section-title">Thermal Image with Anomaly Annotations</h2>
            <div className="image-container" ref={containerRef}>
              <img 
                ref={imageRef}
                src={selectedInspection.thermalImageUrl} 
                alt="Thermal inspection" 
                className="thermal-image"
                onLoad={() => drawBoundingBoxes()}
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                  width: '100%',
                  height: '100%'
                }}
              />
            </div>
          </section>
        )}

        {/* Inspection Header Section */}
        <section className="form-section">
          <h2 className="section-title">Inspection Header</h2>
          <div className="form-row-3">
            <div className="form-field">
              <label>Date of Inspection</label>
              <input 
                type="date" 
                value={formData.inspectionDate}
                onChange={(e) => handleFormChange('inspectionDate', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label>Time</label>
              <input 
                type="time" 
                value={formData.inspectionTime}
                onChange={(e) => handleFormChange('inspectionTime', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label>Inspected By</label>
              <input 
                type="text" 
                value={formData.inspectedBy}
                onChange={(e) => handleFormChange('inspectedBy', e.target.value)}
                placeholder="eg: A-110"
                className="form-input"
              />
            </div>
          </div>
        </section>

        {/* Base Line Imaging Section */}
        <section className="form-section">
          <h2 className="section-title">Base Line Imaging nos (IR)</h2>
          <div className="form-row-3">
            <div className="form-field">
              <label>Right</label>
              <input 
                type="text" 
                value={formData.baselineRight}
                onChange={(e) => handleFormChange('baselineRight', e.target.value)}
                placeholder="eg: IR 02052"
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label>Left</label>
              <input 
                type="text" 
                value={formData.baselineLeft}
                onChange={(e) => handleFormChange('baselineLeft', e.target.value)}
                placeholder="eg: IR 02053"
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label>Front</label>
              <input 
                type="text" 
                value={formData.baselineFront}
                onChange={(e) => handleFormChange('baselineFront', e.target.value)}
                placeholder="eg: IR 02054"
                className="form-input"
              />
            </div>
          </div>
        </section>

        {/* Historical & Current Data Section */}
        <section className="form-section">
          <h2 className="section-title">Historical & Current Data</h2>
          <div className="form-row-3">
            <div className="form-field">
              <label>Last Month kVA</label>
              <input 
                type="text" 
                value={formData.lastMonthKVA}
                onChange={(e) => handleFormChange('lastMonthKVA', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label>Date</label>
              <input 
                type="date" 
                value={formData.lastMonthDate}
                onChange={(e) => handleFormChange('lastMonthDate', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label>Time</label>
              <input 
                type="time" 
                value={formData.lastMonthTime}
                onChange={(e) => handleFormChange('lastMonthTime', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-row-3" style={{ marginTop: '12px' }}>
            <div className="form-field">
              <label>Current Month kVA</label>
              <input 
                type="text" 
                value={formData.currentMonthKVA}
                onChange={(e) => handleFormChange('currentMonthKVA', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label>Base Line Condition</label>
              <select 
                value={formData.baselineCondition}
                onChange={(e) => handleFormChange('baselineCondition', e.target.value)}
                className="form-input"
              >
                <option>Sunny</option>
                <option>Cloudy</option>
                <option>Rainy</option>
              </select>
            </div>
            <div className="form-field">
              <label>Transformer Type</label>
              <select 
                value={formData.transformerType}
                onChange={(e) => handleFormChange('transformerType', e.target.value)}
                className="form-input"
              >
                <option>Bulk</option>
                <option>Distribution</option>
                <option>Power</option>
              </select>
            </div>
          </div>
        </section>

        {/* Meter Details Section */}
        <section className="form-section">
          <h2 className="section-title">Meter Details</h2>
          <div className="form-row-3">
            <div className="form-field">
              <label>Serial</label>
              <input 
                type="text" 
                value={formData.meterSerial}
                onChange={(e) => handleFormChange('meterSerial', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label>Meter CT Ratio</label>
              <div className="input-with-suffix">
                <input 
                  type="number" 
                  value={formData.meterCTRatio}
                  onChange={(e) => handleFormChange('meterCTRatio', e.target.value)}
                  className="form-input"
                />
                <span className="input-suffix">/5A</span>
              </div>
            </div>
            <div className="form-field">
              <label>Make</label>
              <select 
                value={formData.meterMake}
                onChange={(e) => handleFormChange('meterMake', e.target.value)}
                className="form-input"
              >
                <option>Microstar</option>
                <option>Landis+Gyr</option>
                <option>Siemens</option>
                <option>ABB</option>
              </select>
            </div>
          </div>
        </section>

        {/* Inspection Checklist Grid */}
        <section className="form-section">
          <h2 className="section-title">Inspection Checklist</h2>
          <div className="checklist-container">
            <div className="checklist-left">
              <h3 className="checklist-subtitle">Work Content</h3>
              <table className="checklist-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>C</th>
                    <th>Cl</th>
                    <th>T</th>
                    <th>R</th>
                    <th>Other</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.checklist.map((item, index) => (
                    <tr key={index}>
                      <td>{item.no}</td>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={item.c}
                          onChange={(e) => handleChecklistChange(index, 'c', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={item.cl}
                          onChange={(e) => handleChecklistChange(index, 'cl', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={item.t}
                          onChange={(e) => handleChecklistChange(index, 't', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={item.r}
                          onChange={(e) => handleChecklistChange(index, 'r', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          value={item.other}
                          onChange={(e) => handleChecklistChange(index, 'other', e.target.value)}
                          className="other-input"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="checklist-legend">
                <strong>Legend:</strong> C- Check, Cl- Clean, T- Tight, R- Replace
              </p>
            </div>
            
            <div className="checklist-right">
              <h3 className="checklist-subtitle">After Inspection Report</h3>
              <table className="checklist-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>OK</th>
                    <th>NOT OK</th>
                    <th>IR No(s)</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.checklist.map((item, index) => (
                    <tr key={index}>
                      <td>{item.no}</td>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={item.ok}
                          onChange={(e) => {
                            handleChecklistChange(index, 'ok', e.target.checked);
                            if (e.target.checked) handleChecklistChange(index, 'notOk', false);
                          }}
                        />
                      </td>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={item.notOk}
                          onChange={(e) => {
                            handleChecklistChange(index, 'notOk', e.target.checked);
                            if (e.target.checked) handleChecklistChange(index, 'ok', false);
                          }}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          value={item.irNos}
                          onChange={(e) => handleChecklistChange(index, 'irNos', e.target.value)}
                          className="other-input"
                          placeholder="eg: IR-001"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="form-row-2" style={{ marginTop: '16px' }}>
                <div className="form-field">
                  <label>After Thermal Date</label>
                  <input 
                    type="date" 
                    value={formData.afterThermalDate}
                    onChange={(e) => handleFormChange('afterThermalDate', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label>Time</label>
                  <input 
                    type="time" 
                    value={formData.afterThermalTime}
                    onChange={(e) => handleFormChange('afterThermalTime', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Voltage and Current Readings Section */}
        <section className="form-section">
          <h2 className="section-title">Voltage and Current Readings</h2>
          <div className="readings-container">
            <div className="reading-card">
              <h3 className="reading-title">First Inspection Voltage and Current Readings</h3>
              <table className="readings-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>R</th>
                    <th>Y</th>
                    <th>B</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="reading-label">V</td>
                    <td>
                      <input 
                        type="number" 
                        value={formData.firstInspection.vR}
                        onChange={(e) => handleInspectionReadingChange('firstInspection', 'vR', e.target.value)}
                        className="reading-input"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={formData.firstInspection.vY}
                        onChange={(e) => handleInspectionReadingChange('firstInspection', 'vY', e.target.value)}
                        className="reading-input"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={formData.firstInspection.vB}
                        onChange={(e) => handleInspectionReadingChange('firstInspection', 'vB', e.target.value)}
                        className="reading-input"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="reading-label">I</td>
                    <td>
                      <input 
                        type="number" 
                        value={formData.firstInspection.iR}
                        onChange={(e) => handleInspectionReadingChange('firstInspection', 'iR', e.target.value)}
                        className="reading-input"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={formData.firstInspection.iY}
                        onChange={(e) => handleInspectionReadingChange('firstInspection', 'iY', e.target.value)}
                        className="reading-input"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={formData.firstInspection.iB}
                        onChange={(e) => handleInspectionReadingChange('firstInspection', 'iB', e.target.value)}
                        className="reading-input"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="reading-card">
              <h3 className="reading-title">Second Inspection Voltage and Current Readings</h3>
              <table className="readings-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>R</th>
                    <th>Y</th>
                    <th>B</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="reading-label">V</td>
                    <td>
                      <input 
                        type="number" 
                        value={formData.secondInspection.vR}
                        onChange={(e) => handleInspectionReadingChange('secondInspection', 'vR', e.target.value)}
                        className="reading-input"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={formData.secondInspection.vY}
                        onChange={(e) => handleInspectionReadingChange('secondInspection', 'vY', e.target.value)}
                        className="reading-input"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={formData.secondInspection.vB}
                        onChange={(e) => handleInspectionReadingChange('secondInspection', 'vB', e.target.value)}
                        className="reading-input"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="reading-label">I</td>
                    <td>
                      <input 
                        type="number" 
                        value={formData.secondInspection.iR}
                        onChange={(e) => handleInspectionReadingChange('secondInspection', 'iR', e.target.value)}
                        className="reading-input"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={formData.secondInspection.iY}
                        onChange={(e) => handleInspectionReadingChange('secondInspection', 'iY', e.target.value)}
                        className="reading-input"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={formData.secondInspection.iB}
                        onChange={(e) => handleInspectionReadingChange('secondInspection', 'iB', e.target.value)}
                        className="reading-input"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Anomalies Section */}
        <section className="form-section">
          <h2 className="section-title">Detected Anomalies</h2>
          
          {loading && selectedInspectionId ? (
            <p className="loading-message">Loading anomalies...</p>
          ) : anomalies.length === 0 ? (
            <p className="no-data-message">No anomalies detected for this inspection.</p>
          ) : (
            <div className="anomalies-list">
              <table className="anomalies-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Confidence</th>
                    <th>Source</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalies.map((anomaly, index) => (
                    <tr key={anomaly.anomalyId || index}>
                      <td>{index + 1}</td>
                      <td>
                        <span 
                          className="anomaly-type-badge"
                          style={{ backgroundColor: getAnomalyTypeColor(anomaly.anomalyType) }}
                        >
                          {anomaly.anomalyType || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        {(anomaly.xCoordinate || anomaly.centroidX) && (anomaly.yCoordinate || anomaly.centroidY) ? (
                          <span className="coordinates">
                            ({Math.round(anomaly.xCoordinate || anomaly.centroidX)}, {Math.round(anomaly.yCoordinate || anomaly.centroidY)})
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td>
                        {anomaly.confidence ? 
                          `${(anomaly.confidence * 100).toFixed(1)}%` : 
                          'N/A'
                        }
                      </td>
                      <td>
                        <span className={`source-badge ${anomaly.isAiDetection ? 'ai' : 'manual'}`}>
                          {anomaly.isAiDetection ? 'AI' : 'Manual'}
                        </span>
                      </td>
                      <td className="details-cell">
                        {anomaly.description || 'No description available'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Summary Section */}
        <section className="form-section summary-section">
          <h2 className="section-title">Inspection Summary</h2>
          <div className="summary-content">
            <div className="summary-stat">
              <span className="stat-label">Total Anomalies:</span>
              <span className="stat-value">{anomalies.length}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">AI Detections:</span>
              <span className="stat-value">
                {anomalies.filter(a => a.isAiDetection).length}
              </span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Manual Annotations:</span>
              <span className="stat-value">
                {anomalies.filter(a => !a.isAiDetection).length}
              </span>
            </div>
          </div>
        </section>

        {/* Print-only signature section */}
        <section className="form-section print-only signature-section">
          <h2 className="section-title">Approvals</h2>
          <div className="signature-grid">
            <div className="signature-box">
              <p className="signature-label">Inspector Signature:</p>
              <div className="signature-line"></div>
              <p className="signature-date">Date: _______________</p>
            </div>
            <div className="signature-box">
              <p className="signature-label">Supervisor Signature:</p>
              <div className="signature-line"></div>
              <p className="signature-date">Date: _______________</p>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="form-footer print-only">
        <p>This is an auto-generated maintenance record from the Transformer Maintenance System</p>
        <p>Generated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default DigitalFormPage;
