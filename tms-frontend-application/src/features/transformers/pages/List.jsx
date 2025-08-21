import { Link, useSearchParams, useNavigate, NavLink } from 'react-router-dom';
import { useTransformerList, useDeleteTransformer } from '../hooks.js';
import Pagination from '../../../components/Pagination.jsx';
import ConfirmDialog from '../../../components/ConfirmDialog.jsx';
import SearchBar from '../../../components/SearchBar.jsx';
import { useState, useEffect, useRef } from 'react';
import '../styles/List.css'


export default function List() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q     = searchParams.get("q")    || "";
  const by    = searchParams.get("by")   || "transformerNo";
  const range = searchParams.get("range")|| "all";

  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const page = Number(sp.get('page') ?? 0);
  const size = Number(sp.get('size') ?? 10);
  
  // Fixed: Use consistent parameters for both calls
  const { data, isLoading, error } = useTransformerList({ page, size, by, q, range });

  const [confirmId, setConfirmId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const del = useDeleteTransformer();

  function doSearch({ by, query, range }) {
    setSearchParams({
      page: 0,                   // reset to first page on new search
      size,
      by,
      q: query,
      range,
    });
  }

  function resetFilters() {
    setSearchParams({ page: 0, size, by: "transformerNo", q: "", range: "all" });
  }

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
    // Fixed: Include all current search parameters when changing page
    setSp({ 
      page: String(p), 
      size: String(size),
      by,
      q,
      range
    });
  }

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p style={{color:'salmon'}}>Error: {error.message}</p>;

  const content = data?.content ?? [];

  return (
    <div>

      <nav className="topnav">
          <div className="segmented">
            <Link  to="/transformers">Transformers</Link>
            <Link  to="/inspections">Inspections</Link> 
          </div>
      </nav>

      <div className="row" style={{justifyContent:'space-between'}}>
        <h2 style={{margin:0}}>Transformers</h2>
      </div>
      <div className='add'>
                <Link className="btn primary" to="/transformers/new">Add Transformer</Link>
      </div>
      {/* Search/filter bar */}
      <SearchBar
        initialBy={by}
        initialQuery={q}
        initialRange={range}
        onSearch={doSearch}
        onReset={resetFilters}
      />

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
            <tr><td colSpan={6} className="meta" style={{textAlign: 'center', padding: '2rem'}}>
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