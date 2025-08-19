import { Link, useSearchParams } from 'react-router-dom';
import { useTransformerList, useDeleteTransformer } from '../hooks.js';
import Pagination from '../../../components/Pagination.jsx';
import ConfirmDialog from '../../../components/ConfirmDialog.jsx';
import { useState } from 'react';

export default function List() {
  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get('page') ?? 0);
  const size = Number(sp.get('size') ?? 10);
  const { data, isLoading, error } = useTransformerList(page, size);

  const [confirmId, setConfirmId] = useState(null);
  const del = useDeleteTransformer();

  function goToPage(p) {
    setSp({ page: String(p), size: String(size) });
  }

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p style={{color:'salmon'}}>Error: {error.message}</p>;

  const content = data?.content ?? [];

  return (
    <div>
      <div className="row" style={{justifyContent:'space-between'}}>
        <h2 style={{margin:0}}>Transformers</h2>
        <Link className="btn primary" to="/transformers/new">+ New</Link>
      </div>

      <table className="table" style={{marginTop:'1rem'}}>
        <thead>
          <tr>
            <th></th>
            <th>Transformer No</th>
            <th>Pole No</th>
            <th>Region</th>
            <th>Type</th>
            <th>Location</th>
            <th style={{width:200}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {content.map((row, idx) => (
            <tr key={row.id}>
              <td>{idx + 1 + page * size}</td>
              <td><Link to={`/transformers/${row.id}`}>{row.transformerNo}</Link></td>
              <td>{row.poleNo ?? '-'}</td>
              <td><span className="badge">{row.region ?? '-'}</span></td>
              <td><span className="badge">{row.type ?? '-'}</span></td>
              <td className="meta">{row.locationDetails ?? '-'}</td>
              <td>
                <div className="row" style={{gap:'.4rem'}}>
                  <Link className="btn" to={`/transformers/${row.id}`}>View</Link>
                  <Link className="btn" to={`/transformers/${row.id}/edit`}>Edit</Link>
                  <button 
                    className="btn danger" 
                    onClick={() => setConfirmId(row.id)}
                    disabled={del.isPending}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {content.length === 0 && (
            <tr><td colSpan={7} className="meta" style={{textAlign: 'center', padding: '2rem'}}>
              No transformers found
            </td></tr>
          )}
        </tbody>
      </table>
      
      <div className="row" style={{justifyContent:'space-between', marginTop:'1rem'}}>
        <div className="meta">
          Showing {content.length} of {data?.totalElements ?? 0}
        </div>
        <Pagination 
          page={data?.number ?? 0} 
          size={data?.size ?? size}
          totalPages={data?.totalPages ?? 0} 
          onChange={goToPage} 
        />
      </div>

      {confirmId && (
        <ConfirmDialog
          text="This will permanently delete the transformer. This action cannot be undone."
          onCancel={() => setConfirmId(null)}
          onConfirm={async () => {
            try {
              await del.mutateAsync(confirmId);
              setConfirmId(null);
              // Optional: Show success message
            } catch (error) {
              console.error('Delete failed:', error);
              alert(`Failed to delete transformer: ${error.message}`);
              setConfirmId(null);
            }
          }}
          loading={del.isPending}
        />
      )}
    </div>
  );
}