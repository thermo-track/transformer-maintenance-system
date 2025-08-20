export default function ConfirmDialog({ title = 'Are you sure?', text, onConfirm, onCancel }) {
  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div 
        className="confirm-dialog card" 
        style={{borderColor:'#504e4fff'}}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside dialog
      >
        <h3 style={{marginTop:0}}>{title}</h3>
        {text && <p className="meta">{text}</p>}
        <div className="actions">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}