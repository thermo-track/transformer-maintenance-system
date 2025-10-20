import React from 'react';
import './ConfirmDialog.css';

/**
 * Reusable confirmation dialog component
 * @param {boolean} isOpen - Whether the dialog is visible
 * @param {function} onConfirm - Callback when user confirms
 * @param {function} onCancel - Callback when user cancels
 * @param {string} title - Dialog title
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Text for confirm button (default: "Confirm")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {string} confirmButtonClass - Additional class for confirm button (default: "danger")
 */
const ConfirmDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'danger',
  icon = '⚠️'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="confirm-dialog-overlay" onClick={handleCancel}>
      <div className="confirm-dialog-container" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          <span className="confirm-dialog-icon">{icon}</span>
          <h3 className="confirm-dialog-title">{title}</h3>
        </div>
        
        <div className="confirm-dialog-body">
          <p className="confirm-dialog-message">{message}</p>
        </div>
        
        <div className="confirm-dialog-footer">
          <button 
            className="confirm-dialog-btn cancel-btn" 
            onClick={handleCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-dialog-btn confirm-btn ${confirmButtonClass}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
