import api from './api';

const profileService = {
  /**
   * Get the current user's profile data
   * @returns {Promise} Promise with user data
   */
  getProfile: async () => {
    try {
      const response = await api.get('/auth/user');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  /**
   * Update the user's profile information
   * @param {Object} profileData - User profile data to update
   * @returns {Promise} Promise with updated user data and success status
   */
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      // Ensure we consistently return a success flag
      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      // Return a formatted error response instead of throwing
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update profile',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  /**
   * Update the user's password
   * @param {Object} passwordData - Contains current_password, password, and password_confirmation
   * @returns {Promise} Promise with success message
   */
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/auth/password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Upload a new profile avatar
   * @param {File} file - The image file to upload
   * @returns {Promise} Promise with updated user data including new avatar URL
   */
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post('/auth/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Get user's uploaded documents - handle with proper error handling for role permissions
   * @param {Object} params - Query parameters like page, limit, etc.
   * @returns {Promise} Promise with user's documents
   */
  getUserDocuments: async (params = {}) => {
    try {
      // Try to determine user role from localStorage
      const userData = localStorage.getItem('user');
      let isTeacher = false;
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.roles && Array.isArray(user.roles)) {
            isTeacher = user.roles.some(r => 
              (typeof r === 'object' && r.name === 'lecturer') || 
              (typeof r === 'string' && r === 'lecturer')
            );
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      // Use the appropriate endpoint based on user role
      const endpoint = isTeacher ? '/teacher/my-documents' : '/student/my-documents';
      console.log('Using endpoint:', endpoint, 'isTeacher:', isTeacher);
      
      const response = await api.get(endpoint, { params });
      
      // Directly return the response data, which already contains success/error info
      return response.data;
    } catch (error) {
      // Enhanced error handling with role context
      if (error.response && error.response.status === 403) {
        console.error('Permission denied. User likely does not have the required role.');
        console.error('Original error:', error.response.data);
      }
      
      // Simplified error passing - let the component handle formatting
      throw error;
    }
  },

  /**
   * Get user's trashed documents
   * @param {Object} params - Query parameters like page, limit, etc.
   * @returns {Promise} Promise with user's trashed documents
   */
  getTrashedDocuments: async (params = {}) => {
    try {
      // Try to determine user role from localStorage
      const userData = localStorage.getItem('user');
      let isTeacher = false;
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.roles && Array.isArray(user.roles)) {
            isTeacher = user.roles.some(r => 
              (typeof r === 'object' && r.name === 'lecturer') || 
              (typeof r === 'string' && r === 'lecturer')
            );
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      // Use the appropriate endpoint based on user role
      const endpoint = isTeacher ? '/teacher/my-documents/trash' : '/student/my-documents/trash';
      console.log('Using trash endpoint:', endpoint);
      
      const response = await api.get(endpoint, { 
        params: {
          ...params,
          trashed: true,  // Ensure this parameter is included
        }
      });
      
      // Handle case when we get an empty response
      if (!response.data) {
        return {
          data: [],
          meta: { current_page: 1, last_page: 1 }
        };
      }
      
      // Return the response data
      return response.data;
    } catch (error) {
      console.error('Error fetching trashed documents:', error);
      // Return empty data structure to avoid null errors in components
      return {
        data: [],
        meta: { current_page: 1, last_page: 1 }
      };
    }
  },

  /**
   * Get user's activity history
   * @param {Object} params - Query parameters like page, limit, etc.
   * @returns {Promise} Promise with user's activity history
   */
  getUserHistory: async (params = {}) => {
    try {
      try {
        // First try the dedicated history endpoint
        const response = await api.get('/user/history', { params });
        return response.data;
      } catch (historyError) {
        console.warn('History endpoint failed, falling back to documents:', historyError);
        
        // If dedicated history API fails, fall back to documents list
        // This provides graceful degradation if the history API is not yet implemented
        const fallbackResponse = await api.get('/student/my-documents', { 
          params: {
            ...params,
            sort: 'latest'
          }
        });
        
        // Transform the data to match expected history format
        if (fallbackResponse.data && fallbackResponse.data.data) {
          // Add history-specific fields to the documents
          const historyItems = fallbackResponse.data.data.map(doc => ({
            ...doc,
            type: 'document',
            action: 'upload',
            status: doc.is_approved ? 'completed' : 'pending'
          }));
          
          return {
            ...fallbackResponse.data,
            data: historyItems
          };
        }
        
        return fallbackResponse.data;
      }
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Get user's groups
   * @param {Object} params - Query parameters like page, limit, status, etc.
   * @returns {Promise} Promise with user's groups
   */
  getUserGroups: async (params = {}) => {
    try {
      const response = await api.get('/user/groups', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Leave a group
   * @param {Number} groupId - The ID of the group to leave
   * @returns {Promise} Promise with success message
   */  leaveGroup: async (groupId) => {
    try {
      // Make sure the token is in the request
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return { success: false, message: 'Authentication token not found' };
      }
      
      console.log(`Attempting to leave group ${groupId} with token: ${token.substring(0, 15)}...`);
      
      // FIX: Thêm timeout dài hơn và retry logic cho API rời nhóm
      const response = await api.post(`/groups/${groupId}/leave`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000 // Tăng timeout lên 10 giây
      });
      
      console.log('Leave group response:', response.data);
      
      // Đảm bảo chúng ta kiểm tra phản hồi chính xác
      if (response.data && response.data.success === true) {
        return response.data;
      } else {
        // Trả về lỗi nếu phản hồi không có success = true
        return {
          success: false,
          message: response.data?.message || 'Unexpected response when leaving group'
        };
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      
      // Provide more detailed error info for debugging
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        return { 
          success: false, 
          message: error.response.data?.message || 'Failed to leave group',
          error: error.response.data
        };
      }
      
      return {
        success: false,
        message: error.message || 'Network error when trying to leave group'
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
      const response = await api.get(`/user/groups/${groupId}`);
      return response.data;
    } catch (error) {
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
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
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
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Create a new group
   * @param {Object} groupData - Group data including name, description, etc.
   * @returns {Promise} Promise with created group data
   */
  createGroup: async (groupData) => {
    try {
      // Handle FormData for file uploads
      let config = {};
      if (groupData instanceof FormData) {
        config = {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      }
      
      const response = await api.post('/groups', groupData, config);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
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
      // Handle FormData for file uploads
      let config = {};
      if (groupData instanceof FormData) {
        config = {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      }
      
      const response = await api.put(`/groups/${groupId}`, groupData, config);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
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
      return {
        success: true,
        data: response.data.data || [],
        meta: response.data.meta || { current_page: 1, last_page: 1, total: 0 }
      };
    } catch (error) {
      console.error('Error fetching group posts:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Could not fetch group posts',
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0 }
      };
    }
  },

  /**
   * Create a new post in a group
   * @param {Number} groupId - The group ID
   * @param {Object} postData - Post data to create
   * @returns {Promise} Promise with created post
   */
  createGroupPost: async (groupId, postData) => {
    try {
      let config = {};
      
      // Set the right content type for FormData
      if (postData instanceof FormData) {
        config = {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        };
      }
      
      const response = await api.post(`/groups/${groupId}/posts`, postData, config);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Post created successfully'
      };
    } catch (error) {
      console.error(`Error creating post in group ${groupId}:`, error);
      
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Failed to create post',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  /**
   * Delete a user's document with proper role check
   * @param {Number} documentId - The ID of the document to delete
   * @returns {Promise} Promise with success message
   */
  deleteDocument: async (documentId) => {
    try {
      // Try to determine user role from localStorage
      const userData = localStorage.getItem('user');
      let isTeacher = false;
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.roles && Array.isArray(user.roles)) {
            isTeacher = user.roles.some(r => 
              (typeof r === 'object' && r.name === 'lecturer') || 
              (typeof r === 'string' && r === 'lecturer')
            );
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      // Use the appropriate endpoint based on user role
      const endpoint = isTeacher ? `/teacher/documents/${documentId}` : `/student/documents/${documentId}`;
      console.log('Using deletion endpoint:', endpoint);
      
      const response = await api.delete(endpoint);
      
      // Log the response for debugging
      console.log('Delete document response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      
      if (error.response && error.response.data) {
        return error.response.data;
      }
      
      throw error;
    }
  },
  
  /**
   * Restore a document from trash
   * @param {Number} documentId - The ID of the document to restore
   * @returns {Promise} Promise with success message
   */
  restoreDocument: async (documentId) => {
    try {
      const response = await api.post(`/documents/${documentId}/restore`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Permanently delete a document
   * @param {Number} documentId - The ID of the document to delete permanently
   * @returns {Promise} Promise with success message
   */
  permanentlyDeleteDocument: async (documentId) => {
    try {
      const response = await api.delete(`/documents/${documentId}/force`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Empty trash (delete all trashed documents permanently)
   * @returns {Promise} Promise with success message
   */
  emptyTrash: async () => {
    try {
      // Make sure we're using DELETE method, not POST
      const response = await api.delete('/documents/trash/empty');
      
      // Log response for debugging
      console.log('Empty trash response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error emptying trash:', error);
      
      // Provide more detailed error info
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      
      throw error.response ? error.response.data : error;
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
   * Download a document
   * @param {Number} documentId - The ID of the document to download
   * @returns {Promise} Promise with download URL
   */
  downloadDocument: async (documentId) => {
    try {
      // First, check if we need to get a download URL or download directly
      console.log(`Getting download-info for document ${documentId}`);
      const checkResponse = await api.get(`/documents/${documentId}/download-info`);
      console.log('Download info response:', checkResponse.data);
      
      if (checkResponse.data && checkResponse.data.download_url) {
        // If we have a download URL, open it in a new tab
        console.log(`Opening download URL: ${checkResponse.data.download_url}`);
        window.open(checkResponse.data.download_url, '_blank');
        return { success: true };
      }
      
      // Check if download-info contains a file_path that we can try directly
      if (checkResponse.data && checkResponse.data.file_path) {
        // Try to download using the file_path directly
        console.log(`Attempting to download using file_path: ${checkResponse.data.file_path}`);
        
        try {
          // Try a more direct approach using the file_path
          const directResponse = await api.get(`/storage/${checkResponse.data.file_path}`, {
            responseType: 'blob'
          });
          
          // Create a download link
          const url = window.URL.createObjectURL(new Blob([directResponse.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', checkResponse.data.filename || 'document.pdf');
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          window.URL.revokeObjectURL(url);
          link.remove();
          
          return { success: true };
        } catch (directError) {
          console.error('Direct download failed:', directError);
          // Continue to standard download approach
        }
      }
      
      // Otherwise proceed with direct download using the /download endpoint
      console.log(`Attempting standard download for document ${documentId}`);
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
        validateStatus: function (status) {
          return status < 500; // Accept any status code less than 500 to handle errors
        }
      });
      
      // Check if we got an error response or a blob
      if (response.status !== 200) {
        console.error(`Download failed with status: ${response.status}`);
        throw { 
          message: `Không thể tải xuống tài liệu (HTTP ${response.status})`,
          status: response.status
        };
      }
      
      // Check content type to see if we got a proper file or an error response
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        // This is likely an error response as JSON, convert blob to text and parse it
        const errorText = await new Response(response.data).text();
        try {
          const errorJson = JSON.parse(errorText);
          throw errorJson;
        } catch (parseError) {
          throw { message: 'Error processing server response' };
        }
      }
      
      // Create a download link for the blob response
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get the filename from the Content-Disposition header or use a default name
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'document.pdf';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      } else if (checkResponse.data && checkResponse.data.filename) {
        filename = checkResponse.data.filename;
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      link.remove();
      
      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      
      // More detailed error reporting for different scenarios
      if (error.status === 404) {
        throw { message: 'Không tìm thấy file tài liệu trên máy chủ (404)' };
      } else if (error.response && error.response.status === 404) {
        throw { message: 'Không tìm thấy file tài liệu trên máy chủ (404)' };
      } else if (error.response && error.response.status === 403) {
        throw { message: 'Bạn không có quyền tải xuống tài liệu này (403)' };
      } else if (error.response) {
        throw error.response.data || { message: `Không thể tải xuống tài liệu (${error.response.status})` };
      } else if (error.message) {
        throw { message: error.message };
      } else {
        throw { message: 'Không thể kết nối đến máy chủ' };
      }
    }
  },

  /**
   * Get document download information
   * @param {Number} documentId - The ID of the document
   * @returns {Promise} Promise with download information
   */
  getDocumentDownloadInfo: async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/download-info`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting document download info:', error);
      // Return a structured error that can be handled by the calling code
      return {
        success: false,
        error: error.response ? error.response.data : { message: 'Network error' }
      };
    }
  },

  /**
   * Get all documents with optional filters
   * @param {Object} params - Query parameters like page, subject, course_code, etc.
   * @returns {Promise} Promise with documents list
   */
  getAllDocuments: async (params = {}) => {
    try {
      const response = await api.get('/documents', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Report a document
   * @param {Number} documentId - The ID of the document to report
   * @param {Object} reportData - The report data including reason and description
   * @returns {Promise} Promise with success message
   */
  reportDocument: async (documentId, reportData) => {
    try {
      const response = await api.post(`/documents/${documentId}/report`, reportData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  /**
   * Upload a new document
   * @param {FormData} formData - Form data with document file and metadata
   * @returns {Promise} Promise with uploaded document data
   */
  uploadDocument: async (formData) => {
    try {
      // Try to determine user role from localStorage
      const userData = localStorage.getItem('user');
      let isTeacher = false;
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.roles && Array.isArray(user.roles)) {
            isTeacher = user.roles.some(r => 
              (typeof r === 'object' && r.name === 'lecturer') || 
              (typeof r === 'string' && r === 'lecturer')
            );
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      // First, check if the file already exists by calculating hash
      // This is optional - you can skip this step and directly handle the error
      const file = formData.get('file');
      if (file) {
        try {
          // Create a small form just for hash check
          const hashCheckForm = new FormData();
          hashCheckForm.append('file', file);
          
          // Check if file exists before full upload
          const hashCheck = await api.post('/documents/check-exists', hashCheckForm, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          // If the file already exists and we got a document ID back
          if (hashCheck.data && hashCheck.data.exists && hashCheck.data.document_id) {
            return {
              success: true,
              message: 'Tài liệu đã tồn tại và được liên kết với tài khoản của bạn',
              data: hashCheck.data.document,
              isDuplicate: true,
              documentId: hashCheck.data.document_id
            };
          }
        } catch (hashError) {
          // Silently ignore hash check errors and proceed with normal upload
          console.log('Hash check failed, proceeding with normal upload:', hashError);
        }
      }
      
      // Use the appropriate endpoint based on user role
      const endpoint = isTeacher ? '/teacher/documents' : '/student/documents';
      console.log('Using upload endpoint:', endpoint, 'for user role:', isTeacher ? 'lecturer' : 'student');
      
      // Proceed with role-appropriate upload
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      // Handle duplicate file error specifically
      if (error.response && 
          error.response.status === 409 || // HTTP conflict status
          (error.response.data && 
           error.response.data.message && 
           (error.response.data.message.includes('Duplicate') || 
            error.response.data.message.includes('already exists')))) {
        
        // If the error contains the existing document info, return it
        if (error.response.data && error.response.data.document) {
          return {
            success: true,
            message: 'Tài liệu này đã tồn tại trong hệ thống',
            data: error.response.data.document,
            isDuplicate: true,
            documentId: error.response.data.document.id
          };
        }
        
        // Otherwise return a generic duplicate message
        return {
          success: false,
          message: 'Tài liệu này đã tồn tại trong hệ thống. Vui lòng tải lên tài liệu khác.',
          isDuplicate: true
        };
      }
      
      // For other errors, throw them as usual
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Initialize a chunked upload
   * @param {Object} fileInfo - Information about the file to upload
   * @returns {Promise} Promise with upload session ID
   */
  initializeUpload: async (fileInfo) => {
    try {
      const response = await api.post('/uploads/initialize', fileInfo);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Upload a chunk of a file
   * @param {FormData} chunkData - Form data with chunk data
   * @returns {Promise} Promise with chunk upload status
   */
  uploadChunk: async (chunkData) => {
    try {
      const response = await api.post('/uploads/chunk', chunkData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Check status of an upload
   * @param {String} uploadId - The upload session ID
   * @returns {Promise} Promise with upload status
   */
  checkUploadStatus: async (uploadId) => {
    try {
      const response = await api.get(`/uploads/${uploadId}/status`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Update a document
   * @param {Number} documentId - The ID of the document to update
   * @param {Object} documentData - The document data to update
   * @returns {Promise} Promise with updated document data
   */
  updateDocument: async (documentId, documentData) => {
    try {
      const response = await api.put(`/student/documents/${documentId}`, documentData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Upload a document as a teacher
   * @param {FormData} formData - Form data with document file and metadata
   * @returns {Promise} Promise with uploaded document data
   */
  uploadTeacherDocument: async (formData) => {
    try {
      const response = await api.post('/teacher/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Mark a document as official (for teachers)
   * @param {Number} documentId - The ID of the document to mark as official
   * @returns {Promise} Promise with updated document data
   */
  markDocumentAsOfficial: async (documentId) => {
    try {
      const response = await api.post(`/teacher/documents/${documentId}/official`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Resume an interrupted upload
   * @param {String} uploadId - The upload session ID
   * @returns {Promise} Promise with resumption status
   */
  resumeUpload: async (uploadId) => {
    try {
      const response = await api.post(`/uploads/${uploadId}/resume`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Cancel an upload
   * @param {String} uploadId - The upload session ID
   * @returns {Promise} Promise with cancellation confirmation
   */
  cancelUpload: async (uploadId) => {
    try {
      const response = await api.delete(`/uploads/${uploadId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Check if current user has a specific role
   * @param {String} role - The role to check for
   * @returns {Promise<Boolean>} Promise with boolean result
   */
  hasRole: async (role) => {
    try {
      // First check local storage for user data with roles
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.roles && Array.isArray(user.roles)) {
          // Return immediately if we can determine from local storage
          return user.roles.some(r => r.name === role || r === role);
        }
      }
      
      // If we can't determine from local storage, ask the server
      const response = await api.get('/auth/check-role', { params: { role } });
      return response.data.hasRole;
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  },
  
  /**
   * Check if current user has a specific permission
   * @param {String} permission - The permission to check for
   * @returns {Promise<Boolean>} Promise with boolean result
   */
  hasPermission: async (permission) => {
    try {
      // First check local storage for user data with permissions
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.permissions && Array.isArray(user.permissions)) {
          // Return immediately if we can determine from local storage
          return user.permissions.includes(permission);
        }
      }
      
      // If we can't determine from local storage, ask the server
      const response = await api.get('/auth/check-permission', { params: { permission } });
      return response.data.hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  },
  
  /**
   * Get current user's roles
   * @returns {Promise<Array>} Promise with array of roles
   */
  getUserRoles: async () => {
    try {
      // First check local storage
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.roles && Array.isArray(user.roles)) {
          return user.roles;
        }
      }
      
      // If not available in local storage, fetch from server
      const response = await api.get('/auth/roles');
      return response.data.roles;
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  },
  
  /**
   * Get current user's permissions
   * @returns {Promise<Array>} Promise with array of permissions
   */
  getUserPermissions: async () => {
    try {
      // First check local storage
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.permissions && Array.isArray(user.permissions)) {
          return user.permissions;
        }
      }
      
      // If not available in local storage, fetch from server
      const response = await api.get('/auth/permissions');
      return response.data.permissions;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }
  },
  
  /**
   * Synchronize user's roles with a specific model
   * @param {String} modelType - Type of model (e.g. 'group', 'document')
   * @param {Number} modelId - ID of the model
   * @param {Array} roles - Array of role names to assign
   * @returns {Promise} Promise with success message
   */
  syncModelRoles: async (modelType, modelId, roles) => {
    try {
      const response = await api.post(`/permissions/sync-model-roles`, {
        model_type: modelType,
        model_id: modelId,
        roles
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Check if user has permission for a specific model
   * @param {String} permission - Permission to check
   * @param {String} modelType - Type of model
   * @param {Number} modelId - ID of the model
   * @returns {Promise<Boolean>} Promise with boolean result
   */
  hasModelPermission: async (permission, modelType, modelId) => {
    try {
      const response = await api.get('/permissions/check-model', {
        params: {
          permission,
          model_type: modelType,
          model_id: modelId
        }
      });
      return response.data.hasPermission;
    } catch (error) {
      console.error('Error checking model permission:', error);
      return false;
    }
  },

  /**
   * Update a document as a teacher
   * @param {Number} documentId - The ID of the document to update
   * @param {Object} documentData - The document data to update
   * @returns {Promise} Promise with updated document data
   */
  updateTeacherDocument: async (documentId, documentData) => {
    try {
      const response = await api.put(`/teacher/documents/${documentId}`, documentData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Get document preview URL
   * @param {Number} documentId - The ID of the document
   * @returns {Promise} Promise with document preview URL
   */
  getDocumentPreview: async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/preview`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  
  /**
   * Check if document can be previewed
   * @param {Number} documentId - The ID of the document
   * @returns {Promise<Boolean>} Promise with boolean result
   */
  canPreviewDocument: async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/can-preview`);
      return response.data.can_preview;
    } catch (error) {
      console.error('Error checking preview capability:', error);
      return false;
    }
  },
  
  /**
   * Mark a teacher document as official
   * @param {Number} documentId - The ID of the document
   * @returns {Promise} Promise with updated document data
   */
  markDocumentAsOfficial: async (documentId) => {
    try {
      const response = await api.post(`/teacher/documents/${documentId}/mark-as-official`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Report a post
   * @param {Number} postId - The ID of the post to report
   * @param {Object} reportData - The report data including reason and description
   * @returns {Promise} Promise with success message
   */
  reportPost: async (postId, reportData) => {
    try {
      const response = await api.post('/reports', {
        reportable_type: 'post',
        reportable_id: postId,
        reason: reportData.reason,
        details: reportData.details
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Report a user
   * @param {Number} userId - The ID of the user to report
   * @param {Object} reportData - The report data including reason and description
   * @returns {Promise} Promise with success message
   */
  reportUser: async (userId, reportData) => {
    try {
      const response = await api.post('/reports', {
        reportable_type: 'user',
        reportable_id: userId,
        reason: reportData.reason,
        details: reportData.details
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Report a comment
   * @param {Number} commentId - The ID of the comment to report
   * @param {Object} reportData - The report data including reason and description
   * @returns {Promise} Promise with success message
   */
  reportComment: async (commentId, reportData) => {
    try {
      const response = await api.post('/reports', {
        reportable_type: 'comment',
        reportable_id: commentId,
        reason: reportData.reason,
        details: reportData.details
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Get user's reports
   * @param {Object} params - Query parameters like page, status, etc.
   * @returns {Promise} Promise with user's reports
   */
  getUserReports: async (params = {}) => {
    try {
      const response = await api.get('/user/reports', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Cancel a user's report
   * @param {Number} reportId - The ID of the report to cancel
   * @returns {Promise} Promise with success message
   */
  cancelReport: async (reportId) => {
    try {
      const response = await api.post(`/reports/${reportId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default profileService;
