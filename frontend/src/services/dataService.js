// Data Service
// This provides data management functionality with configurable mock/real API
// Controlled by VITE_USE_MOCK_DATA environment variable

import { mockDataService } from './mockDataService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to build query string
const buildQueryString = (params) => {
  if (!params || Object.keys(params).length === 0) return '';
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  
  return searchParams.toString() ? `?${searchParams.toString()}` : '';
};

// Real API data service
const realDataService = {
  // Get all data with pagination and filters
  getAll: async (options = {}) => {
    try {
      const token = getAuthToken();
      const queryString = buildQueryString(options);
      
      const response = await fetch(`${API_URL}/api/data${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch data');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch data');
      }

      return {
        success: true,
        data: data.data || [],
        pagination: data.pagination || {},
        total: data.total || 0,
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },

  // Get data by ID
  getById: async (id) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_URL}/api/data/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch data');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch data');
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },

  // Create new data
  create: async (recordData) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(recordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create data');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to create data');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Data created successfully',
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },

  // Update existing data
  update: async (id, recordData) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_URL}/api/data/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(recordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update data');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to update data');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Data updated successfully',
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },

  // Delete data
  delete: async (id) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_URL}/api/data/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete data');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete data');
      }

      return {
        success: true,
        message: data.message || 'Data deleted successfully',
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },

  // Search data
  search: async (query, options = {}) => {
    try {
      const token = getAuthToken();
      const searchParams = { q: query, ...options };
      const queryString = buildQueryString(searchParams);
      
      const response = await fetch(`${API_URL}/api/data/search${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search data');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to search data');
      }

      return {
        success: true,
        data: data.data || [],
        pagination: data.pagination || {},
        total: data.total || 0,
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },

  // Get analytics
  getAnalytics: async () => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_URL}/api/data/analytics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch analytics');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch analytics');
      }

      return {
        success: true,
        analytics: data.analytics,
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },

  // Export data
  export: async (format = 'json', options = {}) => {
    try {
      const token = getAuthToken();
      const searchParams = { format, ...options };
      const queryString = buildQueryString(searchParams);
      
      const response = await fetch(`${API_URL}/api/data/export${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to export data');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to export data');
      }

      return {
        success: true,
        data: data.data,
        format: format,
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },

  // Bulk operations
  bulkOperation: async (operation, ids, data = {}) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_URL}/api/data/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          operation,
          ids,
          data,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Bulk operation failed');
      }

      if (!responseData.success) {
        throw new Error(responseData.message || 'Bulk operation failed');
      }

      return {
        success: true,
        data: responseData.data,
        message: responseData.message || 'Bulk operation completed successfully',
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },
};

// Enhanced mock service with consistent API structure
const enhancedMockDataService = {
  ...mockDataService,
  
  // Ensure all methods return consistent structure
  getAll: async (options = {}) => {
    const result = await mockDataService.getAll(options);
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
      total: result.total,
    };
  },

  getById: async (id) => {
    const result = await mockDataService.getById(id);
    return {
      success: true,
      data: result.data,
    };
  },

  create: async (recordData) => {
    const result = await mockDataService.create(recordData);
    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  },

  update: async (id, recordData) => {
    const result = await mockDataService.update(id, recordData);
    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  },

  delete: async (id) => {
    const result = await mockDataService.delete(id);
    return {
      success: true,
      message: result.message,
    };
  },

  search: async (query, options = {}) => {
    const result = await mockDataService.search(query, options);
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
      total: result.total,
    };
  },

  getAnalytics: async () => {
    const result = await mockDataService.getAnalytics();
    return {
      success: true,
      analytics: result.analytics,
    };
  },

  export: async (format = 'json', options = {}) => {
    const result = await mockDataService.export(format, options);
    return {
      success: true,
      data: result.data,
      format: format,
    };
  },

  bulkOperation: async (operation, ids, data = {}) => {
    const result = await mockDataService.bulkOperation(operation, ids, data);
    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  },
};

// Log service mode
console.log(`📊 Data Service: Using ${USE_MOCK_DATA ? 'MOCK' : 'REAL API'} mode`);

// Export the appropriate service based on environment variable
export const dataService = USE_MOCK_DATA ? enhancedMockDataService : realDataService;

// Export configuration for debugging
export const dataConfig = {
  useMock: USE_MOCK_DATA,
  apiUrl: API_URL,
};

// Helper function to check if we're using mock mode
export const isUsingMockData = () => USE_MOCK_DATA;