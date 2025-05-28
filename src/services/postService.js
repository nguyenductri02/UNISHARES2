import api, { apiRequestWithRetry } from './api';
import cacheService from './cacheService';

/**
 * Service for post-related operations
 */
const postService = {
  /**
   * Get all posts with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise} Promise with posts data
   */
  getAllPosts: async (params = {}) => {
    try {
      const response = await apiRequestWithRetry('get', '/posts', null, { params });
      return {
        success: true,
        data: response.data.data || response.data,
        meta: response.data.meta || {}
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: []
      };
    }
  },

  /**
   * Get posts for a specific group
   * @param {number} groupId - The group ID
   * @param {object} params - Query parameters like page, search, etc.
   * @returns {Promise} - Promise with posts data
   */
  getGroupPosts: async (groupId, params = {}) => {
    try {
      // Add a timeout promise to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 15000);
      });
      
      const fetchPromise = apiRequestWithRetry('get', `/groups/${groupId}/posts`, null, { params });
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response || !response.data) {
        throw new Error('Invalid response format');
      }
      
      const result = {
        success: true,
        data: response.data.data || response.data,
        meta: response.data.meta || {}
      };
      
      return result;
    } catch (error) {
      console.error(`API error fetching posts for group ${groupId}:`, error);
      
      // Provide a user-friendly error message
      let errorMessage = 'Không thể tải bài viết. Vui lòng thử lại sau.';
      
      if (error.response?.status === 500) {
        errorMessage = 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Bạn không có quyền xem bài viết trong nhóm này.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy nhóm.';
      }
      
      return { 
        success: false, 
        message: errorMessage,
        data: []
      };
    }
  },

  /**
   * Create a post in a group
   * @param {number} groupId - The group ID
   * @param {Object} postData - Post data including content and attachments
   * @returns {Promise} Promise with created post
   */
  createGroupPost: async (groupId, postData) => {
    try {
      const formData = new FormData();
      
      if (postData.content) {
        formData.append('content', postData.content);
      }
      
      if (postData.title) {
        formData.append('title', postData.title);
        console.log("Including title in post data:", postData.title);
      }
      
      // Add attachments if any - properly handle attachments array
      if (postData.attachments && postData.attachments.length > 0) {
        console.log("FormData entries:");
        for (let i = 0; i < postData.attachments.length; i++) {
          // This is the correct format that the server expects
          formData.append('attachments[]', postData.attachments[i]);
          console.log(`Adding attachment ${i+1}: ${postData.attachments[i].name}, size: ${postData.attachments[i].size} bytes`);
        }
      }
      
      // Log form data for debugging
      console.log("FormData entries:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }
      
      // Use direct API call with proper headers for multipart form data
      const response = await api.post(`/groups/${groupId}/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Post created successfully'
      };
    } catch (error) {
      console.error('Error creating post:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create post',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  /**
   * Get a specific post
   * @param {number} postId - The post ID
   * @returns {Promise} Promise with post data
   */
  getPost: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error(`Error fetching post ${postId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  },

  /**
   * Like a post
   * @param {number} postId - The post ID
   * @returns {Promise} Promise with like result
   */
  likePost: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      return {
        success: true,
        message: response.data.message || 'Post liked successfully'
      };
    } catch (error) {
      console.error(`Error liking post ${postId}:`, error);
      
      // Special handling for "already liked" error
      if (error.response?.status === 400 && error.response.data?.message?.includes('already liked')) {
        return {
          success: false,
          message: error.response.data.message,
          alreadyLiked: true
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to like post'
      };
    }
  },

  /**
   * Unlike a post
   * @param {number} postId - The post ID
   * @returns {Promise} Promise with unlike result
   */
  unlikePost: async (postId) => {
    try {
      const response = await api.delete(`/posts/${postId}/like`);
      return {
        success: true,
        message: response.data.message || 'Post unliked successfully'
      };
    } catch (error) {
      console.error(`Error unliking post ${postId}:`, error);
      
      // Special handling for "not liked" error
      if (error.response?.status === 400 && error.response.data?.message?.includes('not liked')) {
        return {
          success: false,
          message: error.response.data.message,
          notLiked: true
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to unlike post'
      };
    }
  },

  /**
   * Get comments for a specific post
   * @param {number} postId - The post ID
   * @param {object} params - Query parameters like page, limit, etc.
   * @returns {Promise} - Promise with comments data
   */
  getPostComments: async (postId, params = {}) => {
    try {
      const response = await apiRequestWithRetry('get', `/posts/${postId}/comments`, null, { params });
      
      return {
        success: true,
        data: response.data.data || response.data,
        meta: response.data.meta || {}
      };
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Failed to fetch comments',
        data: []
      };
    }
  },

  /**
   * Add a comment to a post
   * @param {number} postId - The post ID
   * @param {Object} commentData - Comment data
   * @returns {Promise} Promise with comment result
   */
  addComment: async (postId, commentData) => {
    try {
      const response = await api.post(`/posts/${postId}/comments`, commentData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Comment added successfully'
      };
    } catch (error) {
      console.error(`Error adding comment to post ${postId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add comment',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  /**
   * Create a comment for a post
   * @param {Number} postId - The ID of the post
   * @param {Object} commentData - Comment data including content and optional parent_id
   * @returns {Promise} Promise with created comment data
   */
  createPostComment: async (postId, commentData) => {
    try {
      const response = await api.post(`/posts/${postId}/comments`, commentData);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Comment added successfully'
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add comment',
        errors: error.response?.data?.errors || {}
      };
    }
  },

  /**
   * Delete a comment
   * @param {Number} postId - The ID of the post
   * @param {Number} commentId - The ID of the comment to delete
   * @returns {Promise} Promise with success message
   */
  deletePostComment: async (postId, commentId) => {
    try {
      const response = await api.delete(`/posts/${postId}/comments/${commentId}`);
      
      return {
        success: true,
        message: response.data.message || 'Comment deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete comment'
      };
    }
  },

  /**
   * Get replies for a comment
   * @param {Number} postId - The ID of the post
   * @param {Number} commentId - The ID of the parent comment
   * @param {Object} params - Query parameters
   * @returns {Promise} Promise with replies data
   */
  getCommentReplies: async (postId, commentId, params = {}) => {
    try {
      const response = await api.get(`/posts/${postId}/comments/${commentId}/replies`, { params });
      
      return {
        success: true,
        data: response.data.data || response.data,
        meta: response.data.meta || null
      };
    } catch (error) {
      console.error('Error fetching comment replies:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch replies'
      };
    }
  },

  /**
   * Get file URL for downloading attachments
   * @param {Number} attachmentId - The ID of the attachment
   * @returns {Promise} Promise with file URL
   */
  getFileUrl: async (attachmentId) => {
    try {
      const response = await api.get(`/post-attachments/${attachmentId}/url`);
      
      return {
        success: true,
        url: response.data.url || response.data.data?.url
      };
    } catch (error) {
      console.error('Error getting file URL:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get file URL'
      };
    }
  },

  /**
   * Download a post attachment
   * @param {Number} attachmentId - The ID of the attachment
   * @returns {Promise} Promise with download result
   */
  downloadAttachment: async (attachmentId) => {
    try {
      // First get the download URL
      const urlResponse = await postService.getFileUrl(attachmentId);
      
      if (!urlResponse.success) {
        throw new Error(urlResponse.message || 'Failed to get download URL');
      }
      
      // Create a temporary link and trigger the download
      const link = document.createElement('a');
      link.href = urlResponse.url;
      link.setAttribute('download', ''); // Let the server set the filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return {
        success: true,
        message: 'Download started'
      };
    } catch (error) {
      console.error('Error downloading attachment:', error);
      return {
        success: false,
        message: error.message || 'Failed to download attachment'
      };
    }
  },

  /**
   * Delete a post
   * @param {number} postId - The post ID
   * @returns {Promise} Promise with delete result
   */
  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/posts/${postId}`);
      return {
        success: true,
        message: response.data.message || 'Post deleted successfully'
      };
    } catch (error) {
      console.error(`Error deleting post ${postId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete post'
      };
    }
  },

  /**
   * Update an existing post
   * @param {number} postId - The post ID
   * @param {Object} postData - Post data to update (title, content)
   * @returns {Promise} Promise with update result
   */
  updatePost: async (postId, postData) => {
    try {
      const response = await api.put(`/posts/${postId}`, postData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Post updated successfully'
      };
    } catch (error) {
      console.error(`Error updating post ${postId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update post',
        errors: error.response?.data?.errors || {}
      };
    }
  }
};

export default postService;
