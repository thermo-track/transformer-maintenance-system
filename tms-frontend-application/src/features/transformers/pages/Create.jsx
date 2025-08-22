// src/features/transformers/pages/Create.jsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useCreateTransformer } from '../hooks.js';
import TransformerForm from '../components/TransformerForm.jsx';
import { useNavigate, Link } from 'react-router-dom';

export default function Create({ asModal = false }) {
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const create = useCreateTransformer();

async function handleSubmit(payload) {
  try {
    setSubmitting(true);
    await create.mutateAsync(payload);       
    nav('/transformers', { replace: true });
  } catch (error) {
    console.error('Create transformer failed:', error);
    alert(`Failed to create transformer: ${error.message || 'Unknown error'}`);
  } finally {
    setSubmitting(false);
  }
}

  function handleCancel() {
    if (asModal) nav(-1);           // close overlay (return to background page)
    else nav('/transformers');      // normal page fallback
  }

  const body = (
    <div className="create-wrapper">
      <div className="row" style={{ justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
        <h2 style={{ margin: 0 }}>Create Transformer</h2>
         {asModal && (
          <button className="btn" onClick={handleCancel}>✕ Close</button>
         )}
      </div>

      <TransformerForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitting={submitting || create.isPending}
      />
    </div>
  );

  // If not modal, render as usual
  if (!asModal) return body;

  // Modal: portal into a full-screen overlay on top of the existing screen
  return createPortal(
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {body}
      </div>
    </div>,
    document.body
  );
}
