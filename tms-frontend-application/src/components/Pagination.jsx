export default function Pagination({ page, size, totalPages, onChange }) {
return (
<div className="pagination">
<button className="btn" disabled={page <= 0} onClick={() => onChange(page - 1)}>
◀ Prev
</button>
<span className="meta">Page {page + 1} / {Math.max(totalPages, 1)}</span>
<button className="btn" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>
Next ▶
</button>
</div>
);
}
