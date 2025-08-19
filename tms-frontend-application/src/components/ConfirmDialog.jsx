export default function ConfirmDialog({ title = 'Are you sure?', text, onConfirm, onCancel }) {
return (
<div className="card" style={{borderColor:'#6b1e2c'}}>
<h3 style={{marginTop:0}}>{title}</h3>
{text && <p className="meta">{text}</p>}
<div className="actions">
<button className="btn" onClick={onCancel}>Cancel</button>
<button className="btn danger" onClick={onConfirm}>Delete</button>
</div>
</div>
);
}