import api, { apiRequestWithRetry, API_BASE_URL } from './api';
import cacheService from './cacheService';
import authService from './authService';

class AIChatService {
  constructor() {
    this.pusher = null;
    this.isConnecting = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
    this.reconnectTimeout = null;
  }

  /**
   * Get user's AI chats
   * @param {Object} params - Query parameters like page, limit, etc.
   * @param {boolean} useCache - Whether to use cached data if available
   * @returns {Promise} Promise with user's AI chats
   */
  getUserAIChats = async (params = {}, useCache = true) => {
    const user = authService.getUser();
    const userId = user?.id || 'anonymous';
    const cacheKey = `user_ai_chats_${userId}_${JSON.stringify(params)}`;
    
    if (useCache) {
      console.log('Using cached AI chats data');
      return cacheService.memoize(
        cacheKey,
        async () => {
          try {
            const response = await api.get('/ai-chats', { params });
            
            let result;
            
            if (response.data && response.data.data) {
              result = {
                success: true,
                data: response.data.data
              };
            } else if (response.data) {
              result = {
                success: true,
                data: response.data
              };
            } else {
              result = response.data;
            }
            
            return result;
          } catch (error) {
            console.error('Error fetching user AI chats:', error.response?.data || error.message);
            return {
              success: false,
              message: error.response?.data?.message || error.message || 'Could not fetch AI chats',
              data: []
            };
          }
        }
      );
    } else {
      console.log('Bypassing cache for AI chats, fetching fresh data');
      try {
        const response = await api.get('/ai-chats', { params });
        
        let result;
        
        if (response.data && response.data.data) {
          result = {
            success: true,
            data: response.data.data
          };
        } else if (response.data) {
          result = {
            success: true,
            data: response.data
          };
        } else {
          result = response.data;
        }
        
        return result;
      } catch (error) {
        console.error('Error fetching user AI chats:', error.response?.data || error.message);
        return {
          success: false,
          message: error.response?.data?.message || error.message || 'Could not fetch AI chats',
          data: []
        };
      }
    }
  };

