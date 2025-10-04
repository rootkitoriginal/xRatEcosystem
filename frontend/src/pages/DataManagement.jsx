import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/data/DataTable';
import DataForm from '../components/data/DataForm';
import DataPagination from '../components/data/DataPagination';
import DataSearch from '../components/data/DataSearch';
import BulkActions from '../components/data/BulkActions';
import DataStats from '../components/data/DataStats';
import DataExport from '../components/data/DataExport';
import { mockDataService } from '../services/mockDataService';
import './DataManagement.css';

function DataManagement() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {},
    byCategory: {},
    byPriority: {},
    totalValue: 0,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    priority: '',
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        perPage,
        search: searchTerm,
        ...filters,
      };

      const result = await mockDataService.getData(params);
      setData(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalRecords(result.pagination.total);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await mockDataService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Search handler
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on search
  };

  // Filter handler
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  // CRUD handlers
  const handleCreate = async (formData) => {
    await mockDataService.createData(formData);
    setShowForm(false);
    await fetchData();
    await fetchStats();
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async (formData) => {
    await mockDataService.updateData(editingItem.id, formData);
    setEditingItem(null);
    setShowForm(false);
    await fetchData();
    await fetchStats();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await mockDataService.deleteData(id);
        setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
        await fetchData();
        await fetchStats();
      } catch (err) {
        setError(err.message || 'Failed to delete record');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} records?`)) {
      try {
        await mockDataService.bulkDelete(selectedIds);
        setSelectedIds([]);
        await fetchData();
        await fetchStats();
      } catch (err) {
        setError(err.message || 'Failed to delete records');
      }
    }
  };

  const handleExport = async (format) => {
    try {
      let content;
      let filename;
      let mimeType;

      if (format === 'json') {
        content = await mockDataService.exportJSON();
        filename = `data-export-${Date.now()}.json`;
        mimeType = 'application/json';
      } else if (format === 'csv') {
        content = await mockDataService.exportCSV();
        filename = `data-export-${Date.now()}.csv`;
        mimeType = 'text/csv';
      }

      // Create download link
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to export data');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <div className="data-management">
      <header className="data-management-header">
        <div>
          <h1>📊 Data Management</h1>
          <p>Manage and visualize your data</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingItem(null);
            setShowForm(!showForm);
          }}
        >
          {showForm ? '❌ Cancel' : '➕ New Record'}
        </button>
      </header>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <DataStats stats={stats} />

      <DataExport onExport={handleExport} />

      {showForm && (
        <DataForm
          initialData={editingItem}
          onSubmit={editingItem ? handleUpdate : handleCreate}
          onCancel={handleCancelForm}
        />
      )}

      <DataSearch onSearch={handleSearch} onFilterChange={handleFilterChange} filters={filters} />

      <BulkActions
        selectedCount={selectedIds.length}
        onBulkDelete={handleBulkDelete}
        onDeselectAll={() => setSelectedIds([])}
      />

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      ) : (
        <>
          <DataTable
            data={data}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSelectionChange={setSelectedIds}
            selectedIds={selectedIds}
          />

          {totalRecords > 0 && (
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              perPage={perPage}
              total={totalRecords}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
            />
          )}
        </>
      )}
    </div>
  );
}

export default DataManagement;
