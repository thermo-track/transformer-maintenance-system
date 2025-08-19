import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTransformer, useUpdateTransformer } from '../hooks.js';
import TransformerForm from '../components/TransformerForm.jsx';
import { useState } from 'react';

export default function Edit() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, isLoading, error } = useTransformer(id);
  const update = useUpdateTransformer(id);
  const [submitting, setSubmitting] = useState(false);

  // Handle missing or invalid ID
  if (!id) {
    return (
      <div>
        <p style={{color:'salmon'}}>Error: Invalid transformer ID</p>
        <Link className="btn" to="/transformers">← Back to List</Link>
      </div>
    );
  }

  if (isLoading) return <p>Loading…</p>;
  
  if (error) {
    return (
      <div>
        <p style={{color:'salmon'}}>Error: {error.message}</p>
        <Link className="btn" to="/transformers">← Back to List</Link>
      </div>
    );
  }

  // Handle case where transformer is not found
  if (!data) {
    return (
      <div>
        <p style={{color:'salmon'}}>Transformer not found</p>
        <Link className="btn" to="/transformers">← Back to List</Link>
      </div>
    );
  }

  async function handleSubmit(payload) {
    try {
      setSubmitting(true);
      await update.mutateAsync(payload);
      nav(`/transformers/${id}`);
    } catch (error) {
      console.error('Update transformer failed:', error);
      alert(`Failed to update transformer: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    nav(`/transformers/${id}`);
  }

  return (
    <div>
      <div className="row" style={{justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
        <h2 style={{margin:0}}>Edit Transformer</h2>
        <div className="row" style={{gap:'.5rem'}}>
          <Link className="btn" to={`/transformers/${id}`}>← Back to View</Link>
          <Link className="btn" to="/transformers">List</Link>
        </div>
      </div>
      
      <TransformerForm 
        mode="edit" 
        initial={data} 
        onSubmit={handleSubmit} 
        onCancel={handleCancel}
        submitting={submitting || update.isPending} 
      />
    </div>
  );
}