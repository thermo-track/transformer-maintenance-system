import { Link, useSearchParams, useNavigate, NavLink } from 'react-router-dom';
import { useTransformerList, useDeleteTransformer } from '../hooks.js';
import Pagination from '../../../components/Pagination.jsx';
import ConfirmDialog from '../../../components/ConfirmDialog.jsx';
import { useState, useEffect, useRef } from 'react';

export default function List() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const page = Number(sp.get('page') ?? 0);
  const size = Number(sp.get('size') ?? 10);
  const { data, isLoading, error } = useTransformerList(page, size);

  const [confirmId, setConfirmId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const del = useDeleteTransformer();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuOpenId && !event.target.closest('.menu')) {
        setMenuOpenId(null);
      }
    }

    if (menuOpenId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpenId]);

  function goToPage(p) {
    setSp({ page: String(p), size: String(size) });
  }

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p style={{color:'salmon'}}>Error: {error.message}</p>;

  const content = data?.content ?? [];

  return (
    <div>

      <nav className="topnav">
          <div className="segmented">
            <Link  to="/transformers">Transformers</Link>
            <Link  to="">Inspections</Link> {/*TO BE ADDEDDDDDD */}
          </div>
      </nav>

      <div className="row" style={{justifyContent:'space-between'}}>
        <h2 style={{margin:0}}>Transformers</h2>
      </div>
      <div className='add'>
                <Link className="btn primary" to="/transformers/new">Add Transformer</Link>
      </div>

      <table className="table" style={{marginTop:'1rem'}}>
        <thead>
          <tr>
            <th></th>
            <th>Transformer No</th>
            <th>Pole No</th>
            <th>Region</th>
            <th>Type</th>
            <th style={{width:200}}></th>
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
              <td>
  <div className="row" style={{gap:'.4rem', justifyContent:'flex-start'}}>
    <Link className="btnn" to={`/transformers/${row.id}`}>View</Link>

    <div className="menu">
      <button
        className="btn icon"
        aria-haspopup="menu"
        aria-expanded={menuOpenId === row.id}
        onClick={() => setMenuOpenId(menuOpenId === row.id ? null : row.id)}
        title="More"
      >⋮</button>

      {menuOpenId === row.id && (
        <div className="menu-popover" role="menu">
          <button
            className="menu-item"
            onClick={() => { setMenuOpenId(null); nav(`/transformers/${row.id}/edit`); }}
          >
            Edit
          </button>
          <button
            className="menu-item danger"
            onClick={() => { setMenuOpenId(null); setConfirmId(row.id); }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
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