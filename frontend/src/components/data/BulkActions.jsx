import './BulkActions.css';

function BulkActions({ selectedCount, onBulkDelete, onDeselectAll }) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bulk-actions">
      <div className="bulk-info">
        <span className="selected-count">{selectedCount}</span> item{selectedCount !== 1 ? 's' : ''} selected
      </div>
      <div className="bulk-buttons">
        <button className="bulk-btn bulk-delete" onClick={onBulkDelete}>
          🗑️ Delete Selected
        </button>
        <button className="bulk-btn bulk-deselect" onClick={onDeselectAll}>
          ✕ Deselect All
        </button>
      </div>
    </div>
  );
}

export default BulkActions;
