import { useState, useMemo } from 'react';
import './DataTable.css';

function DataTable({ data, onEdit, onDelete, onSelectionChange, selectedIds = [] }) {
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (typeof aVal === 'string') {
        return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }

      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    return sorted;
  }, [data, sortBy, sortOrder]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectionChange(data.map((item) => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatValue = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getPriorityClass = (priority) => {
    const classes = {
      Critical: 'priority-critical',
      High: 'priority-high',
      Medium: 'priority-medium',
      Low: 'priority-low',
    };
    return classes[priority] || '';
  };

  const getStatusClass = (status) => {
    const classes = {
      Active: 'status-active',
      Pending: 'status-pending',
      Completed: 'status-completed',
    };
    return classes[status] || '';
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <span className="sort-icon">⇅</span>;
    return <span className="sort-icon">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  if (data.length === 0) {
    return (
      <div className="data-table-empty">
        <p>No data found</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th className="table-checkbox">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(input) => {
                  if (input) input.indeterminate = isSomeSelected;
                }}
                onChange={handleSelectAll}
                aria-label="Select all rows"
              />
            </th>
            <th onClick={() => handleSort('id')} className="sortable">
              ID <SortIcon column="id" />
            </th>
            <th onClick={() => handleSort('name')} className="sortable">
              Name <SortIcon column="name" />
            </th>
            <th onClick={() => handleSort('category')} className="sortable">
              Category <SortIcon column="category" />
            </th>
            <th onClick={() => handleSort('status')} className="sortable">
              Status <SortIcon column="status" />
            </th>
            <th onClick={() => handleSort('priority')} className="sortable">
              Priority <SortIcon column="priority" />
            </th>
            <th onClick={() => handleSort('value')} className="sortable">
              Value <SortIcon column="value" />
            </th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => (
            <tr key={item.id} className={selectedIds.includes(item.id) ? 'selected' : ''}>
              <td className="table-checkbox">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                  aria-label={`Select row ${item.id}`}
                />
              </td>
              <td>{item.id}</td>
              <td className="table-name">{item.name}</td>
              <td>{item.category}</td>
              <td>
                <span className={`badge ${getStatusClass(item.status)}`}>{item.status}</span>
              </td>
              <td>
                <span className={`badge ${getPriorityClass(item.priority)}`}>{item.priority}</span>
              </td>
              <td className="table-value">{formatValue(item.value)}</td>
              <td className="table-date">{formatDate(item.createdAt)}</td>
              <td className="table-actions">
                <button
                  className="btn-icon btn-edit"
                  onClick={() => onEdit(item)}
                  aria-label={`Edit ${item.name}`}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  className="btn-icon btn-delete"
                  onClick={() => onDelete(item.id)}
                  aria-label={`Delete ${item.name}`}
                  title="Delete"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
