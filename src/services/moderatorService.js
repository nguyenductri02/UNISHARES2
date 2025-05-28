import api, { getCsrfToken, apiRequestWithRetry } from './api';
import { getCachedData } from '../utils/apiCache';

const moderatorService = {
  /**
   * Get dashboard statistics for moderator
   */
  getDashboardStats: async () => {
    return getCachedData('moderator-dashboard-stats', async () => {
      try {
        // First get overview stats
        const response = await apiRequestWithRetry('get', '/moderator/statistics/overview');
        
        // Then get report statistics for additional data
        let reportStats = {};
        try {
          const reportResponse = await apiRequestWithRetry('get', '/moderator/reports/statistics');
          if (reportResponse.data && reportResponse.data.data) {
            reportStats = reportResponse.data.data;
          } else if (reportResponse.data && reportResponse.data.success) {
            reportStats = reportResponse.data;
          }
        } catch (reportError) {
          console.error("Error fetching report statistics:", reportError);
        }
        
        // Combine the data
        const baseData = response.data.data || response.data;
        
        return {
          ...baseData,
          reports: {
            ...(baseData.reports || {}),
            total: reportStats.total || 0,
            resolved: reportStats.by_status?.resolved || 0,
            rejected: reportStats.by_status?.rejected || 0,
            pending: reportStats.by_status?.pending || 0,
            new_reports: reportStats.new_reports || 0
          },
          report_types: reportStats.by_type?.reduce((acc, item) => {
            acc[item.type] = item.count;
            return acc;
          }, {}) || {},
          resolution_metrics: reportStats.resolution_metrics || {
            fastest: null,
            slowest: null,
            average: null
          }
        };
      } catch (error) {
        console.error("Error fetching moderator dashboard stats:", error);
        // Return default stats instead of throwing
        return {
          documents: { approved: 0, pending: 0, rejected: 0 },
          reports: { pending: 0, resolved: 0, total: 0, rejected: 0 },
          recent_activities: [],
          report_types: {},
          resolution_metrics: { fastest: null, slowest: null, average: null }
        };
      }
    }, { ttl: 2 * 60 * 1000 }); // 2 minute cache
  },

  /**
   * Get document list with filters and normalize user data
   */
  getDocuments: async (params = {}) => {
    try {
      const response = await apiRequestWithRetry('get', '/moderator/documents', null, { params });
      
      // Normalize user data if needed
      if (response.data && Array.isArray(response.data.data)) {
        const documents = response.data.data.map(doc => {
          // If user information is missing but user_id exists, add a placeholder
          if (!doc.user && doc.user_id) {
            doc.user = {
              id: doc.user_id,
              name: `User ${doc.user_id}`,
              placeholder: true
            };
          }
          return doc;
        });
        
        response.data.data = documents;
      }
      
      return response.data;
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error.response ? error.response.data : error;
    }
  },
  /**
   * Get document details with normalized user data
   */
  getDocument: async (documentId) => {
    try {
      const response = await api.get(`/moderator/documents/${documentId}`);
      
      // Handle the response structure - backend returns { success: true, data: document }
      const documentData = response.data.data || response.data;
      
      // Normalize user information if missing
      if (documentData && !documentData.user && documentData.user_id) {
        documentData.user = {
          id: documentData.user_id,
          name: `User ${documentData.user_id}`,
          placeholder: true
        };
      }
      
      return documentData;
    } catch (error) {
      console.error('Error fetching document details:', error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Approve document
   */
  approveDocument: async (documentId) => {
    try {
      const response = await api.post(`/moderator/documents/${documentId}/approve`);
      return response.data;
    } catch (error) {
      console.error('Error approving document:', error);
      // If it's already approved, return a structured error that can be handled
      if (error.response && error.response.status === 400 && 
          error.response.data.message && 
          error.response.data.message.includes('already approved')) {
        throw {
          message: error.response.data.message,
          status: 400,
          alreadyApproved: true
        };
      }
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Reject document
   */
  rejectDocument: async (documentId, reason) => {
    try {
      const response = await api.post(`/moderator/documents/${documentId}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error rejecting document:', error);
      // Create structured error that includes response data if available
      const enhancedError = new Error(
        error.response?.data?.message || 'Failed to reject document'
      );
      enhancedError.response = error.response;
      enhancedError.originalError = error;
      throw enhancedError;
    }
  },

  /**
   * Delete document
   */
  deleteDocument: async (documentId, reason = '') => {
    try {
      await getCsrfToken();
      const response = await api.delete(`/moderator/documents/${documentId}`, {
        data: { reason }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Get reports with improved error handling
   */
  getReports: async (filters = {}) => {
    try {
      const params = {
        ...filters,
        page: filters.page || 1,
        per_page: filters.per_page || 10
      };
      
      console.log("Fetching reports with params:", params);
      
      const response = await apiRequestWithRetry('get', '/moderator/reports', null, {
        params
      });
      
      console.log("Raw reports API response:", response);
      
      // Return the data directly without additional wrapping
      // The backend already returns a standard Laravel paginator
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error("Error fetching reports in moderatorService:", error);
      if (error.response?.status === 403) {
        return {
          success: false,
          message: 'Permission denied: You are not authorized to view reports',
          data: { data: [], current_page: 1, last_page: 1, total: 0 }
        };
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to fetch reports';
      return { 
        success: false, 
        message: errorMessage,
        data: { data: [], current_page: 1, last_page: 1, total: 0 } 
      };
    }
  },

  /**
   * Get all reports without filtering
   */
  getAllReports: async (params = {}) => {
    try {
      const queryParams = {
        ...params,
        page: params.page || 1,
        per_page: params.per_page || 10
      };
      
      console.log("Fetching all reports with params:", queryParams);
      
      const response = await apiRequestWithRetry('get', '/moderator/reports/all', null, {
        params: queryParams
      });
      
      console.log("All reports API response:", response);
      
      // Return data directly
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error("Error fetching all reports in moderatorService:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch all reports',
        data: { data: [], current_page: 1, last_page: 1, total: 0 } 
      };
    }
  },

  /**
   * Test the reports API endpoint
   */
  testReportsAPI: async () => {
    try {
      // Make a direct axios request to bypass any caching or processing
      const directResponse = await api.get('/moderator/reports');
      console.log("Direct API response:", directResponse);
      
      return {
        success: true,
        directResponse: directResponse.data
      };
    } catch (error) {
      console.error("Direct API test failed:", error);
      return {
        success: false,
        error: error.message,
        response: error.response?.data
      };
    }
  },

  /**
   * Get report details
   */
  getReportDetails: async (reportId) => {
    try {
      // Use moderator endpoint which now points to the admin report controller
      const response = await apiRequestWithRetry('get', `/moderator/reports/${reportId}`);
      console.log(`Report details for ID ${reportId}:`, response.data);
      
      // Return a properly structured response
      if (response.data && response.data.success === true) {
        // Backend already returned a success: true structure
        return response.data;
      } else {
        // Wrap the raw data in a success structure
        return {
          success: true,
          data: response.data
        };
      }
    } catch (error) {
      console.error(`Error fetching report details for ID ${reportId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch report details',
        data: null
      };
    }
  },

  /**
   * Resolve report
   */
  resolveReport: async (reportId, action, resolutionNote) => {
    try {
      // Use moderator endpoint which now points to the admin report controller
      const response = await apiRequestWithRetry('post', `/moderator/reports/${reportId}/resolve`, {
        action,
        resolution_note: resolutionNote
      });
      return response.data;
    } catch (error) {
      console.error(`Error resolving report ID ${reportId}:`, error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Get report statistics
   */
  getReportStatistics: async () => {
    try {
      // Use moderator endpoint which now points to the admin report controller
      const response = await apiRequestWithRetry('get', '/moderator/reports/statistics');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching report statistics:', error);
      return {
        total: 0,
        pending: 0,
        resolved: 0,
        rejected: 0
      };
    }
  },

  /**
   * Get user information by ID
   */
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/moderator/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error.response ? error.response.data : error;
    }
  }
};

export default moderatorService;
export { moderatorService };
