import { useState } from 'react';
import { useCreateTransformer } from '../hooks.js';
import TransformerForm from '../components/TransformerForm.jsx';
import { useNavigate, Link } from 'react-router-dom';

export default function Create() {
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const create = useCreateTransformer();

  async function handleSubmit(payload) {
    try {
      setSubmitting(true);
      const res = await create.mutateAsync(payload);
      
      // Navigate to the created transformer's detail page
      if (res?.id) {
        nav(`/transformers/${res.id}`);
      } else {
        // Fallback navigation if ID is not returned
        nav('/transformers');
      }
    } catch (error) {
      console.error('Create transformer failed:', error);
      alert(`Failed to create transformer: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    nav('/transformers');
  }

  return (
    <div>
      <div className="row" style={{justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
        <h2 style={{margin:0}}>Create Transformer</h2>
        <Link className="btn" to="/transformers">← Back to List</Link>
      </div>
      
      <TransformerForm 
        mode="create" 
        onSubmit={handleSubmit} 
        onCancel={handleCancel}
        submitting={submitting || create.isPending} 
      />
    </div>
  );
}