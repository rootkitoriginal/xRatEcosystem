// Mock Data Service
// This provides data management functionality for development
// Replace with real API calls when backend is ready

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock data schema
const mockRecords = [
  {
    id: 1,
    name: 'Project Alpha',
    category: 'Development',
    status: 'Active',
    priority: 'High',
    value: 15000,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-03T14:30:00Z',
  },
  {
    id: 2,
    name: 'Marketing Campaign',
    category: 'Marketing',
    status: 'Completed',
    priority: 'Medium',
    value: 8500,
    createdAt: '2024-12-15T08:00:00Z',
    updatedAt: '2025-01-02T16:00:00Z',
  },
  {
    id: 3,
    name: 'Infrastructure Update',
    category: 'Operations',
    status: 'Active',
    priority: 'High',
    value: 25000,
    createdAt: '2025-01-05T09:00:00Z',
    updatedAt: '2025-01-05T09:00:00Z',
  },
  {
    id: 4,
    name: 'Customer Support',
    category: 'Support',
    status: 'Active',
    priority: 'Low',
    value: 5000,
    createdAt: '2024-12-20T11:00:00Z',
    updatedAt: '2025-01-04T10:00:00Z',
  },
  {
    id: 5,
    name: 'Data Analytics',
    category: 'Development',
    status: 'Pending',
    priority: 'Medium',
    value: 12000,
    createdAt: '2025-01-03T07:00:00Z',
    updatedAt: '2025-01-03T07:00:00Z',
  },
  {
    id: 6,
    name: 'Security Audit',
    category: 'Security',
    status: 'Active',
    priority: 'Critical',
    value: 30000,
    createdAt: '2025-01-02T13:00:00Z',
    updatedAt: '2025-01-04T15:00:00Z',
  },
  {
    id: 7,
    name: 'Mobile App',
    category: 'Development',
    status: 'Active',
    priority: 'High',
    value: 40000,
    createdAt: '2024-11-10T09:00:00Z',
    updatedAt: '2025-01-05T11:00:00Z',
  },
  {
    id: 8,
    name: 'Documentation',
    category: 'Documentation',
    status: 'Pending',
    priority: 'Low',
    value: 3000,
    createdAt: '2025-01-04T12:00:00Z',
    updatedAt: '2025-01-04T12:00:00Z',
  },
];

// In-memory storage for mock data
let dataStore = [...mockRecords];
let nextId = 9;

export const mockDataService = {
  // Get all data with optional filtering and pagination
  getData: async (params = {}) => {
    await delay(500);

    let filtered = [...dataStore];

    // Apply search filter
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.status.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (params.category) {
      filtered = filtered.filter((item) => item.category === params.category);
    }

    // Apply status filter
    if (params.status) {
      filtered = filtered.filter((item) => item.status === params.status);
    }

    // Apply priority filter
    if (params.priority) {
      filtered = filtered.filter((item) => item.priority === params.priority);
    }

    // Apply sorting
    if (params.sortBy) {
      filtered.sort((a, b) => {
        const aVal = a[params.sortBy];
        const bVal = b[params.sortBy];

        if (typeof aVal === 'string') {
          return params.sortOrder === 'desc'
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal);
        }

        return params.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }

    // Calculate pagination
    const page = params.page || 1;
    const perPage = params.perPage || 10;
    const total = filtered.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      pagination: {
        page,
        perPage,
        total,
        totalPages,
      },
    };
  },

  // Get single record by ID
  getById: async (id) => {
    await delay(300);

    const record = dataStore.find((item) => item.id === Number(id));

    if (!record) {
      throw new Error('Record not found');
    }

    return record;
  },

  // Create new record
  createData: async (data) => {
    await delay(500);

    const newRecord = {
      id: nextId++,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dataStore.push(newRecord);

    return newRecord;
  },

  // Update existing record
  updateData: async (id, data) => {
    await delay(500);

    const index = dataStore.findIndex((item) => item.id === Number(id));

    if (index === -1) {
      throw new Error('Record not found');
    }

    dataStore[index] = {
      ...dataStore[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return dataStore[index];
  },

  // Delete record
  deleteData: async (id) => {
    await delay(500);

    const index = dataStore.findIndex((item) => item.id === Number(id));

    if (index === -1) {
      throw new Error('Record not found');
    }

    dataStore.splice(index, 1);

    return { deleted: id };
  },

  // Bulk delete
  bulkDelete: async (ids) => {
    await delay(700);

    const idsToDelete = ids.map(Number);
    dataStore = dataStore.filter((item) => !idsToDelete.includes(item.id));

    return { deleted: idsToDelete.length };
  },

  // Get statistics
  getStats: async () => {
    await delay(400);

    const stats = {
      total: dataStore.length,
      byStatus: {},
      byCategory: {},
      byPriority: {},
      totalValue: 0,
    };

    dataStore.forEach((item) => {
      // Count by status
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;

      // Count by category
      stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;

      // Count by priority
      stats.byPriority[item.priority] = (stats.byPriority[item.priority] || 0) + 1;

      // Sum total value
      stats.totalValue += item.value;
    });

    return stats;
  },

  // Export data as JSON
  exportJSON: async () => {
    await delay(300);
    return JSON.stringify(dataStore, null, 2);
  },

  // Export data as CSV
  exportCSV: async () => {
    await delay(300);

    const headers = ['id', 'name', 'category', 'status', 'priority', 'value', 'createdAt', 'updatedAt'];
    const csvRows = [headers.join(',')];

    dataStore.forEach((item) => {
      const values = headers.map((header) => {
        const val = item[header];
        return typeof val === 'string' ? `"${val}"` : val;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  },

  // Reset to initial mock data
  reset: () => {
    dataStore = [...mockRecords];
    nextId = 9;
  },
};
