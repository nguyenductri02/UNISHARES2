import api, { apiRequestWithRetry } from './api';
import cacheService from './cacheService';

/**
 * Service for document-related operations
 */
const documentService = {  /**
   * Get popular documents
   * @param {Object} params - Additional query parameters
   * @returns {Promise} Promise with popular documents
   */
  getPopularDocuments: async (params = {}) => {
    try {
      // Create parameters with sorting by download count
      const queryParams = {
        ...params,
        page: params.page || 1,
        per_page: params.per_page || 12
      };
      
      const cacheKey = `popular_docs_${JSON.stringify(queryParams)}`;
      const cachedData = cacheService.get(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      const response = await apiRequestWithRetry('get', '/home/popular-documents', null, { params: queryParams });
      
      const result = {
        success: true,
        data: response.data.data || response.data,
        meta: response.data.meta || {}
      };
      
      // Cache popular documents for 5 minutes
      cacheService.set(cacheKey, result, 5 * 60 * 1000);
      
      return result;
    } catch (error) {
      console.error('Error fetching popular documents:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch popular documents',
        data: []
      };
    }
  },
  
  /**
   * Get new documents
   * @param {Object} params - Additional query parameters
   * @returns {Promise} Promise with new documents
   */
  getNewDocuments: async (params = {}) => {
    try {
      // Create parameters with sorting by created_at date
      const queryParams = {
        ...params,
        sortBy: 'latest', // Ensure sorting by latest
        page: params.page || 1,
        per_page: params.per_page || 12
      };
      
      const cacheKey = `new_docs_${JSON.stringify(queryParams)}`;
      const cachedData = cacheService.get(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      const response = await apiRequestWithRetry('get', '/home/new-documents', null, { params: queryParams });
      
      const result = {
        success: true,
        data: response.data.data || response.data,
        meta: response.data.meta || {}
      };
      
      // Cache new documents for 2 minutes (shorter than popular as they change more frequently)
      cacheService.set(cacheKey, result, 2 * 60 * 1000);
      
      return result;
    } catch (error) {
      console.error('Error fetching new documents:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch new documents',
        data: []
      };
    }
  },
    /**
   * Get all documents with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise} Promise with documents
   */
  getAllDocuments: async (params = {}) => {
    try {
      // Create parameters for query
      const queryParams = {
        ...params,
        page: params.page || 1,
        per_page: params.per_page || 12
      };
      
      const cacheKey = `all_docs_${JSON.stringify(queryParams)}`;
      const cachedData = cacheService.get(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      const response = await apiRequestWithRetry('get', '/home/all-documents', null, { params: queryParams });
      
      const result = {
        success: true,
        data: response.data.data || response.data,
        meta: response.data.meta || {}
      };
      
      // Cache all documents for 2 minutes
      cacheService.set(cacheKey, result, 2 * 60 * 1000);
      
      return result;
    } catch (error) {
      console.error('Error fetching all documents:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch documents',
        data: []
      };
    }
  },

  /**
   * Get documents for a specific group
   * @param {number} groupId - The group ID
   * @param {object} params - Query parameters like page, search, etc.
   * @returns {Promise} - Promise with documents data
   */
  getGroupDocuments: async (groupId, params = {}) => {
    try {
      // Only cache if not searching and on first page
      const shouldCache = !params.search && (!params.page || params.page === 1);
      const cacheKey = `group_docs_${groupId}_${JSON.stringify(params)}`;
      
      if (shouldCache) {
        const cachedData = cacheService.get(cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }
      
      const response = await apiRequestWithRetry('get', `/groups/${groupId}/documents`, null, { params });
      
      const result = {
        success: true,
        data: response.data.data || response.data,
        meta: response.data.meta || {}
      };
      
      // Cache for 60 seconds if appropriate
      if (shouldCache) {
        cacheService.set(cacheKey, result, 60 * 1000);
      }
      
      return result;
    } catch (error) {
      console.error(`Error fetching documents for group ${groupId}:`, error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Failed to fetch group documents',
        data: []
      };
    }
  },

  /**
   * Get document details
   * @param {Number} documentId - The ID of the document
   * @returns {Promise} Promise with document details
   */
  getDocument: async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Get document details including access rights
   * @param {Number} documentId - The ID of the document
   * @returns {Promise} Promise with document details
   */
  getDocumentWithAccess: async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error(`Error fetching document ${documentId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch document details'
      };
    }
  },

  /**
   * Download a document
   * @param {number} documentId - Document ID to download
   * @returns {Promise} Promise with download status
   */
  downloadDocument: async (documentId) => {
    try {
      const response = await apiRequestWithRetry('get', `/documents/${documentId}/download`, null, {
        responseType: 'blob'
      });
      
      // Get filename from Content-Disposition header or use a default
      let filename = 'document.pdf';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Create a Blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading document:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to download document'
      };
    }
  },

  /**
   * Upload a document to a group
   * @param {number} groupId - The group ID
   * @param {FormData} formData - Form data with document and metadata
   * @returns {Promise} Promise with upload result
   */
  uploadGroupDocument: async (groupId, formData) => {
    try {
      // Clear any cached documents for this group to ensure fresh data after upload
      cacheService.removeByPattern(`group_docs_${groupId}`);
      
      const response = await apiRequestWithRetry('post', `/groups/${groupId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        // Increase timeout for large uploads
        timeout: 60000 // 60 seconds
      });
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Document uploaded successfully'
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      
      // Check for specific error types
      if (error.message && error.message.includes('timeout')) {
        return {
          success: false,
          message: 'Upload timed out. The file may be too large or your connection too slow.',
          errors: {}
        };
      }
      
      if (error.response?.status === 413) {
        return {
          success: false,
          message: 'The file is too large to upload.',
          errors: {}
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload document',
        errors: error.response?.data?.errors || {}
      };
    }
  }
};

export default documentService;
