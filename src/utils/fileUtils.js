import api from '../services/api';

/**
 * Utility functions for file operations
 */
const fileUtils = {
  /**
   * Check if a file already exists in the system
   * @param {File} file - The file to check
   * @returns {Promise} Promise with check result
   */
  checkFileExists: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/documents/check-exists', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error checking file existence:', error);
      // Return false to proceed with normal upload
      return { exists: false };
    }
  },
  
  /**
   * Format file size in human-readable format
   * @param {Number} bytes - Size in bytes
   * @returns {String} Formatted size
   */
  formatFileSize: (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  /**
   * Get icon component based on file type
   * @param {String} fileType - MIME type or extension
   * @returns {Object} Icon information
   */
  getFileTypeInfo: (fileType) => {
    if (!fileType) return { icon: 'file-alt', color: 'secondary' };
    
    fileType = fileType.toLowerCase();
    
    if (fileType.includes('pdf')) return { icon: 'file-pdf', color: 'danger' };
    if (fileType.includes('word') || fileType.includes('doc')) return { icon: 'file-word', color: 'primary' };
    if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('xls')) return { icon: 'file-excel', color: 'success' };
    if (fileType.includes('powerpoint') || fileType.includes('presentation') || fileType.includes('ppt')) return { icon: 'file-powerpoint', color: 'warning' };
    if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('png') || fileType.includes('gif')) return { icon: 'file-image', color: 'info' };
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z') || fileType.includes('tar') || fileType.includes('gz')) return { icon: 'file-archive', color: 'secondary' };
    if (fileType.includes('text') || fileType.includes('txt')) return { icon: 'file-alt', color: 'secondary' };
    
    return { icon: 'file-alt', color: 'secondary' };
  },
  
  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateFile: (file, options = {}) => {
    const { 
      maxSize = 100 * 1024 * 1024, // 100MB default
      allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'application/x-zip-compressed',
        'image/jpeg',
        'image/png',
        'image/gif'
      ]
    } = options;
    
    if (!file) {
      return { valid: false, error: 'Không có file nào được chọn' };
    }
    
    // Check file size
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `Kích thước file vượt quá ${fileUtils.formatFileSize(maxSize)}`
      };
    }
    
    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Định dạng file không được hỗ trợ' 
      };
    }
    
    return { valid: true };
  }
};

export default fileUtils;
