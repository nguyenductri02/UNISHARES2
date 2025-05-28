import api, { apiRequestWithRetry, API_BASE_URL } from './api';
import cacheService from './cacheService';
import { authService } from './index';

class ChatService {
  constructor() {
    this.pusher = null;
    this.isConnecting = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
    this.reconnectTimeout = null;
  }

  /**
   * Get user's chats
   * @param {Object} params - Query parameters like page, limit, etc.
   * @param {boolean} useCache - Whether to use cached data if available
   * @returns {Promise} Promise with user's chats
   */  getUserChats = async (params = {}, useCache = true) => {
    // Tạo cache key từ params và user ID
    const user = authService.getUser();
    const userId = user?.id || 'anonymous';
    const cacheKey = `user_chats_${userId}_${JSON.stringify(params)}`;
    
    // Sử dụng memoize để tránh duplicate calls
    if (useCache) {
      console.log('Using cached user chats data');
      return cacheService.memoize(
        cacheKey,
        async () => {
          try {
            const response = await api.get('/chats', { params });
            
            let result;
            
            // If the API returns a nested structure with data.data, standardize it
            if (response.data && response.data.data) {
              result = {
                success: true,
                data: response.data.data
              };
            }
            // If the API returns data directly
            else if (response.data) {
              result = {
                success: true,
                data: response.data
              };
            }
            else {
              result = response.data;
            }
            
            return result;
          } catch (error) {
            console.error('Error fetching user chats:', error.response?.data || error.message);
            return {
              success: false,
              message: error.response?.data?.message || error.message || 'Could not fetch user chats',
              data: []
            };
          }
        }
      );
    } else {
      console.log('Bypassing cache for user chats, fetching fresh data');
      try {
        const response = await api.get('/chats', { params });
        
        let result;
        
        // If the API returns a nested structure with data.data, standardize it
        if (response.data && response.data.data) {
          result = {
            success: true,
            data: response.data.data
          };
        }
        // If the API returns data directly
        else if (response.data) {
          result = {
            success: true,
            data: response.data
          };
        }
        else {
          result = response.data;
        }
        
        return result;
      } catch (error) {
        console.error('Error fetching user chats:', error.response?.data || error.message);
        return {
          success: false,
          message: error.response?.data?.message || error.message || 'Could not fetch user chats',
          data: []
        };
      }
    }
  };

