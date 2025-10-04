import { useState } from 'react';
import './DataSearch.css';

function DataSearch({ onSearch, onFilterChange, filters }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    'All',
    'Development',
    'Marketing',
    'Operations',
    'Support',
    'Security',
    'Documentation',
  ];
  const statuses = ['All', 'Active', 'Pending', 'Completed'];
  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleFilterChange = (filterType, value) => {
    const filterValue = value === 'All' ? '' : value;
    onFilterChange({ ...filters, [filterType]: filterValue });
  };

  const clearFilters = () => {
    setSearchTerm('');
    onSearch('');
    onFilterChange({
      category: '',
      status: '',
      priority: '',
    });
  };

  const hasActiveFilters = searchTerm || filters.category || filters.status || filters.priority;

  return (
    <div className="data-search">
      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, category, or status..."
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Search data"
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => handleSearchChange({ target: { value: '' } })}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Toggle filters"
        >
          🎛️ Filters{' '}
          {hasActiveFilters && (
            <span className="filter-badge">
              {
                [searchTerm, filters.category, filters.status, filters.priority].filter(Boolean)
                  .length
              }
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button className="clear-filters" onClick={clearFilters}>
            Clear All
          </button>
        )}
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label htmlFor="category-filter">Category</label>
            <select
              id="category-filter"
              value={filters.category || 'All'}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              value={filters.status || 'All'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="priority-filter">Priority</label>
            <select
              id="priority-filter"
              value={filters.priority || 'All'}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataSearch;
