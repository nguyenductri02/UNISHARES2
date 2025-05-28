/**
 * Utility functions for handling errors in the application
 */

/**
 * Log errors to console with consistent formatting
 * @param {string} context - Where the error occurred (component or function name)
 * @param {Error} error - The error object
 * @param {string} message - Optional custom message
 */
export const logError = (context, error, message = '') => {
  const errorMessage = message || error.message || 'Unknown error';
  console.error(`[${context}] ${errorMessage}`, error);
  
  // Could be extended to log to a remote error tracking service
};

/**
 * Format API errors to human-readable messages
 * @param {object|Error} error - Error object from API or catch block
 * @returns {string} Human-readable error message
 */
export const formatApiError = (error) => {
  // Handle Laravel API error format
  if (error.response && error.response.data) {
    const { data } = error.response;
    
    // Error message from Laravel
    if (data.message) {
      return data.message;
    }
    
    // Validation errors
    if (data.errors) {
      return Object.values(data.errors)
        .flat()
        .join(', ');
    }
  }
  
  // Network errors
  if (error.message === 'Network Error') {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.';
  }
  
  // Default error message
  return error.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
};

/**
 * Get fallback/default data when API calls fail
 * @param {string} type - Type of data needed
 * @returns {Array|Object} Default data for the requested type
 */
export const getFallbackData = (type) => {
  const fallbacks = {
    roles: [
      { value: 'student', label: 'Sinh viên' },
      { value: 'lecturer', label: 'Giảng viên' },
      { value: 'moderator', label: 'Người kiểm duyệt' },
      { value: 'admin', label: 'Quản trị viên' }
    ],
    permissions: [
      'view documents', 'create documents', 'edit documents', 'delete documents',
      'view posts', 'create posts', 'edit posts', 'delete posts',
      'view reports', 'create reports', 'resolve reports',
      'view statistics'
    ],
    users: [
      { id: 1, name: 'Admin User', email: 'admin@example.com', roles: [{ name: 'admin' }], is_active: true },
      { id: 2, name: 'Moderator User', email: 'moderator@example.com', roles: [{ name: 'moderator' }], is_active: true },
      { id: 3, name: 'Lecturer User', email: 'lecturer@example.com', roles: [{ name: 'lecturer' }], is_active: true },
      { id: 4, name: 'Student User', email: 'student@example.com', roles: [{ name: 'student' }], is_active: true }
    ],
    stats: {
      users: { total: 0, active: 0 },
      content: { documents: { total: 0, approved: 0 }, posts: { total: 0 } },
      reports: { pending: 0 }
    }
  };
  
  return fallbacks[type] || [];
};

export default {
  logError,
  formatApiError,
  getFallbackData
};