  /**
   * Get a specific chat by ID
   * @param {Number} chatId - The ID of the chat
   * @returns {Promise} Promise with chat data
   */
  getChat = async (chatId) => {
    try {
      const response = await api.get(`/chats/${chatId}`);
      
      // If the API returns a nested structure, unwrap it for consistency
      if (response.data && response.data.data) {
        return {
          success: true,
          data: response.data.data
        };
      }
      
      // If the API returns data directly
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching chat:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Could not fetch chat details'
      };
    }
  };

  /**
   * Get messages for a chat
   * @param {Number} chatId - The ID of the chat
   * @param {Object} params - Query parameters like page, limit, etc.
   * @returns {Promise} Promise with chat messages
   */
  getChatMessages = async (chatId, params = {}) => {
    try {
      console.log(`Fetching messages for chat ${chatId}`);
      
      // Add sort parameter to ensure messages are returned in chronological order
      const queryParams = { 
        ...params,
        sort_by: 'created_at',
        sort_direction: 'asc' 
      };
      
      const response = await apiRequestWithRetry('get', `/chats/${chatId}/messages`, null, {
        params: queryParams
      });
      
      console.log('Messages response:', response.data);
      
      // Standardize the response format to ensure we always return an array
      if (response.data && typeof response.data === 'object') {
        // Check if the response has a data property that's an array
        if (response.data.data && Array.isArray(response.data.data)) {
          return {
            success: true,
            data: response.data.data
          };
        }
        
        // Check if the response itself is an array
        if (Array.isArray(response.data)) {
          return {
            success: true,
            data: response.data
          };
        }
        
        // Default fallback - return an empty array if we can't find a valid messages array
        console.warn('Unexpected chat messages format:', response.data);
        return {
          success: true,
          data: []
        };
      }
      
      // If response.data is not an object, return empty array
      return {
        success: false,
        message: 'Invalid response format',
        data: []
      };
    } catch (error) {
      console.error('Error fetching chat messages:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Could not fetch chat messages',
        data: []
      };
    }
  };

  /**
   * Send a message to a chat
   * @param {Number} chatId - The ID of the chat
   * @param {Object} messageData - The message data
   * @returns {Promise} Promise with sent message data
   */  
  sendMessage = async (chatId, messageData) => {
    try {
      console.log(`Sending message to chat ${chatId}:`, messageData);
      
      // Ensure content is sent properly and never null/undefined
      const payload = {
        content: (messageData.content || '').trim()
      };
      
      // Validate that we have content to send
      if (!payload.content) {
        return {
          success: false,
          message: 'Message content is required'
        };
      }
      
      console.log('Payload being sent:', payload);
      
      const response = await apiRequestWithRetry('post', `/chats/${chatId}/messages`, payload);
      
      console.log('Full response object:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      // Check if response exists and has data
      if (response && response.data !== undefined) {
        // Handle different response structures
        let messageData = null;
        
        if (response.data && typeof response.data === 'object') {
          // If response.data has a nested data property
          if (response.data.data) {
            messageData = response.data.data;
          } 
          // If response.data is the message itself
          else if (response.data.id || response.data.content !== undefined) {
            messageData = response.data;
          }
          // If response.data has a message property
          else if (response.data.message && typeof response.data.message === 'object') {
            messageData = response.data.message;
          }
        }
        
        console.log('Extracted message data:', messageData);
        
        if (messageData) {
          return {
            success: true,
            data: messageData,
            message: 'Message sent successfully'
          };
        } else {
          console.warn('Message sent but no data returned:', response.data);
          return {
            success: true,
            data: null,
            message: 'Message sent successfully (no data returned)'
          };
        }
      } else {
        console.error('Invalid response structure:', response);
        return {
          success: false,
          message: 'Invalid response format from server'
        };
      }
    } catch (error) {
      console.error(`Error sending message to chat ${chatId}:`, error);
      
      let errorMessage = 'Could not send message';
      
      // Extract error message from response if available
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage,
        error: error.response?.data || error.message
      };
    }
  };

  /**
   * Send a message with attachments to a chat
   * @param {Number} chatId - The ID of the chat
   * @param {Object} messageData - The message data
   * @param {Array} files - Array of files to attach
   * @returns {Promise} Promise with sent message data
   */
  sendMessageWithAttachments = async (chatId, messageData, files) => {
    try {
      console.log(`Sending message with attachments to chat ${chatId}`);
      
      const formData = new FormData();
      
      // Always add content field, even if it's an empty string
      // This prevents NULL values that can cause database constraint violations
      formData.append('content', messageData.content?.trim() || '');
      
      // Add files
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          formData.append('attachments[]', files[i]);
        }
      }
      
      const response = await api.post(
        `/chats/${chatId}/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      
      console.log('Message with attachments response:', response.data);
      
      // Ensure we return a consistent response format
      let result;
      if (response.data && response.data.data) {
        result = {
          success: true,
          data: response.data.data
        };
      } else {
        result = {
          success: true,
          data: response.data
        };
      }
      
      return result;
    } catch (error) {
      console.error(`Error sending message with attachments to chat ${chatId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Could not send message with attachments',
        error: error.response?.data || error.message
      };
    }
  };

  /**
   * Create a new chat
   * @param {Object} chatData - The chat data
   * @returns {Promise} Promise with created chat data
   */
  createChat = async (chatData) => {
    try {
      const response = await api.post('/chats', chatData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  };

  /**
   * Add a user to a chat
   * @param {Number} chatId - The ID of the chat
   * @param {Number} userId - The ID of the user to add
   * @returns {Promise} Promise with success message
   */
  addUserToChat = async (chatId, userId) => {
    try {
      const response = await api.post(`/chats/${chatId}/participants`, { user_id: userId });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  };

  /**
   * Remove a user from a chat
   * @param {Number} chatId - The ID of the chat
   * @param {Number} userId - The ID of the user to remove
   * @returns {Promise} Promise with success message
   */
  removeUserFromChat = async (chatId, userId) => {
    try {
      const response = await api.delete(`/chats/${chatId}/participants/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  };

  /**
   * Mark a chat as read
   * @param {Number} chatId - The ID of the chat
   * @returns {Promise} Promise with success message
   */
  markChatAsRead = async (chatId) => {
    try {
      const response = await api.post(`/chats/${chatId}/read`);
      
      // Return a standardized response
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Chat marked as read successfully'
      };
    } catch (error) {
      console.error(`Error marking chat ${chatId} as read:`, error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Could not mark chat as read',
        error: error.response?.data || error.message
      };
    }
  };

  /**
   * Get or create a group chat
   * @param {Number} groupId - The ID of the group
   * @returns {Promise} Promise with chat data
   */
  getGroupChat = async (groupId) => {
    try {
      console.log(`Getting chat for group ${groupId}`);
      
      // First try to get existing chat
      try {
        const response = await api.get(`/groups/${groupId}/chat`);
        console.log('GET chat response:', response.data);
        
        if (response.data.success !== false) {
          return {
            success: true,
            data: response.data.data || response.data
          };
        }
      } catch (error) {
        console.warn('Get group chat failed, will try to create:', error.message);
        // If GET fails because the chat doesn't exist, continue to create it
      }
      
      // Create a new chat if one doesn't exist
      console.log(`Creating new chat for group ${groupId}`);
      try {
        const createResponse = await api.post(`/groups/${groupId}/chat`);
        console.log('Create chat response:', createResponse.data);
        
        if (createResponse.data.success === false) {
          // If there was a specific error with the creation, but we want to handle it gracefully
          throw new Error(createResponse.data.message || 'Failed to create group chat');
        }
        
        return {
          success: true,
          data: createResponse.data.data || createResponse.data
        };
      } catch (createError) {
        // If creation failed, try one more time after a short delay
        // This can help if the error was due to a missing column that was just added by a migration
        console.warn('Creating chat failed, retrying after delay:', createError.message);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          const retryResponse = await api.post(`/groups/${groupId}/chat`);
          return {
            success: true,
            data: retryResponse.data.data || retryResponse.data
          };
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
          throw retryError;
        }
      }
    } catch (error) {
      console.error('Error fetching/creating group chat:', error);
      
      // Return structured error response
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Could not get or create group chat',
        error: error.response?.data || error.message
      };
    }
  };

  /**
   * Send a message to a group chat
   * @param {Number} groupId - The ID of the group
   * @param {Object} messageData - The message data
   * @returns {Promise} Promise with sent message data
   */
  sendGroupMessage = async (groupId, messageData) => {
    try {
      // First, ensure we have a chat for this group
      const chatResponse = await chatService.getGroupChat(groupId);
      
      if (!chatResponse.success || !chatResponse.data) {
        return {
          success: false,
          message: 'Failed to get or create chat for this group'
        };
      }
      
      const chat = chatResponse.data;
      const chatId = chat.id;
      
      // Send the message to the chat
      const response = await api.post(`/chats/${chatId}/messages`, messageData);
      
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error(`Error sending message to group ${groupId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Could not send message to group chat',
        error: error.response?.data || error.message
      };
    }
  };

  /**
   * Get group chat messages
   * @param {Number} groupId - The ID of the group
   * @param {Object} params - Query parameters like page, limit, etc.
   * @returns {Promise} Promise with chat messages
   */
  getGroupChatMessages = async (groupId, params = {}) => {
    try {
      // First, ensure we have a chat for this group
      const chatResponse = await chatService.getGroupChat(groupId);
      
      if (!chatResponse.success || !chatResponse.data) {
        return {
          success: false,
          message: 'Failed to get or create chat for this group',
          data: []
        };
      }
      
      const chat = chatResponse.data;
      const chatId = chat.id;
      
      // Get messages for the chat
      const response = await api.get(`/chats/${chatId}/messages`, { params });
      
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error(`Error fetching messages for group ${groupId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Could not fetch group chat messages',
        data: []
      };
    }
  };

  /**
   * Get unread message counts for all chats
   * @returns {Promise} Promise with unread counts data
   */
  getUnreadCounts = async () => {
    try {
      const response = await api.get('/chats/unread-counts');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  };

  /**
   * Download a message attachment
   * @param {Number} attachmentId - The ID of the attachment
   * @returns {Promise} Promise with download URL
   */
  downloadAttachment = async (attachmentId) => {
    try {
      const response = await api.get(`/message-attachments/${attachmentId}/download`, {
        responseType: 'blob'
      });
      
      // Create a download URL
      const url = window.URL.createObjectURL(new Blob([response.data]));
      return {
        success: true,
        url
      };
    } catch (error) {
      console.error(`Error downloading attachment ${attachmentId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Could not download attachment',
        error: error.response?.data || error.message
      };
    }
  };

  // Real-time event listeners
  _listeners = new Map();

  /**
   * Subscribe to real-time chat events
   * @param {Function} onNewMessage - Callback for new messages
   * @param {Function} onChatUpdated - Callback for chat updates
   * @param {Function} onChatListUpdated - Callback for chat list updates
   */
  subscribeToRealTimeEvents = (onNewMessage, onChatUpdated, onChatListUpdated) => {
    // Prevent multiple concurrent connection attempts
    if (this.isConnecting) {
      console.log('Already connecting to Pusher, skipping new connection attempt');
      return false;
    }

    // Check if user is authenticated first
    const token = authService.getToken();
    if (!token) {
      console.warn('Cannot subscribe to real-time events: No authentication token');
      return false;
    }

    // Check if Pusher environment variables are configured
    const pusherKey = process.env.REACT_APP_PUSHER_KEY;
    const pusherCluster = process.env.REACT_APP_PUSHER_CLUSTER;
    
    console.log('Pusher config check:', {
      key: pusherKey ? 'configured' : 'missing',
      cluster: pusherCluster ? 'configured' : 'missing'
    });

    if (!pusherKey || !pusherCluster || pusherKey === 'your_pusher_app_key_here') {
      console.warn('Pusher environment variables not configured properly. Please set REACT_APP_PUSHER_KEY and REACT_APP_PUSHER_CLUSTER in your .env file');
      console.info('Real-time chat features will be disabled. Messages will still work but won\'t update in real-time.');
      
      // Set up polling fallback
      this.setupPollingFallback();
      return false;
    }

    try {
      // Check if Pusher is available
      if (!window.Pusher) {
        console.warn('Pusher library not loaded, falling back to polling');
        this.setupPollingFallback();
        return false;
      }

      // If already connected and working, don't reconnect
      if (this.pusher && this.pusher.connection.state === 'connected') {
        console.log('Pusher already connected, updating callbacks and subscribing to channels');
        
        // Update callbacks
        this.realTimeCallbacks = {
          onNewMessage,
          onChatUpdated,
          onChatListUpdated
        };
        
        // Re-subscribe to channels with new callbacks
        this.subscribeToChannels(
          this.realTimeCallbacks.onNewMessage,
          this.realTimeCallbacks.onChatUpdated,
          this.realTimeCallbacks.onChatListUpdated
        );
        
        return true;
      }

      // Set connecting flag
      this.isConnecting = true;

      // Disconnect existing connection if any
      if (this.pusher) {
        console.log('Disconnecting existing Pusher connection');
        try {
          this.pusher.disconnect();
        } catch (disconnectError) {
          console.warn('Error disconnecting existing Pusher connection:', disconnectError);
        }
        this.pusher = null;
      }

      console.log('Initializing Pusher connection with key:', pusherKey);
      
      // Get current auth headers
      const authHeaders = this.getAuthHeaders();
      console.log('Auth headers for Pusher:', Object.keys(authHeaders));

      this.pusher = new window.Pusher(pusherKey, {
        cluster: pusherCluster,
        encrypted: true,
        forceTLS: true,
        auth: {
          headers: authHeaders,
          params: {
            // Add any additional auth params if needed
          }
        },
        authEndpoint: `${API_BASE_URL}/broadcasting/auth`, // Remove the duplicate /api
        authTransport: 'ajax',
        enabledTransports: ['ws', 'wss'],
        disabledTransports: [],
        // Add retry configuration
        activityTimeout: 120000,
        pongTimeout: 60000,
        unavailableTimeout: 10000,
        // Disable automatic reconnection to prevent conflicts
        enableStats: false,
        maxReconnectionAttempts: 3,
        reconnectGap: 2000
      });

      // Store callbacks for later use - do this BEFORE setting up connection handlers
      this.realTimeCallbacks = {
        onNewMessage,
        onChatUpdated,
        onChatListUpdated
      };

      // Set up connection event handlers
      this.pusher.connection.bind('connecting', () => {
        console.log('Pusher: Connecting...');
      });

      this.pusher.connection.bind('connected', () => {
        console.log('Pusher: Connected successfully');
        this.isConnecting = false;
        this.connectionAttempts = 0;
        
        // Clear any reconnect timeout
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        
        // Subscribe to channels
        this.subscribeToChannels(
          this.realTimeCallbacks.onNewMessage,
          this.realTimeCallbacks.onChatUpdated,
          this.realTimeCallbacks.onChatListUpdated
        );
      });

      this.pusher.connection.bind('disconnected', () => {
        console.log('Pusher: Disconnected');
        this.isConnecting = false;
        
        // Only attempt reconnection if we haven't exceeded max attempts
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          this.connectionAttempts++;
          console.log(`Attempting to reconnect (${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
          
          // Delay reconnection to avoid rapid reconnect attempts
          this.reconnectTimeout = setTimeout(() => {
            if (!this.pusher || this.pusher.connection.state === 'disconnected') {
              console.log('Attempting Pusher reconnection...');
              this.subscribeToRealTimeEvents(
                this.realTimeCallbacks?.onNewMessage,
                this.realTimeCallbacks?.onChatUpdated,
                this.realTimeCallbacks?.onChatListUpdated
              );
            }
          }, 3000 * this.connectionAttempts); // Exponential backoff
        } else {
          console.warn('Max reconnection attempts reached, falling back to polling');
          this.setupPollingFallback();
        }
      });

      this.pusher.connection.bind('error', (error) => {
        console.error('Pusher connection error:', error);
        this.isConnecting = false;
        
        // Check if it's an auth error
        if (error.type === 'AuthError' || error.status === 403) {
          console.error('Pusher authentication failed. This could be due to:');
          console.error('1. Backend /api/broadcasting/auth endpoint not configured');
          console.error('2. Invalid authentication token');
          console.error('3. CORS issues with the auth endpoint');
          console.error('4. Backend Pusher configuration mismatch');
          
          // Don't retry auth errors immediately, fall back to polling
          this.setupPollingFallback();
        } else {
          // For other errors, increment connection attempts
          this.connectionAttempts++;
          
          if (this.connectionAttempts >= this.maxConnectionAttempts) {
            console.warn('Max connection attempts reached after error, falling back to polling');
            this.setupPollingFallback();
          }
        }
      });

      this.pusher.connection.bind('failed', () => {
        console.warn('Pusher connection failed, falling back to polling');
        this.isConnecting = false;
        this.setupPollingFallback();
      });

      return true;
    } catch (error) {
      console.error('Error setting up real-time events:', error);
      this.isConnecting = false;
      this.setupPollingFallback();
      return false;
    }
  };

  // Ensure this method is properly bound as an arrow function
  subscribeToChannels = (onNewMessage, onChatUpdated, onChatListUpdated) => {
    console.log('subscribeToChannels called with pusher state:', this.pusher?.connection?.state);
    
    if (!this.pusher || this.pusher.connection.state !== 'connected') {
      console.warn('Pusher not connected, cannot subscribe to channels');
      return;
    }

    try {
      const currentUser = authService.getUser();
      if (!currentUser?.id) {
        console.warn('No current user found, cannot subscribe to channels');
        return;
      }

      console.log('Subscribing to channels for user:', currentUser.id);

      // For now, skip private channels due to auth issues and use public channels only
      console.log('Skipping private channels due to auth endpoint issues, using public channels only');

      // Subscribe to public channels for all events
      this.subscribeToPublicChannels(onNewMessage, onChatUpdated, onChatListUpdated);

      console.log('Real-time events subscribed successfully (public channels only)');
    } catch (error) {
      console.error('Error subscribing to channels:', error);
    }
  };

  // Helper method to subscribe to public channels as fallback
  subscribeToPublicChannels = (onNewMessage, onChatUpdated, onChatListUpdated) => {
    try {
      // Subscribe to public chat updates channel
      if (onChatListUpdated && typeof onChatListUpdated === 'function') {
        const publicChannelName = 'public-chats';
        console.log('Subscribing to public channel:', publicChannelName);
        
        const publicChannel = this.pusher.subscribe(publicChannelName);
        
        publicChannel.bind('pusher:subscription_succeeded', () => {
          console.log('Successfully subscribed to public chats channel');
        });

        publicChannel.bind('pusher:subscription_error', (error) => {
          console.error('Failed to subscribe to public chats channel:', error);
        });

        publicChannel.bind('chat.created', (data) => {
          console.log('Real-time: Chat created', data);
          onChatListUpdated();
        });

        publicChannel.bind('chat.updated', (data) => {
          console.log('Real-time: Chat list updated', data);
          onChatListUpdated();
        });
      }

      // Subscribe to a general messages channel as fallback
      if (onNewMessage && typeof onNewMessage === 'function') {
        const messagesChannelName = 'public-messages';
        console.log('Subscribing to public messages channel:', messagesChannelName);
        
        const messagesChannel = this.pusher.subscribe(messagesChannelName);
        
        messagesChannel.bind('pusher:subscription_succeeded', () => {
          console.log('Successfully subscribed to public messages channel');
        });

        messagesChannel.bind('pusher:subscription_error', (error) => {
          console.error('Failed to subscribe to public messages channel:', error);
        });

        messagesChannel.bind('new.message', (data) => {
          console.log('Real-time: New message received from public channel', data);
          if (data.message) {
            onNewMessage(data.message, data.chat || { id: data.message.chat_id });
          }
        });
      }

      // Subscribe to user-specific public channel as alternative to private channel
      const currentUser = authService.getUser();
      if (currentUser?.id && onNewMessage && typeof onNewMessage === 'function') {
        const userPublicChannelName = `public-user-${currentUser.id}`;
        console.log('Subscribing to user public channel:', userPublicChannelName);
        
        const userPublicChannel = this.pusher.subscribe(userPublicChannelName);
        
        userPublicChannel.bind('pusher:subscription_succeeded', () => {
          console.log('Successfully subscribed to user public channel');
        });

        userPublicChannel.bind('pusher:subscription_error', (error) => {
          console.error('Failed to subscribe to user public channel:', error);
        });

        userPublicChannel.bind('new.message', (data) => {
          console.log('Real-time: New message received from user public channel', data);
          if (data.message) {
            onNewMessage(data.message, data.chat || { id: data.message.chat_id });
          }
        });

        if (onChatUpdated && typeof onChatUpdated === 'function') {
          userPublicChannel.bind('chat.updated', (data) => {
            console.log('Real-time: Chat updated from user public channel', data);
            if (data.chat) {
              onChatUpdated(data.chat);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error subscribing to public channels:', error);
    }
  };

  /**
   * Subscribe to a specific chat for real-time messages
   * @param {Number} chatId - Chat ID to subscribe to
   * @param {Function} onNewMessage - Callback for new messages
   */
  subscribeToChat = (chatId, onNewMessage) => {
    if (!this.pusher || this.pusher.connection.state !== 'connected') {
      console.warn('Pusher not connected, cannot subscribe to chat');
      return;
    }

    if (!onNewMessage || typeof onNewMessage !== 'function') {
      console.warn('Invalid onNewMessage callback provided');
      return;
    }

    try {
      console.log(`Subscribing to public chat channel for chat ${chatId} (skipping private due to auth issues)`);
      
      // Use public chat channel only due to auth endpoint issues
      this.subscribeToPublicChatChannel(chatId, onNewMessage);

    } catch (error) {
      console.error('Error subscribing to chat:', error);
    }
  };

  // Helper method to subscribe to public chat channel
  subscribeToPublicChatChannel = (chatId, onNewMessage) => {
    try {
      console.log(`Subscribing to public chat channel for chat ${chatId}`);
      
      const publicChatChannelName = `public-chat-${chatId}`;
      const chatChannel = this.pusher.subscribe(publicChatChannelName);
      
      chatChannel.bind('pusher:subscription_succeeded', () => {
        console.log('Successfully subscribed to public chat channel');
      });

      chatChannel.bind('pusher:subscription_error', (error) => {
        console.error('Failed to subscribe to public chat channel:', error);
      });

      chatChannel.bind('new.message', (data) => {
        console.log('Real-time: New message received in public chat', data);
        if (data.message && data.message.chat_id == chatId) {
          onNewMessage(data.message);
        }
      });

      // Store the subscription for cleanup
      if (!this.chatChannels) {
        this.chatChannels = {};
      }
      this.chatChannels[chatId] = chatChannel;

    } catch (error) {
      console.error('Error subscribing to public chat channel:', error);
    }
  };

  /**
   * Unsubscribe from a specific chat
   * @param {Number} chatId - Chat ID to unsubscribe from
   */
  unsubscribeFromChat = (chatId) => {
    try {
      if (this.chatChannels && this.chatChannels[chatId]) {
        console.log(`Unsubscribing from chat ${chatId}`);
        this.pusher.unsubscribe(`private-chat.${chatId}`);
        this.pusher.unsubscribe(`public-chat.${chatId}`);
        delete this.chatChannels[chatId];
      }
    } catch (error) {
      console.error('Error unsubscribing from chat:', error);
    }
  };

  /**
   * Check if real-time is connected
   * @returns {boolean} True if connected
   */
  isRealTimeConnected = () => {
    return this.pusher && this.pusher.connection.state === 'connected';
  };

  // Add method to get auth headers
  getAuthHeaders() {
    const token = authService.getToken();
    if (!token) {
      console.warn('No auth token available for chat service');
      return {};
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };
  }

  // Update API methods to handle auth failures
  async makeAuthenticatedRequest(url, options = {}) {
    try {
      const headers = this.getAuthHeaders();
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        }
      });

      if (response.status === 401) {
        console.warn('Authentication failed, token may be expired');
        // Try to refresh token if available
        try {
          await authService.refreshToken();
          // Retry with new token
          const newHeaders = this.getAuthHeaders();
          return await fetch(url, {
            ...options,
            headers: {
              ...newHeaders,
              ...options.headers
            }
          });
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Redirect to login or handle appropriately
          throw new Error('Authentication required. Please log in again.');
        }
      }

      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  // Update existing API methods to use authenticated requests
  async getUserChats(lastChatId = null, useCache = true) {
    try {
      let url = `${API_BASE_URL}/chats`; // Remove duplicate /api
      if (lastChatId) {
        url += `?last_chat_id=${lastChatId}`;
      }

      const response = await this.makeAuthenticatedRequest(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch chats');
      }

      return data;
    } catch (error) {
      console.error('Error fetching user chats:', error);
      throw error;
    }
  }

  /**
   * Clean up all real-time listeners
   */
  unsubscribeFromAllEvents = () => {
    try {
      console.log('Cleaning up all real-time listeners...');
      
      // Clear connection flag
      this.isConnecting = false;
      this.connectionAttempts = 0;
      
      // Clear reconnect timeout
      if (this.reconnectTimeout) {
        console.log('Clearing reconnect timeout');
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      // Clear polling interval
      if (this.pollingInterval) {
        console.log('Clearing polling interval');
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
      
      // Disconnect Pusher if it exists
      if (this.pusher) {
        console.log('Disconnecting Pusher connection');
        try {
          // Unbind all event listeners first
          this.pusher.connection.unbind_all();
          
          // Then disconnect
          this.pusher.disconnect();
        } catch (pusherError) {
          console.warn('Error disconnecting Pusher:', pusherError);
        }
        this.pusher = null;
      }
      
      // Clear chat channels
      if (this.chatChannels) {
        console.log('Clearing chat channels');
        this.chatChannels = {};
      }
      
      // Clear listeners map
      if (this._listeners) {
        console.log('Clearing listeners map');
        this._listeners.clear();
      }
      
      // Clear any stored callbacks
      if (this.realTimeCallbacks) {
        this.realTimeCallbacks = null;
      }
      
      console.log('All real-time listeners cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up real-time listeners:', error);
    }
  };
}

const chatService = new ChatService();
export default chatService;
