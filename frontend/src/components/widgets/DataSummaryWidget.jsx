import { useEffect, useState } from 'react';
import { mockDataService } from '../../services/mockDataService';
import './DataSummaryWidget.css';

function DataSummaryWidget() {
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDataCount();
  }, []);

  const fetchDataCount = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await mockDataService.getStats();
      setTotalCount(stats.total);
    } catch (err) {
      setError('Failed to load data count');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-summary-widget widget-card">
      <div className="widget-header">
        <h3>📊 Data Summary</h3>
      </div>
      <div className="widget-content">
        {loading ? (
          <div className="widget-loading">Loading...</div>
        ) : error ? (
          <div className="widget-error">{error}</div>
        ) : (
          <div className="summary-content">
            <div className="summary-icon">📁</div>
            <div className="summary-count">{totalCount}</div>
            <div className="summary-label">Total Records</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataSummaryWidget;
