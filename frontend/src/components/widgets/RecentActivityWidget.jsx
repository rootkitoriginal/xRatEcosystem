import { useEffect, useState } from 'react';
import { dataService } from '../../services/dataService';
import './RecentActivityWidget.css';

function RecentActivityWidget() {
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get data sorted by updatedAt in descending order, limit to 5
      const result = await dataService.getAll({
        limit: 5,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
      setRecentItems(result.data);
    } catch (err) {
      setError('Failed to load recent activity');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString();
  };

  return (
    <div className="recent-activity-widget widget-card">
      <div className="widget-header">
        <h3>⏱️ Recent Activity</h3>
      </div>
      <div className="widget-content">
        {loading ? (
          <div className="widget-loading">Loading...</div>
        ) : error ? (
          <div className="widget-error">{error}</div>
        ) : recentItems.length === 0 ? (
          <div className="widget-empty">No recent activity</div>
        ) : (
          <ul className="activity-list">
            {recentItems.map((item) => (
              <li key={item.id} className="activity-item">
                <div className="activity-name">{item.name}</div>
                <div className="activity-date">{formatDate(item.updatedAt)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default RecentActivityWidget;
