import api from './api';
import { authService } from './index';
import { isLecturer, isAdmin, isModerator } from '../utils/roleUtils';
import cacheService from './cacheService';

/**
 * Xử lý các tham số truy vấn để tránh lỗi cột không tồn tại
 * @param {Object} params - Các tham số truy vấn gốc
 * @returns {Object} Các tham số đã được xử lý an toàn
 */
const sanitizeQueryParams = (params = {}) => {
  const safeParams = { ...params };
  
  // Danh sách các tham số có thể gây lỗi
  const problematicParams = ['is_private', 'requires_approval', 'featured'];
  
  // Xóa các tham số có thể gây lỗi
  problematicParams.forEach(param => {
    if (safeParams[param] !== undefined) {
      delete safeParams[param];
    }
  });
  
  return safeParams;
};

// Biến track thử lại để ngăn retry vô hạn
const retryTracker = {};

/**
 * Xử lý phản hồi API để trả về định dạng chuẩn
 * @param {Object} response - Phản hồi từ API
 * @returns {Object} Dữ liệu đã được chuẩn hóa
 */
const formatResponse = (response) => {
  if (!response.data) {
    return { success: false, message: 'Unexpected response format', data: [] };
  }
  
  if (response.data.data) {
    return {
      success: true,
      data: response.data.data,
      meta: response.data.meta || null
    };
  } else if (Array.isArray(response.data)) {
    return {
      success: true,
      data: response.data
    };
  }
  
  return {
    success: true,
    data: response.data
  };
};

/**
 * Xử lý lỗi API và trả về thông báo lỗi chuẩn
 * @param {Error} error - Lỗi từ API
 * @param {string} defaultMessage - Thông báo mặc định
 * @returns {Object} Thông báo lỗi đã được chuẩn hóa
 */
const handleApiError = (error, defaultMessage) => {
  console.error(defaultMessage, error);
  
  return {
    success: false,
    message: error.response?.data?.message || defaultMessage,
    data: []
  };
};

/**
 * Service for group-related operations
 */
