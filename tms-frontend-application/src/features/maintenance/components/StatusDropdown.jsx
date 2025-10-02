import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';
import { inspectionService } from '../services/InspectionService';
import '../styles/status-dropdown.css';

const StatusDropdown = ({ inspection, onStatusUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(inspection?.status || 'PENDING'); // Default to PENDING if no status
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  // Get status options from service
  const statusOptions = inspectionService.getStatusOptions();

  // Handle null values and normalize status
  const normalizeStatus = (status) => {
    if (!status) return 'PENDING'; // Default to PENDING instead of null
    return status.toUpperCase().replace(' ', '_');
  };

  // Get display label for status
  const getStatusLabel = (status) => {
    if (!status) return 'Pending'; // Default display
    const option = statusOptions.find(opt => opt.value === normalizeStatus(status));
    return option ? option.label : status;
  };

  // Get CSS class for status styling
  const getStatusClass = (status) => {
    if (!status) return 'sd-status-pending'; // Default to pending styling
    
    switch (normalizeStatus(status)) {
      case 'COMPLETED': return 'sd-status-completed';
      case 'IN_PROGRESS': return 'sd-status-progress';
      case 'PENDING': return 'sd-status-pending';
      case 'SCHEDULED': return 'sd-status-scheduled';
      default: return 'sd-status-default';
    }
  };

  // Update current status when inspection prop changes
  useEffect(() => {
    setCurrentStatus(inspection?.status || 'PENDING'); // Default to PENDING
    setError(null);
  }, [inspection]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle status selection
  const handleStatusSelect = async (newStatus) => {
    if (!inspection?.inspectionId) {
      setError('Invalid inspection ID');
      return;
    }

    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      setIsOpen(false);

      console.log(`Updating inspection ${inspection.inspectionId} status from "${currentStatus}" to "${newStatus}"`);

      // Call the API to update status
      await inspectionService.updateInspectionStatus(inspection.inspectionId, newStatus);

      // Update local state
      setCurrentStatus(newStatus);

      // Notify parent component
      if (onStatusUpdate) {
        onStatusUpdate(inspection.inspectionId, newStatus);
      }

      console.log(`Status updated successfully for inspection ${inspection.inspectionId}`);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status');
      
      // Revert to previous status on error
      setCurrentStatus(inspection?.status || 'PENDING');
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!isUpdating) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="sd-status-dropdown-container" ref={dropdownRef}>
      <div 
        className={`sd-status-dropdown-trigger ${getStatusClass(currentStatus)} ${isUpdating ? 'sd-updating' : ''} ${error ? 'sd-error' : ''}`}
        onClick={toggleDropdown}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown();
          }
        }}
      >
        <span className="sd-status-text">
          {isUpdating ? 'Updating...' : getStatusLabel(currentStatus)}
        </span>
        
        {isUpdating ? (
          <div className="sd-status-spinner" />
        ) : error ? (
          <AlertCircle className="icon-xs sd-status-error-icon" />
        ) : (
          <ChevronDown className={`icon-xs sd-status-chevron ${isOpen ? 'sd-rotated' : ''}`} />
        )}
      </div>

      {isOpen && !isUpdating && (
        <div className="sd-status-dropdown-menu" role="listbox">
          {/* Only show the four status options */}
          {statusOptions.map((option) => (
            <div
              key={option.value}
              className={`sd-status-option ${normalizeStatus(currentStatus) === option.value ? 'sd-selected' : ''} sd-status-${option.value.toLowerCase().replace('_', '-')}`}
              onClick={() => handleStatusSelect(option.value)}
              role="option"
              aria-selected={normalizeStatus(currentStatus) === option.value}
            >
              <span className="sd-status-option-text">{option.label}</span>
              {normalizeStatus(currentStatus) === option.value && (
                <Check className="icon-xs sd-check-icon" />
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="sd-status-error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default StatusDropdown;