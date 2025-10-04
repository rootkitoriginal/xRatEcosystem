import { useState } from 'react';
import './DataExport.css';

function DataExport({ onExport }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      await onExport(format);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="data-export">
      <h4>📥 Export Data</h4>
      <div className="export-buttons">
        <button
          className="export-btn export-json"
          onClick={() => handleExport('json')}
          disabled={exporting}
          title="Export as JSON"
        >
          📄 Export JSON
        </button>
        <button
          className="export-btn export-csv"
          onClick={() => handleExport('csv')}
          disabled={exporting}
          title="Export as CSV"
        >
          📊 Export CSV
        </button>
      </div>
      {exporting && <div className="export-loading">Preparing export...</div>}
    </div>
  );
}

export default DataExport;