const groupService = {
  /**
   * Get all groups with optional filters
   * @param {Object} params - Query parameters like page, type, search, etc.
   * @param {boolean} useCache - Whether to use cached data if available
   * @returns {Promise} Promise with groups list
   */
  getAllGroups: async (params = {}, useCache = true) => {
    // Xử lý các tham số truy vấn để tránh lỗi SQL
    const safeParams = sanitizeQueryParams(params);
    
    // Tạo cache key từ params
    const cacheKey = `groups_${JSON.stringify(safeParams)}`;
    
    const fetchGroups = async () => {
      try {
        const response = await api.get('/groups', { params: safeParams });
        return formatResponse(response);
      } catch (error) {
        // Kiểm tra lỗi "Column not found"
        if (error.response?.data?.message?.includes('Column not found')) {
          const requestId = JSON.stringify(params) + (cacheKey || '');
          
          // Tránh retry vô hạn
          if (retryTracker[requestId]) {
            return handleApiError(error, 'Failed to fetch groups');
          }
          
          // Đánh dấu đã thử lại request này
          retryTracker[requestId] = true;
          setTimeout(() => delete retryTracker[requestId], 60000);
          
          // Xóa cache nếu có
          if (cacheKey && useCache) {
            cacheService.remove(cacheKey);
          }
          
          // Tạo tham số mới không có các cột gây lỗi
          const retryParams = { ...params };
          ['is_private', 'requires_approval', 'featured'].forEach(param => {
            if (error.response.data.message.includes(`'${param}'`)) {
              delete retryParams[param];
            }
          });
          
          // Thử lại với tham số mới
          return await groupService.getAllGroups(retryParams, false);
        }
        
        return handleApiError(error, 'Failed to fetch groups');
      }
    };
    
    // Sử dụng cache nếu được yêu cầu
    if (useCache) {
      return cacheService.memoize(cacheKey, fetchGroups, 5 * 60 * 1000); // 5 phút
    }
    
    return fetchGroups();
  },

  /**
   * Get user's groups
   * @param {Object} params - Query parameters like page, limit, status, etc.
   * @param {boolean} useCache - Whether to use cached data if available
   * @returns {Promise} Promise with user's groups
   */
  getUserGroups: async (params = {}, useCache = true) => {
    // Xử lý các tham số truy vấn để tránh lỗi SQL
    const safeParams = sanitizeQueryParams(params);
    
    // Tạo cache key từ params và user ID
    const user = authService.getUser();
    const userId = user?.id || 'anonymous';
    const cacheKey = `user_groups_${userId}_${JSON.stringify(safeParams)}`;
    
    const fetchUserGroups = async () => {
      try {
        const response = await api.get('/user/groups', { params: safeParams });
        return formatResponse(response);
      } catch (error) {
        // Kiểm tra lỗi "Column not found"
        if (error.response?.data?.message?.includes('Column not found')) {
          const requestId = JSON.stringify(params) + (cacheKey || '');
          
          // Tránh retry vô hạn
          if (retryTracker[requestId]) {
            return handleApiError(error, 'Failed to fetch user groups');
          }
          
          // Đánh dấu đã thử lại request này
          retryTracker[requestId] = true;
          setTimeout(() => delete retryTracker[requestId], 60000);
          
          // Xóa cache nếu có
          if (cacheKey && useCache) {
            cacheService.remove(cacheKey);
          }
          
          // Tạo tham số mới không có các cột gây lỗi
          const retryParams = { ...params };
          ['is_private', 'requires_approval', 'featured'].forEach(param => {
            if (error.response.data.message.includes(`'${param}'`)) {
              delete retryParams[param];
            }
          });
          
          // Thử lại với tham số mới
          return await groupService.getUserGroups(retryParams, false);
        }
        
        return handleApiError(error, 'Failed to fetch user groups');
      }
    };
    
    // Sử dụng cache nếu được yêu cầu
    if (useCache) {
      return cacheService.memoize(cacheKey, fetchUserGroups, 5 * 60 * 1000); // 5 phút
    }
    
    return fetchUserGroups();
  },
  
  /**
   * Check if the current user can create groups
   * @param {boolean} useCache - Whether to use cached data if available
   * @returns {Promise<boolean>} Whether the user can create groups
   */
  canCreateGroups: async (useCache = true) => {
    // Kiểm tra người dùng hiện tại
    const user = authService.getUser();
    
    if (!user) {
      return false;
    }
    
    // Tạo cache key từ user ID
    const userId = user.id || 'anonymous';
    const cacheKey = `can_create_groups_${userId}`;
    
    const checkPermissions = async () => {
      try {
        // Kiểm tra quyền từ thông tin người dùng hiện tại
        if (user.roles) {
          if (isAdmin(user) || isModerator(user) || isLecturer(user)) {
            return true;
          }
            if (user.permissions && user.permissions.includes('create groups')) {
            return true;
          }
        }
        
        // Làm mới thông tin người dùng nếu cần
        const refreshedUser = await authService.refreshUserInfo();
        
        if (refreshedUser) {
          if (isAdmin(refreshedUser) || isModerator(refreshedUser) || isLecturer(refreshedUser)) {
            return true;
          }
            if (refreshedUser.permissions && refreshedUser.permissions.includes('create groups')) {
            return true;
          }
        }
        
        return false;
      } catch (error) {
        console.error("Error checking group creation permissions:", error);
        return false;
      }
    };
    
    // Sử dụng cache nếu được yêu cầu
    if (useCache) {
      return cacheService.memoize(cacheKey, checkPermissions, 10 * 60 * 1000); // 10 phút
    }
    
    return checkPermissions();
  },
  
  /**
   * Create a new group
   * @param {Object} groupData - Group data including name, description, etc.
   * @returns {Promise} Promise with created group data
   */
  createGroup: async (groupData) => {
    try {
      const formData = new FormData();
      
      // Kiểm tra thông tin người dùng
      const currentUser = authService.getUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('User information not available. Please log in again.');
      }
      
      // Xử lý dữ liệu nhóm để tránh lỗi SQL
      const processedData = { ...groupData };
      
      // Chuyển đổi is_private thành requires_approval để tương thích với backend
      if (processedData.is_private !== undefined) {
        processedData.requires_approval = processedData.is_private;
        delete processedData.is_private;
      }
      
      // Thêm creator_id vào form data
      processedData.creator_id = currentUser.id;
      
      // Thêm các trường văn bản
      Object.keys(processedData).forEach(key => {
        if (key !== 'cover_image') {
          formData.append(key, processedData[key]);
        }
      });
      
      // Thêm ảnh bìa nếu có
      if (groupData.cover_image instanceof File) {
        formData.append('cover_image', groupData.cover_image);
      }
      
      const response = await api.post('/groups', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error("Error creating group:", error);
      
      // Xử lý lỗi quyền truy cập
      if (error.response?.status === 403) {
        return {
          success: false,
          message: 'Bạn không có quyền tạo nhóm học. Hãy liên hệ quản trị viên để được cấp quyền.',
          errorDetail: error.response?.data?.message || 'Permission denied'
        };
      }
      
      // Xử lý lỗi cột không tồn tại
      if (error.response?.data?.message?.includes('Column not found')) {
        try {
          const newFormData = new FormData();
          const processedData = { ...groupData };
          
          // Thêm creator_id
          const currentUser = authService.getUser();
          if (!currentUser || !currentUser.id) {
            throw new Error('User information not available. Please log in again.');
          }
          processedData.creator_id = currentUser.id;
          
          // Xử lý các trường có thể gây lỗi
          if (error.response.data.message.includes("'is_private'")) {
            if (processedData.is_private !== undefined) {
              processedData.requires_approval = processedData.is_private;
              delete processedData.is_private;
            }
          }
          
          if (error.response.data.message.includes("'requires_approval'")) {
            delete processedData.requires_approval;
          }
          
          // Thêm các trường đã xử lý
          Object.keys(processedData).forEach(key => {
            if (key !== 'cover_image') {
              newFormData.append(key, processedData[key]);
            }
          });
          
          if (groupData.cover_image instanceof File) {
            newFormData.append('cover_image', groupData.cover_image);
          }
          
          const retryResponse = await api.post('/groups', newFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          return {
            success: true,
            data: retryResponse.data.data || retryResponse.data
          };
        } catch (retryError) {
          console.error("Retry with adjusted parameters failed:", retryError);
        }
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể tạo nhóm. Vui lòng thử lại sau.',
        errors: error.response?.data?.errors
      };
    }
  },
  
  /**
   * Get group details
   * @param {Number} groupId - The ID of the group
   * @returns {Promise} Promise with group details
   */
  getGroupDetails: async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch group details for ID ${groupId}`);
    }
  },
  
  /**
   * Update a group
   * @param {Number} groupId - The ID of the group to update
   * @param {Object} groupData - Updated group data
   * @returns {Promise} Promise with updated group data
   */
  updateGroup: async (groupId, groupData) => {
    try {
      const formData = new FormData();
      
      // Thêm các trường văn bản
      Object.keys(groupData).forEach(key => {
        if (key !== 'cover_image') {
          formData.append(key, groupData[key]);
        }
      });
      
      // Thêm ảnh bìa nếu có
      if (groupData.cover_image instanceof File) {
        formData.append('cover_image', groupData.cover_image);
      }
      
      // Sử dụng phương thức PUT để cập nhật
      const response = await api.post(`/groups/${groupId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-HTTP-Method-Override': 'PUT',
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error updating group ID ${groupId}:`, error);
      throw error.response ? error.response.data : error;
    }
  },
    /**
   * Join a group
   * @param {Number} groupId - The ID of the group to join
   * @returns {Promise} Promise with success message
   */
  joinGroup: async (groupId) => {
    try {
      const response = await api.post(`/groups/${groupId}/join`);
      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      console.error(`Error joining group ID ${groupId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to join group',
        ...error.response?.data
      };
    }
  },
  
  /**
   * Leave a group
   * @param {Number} groupId - Group ID to leave
   * @returns {Promise} Promise with success/failure info
   */
  leaveGroup: async (groupId) => {
    try {
      const response = await api.post(`/groups/${groupId}/leave`);
      
      return {
        success: true,
        message: response.data.message || 'Đã rời nhóm thành công'
      };
    } catch (error) {
      return handleApiError(error, 'Không thể rời nhóm. Vui lòng thử lại sau.');
    }
  },
  
  /**
   * Get group members
   * @param {Number} groupId - The ID of the group
   * @param {Object} params - Query parameters like page, limit, etc.
   * @returns {Promise} Promise with group members
   */
  getGroupMembers: async (groupId, params = {}) => {
    try {
      const response = await api.get(`/groups/${groupId}/members`, { params });
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch members for group ID ${groupId}`);
    }
  },
  
  /**
   * Get pending group join requests
   * @param {Number} groupId - The ID of the group
   * @returns {Promise} Promise with join requests
   */
  getGroupJoinRequests: async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/join-requests`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching join requests for group ID ${groupId}:`, error);
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Approve a group join request
   * @param {Number} groupId - The ID of the group
   * @param {Number} userId - The ID of the user
   * @returns {Promise} Promise with success message
   */
  approveJoinRequest: async (groupId, userId) => {
    try {
      const response = await api.post(`/groups/${groupId}/join-requests/${userId}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Error approving join request for user ${userId} in group ${groupId}:`, error);
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Reject a group join request
   * @param {Number} groupId - The ID of the group
   * @param {Number} userId - The ID of the user
   * @returns {Promise} Promise with success message
   */
  rejectJoinRequest: async (groupId, userId) => {
    try {
      const response = await api.post(`/groups/${groupId}/join-requests/${userId}/reject`);
      return response.data;
    } catch (error) {
      console.error(`Error rejecting join request for user ${userId} in group ${groupId}:`, error);
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Change a member's role in a group
   * @param {Number} groupId - The ID of the group
   * @param {Number} userId - The ID of the user
   * @param {String} role - The new role (admin, moderator, member)
   * @returns {Promise} Promise with success message
   */
  changeGroupMemberRole: async (groupId, userId, role) => {
    try {
      const response = await api.put(`/groups/${groupId}/members/${userId}`, { role });
      return response.data;
    } catch (error) {
      console.error(`Error changing role for user ${userId} in group ${groupId}:`, error);
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Remove a member from a group
   * @param {Number} groupId - The ID of the group
   * @param {Number} userId - The ID of the user to remove
   * @returns {Promise} Promise with success message
   */
  removeGroupMember: async (groupId, userId) => {
    try {
      const response = await api.delete(`/groups/${groupId}/members/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error removing user ${userId} from group ${groupId}:`, error);
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Get posts for a specific group
   * @param {Number} groupId - The ID of the group
   * @param {Object} params - Query parameters like page, limit, etc.
   * @returns {Promise} Promise with group posts
   */
  getGroupPosts: async (groupId, params = {}) => {
    try {
      const response = await api.get(`/groups/${groupId}/posts`, { params });
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch posts for group ${groupId}`);
    }
  },
  
  /**
   * Create a post in a group
   * @param {Number} groupId - The ID of the group
   * @param {Object} postData - Post data including content and attachments
   * @returns {Promise} Promise with created post data
   */
  createGroupPost: async (groupId, postData) => {
    try {
      const formData = new FormData();
      
      if (postData.content) {
        formData.append('content', postData.content);
      }
      
      if (postData.title) {
        formData.append('title', postData.title);
      }
      
      // Thêm tệp đính kèm nếu có
      if (postData.attachments && postData.attachments.length > 0) {
        for (let i = 0; i < postData.attachments.length; i++) {
          formData.append('attachments[]', postData.attachments[i]);
        }
      }
      
      const response = await api.post(`/groups/${groupId}/posts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || `Failed to create post in group ${groupId}`,
        errors: error.response?.data?.errors
      };
    }
  },
  
  /**
   * Get documents for a specific group
   * @param {Number} groupId - The ID of the group
   * @param {Object} params - Query parameters like page, search, etc.
   * @returns {Promise} Promise with group documents
   */
  getGroupDocuments: async (groupId, params = {}) => {
    try {
      const response = await api.get(`/groups/${groupId}/documents`, { params });
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch documents for group ${groupId}`);
    }
  },
  
  /**
   * Upload a document to a group
   * @param {Number} groupId - The ID of the group
   * @param {FormData} formData - Form data with document file and metadata
   * @returns {Promise} Promise with uploaded document data
   */
  uploadGroupDocument: async (groupId, formData) => {
    try {
      const response = await api.post(`/groups/${groupId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || `Failed to upload document to group ${groupId}`,
        errors: error.response?.data?.errors
      };
    }
  },
  
  /**
   * Delete a group
   * @param {Number} groupId - The ID of the group to delete
   * @returns {Promise} Promise with success message
   */
  deleteGroup: async (groupId) => {
    try {
      const response = await api.delete(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting group ${groupId}:`, error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Check if the current user has a pending join request for a group
   * @param {Number} groupId - The ID of the group
   * @returns {Promise} Promise with join request status
   */
  checkJoinRequestStatus: async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/join-request-status`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // It's normal to get a 404 if there's no pending request
      if (error.response?.status === 404) {
        return {
          success: true,
          data: { status: 'none' }
        };
      }
      
      console.error(`Error checking join request status for group ${groupId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to check join request status',
        data: { status: 'none' }
      };
    }
  }
};

export default groupService;
