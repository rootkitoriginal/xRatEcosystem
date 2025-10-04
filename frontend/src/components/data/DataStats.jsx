import { useEffect, useState } from 'react';
import './DataStats.css';

function DataStats({ stats }) {
  const [animatedStats, setAnimatedStats] = useState({
    total: 0,
    totalValue: 0,
  });

  useEffect(() => {
    // Animate numbers
    const duration = 1000;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedStats({
        total: Math.floor(stats.total * progress),
        totalValue: Math.floor(stats.totalValue * progress),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats({
          total: stats.total,
          totalValue: stats.totalValue,
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [stats.total, stats.totalValue]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="data-stats">
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{animatedStats.total}</div>
            <div className="stat-label">Total Records</div>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(animatedStats.totalValue)}</div>
            <div className="stat-label">Total Value</div>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-value">{Object.keys(stats.byCategory || {}).length}</div>
            <div className="stat-label">Categories</div>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">{stats.byStatus?.Active || 0}</div>
            <div className="stat-label">Active Items</div>
          </div>
        </div>
      </div>

      <div className="stats-breakdown">
        <div className="breakdown-section">
          <h4>By Status</h4>
          <div className="breakdown-items">
            {Object.entries(stats.byStatus || {}).map(([status, count]) => (
              <div key={status} className="breakdown-item">
                <span className="breakdown-label">{status}</span>
                <span className="breakdown-value">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="breakdown-section">
          <h4>By Category</h4>
          <div className="breakdown-items">
            {Object.entries(stats.byCategory || {}).map(([category, count]) => (
              <div key={category} className="breakdown-item">
                <span className="breakdown-label">{category}</span>
                <span className="breakdown-value">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="breakdown-section">
          <h4>By Priority</h4>
          <div className="breakdown-items">
            {Object.entries(stats.byPriority || {}).map(([priority, count]) => (
              <div key={priority} className="breakdown-item">
                <span className="breakdown-label">{priority}</span>
                <span className="breakdown-value">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataStats;
