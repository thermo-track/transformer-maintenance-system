import { Link, useParams } from 'react-router-dom';
import { useTransformer } from '../hooks.js';

export default function View() {
  const { id } = useParams();
  const { data, isLoading, error } = useTransformer(id);

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

  return (
    <div>
      <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{margin:0}}>
          Transformer · {data.transformerNo || `${id}`}
        </h2>
        <div className="row" style={{gap:'.5rem'}}>
          <Link className="btn" to={`/transformers/${id}/edit`}>Edit</Link>
          <Link className="btn" to="/transformers">← Back to List</Link>
        </div>
      </div>

      <div className="grid cols-3" style={{marginTop:'1rem', gap:'1rem'}}>
        <Info label="Transformer No" value={data.transformerNo} />
        <Info label="Pole No" value={data.poleNo} />
        <Info label="Region" value={data.region} />
        <Info label="Type" value={data.type} />
        <Info label="Location Details" value={data.locationDetails} wide />
        
        {/* Additional metadata if available */}
        {data.createdAt && (
          <Info label="Created" value={new Date(data.createdAt).toLocaleDateString()} />
        )}
        {data.updatedAt && (
          <Info label="Last Updated" value={new Date(data.updatedAt).toLocaleDateString()} />
        )}
      </div>
    </div>
  );
}

function Info({ label, value, wide = false }) {
  const displayValue = value ?? '-';
  
  return (
    <div className="card" style={{
      gridColumn: wide ? '1 / -1' : 'span 1',
      padding: '1rem'
    }}>
      <div className="label" style={{
        fontSize: '0.875rem',
        color: '#666',
        marginBottom: '0.25rem',
        fontWeight: '500'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '1.05rem',
        fontWeight: '400',
        wordBreak: wide ? 'break-word' : 'normal'
      }}>
        {displayValue}
      </div>
    </div>
  );
}