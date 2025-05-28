import api from './api';
import cacheService from './cacheService';

/**
 * Service for terms-related functionality
 */
const termsService = {
  /**
   * Get the latest terms of service
   * @returns {Promise} Promise with terms content
   */
  getTermsOfService: async () => {
    const cacheKey = 'terms_of_service';
    
    try {
      // Try to get from cache first
      return await cacheService.memoize(
        cacheKey,
        async () => {
          const response = await api.get('/terms/latest');
          return {
            success: true,
            data: response.data
          };
        },
        24 * 60 * 60 * 1000 // Cache for 24 hours
      );
    } catch (error) {
      console.error('Error fetching terms of service:', error);
      return {
        success: false,
        message: 'Không thể tải điều khoản dịch vụ. Vui lòng thử lại sau.'
      };
    }
  },
  
  /**
   * Get user's acceptance status for terms
   * @returns {Promise} Promise with acceptance status
   */
  getUserAcceptanceStatus: async () => {
    try {
      const response = await api.get('/user/terms-acceptance');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching terms acceptance status:', error);
      return {
        success: false,
        message: 'Không thể kiểm tra trạng thái chấp nhận điều khoản. Vui lòng thử lại sau.'
      };
    }
  },
  
  /**
   * Accept the terms of service
   * @param {string} version - The version of terms being accepted
   * @returns {Promise} Promise with acceptance confirmation
   */
  acceptTerms: async (version) => {
    try {
      const response = await api.post('/user/terms-acceptance', { version });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error accepting terms of service:', error);
      return {
        success: false,
        message: 'Không thể cập nhật trạng thái chấp nhận điều khoản. Vui lòng thử lại sau.'
      };
    }
  }
};

export default termsService;
