import api from './api';

const reportService = {
  /**
   * Report a group
   * @param {number} groupId - The ID of the group to report
   * @param {object} reportData - The report data (reason, details)
   * @returns {Promise} - The response from the API
   */
  reportGroup: async (groupId, reportData) => {
    try {
      const response = await api.post(`/reports/groups/${groupId}`, reportData);
      return response.data;
    } catch (error) {
      console.error('Error reporting group:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi báo cáo nhóm'
      };
    }
  },

  /**
   * Report a document
   * @param {number} documentId - The ID of the document to report
   * @param {object} reportData - The report data (reason, details)
   * @returns {Promise} - The response from the API
   */
  reportDocument: async (documentId, reportData) => {
    try {
      const response = await api.post(`/documents/${documentId}/report`, reportData);
      return response.data;
    } catch (error) {
      console.error('Error reporting document:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi báo cáo tài liệu'
      };
    }
  },

  /**
   * Get user's reports
   * @returns {Promise} - The response from the API
   */
  getUserReports: async () => {
    try {
      const response = await api.get('/reports/user');
      return response.data;
    } catch (error) {
      console.error('Error getting user reports:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi lấy danh sách báo cáo'
      };
    }
  },

  /**
   * Cancel a report
   * @param {number} reportId - The ID of the report to cancel
   * @returns {Promise} - The response from the API
   */
  cancelReport: async (reportId) => {
    try {
      const response = await api.post(`/reports/cancel/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Error canceling report:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi hủy báo cáo'
      };
    }
  },

  /**
   * Report a post
   * @param {number} postId - The ID of the post to report
   * @param {object} reportData - The report data (reason, details)
   * @returns {Promise} - The response from the API
   */
  reportPost: async (postId, reportData) => {
    try {
      const response = await api.post(`/posts/${postId}/report`, reportData);
      return response.data;
    } catch (error) {
      console.error('Error reporting post:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi báo cáo bài viết'
      };
    }
  },

  /**
   * Report a post comment
   * @param {number} postId - The ID of the post containing the comment
   * @param {number} commentId - The ID of the comment to report
   * @param {object} reportData - The report data (reason, details)
   * @returns {Promise} - The response from the API
   */
  reportComment: async (postId, commentId, reportData) => {
    try {
      const response = await api.post(`/posts/${postId}/comments/${commentId}/report`, reportData);
      return response.data;
    } catch (error) {
      console.error('Error reporting comment:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi báo cáo bình luận'
      };
    }
  },

  /**
   * Report a user
   * @param {number} userId - The ID of the user to report
   * @param {object} reportData - The report data (reason, details)
   * @returns {Promise} - The response from the API
   */
  reportUser: async (userId, reportData) => {
    try {
      const response = await api.post(`/users/${userId}/report`, reportData);
      return response.data;
    } catch (error) {
      console.error('Error reporting user:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi báo cáo người dùng'
      };
    }
  }
};

export default reportService;
