import React, { useState, useEffect } from 'react';
import { Card, Button, Image, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import userAvatar from '../../assets/avatar-1.png';
import UnishareMessageDetail from './UnishareMessageDetail';
import { chatService, authService } from '../../services';

const UnishareMessages = ({ chats = [], loading = false, onChatCreated }) => {
  const [activeTab, setActiveTab] = useState('group');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [messageCache, setMessageCache] = useState({});
  const [filesForUpload, setFilesForUpload] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [authError, setAuthError] = useState(false);
  
  // Filter chats based on tab
  const filteredChats = activeTab === 'group' 
    ? chats.filter(chat => chat.type === 'group' || chat.is_group) 
    : chats.filter(chat => chat.type === 'private' || !chat.is_group);

  // Select the first chat by default when component mounts or chats change
  useEffect(() => {
    if (filteredChats.length > 0 && !selectedChat) {
      setSelectedChat(filteredChats[0]);
    }
  }, [filteredChats, selectedChat]);

  // Load messages when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  // Fetch unread counts when component mounts or chats change
  useEffect(() => {
    fetchUnreadCounts();
    
    // Set up real-time message listener for this component
    const handleNewMessage = (newMessage, chat) => {
      console.log('Real-time: New message received in UnishareMessages', newMessage);
      
      // Update the selected chat's messages if it matches
      if (selectedChat && newMessage.chat_id === selectedChat.id) {
        setMessages(prev => {
          // Check for duplicates
          const messageExists = prev.some(msg => msg.id === newMessage.id);
          if (messageExists) return prev;
          
          // Add new message
          return [...prev, newMessage].sort((a, b) => 
            new Date(a.created_at) - new Date(b.created_at)
          );
        });
        
        // Update cache
        setMessageCache(prev => ({
          ...prev,
          [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage]
        }));
      }
      
      // Update unread counts
      if (newMessage.user_id !== authService.getUser()?.id) {
        setUnreadCounts(prev => ({
          ...prev,
          [newMessage.chat_id]: (prev[newMessage.chat_id] || 0) + 1
        }));
      }
    };

    // Subscribe to real-time events
    if (chatService && typeof chatService.subscribeToRealTimeEvents === 'function') {
      try {
        chatService.subscribeToRealTimeEvents(
          handleNewMessage,
          null, // Don't need chat updates
          null  // Don't need chat list updates here
        );
      } catch (error) {
        console.error('Error setting up real-time events in UnishareMessages:', error);
      }
    }
    
    // Cleanup function
    return () => {
      console.log('UnishareMessages component unmounted');
    };
  }, [selectedChat]);

  const fetchMessages = async (chatId) => {
    // Check if we already have cached messages for this chat
    if (messageCache[chatId]) {
      console.log(`Using cached messages for chat ${chatId}`);
      setMessages(messageCache[chatId]);
      return;
    }
    
    try {
      setLoadingMessages(true);
      setError(null);
      
      console.log(`Fetching messages for chat ${chatId}`);
      
      const response = await chatService.getChatMessages(chatId);
      
      if (response.success && response.data) {
        // Ensure we're passing an array
        let messageArray = Array.isArray(response.data) ? response.data : 
                          (response.data.data && Array.isArray(response.data.data)) ? response.data.data : [];
        
        // Sort messages by creation date in ascending order (oldest first)
        messageArray = messageArray.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateA - dateB;
        });
        
        console.log(`Loaded ${messageArray.length} messages for chat ${chatId}`);
        
        // Cache the messages for this chat
        setMessageCache(prev => ({
          ...prev,
          [chatId]: messageArray
        }));
        
        // Save the messages and ensure scroll position resets when changing chats
        setMessages(messageArray);
      } else {
        console.warn('Message response format unexpected:', response);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Không thể tải tin nhắn. Vui lòng thử lại sau.');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Fetch unread message counts
  const fetchUnreadCounts = async () => {
    try {
      const response = await chatService.getUnreadCounts();
      if (response && response.data) {
        const counts = {};
        
        // Format the response into a simple object with chatId as key and count as value
        response.data.forEach(item => {
          counts[item.chat_id] = item.unread_count;
        });
        
        setUnreadCounts(counts);
        setAuthError(false); // Clear auth error on success
      }
    } catch (err) {
      console.error('Error fetching unread counts:', err);
      if (err.message?.includes('Authentication required')) {
        setAuthError(true);
      }
    }
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    
    // Mark chat as read when selected
    if (chat && unreadCounts[chat.id] > 0) {
      markChatAsRead(chat.id);
    }
  };

  const markChatAsRead = async (chatId) => {
    try {
      await chatService.markChatAsRead(chatId);
      
      // Update local unread counts immediately for a responsive UI
      setUnreadCounts(prev => ({
        ...prev,
        [chatId]: 0
      }));
    } catch (err) {
      console.error('Error marking chat as read:', err);
    }
  };

  const handleMessagesRead = (chatId) => {
    // Update unread count when messages are marked as read
    setUnreadCounts(prev => ({
      ...prev,
      [chatId]: 0
    }));
  };

  const sendMessage = async (content, files = []) => {
    if (!selectedChat || (!content.trim() && !files.length)) return;
    
    try {
      console.log(`Attempting to send message to chat ${selectedChat.id}:`, content);
      console.log(`With ${files.length} attachments`);
      setError(null);
      
      let response;
      
      // Ensure content is always a string, never null or undefined
      const messageContent = content || '';
      
      console.log('Final message content being sent:', messageContent);
      
      // If we have files to upload
      if (files && files.length > 0) {
        console.log('Sending message with attachments');
        response = await chatService.sendMessageWithAttachments(
          selectedChat.id, 
          { content: messageContent }, 
          files
        );
      } else {
        console.log('Sending regular text message');
        // Normal text message
        response = await chatService.sendMessage(selectedChat.id, { content: messageContent });
      }
      
      console.log('Send message response received:', response);
      
      if (response && (response.success === true || response.success !== false)) {
        console.log('Message sent successfully');
        
        // Add new message to the cache immediately
        if (response.data) {
          console.log('Adding new message to local state:', response.data);
          const newMessage = response.data;
          
          // Update message cache for this chat
          setMessageCache(prev => {
            const updatedMessages = [...(prev[selectedChat.id] || []), newMessage];
            return {
              ...prev,
              [selectedChat.id]: updatedMessages
            };
          });
          
          // Update current messages
          setMessages(prev => [...prev, newMessage]);
        } else {
          console.log('No message data in response, reloading messages');
          // Reload messages to show the new message if we don't have message data
          fetchMessages(selectedChat.id);
        }
        
        return {
          success: true,
          data: response.data,
          message: 'Message sent successfully'
        };
      } else {
        console.error('Failed to send message:', response);
        const errorMessage = (response && response.message) || 'Không thể gửi tin nhắn. Vui lòng thử lại sau.';
        setError(errorMessage);
        
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = 'Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại sau.';
      setError(errorMessage);
      
      return {
        success: false,
        message: err.message || errorMessage
      };
    }
  };

  // Format the time for display
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Format the last message time for display in the chat list
  const formatChatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedChat(null); // Reset selected chat when changing tabs
  };

  return (
    <div className="mb-4">
      <h5 className="fw-bold mb-3" style={{ color: '#0370b7' }}>Tin Nhắn</h5>
      
      {authError && (
        <Alert variant="warning" className="mb-3">
          <div className="d-flex align-items-center">
            <strong>Phiên đăng nhập đã hết hạn</strong>
          </div>
          <p className="mb-2">Vui lòng đăng nhập lại để sử dụng tính năng chat.</p>
          <Button variant="outline-warning" size="sm" onClick={() => window.location.reload()}>
            Tải lại trang
          </Button>
        </Alert>
      )}

      {/* Tabs */}
      <div className="mb-3 d-flex">
        <Button
          variant={activeTab === 'group' ? 'primary' : 'light'}
          onClick={() => handleTabChange('group')}
          className="me-2 border-0"
          style={{ 
            borderRadius: '5px',
            paddingLeft: '30px',
            paddingRight: '30px',
            fontWeight: 500,
            boxShadow: activeTab === 'group' ? '0 2px 6px rgba(3,112,183,0.2)' : 'none'
          }}
        >
          Nhóm
        </Button>
        <Button
          variant={activeTab === 'private' ? 'primary' : 'light'}
          onClick={() => handleTabChange('private')}
          className="border-0"
          style={{ 
            borderRadius: '5px',
            paddingLeft: '30px',
            paddingRight: '30px',
            fontWeight: 500,
            boxShadow: activeTab === 'private' ? '0 2px 6px rgba(3,112,183,0.2)' : 'none'
          }}
        >
          Cá Nhân
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải cuộc trò chuyện...</p>
        </div>
      ) : (
        <Row>
          {/* Chats List Column */}
          <Col md={selectedChat ? 5 : 12}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '10px' }}>
              <Card.Body className="p-0">
                {filteredChats.length === 0 ? (
                  <div className="text-center p-4">
                    <p className="text-muted mb-0">Không có cuộc trò chuyện nào.</p>
                  </div>
                ) : 
                  filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      className="d-flex align-items-center p-3 border-bottom"
                      style={{ 
                        borderColor: '#e9f2f9',
                        backgroundColor: chat.id === selectedChat?.id ? '#f0f9ff' : 'transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleSelectChat(chat)}
                    >
                      <Image
                        src={chat.avatar_url || userAvatar}
                        roundedCircle
                        width={50}
                        height={50}
                        className="me-3"
                        style={{ border: '2px solid #b3d8f6' }}
                      />
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="d-flex align-items-center">
                            <span className="fw-bold" style={{ color: '#0370b7', fontSize: '1rem' }}>
                              {chat.name || (chat.participants && chat.participants.length > 0 ? 
                                chat.participants.map(p => p.user?.name).join(', ') : 'Cuộc trò chuyện')}
                            </span>
                            {/* Add unread message badge */}
                            {unreadCounts[chat.id] > 0 && (
                              <Badge 
                                bg="danger" 
                                pill 
                                className="ms-2"
                                style={{ fontSize: '0.7rem' }}
                              >
                                {unreadCounts[chat.id]}
                              </Badge>
                            )}
                          </div>
                          <span className="text-muted small">{formatChatTime(chat.updated_at)}</span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                          {chat.last_message?.content || 'Chưa có tin nhắn'}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </Card.Body>
            </Card>
          </Col>

          {/* Message Detail Column */}
          {selectedChat && (
            <Col md={7}>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}
              
              <UnishareMessageDetail 
                chat={selectedChat}
                messages={messages}
                loading={loadingMessages}
                onSendMessage={sendMessage}
                onMessagesRead={handleMessagesRead}
              />
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default UnishareMessages;