  /**
   * Get a specific AI chat by ID
   * @param {Number} chatId - The ID of the AI chat
   * @returns {Promise} Promise with AI chat data
   */
  getAIChat = async (chatId) => {
    try {
      const response = await api.get(`/ai-chats/${chatId}`);
      
      if (response.data && response.data.data) {
        return {
          success: true,
          data: response.data.data
        };
      }
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching AI chat:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Could not fetch AI chat details'
      };
    }
  };
  /**
   * Get user's AI chats (alias for getUserAIChats)
   * @param {Object} params - Query parameters like page, limit, etc.
   * @param {boolean} useCache - Whether to use cached data if available
   * @returns {Promise} Promise with user's AI chats
   */
  getAIChats = async (params = {}, useCache = true) => {
    return this.getUserAIChats(params, useCache);
  };

  /**
   * Create a new AI chat (alias for createAIChat)
   * @param {Object} chatData - The AI chat data (title, model)
   * @returns {Promise} Promise with created AI chat data
   */
  createAIChat = async (chatData) => {    
    try {
      const response = await api.post('/ai-chats', chatData);
      
      // Clear cache after creating new chat
      const user = authService.getUser();
      const userId = user?.id || 'anonymous';
      const cachePattern = `user_ai_chats_${userId}_`;
      cacheService.removeByPattern(cachePattern);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'AI chat created successfully'
      };
    } catch (error) {
      console.error('Error creating AI chat:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Could not create AI chat',
        error: error.response?.data || error.message
      };
    }
  };

  /**
   * Update an AI chat
   * @param {Number} chatId - The ID of the AI chat
   * @param {Object} updateData - The data to update (title, model)
   * @returns {Promise} Promise with updated AI chat data
   */
  updateAIChat = async (chatId, updateData) => {
    try {
      const response = await api.put(`/ai-chats/${chatId}`, updateData);
        // Clear cache after updating
      const user = authService.getUser();
      const userId = user?.id || 'anonymous';
      const cachePattern = `user_ai_chats_${userId}_`;
      cacheService.removeByPattern(cachePattern);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'AI chat updated successfully'
      };
    } catch (error) {
      console.error('Error updating AI chat:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Could not update AI chat',
        error: error.response?.data || error.message
      };
    }
  };

  /**
   * Delete an AI chat
   * @param {Number} chatId - The ID of the AI chat
   * @returns {Promise} Promise with success message
   */
  deleteAIChat = async (chatId) => {
    try {
      const response = await api.delete(`/ai-chats/${chatId}`);
        // Clear cache after deleting
      const user = authService.getUser();
      const userId = user?.id || 'anonymous';
      const cachePattern = `user_ai_chats_${userId}_`;
      cacheService.removeByPattern(cachePattern);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'AI chat deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting AI chat:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Could not delete AI chat',
        error: error.response?.data || error.message
      };
    }
  };

  /**
   * Send a message to AI
   * @param {Number} chatId - The ID of the AI chat
   * @param {Object} messageData - The message data (content)
   * @returns {Promise} Promise with AI response message data
   */
  sendMessageToAI = async (chatId, messageData) => {
    try {
      console.log(`Sending message to AI chat ${chatId}:`, messageData);
      
      const payload = {
        content: (messageData.content || '').trim()
      };
      
      if (!payload.content) {
        return {
          success: false,
          message: 'Message content is required'
        };
      }
      
      console.log('Payload being sent to AI:', payload);
      
      const response = await apiRequestWithRetry('post', `/ai-chats/${chatId}/messages`, payload);
      
      console.log('AI response:', response.data);
      
      if (response && response.data !== undefined) {
        let responseData = null;
        
        if (response.data && typeof response.data === 'object') {
          if (response.data.data) {
            responseData = response.data.data;
          } else if (response.data.user_message || response.data.ai_message) {
            responseData = response.data;
          } else {
            responseData = response.data;
          }
        }
        
        console.log('Extracted AI response data:', responseData);
        
        if (responseData) {
          return {
            success: true,
            data: responseData,
            message: 'Message sent to AI successfully'
          };
        } else {
          console.warn('AI message sent but no data returned:', response.data);
          return {
            success: true,
            data: null,
            message: 'Message sent to AI successfully (no data returned)'
          };
        }
      } else {
        console.error('Invalid AI response structure:', response);
        return {
          success: false,
          message: 'Invalid response format from AI server'
        };
      }
    } catch (error) {
      console.error(`Error sending message to AI chat ${chatId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Could not send message to AI',
        error: error.response?.data || error.message
      };
    }
  };

  /**
   * Send a message to AI (alias for sendMessageToAI)
   * @param {Number} chatId - The ID of the AI chat
   * @param {Object} messageData - The message data (content)
   * @returns {Promise} Promise with AI response message data
   */
  sendMessage = async (chatId, messageData) => {
    return this.sendMessageToAI(chatId, messageData);
  };

  /**
   * Clear AI chat history
   * @param {Number} chatId - The ID of the AI chat
   * @returns {Promise} Promise with success message
   */
  clearAIChatHistory = async (chatId) => {
    try {
      const response = await api.delete(`/ai-chats/${chatId}/messages`);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'AI chat history cleared successfully'
      };
    } catch (error) {
      console.error('Error clearing AI chat history:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Could not clear AI chat history',
        error: error.response?.data || error.message
      };
    }
  };

  /**
   * Get available AI models
   * @returns {Array} List of available AI models
   */
  getAvailableModels = () => {
    return [
      { value: 'gpt-4', label: 'GPT-4', description: 'Most capable model, best for complex tasks' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Faster version of GPT-4' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and efficient for most tasks' }
    ];
  };

  /**
   * Get auth headers for API requests
   */
  getAuthHeaders() {
    const token = authService.getToken();
    if (!token) {
      console.warn('No auth token available for AI chat service');
      return {};
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };
  }

  /**
   * Clean up all resources
   */
  cleanup = () => {
    try {
      console.log('Cleaning up AI chat service...');
      
      this.isConnecting = false;
      this.connectionAttempts = 0;
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      console.log('AI chat service cleanup completed');
    } catch (error) {
      console.error('Error during AI chat service cleanup:', error);
    }
  };
}

const aiChatService = new AIChatService();
export default aiChatService;
