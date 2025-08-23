// src/features/transformers/components/TransformerModal.jsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useCreateTransformer, useUpdateTransformer } from '../hooks.js';
import TransformerForm from './TransformerForm.jsx';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export default function TransformerModal({ 
  asModal = false, 
  onClose, 
  onSuccess, 
  mode = 'create', // 'create' or 'edit'
  transformer = null, // existing transformer data for edit mode
  transformerId = null // transformer ID for edit mode
}) {
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  // Use appropriate hook based on mode
  const create = useCreateTransformer();
  const update = useUpdateTransformer(transformerId);
  
  const isEdit = mode === 'edit';
  const title = isEdit ? 'Edit Transformer' : 'Create Transformer';

  async function handleSubmit(payload) {
    try {
      setSubmitting(true);
      
      if (isEdit) {
        await update.mutateAsync(payload);
      } else {
        await create.mutateAsync(payload);
      }
      
      if (asModal && onSuccess) {
        onSuccess(); // Call success callback for modal
      } else {
        nav('/transformers', { replace: true }); // Normal page navigation
      }
    } catch (error) {
      console.error(`${isEdit ? 'Update' : 'Create'} transformer failed:`, error);
      alert(`Failed to ${isEdit ? 'update' : 'create'} transformer: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    if (asModal && onClose) {
      onClose(); // Close modal
    } else {
      nav('/transformers'); // Normal page navigation
    }
  }

  // Handle clicking outside modal to close
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const body = (
    <div className="transformer-modal-wrapper">
      <div className="modal-header">
        <h3 className="modal-title">{title}</h3>
        {asModal && (
          <button className="modal-close-btn" onClick={handleCancel}>
            <X className="icon-sm" />
          </button>
        )}
      </div>

      <div className="modal-body">
        <TransformerForm
          mode={mode}
          initial={transformer} // Pass existing data for edit mode
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitting={submitting || (isEdit ? update.isPending : create.isPending)}
        />
      </div>
    </div>
  );

  // If not modal, render as normal page
  if (!asModal) {
    return (
      <div>
        <div className="row" style={{ justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
        </div>
        <TransformerForm
          mode={mode}
          initial={transformer}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitting={submitting || (isEdit ? update.isPending : create.isPending)}
        />
      </div>
    );
  }

  // Modal: portal into a full-screen overlay using same classes as InspectionModal
  return createPortal(
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {body}
      </div>
    </div>,
    document.body
  );
}