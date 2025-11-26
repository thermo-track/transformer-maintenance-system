import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inspectionService } from '../services/InspectionService';
import { transformerService } from '../services/TransformerService';
import AnnotationService from '../../../services/AnnotationService';
import '../styles/digital-form.css';

const DigitalFormPage = () => {
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
  
  // Form data state
  const [formData, setFormData] = useState({
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectionTime: '12:05',
    inspectedBy: '',
    baselineRight: '',
    baselineLeft: '',
    baselineFront: '',
    lastMonthKVA: '',
    lastMonthDate: '',
    lastMonthTime: '',
    currentMonthKVA: '',
    baselineCondition: 'Sunny',
    transformerType: 'Bulk',
    meterSerial: '',
    meterCTRatio: '',
    meterMake: 'Microstar',
    checklist: [
      { no: 1, c: false, cl: false, t: false, r: false, other: '' },
      { no: 2, c: false, cl: false, t: false, r: false, other: '' },
      { no: 3, c: false, cl: false, t: false, r: false, other: '' },
      { no: 4, c: false, cl: false, t: false, r: false, other: '' }
    ],
    afterInspectionOK: false,
    afterInspectionNotOK: false,
    afterInspectionIRNos: '',
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
