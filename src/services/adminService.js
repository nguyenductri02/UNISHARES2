import api, { getCsrfToken, apiRequestWithRetry } from './api';
import { getCachedData } from '../utils/apiCache';

const adminService = {
  /**
   * Get dashboard statistics overview
   */
  getDashboardStats: async () => {
    return getCachedData('dashboard-stats', async () => {
      try {
        const response = await apiRequestWithRetry('get', '/admin/statistics/overview');
        return response.data.data || response.data;
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Return default stats instead of throwing
        return {
          users: { total: 0, active: 0 },
          content: { documents: { approved: 0 }, posts: { total: 0 } },
          reports: { pending: 0 },
          orders: { total: 0 }
        };
      }
    }, { ttl: 2 * 60 * 1000 }); // 2 minute cache
  },
  
  /**
   * Get user list with filters
   */
  getUsers: async (filters = {}) => {
    // Generate cache key based on filters
    const cacheKey = `users-${JSON.stringify(filters)}`;
    
    return getCachedData(cacheKey, async () => {
      try {
        // Remove problematic filters
        if (filters.is_active !== undefined) delete filters.is_active;
        if (filters.active !== undefined) delete filters.active;
        
        // Fix the URL by removing any duplicate 'api' prefix
        const response = await apiRequestWithRetry('get', '/admin/users', null, { params: filters });
        
        // Handle different response formats
        if (response.data && response.data.data) {
          return {
            data: response.data.data,
            meta: response.data.meta || null
          };
        } else if (response.data && Array.isArray(response.data)) {
          return { data: response.data };
        } else if (response.data && response.data.success) {
          return {
            data: response.data.data || [],
            meta: response.data.meta || null
          };
        } else {
          return { data: [] };
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        return { data: [] };
      }
    }, { ttl: 30 * 1000 }); // 30 seconds cache
  },
  
  /**
   * Get user details
   */
  getUserDetails: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Update a user's role
   * @param {number} userId - User ID
   * @param {string} role - New role value
   * @returns {Promise<Object>} - Response data
   */
  async updateUserRole(userId, role) {
    try {
      console.log(`Updating role for user ${userId} to ${role}`);
      // Adjust the URL to be relative to the base API URL.
      const response = await api.put(`/admin/users/${userId}/role`, { role });
      console.log('Role update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  /**
   * Ban a user
   */
  banUser: async (userId, reason) => {
    try {
      await getCsrfToken();
      const response = await api.post(`/admin/users/${userId}/ban`, { reason });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Unban a user
   */
  unbanUser: async (userId) => {
    try {
      await getCsrfToken();
      const response = await api.post(`/admin/users/${userId}/unban`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Delete a user
   */
  deleteUser: async (userId) => {
    try {
      await getCsrfToken();
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Get message list
   */
  getMessages: async (filters = {}) => {
    try {
      const response = await api.get('/admin/messages', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Get reports with optional filters
   * @param {Object} filters - Filter parameters
   * @returns {Promise} - Response data in the format { success: boolean, data: { paginated_report_list } }
   */
  getReports: async (filters = {}) => {
    try {
      console.log('Fetching reports with filters:', filters);
      
      const params = {
        ...filters,
        page: filters.page || 1,
        per_page: filters.per_page || 10
      };
      
      const axiosResponse = await apiRequestWithRetry('get', '/admin/reports', null, {
        params
      });
      
      console.log('Raw API response from getReports (axiosResponse.data):', axiosResponse.data);
      
      // Assuming backend returns: { success: true, data: { current_page: 1, data: [...reports], ... } }
      if (axiosResponse.data && typeof axiosResponse.data.success === 'boolean' && axiosResponse.data.data) {
        // The backend response is already in the desired { success, data: { pagination_object } } format.
        // So, we extract the success flag and the inner data (pagination object).
        return {
          success: axiosResponse.data.success,
          data: axiosResponse.data.data // This is the pagination object { current_page: ..., data: [...] ... }
        };
      } else {
        // Fallback if the response structure is not as expected, e.g. if backend sends only pagination object
        console.warn('adminService.getReports: API response format was not {success, data: {pagination_obj}}. Actual payload:', axiosResponse.data);
        // If the HTTP request was successful, we can assume success at this level.
        // The component will then try to parse axiosResponse.data as the pagination object.
        return {
          success: true, 
          data: axiosResponse.data 
        };
      }

    } catch (error) {
      console.error("Error fetching reports in adminService:", error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch reports';
      return { 
        success: false, 
        message: errorMessage,
        // Provide a default data structure that components can safely access to prevent crashes
        data: { data: [], current_page: 1, last_page: 1, total: 0 } 
      };
    }
  },

  /**
   * Get detailed information about a report
   * @param {Number} reportId - Report ID
   * @returns {Promise} - Report details
   */
  getReportDetails: async (reportId) => {
    try {
      const response = await apiRequestWithRetry('get', `/admin/reports/${reportId}`);
      
      // For debugging
      console.log('Report details response:', response);
      
      // Return formatted response
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error(`Error fetching report details for ID ${reportId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch report details'
      };
    }
  },

  /**
   * Resolve a report
   * @param {Number} reportId - Report ID
   * @param {String} action - Action to take (resolve/reject/delete)
   * @param {String} resolutionNote - Note explaining resolution
   * @returns {Promise} - Response data
   */
  resolveReport: async (reportId, action, resolutionNote) => {
    try {
      const response = await apiRequestWithRetry('post', `/admin/reports/${reportId}/resolve`, {
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
   * @returns {Promise} - Statistics data
   */
  getReportStatistics: async () => {
    try {
      const response = await apiRequestWithRetry('get', '/admin/reports/statistics');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching report statistics:', error);
      // Return default stats instead of throwing
      return {
        total: 0,
        pending: 0,
        resolved: 0,
        rejected: 0
      };
    }
  },
  
  /**
   * Delete document (for report resolution)
   */
  deleteDocument: async (documentId, reason) => {
    try {
      await getCsrfToken();
      const response = await api.delete(`/admin/documents/${documentId}`, {
        data: { reason }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Get user roles
   */
  getRoles: async () => {
    try {
      // Fix the URL by removing any duplicate 'api' prefix
      const response = await apiRequestWithRetry('get', '/admin/roles');
      
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (response.data && response.data.success) {
        return response.data.data || [];
      } else {
        return response.data || [];
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      
      // Return default roles instead of throwing
      return [
        { value: 'student', label: 'Sinh viên' },
        { value: 'lecturer', label: 'Giảng viên' },
        { value: 'moderator', label: 'Người kiểm duyệt' },
        { value: 'admin', label: 'Quản trị viên' }
      ];
    }
  },
  
  /**
   * Get teachers list
   */
  getTeachers: async (filters = {}) => {
    try {
      filters.role = 'lecturer'; // Filter by lecturer role
      const response = await api.get('/admin/users', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Get all permissions
   */
  getPermissions: async () => {
    try {
      const response = await api.get('/admin/permissions');
      return response.data.data || response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Get permissions for a role
   */
  getRolePermissions: async (roleName) => {
    try {
      const response = await api.get(`/admin/roles/${roleName}/permissions`);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Update role permissions
   */
  updateRolePermissions: async (roleName, permissions) => {
    try {
      await getCsrfToken();
      const response = await api.put(`/admin/roles/${roleName}/permissions`, { permissions });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Get all documents for admin management
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise} Promise with documents data
   */
  getDocuments: async (params = {}) => {
    try {
      const response = await api.get('/admin/documents', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Get document details
   * @param {Number} documentId - Document ID
   * @returns {Promise} Promise with document details
   */
  getDocument: async (documentId) => {
    try {
      const response = await api.get(`/admin/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching document details:', error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Update document details
   * @param {Number} documentId - Document ID
   * @param {Object} documentData - Document data to update
   * @returns {Promise} Promise with updated document data
   */
  updateDocument: async (documentId, documentData) => {
    try {
      const response = await api.put(`/admin/documents/${documentId}`, documentData);
      return response.data;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Delete a document
   * @param {Number} documentId - Document ID
   * @param {String} reason - Reason for deletion
   * @returns {Promise} Promise with success message
   */
  deleteDocument: async (documentId, reason = '') => {
    try {
      const response = await api.delete(`/admin/documents/${documentId}`, {
        data: { reason }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Approve a document
   * @param {Number} documentId - Document ID
   * @returns {Promise} Promise with updated document data
   */
  approveDocument: async (documentId) => {
    try {
      const response = await api.post(`/admin/documents/${documentId}/approve`);
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
   * Reject a document
   * @param {Number} documentId - Document ID
   * @param {String} reason - Reason for rejection
   * @returns {Promise} Promise with updated document data
   */
  rejectDocument: async (documentId, reason) => {
    try {
      const response = await api.post(`/admin/documents/${documentId}/reject`, { reason });
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
   * Get document statistics
   * @returns {Promise} Promise with document statistics
   */
  getDocumentStatistics: async () => {
    try {
      const response = await api.get('/admin/documents/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching document statistics:', error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Get all groups for admin management
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise} Promise with groups data
   */
  getGroups: async (params = {}) => {
    try {
      const response = await api.get('/admin/groups', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Get group details
   * @param {Number} groupId - Group ID
   * @returns {Promise} Promise with group details
   */
  getGroup: async (groupId) => {
    try {
      const response = await api.get(`/admin/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group details:', error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Get members of a group
   * @param {Number} groupId - Group ID
   * @returns {Promise} Promise with group members data
   */
  getGroupMembers: async (groupId) => {
    try {
      const response = await api.get(`/admin/groups/${groupId}/members`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group members:', error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Remove a member from a group
   * @param {Number} groupId - Group ID
   * @param {Number} userId - User ID to remove
   * @returns {Promise} Promise with success message
   */
  removeGroupMember: async (groupId, userId) => {
    try {
      const response = await api.delete(`/admin/groups/${groupId}/members/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing group member:', error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Delete a group
   * @param {Number} groupId - Group ID
   * @returns {Promise} Promise with success message
   */
  deleteGroup: async (groupId) => {
    try {
      const response = await api.delete(`/admin/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Get post statistics
   * @returns {Promise} Promise with post statistics
   */
  getPostStatistics: async () => {
    return getCachedData('post-statistics', async () => {
      try {
        const response = await apiRequestWithRetry('get', '/admin/statistics/posts');
        return response.data.data || response.data;
      } catch (error) {
        console.error("Error fetching post statistics:", error);
        return {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0
        };
      }
    }, { ttl: 5 * 60 * 1000 }); // 5 minute cache
  },
  
  /**
   * Get a list of posts with filtering options
   * @param {Object} filters - Query parameters like page, status, user_id, etc.
   * @returns {Promise} Promise with paginated posts list
   */
  getPosts: async (filters = {}) => {
    try {
      const response = await apiRequestWithRetry('get', '/admin/posts', null, {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Get details of a specific post
   * @param {Number} postId - The ID of the post
   * @returns {Promise} Promise with post details
   */
  getPostDetails: async (postId) => {
    try {
      const response = await apiRequestWithRetry('get', `/admin/posts/${postId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching post details for ID ${postId}:`, error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Approve a post
   * @param {Number} postId - The ID of the post to approve
   * @returns {Promise} Promise with success message
   */
  approvePost: async (postId) => {
    try {
      const response = await apiRequestWithRetry('post', `/admin/posts/${postId}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Error approving post ID ${postId}:`, error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Reject a post
   * @param {Number} postId - The ID of the post to reject
   * @param {String} reason - Reason for rejection
   * @returns {Promise} Promise with success message
   */
  rejectPost: async (postId, reason) => {
    try {
      const response = await apiRequestWithRetry('post', `/admin/posts/${postId}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error rejecting post ID ${postId}:`, error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Delete a post
   * @param {Number} postId - The ID of the post to delete
   * @param {String} reason - Reason for deletion
   * @returns {Promise} Promise with success message
   */
  deletePost: async (postId, reason = '') => {
    try {
      const response = await apiRequestWithRetry('delete', `/admin/posts/${postId}`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error deleting post ID ${postId}:`, error);
      throw error.response ? error.response.data : error;
    }
  }
};

export default adminService;
