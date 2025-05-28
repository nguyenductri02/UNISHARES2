import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Badge, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPaperPlane, FaFile, FaImage, FaUsers, FaUserCircle, FaInfoCircle, FaTimesCircle, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { chatService, authService } from '../services';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatMessage from '../components/chat/ChatMessage';

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [authError, setAuthError] = useState(false);
  const messagesEndRef = useRef(null);
  const isComponentMounted = useRef(true); // Track if component is mounted
  const pollIntervalRef = useRef(null); // Reference to the polling interval
  const lastFetchTime = useRef({
    messages: 0,
    chat: 0
  }); // Track last fetch time to prevent excessive API calls
  const currentChatIdRef = useRef(null); // Track current chatId to prevent unnecessary re-fetching
  // Track component mount/unmount and setup real-time events
  useEffect(() => {
    console.log('ChatPage mounted');
    isComponentMounted.current = true;
    
    // Check authentication before setting up real-time
    const token = authService.getToken();
    if (!token) {
      setAuthError(true);
      return;
    }

    // Setup real-time event listeners only once per component mount
    const handleNewMessage = (newMessage, chat) => {
      console.log('Real-time: New message received in ChatPage', newMessage);
      
      if (newMessage.chat_id == chatId && isComponentMounted.current) {
        setMessages(prevMessages => {
          const messageExists = prevMessages.some(msg => msg.id === newMessage.id);
          if (messageExists) {
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });
        
        if (isNearBottom.current) {
          setTimeout(() => {
            scrollToBottom('smooth');
          }, 100);
        }
      }
    };

    const handleChatUpdated = (updatedChat) => {
      console.log('Real-time: Chat updated in ChatPage', updatedChat);
      if (updatedChat.id == chatId && isComponentMounted.current) {
        setChat(updatedChat);
      }
    };

    // Subscribe to real-time events with safety check
    // Only set up once per component mount to avoid duplicate connections
    let isRealTimeSetup = false;
    if (chatService && typeof chatService.subscribeToRealTimeEvents === 'function') {
      try {
        isRealTimeSetup = chatService.subscribeToRealTimeEvents(
          handleNewMessage,
          handleChatUpdated,
          null // Don't need chat list updates in ChatPage
        );
        
        if (isRealTimeSetup) {
          console.log('Real-time events set up successfully in ChatPage');
        }
      } catch (error) {
        console.error('Error setting up real-time events in ChatPage:', error);
        isRealTimeSetup = false;
      }
    }

    if (!isRealTimeSetup) {
      console.log('Real-time setup failed in ChatPage, chat will work without real-time updates');
    }
    
    return () => {
      console.log('ChatPage unmounted');
      isComponentMounted.current = false;
      
      // Don't clean up chatService here since other components might be using it
      // Only clean up component-specific resources
      if (pollIntervalRef.current) {
        console.log('Clearing poll interval on unmount');
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);
  
  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!isComponentMounted.current) return;
      
      try {
        const userData = await authService.getCurrentUser();
        if (isComponentMounted.current) {
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        if (isComponentMounted.current) {
          setError('Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.');
        }
      }
    };

    fetchCurrentUser();
  }, []);

  // Function to fetch new messages without reloading all data
  const fetchNewMessages = useCallback(async (force = false) => {
    if (!chatId || !chat || !isComponentMounted.current) return;
    
    // Check if chatId is still the current one we're interested in
    if (chatId !== currentChatIdRef.current) {
      console.log('ChatId changed since fetchNewMessages was called, aborting');
      return;
    }
    
    const now = Date.now();
    // Only fetch if forced or if it's been more than 30 seconds since last fetch
    if (!force && now - lastFetchTime.current.messages < 30000) {
      console.log('Throttling fetchNewMessages - last fetch was too recent');
      return;
    }
    
    // Update last fetch time
    lastFetchTime.current.messages = now;
    console.log('Fetching new messages for chat ID:', chatId);
    
    try {
      // Only fetch messages, not the entire chat
      const messagesResponse = await chatService.getChatMessages(chatId);
      
      // Check if component is still mounted before updating state
      if (!isComponentMounted.current) {
        console.log('Component unmounted during fetchNewMessages, aborting update');
        return;
      }
      
      // Check if chatId is still the current one we're interested in
      if (chatId !== currentChatIdRef.current) {
        console.log('ChatId changed during fetchNewMessages, aborting update');
        return;
      }
      
      if (messagesResponse && (messagesResponse.success === true || messagesResponse.data)) {
        const messagesData = messagesResponse.data?.data || messagesResponse.data || [];
        setMessages(messagesData);
        
        // Mark chat as read only if component is still mounted and chatId is current
        if (isComponentMounted.current && chatId === currentChatIdRef.current) {
          await chatService.markChatAsRead(chatId);
        }
      }
    } catch (err) {
      console.warn('Error fetching new messages:', err);
      // Don't set error state for background polling
    }
  }, [chatId, chat]);
  const [currentChatLoaded, setCurrentChatLoaded] = useState(false);

  // Fetch chat data and messages
  useEffect(() => {
    // Skip if chatId is the same as the one we're already tracking
    if (chatId === currentChatIdRef.current) {
      console.log('ChatId unchanged, skipping re-fetch:', chatId);
      return;
    }
    
    console.log('ChatId changed from', currentChatIdRef.current, 'to', chatId);
    currentChatIdRef.current = chatId;
    setCurrentChatLoaded(false); // Reset current chat loaded state
    
    // Clear any existing interval when chatId changes
    if (pollIntervalRef.current) {
      console.log('Clearing previous poll interval');
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    const fetchChatData = async () => {
      if (!chatId || !isComponentMounted.current) return;
      
      try {
        setLoading(true);
        setError('');
        
        console.log('Fetching chat data for chat ID:', chatId);
        // Fetch chat details
        const chatResponse = await chatService.getChat(chatId);
        
        // Check if component is still mounted before updating state
        if (!isComponentMounted.current) return;
        
        // Check if chatId is still the current one we're interested in
        if (chatId !== currentChatIdRef.current) {
          console.log('ChatId changed during fetch, aborting update');
          return;
        }
        
        // Check for success property first, then fallback to checking if data exists
        if (chatResponse && (chatResponse.success === true || chatResponse.data)) {
          // Get the chat data based on the response structure
          const chatData = chatResponse.data || chatResponse;
          setChat(chatData);
          
          try {
            // Fetch chat messages
            const messagesResponse = await chatService.getChatMessages(chatId);
            
            // Check if component is still mounted before updating state
            if (!isComponentMounted.current) return;
            
            // Check if chatId is still the current one we're interested in
            if (chatId !== currentChatIdRef.current) {
              console.log('ChatId changed during message fetch, aborting update');
              return;
            }
              if (messagesResponse && (messagesResponse.success === true || messagesResponse.data)) {
              // Access data correctly based on the response structure
              const messagesData = messagesResponse.data?.data || messagesResponse.data || [];
              setMessages(messagesData);
              
              // Subscribe to real-time messages for this specific chat
              try {
                if (chatService && typeof chatService.subscribeToChat === 'function') {
                  chatService.subscribeToChat(chatId, (newMessage) => {
                    console.log('Real-time: New message in current chat', newMessage);
                    if (isComponentMounted.current && chatId === currentChatIdRef.current) {
                      setMessages(prevMessages => {
                        // Check if message already exists to avoid duplicates
                        const messageExists = prevMessages.some(msg => msg.id === newMessage.id);
                        if (messageExists) {
                          console.log('Message already exists, skipping duplicate');
                          return prevMessages;
                        }
                        console.log('Adding new message to chat');
                        return [...prevMessages, newMessage];
                      });
                      
                      // Auto-scroll to bottom if user was near bottom
                      if (isNearBottom.current) {
                        setTimeout(() => {
                          scrollToBottom('smooth');
                        }, 100);
                      }
                    }
                  });
                } else {
                  console.warn('subscribeToChat method not available on chatService');
                }
              } catch (subscriptionError) {
                console.warn('Error setting up real-time subscription for chat:', subscriptionError);
                // Continue without real-time updates
              }
              
              // Mark chat as read         
           try {
            await chatService.markChatAsRead(chatId);
          } catch (markReadError) {
            console.warn('Failed to mark chat as read:', markReadError);
          }
        } else {
          console.warn('No messages data:', messagesResponse);
          setMessages([]);
        }
      } catch (messagesError) {
        console.error('Error loading messages:', messagesError);
        if (isComponentMounted.current) {
          setMessages([]);
        }
        // Don't set error state here to still show chat with empty messages
      }
      
      // Set current chat loaded to true to trigger any dependent effects
      setCurrentChatLoaded(true);
    } else {
      throw new Error(chatResponse?.message || 'Không thể tải thông tin chat');
    }
      } catch (err) {
        console.error('Error loading chat:', err);
        if (isComponentMounted.current) {
          setError(err.message || 'Không thể tải cuộc trò chuyện. Vui lòng thử lại sau.');
        }
      } finally {
        if (isComponentMounted.current && chatId === currentChatIdRef.current) {
          setLoading(false);
        }
      }
    };    fetchChatData();
    
    // Cleanup previous chat subscription when switching chats
    return () => {
      if (currentChatIdRef.current) {
        try {
          if (chatService && typeof chatService.unsubscribeFromChat === 'function') {
            chatService.unsubscribeFromChat(currentChatIdRef.current);
          }
        } catch (error) {
          console.error('Error unsubscribing from chat:', error);
        }
      }
    };  }, [chatId]);
  // Removed 'error' from dependencies to prevent re-running effect when error changes

  // Scroll to bottom function
  const scrollToBottom = (behavior = 'auto') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'nearest' });
    }
  };

  // Track if user is near bottom of chat
  const isNearBottom = useRef(true);
  const chatBodyRef = useRef(null);
  const isUserScrolling = useRef(false);
  const userScrollTimeout = useRef(null);
  
  // Check if user is near bottom of chat
  const checkIfNearBottom = () => {
    if (chatBodyRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
      // Consider "near bottom" if within 150px of the bottom
      const scrollThreshold = 150;
      const nearBottom = scrollHeight - scrollTop - clientHeight < scrollThreshold;
      
      console.log('Scroll check:', { 
        scrollTop, 
        scrollHeight, 
        clientHeight, 
        distance: scrollHeight - scrollTop - clientHeight,
        nearBottom
      });
      
      isNearBottom.current = nearBottom;
      
      // Set user scrolling flag
      isUserScrolling.current = true;
      
      // Clear any existing timeout
      if (userScrollTimeout.current) {
        clearTimeout(userScrollTimeout.current);
      }
      
      // Reset the scrolling flag after 1 second of no scroll events
      userScrollTimeout.current = setTimeout(() => {
        isUserScrolling.current = false;
      }, 1000);
    }
  };
  
  // Setup effect for chatBodyRef
  useEffect(() => {
    // This effect runs after render when chatBodyRef is available
    const setupScrollListener = () => {
      if (!chatBodyRef.current) {
        console.log('chatBodyRef still not available, skipping scroll listener setup');
        return;
      }
      
      console.log('Setting up scroll listener');
      const chatBody = chatBodyRef.current;
      
      // Initial check
      checkIfNearBottom();
      
      // Add event listener
      chatBody.addEventListener('scroll', checkIfNearBottom);
      
      // Store cleanup function
      const cleanup = () => {
        console.log('Removing scroll listener');
        if (chatBody) {
          chatBody.removeEventListener('scroll', checkIfNearBottom);
        }
      };
      
      // Store cleanup function for later
      return cleanup;
    };
    
    // Only setup scroll listener if we have chat content
    if (chat && !loading) {
      const cleanup = setupScrollListener();
      
      // Cleanup function
      return () => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      };
    }
  }, [chat, loading]); // Add chat and loading as dependencies
  
  // Scroll to bottom only in specific cases:
  // 1. Initial load (loading becomes false)
  // 2. When user sends a new message
  // 3. When new messages arrive and user was already near bottom
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  
  // Vô hiệu hóa tự động cuộn xuống khi tải tin nhắn ban đầu
  useEffect(() => {
    // Không làm gì cả - vô hiệu hóa tự động cuộn khi tải tin nhắn ban đầu
    console.log('Initial auto-scrolling is disabled');
  }, [loading, messages.length]);
  
  // Vô hiệu hóa tự động cuộn xuống khi tin nhắn thay đổi
  // Người dùng sẽ phải tự cuộn xuống nếu muốn xem tin nhắn mới
  useEffect(() => {
    // Không làm gì cả - vô hiệu hóa tự động cuộn
    console.log('Auto-scrolling is disabled');
  }, [shouldScrollToBottom]);

  const handleAttachmentChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      }));
      
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    
    // Revoke object URL if it's an image to free up memory
    if (newAttachments[index].preview) {
      URL.revokeObjectURL(newAttachments[index].preview);
    }
    
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && attachments.length === 0) {
      return;
    }
    
    try {
      setSending(true);
      
      let response;
      
      if (attachments.length > 0) {
        // Send message with attachments using FormData
        const formData = new FormData();
        formData.append('content', newMessage.trim());
        
        // Add attachments to form data
        attachments.forEach((attachment, index) => {
          formData.append(`attachments[${index}]`, attachment.file);
        });
        
        response = await chatService.sendMessageWithAttachments(chatId, { content: newMessage.trim() }, attachments.map(a => a.file));
      } else {
        // Send regular text message
        response = await chatService.sendMessage(chatId, { content: newMessage.trim() });
      }
      
      if (response.success || response.data) {
        // Add new message to the list
        if (response.data) {
          // Thêm tin nhắn mới vào cuối danh sách (tin nhắn mới nhất)
          setMessages(prevMessages => [...prevMessages, response.data]);
          
          // Không tự động cuộn xuống dưới khi gửi tin nhắn
          // Người dùng sẽ phải tự cuộn xuống nếu muốn xem tin nhắn mới
          console.log('Message sent, but not auto-scrolling');
        }
        
        // Clear form
        setNewMessage('');
        
        // Revoke all object URLs
        attachments.forEach(attachment => {
          if (attachment.preview) {
            URL.revokeObjectURL(attachment.preview);
          }
        });
        
        setAttachments([]);
      } else {
        throw new Error(response.message || 'Không thể gửi tin nhắn');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Không thể gửi tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setSending(false);
    }
  };

  // Get chat name based on type
  const getChatName = () => {
    if (!chat) return 'Cuộc trò chuyện';
    
    if (chat.name) return chat.name;
    
    // For private chats, get the other user's name
    if (!chat.is_group && chat.participants && chat.participants.length > 0) {
      const otherParticipant = chat.participants.find(
        p => p.user?.id !== currentUser?.id
      );
      return otherParticipant?.user?.name || 'Người dùng không xác định';
    }
    
    return 'Cuộc trò chuyện không có tên';
  };

  const handleRetry = () => {
    setError('');
    setLoading(true);
    // Force reload the current chat
    window.location.reload();
  };

  return (
    <>
      <Header />
      <div className="chat-page py-4" style={{ backgroundColor: '#f5f8fa', minHeight: 'calc(100vh - 120px)' }}>
        <Container fluid>
          {authError && (
            <Row className="mb-3">
              <Col>
                <Alert variant="danger">
                  <Alert.Heading>Yêu cầu đăng nhập</Alert.Heading>
                  <p>Bạn cần đăng nhập để sử dụng tính năng chat.</p>
                  <Button variant="outline-danger" onClick={() => navigate('/login')}>
                    Đăng nhập
                  </Button>
                </Alert>
              </Col>
            </Row>
          )}
          
          <Row>
            {/* Chat Sidebar */}
            <Col md={3} className="mb-3">
              <ChatSidebar activeChatId={chatId} />
            </Col>
            
            {/* Main Chat Area */}
            <Col md={9}>
              <Card className="shadow-sm border-0 h-100">
                {loading ? (
                  <div className="text-center p-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Đang tải cuộc trò chuyện...</p>
                  </div>
                ) : error ? (
                  <Alert variant="danger" className="m-3">
                    <div className="d-flex align-items-center mb-3">
                      <FaExclamationTriangle className="me-2" size={24} />
                      <div className="fw-bold">Có lỗi xảy ra</div>
                    </div>
                    <p>{error}</p>
                    <div className="d-flex gap-2 mt-3">
                      <Button variant="outline-primary" onClick={handleRetry}>
                        <FaArrowLeft className="me-2" /> Thử lại
                      </Button>
                      <Button variant="outline-secondary" onClick={() => navigate('/unishare/chats')}>
                        Quay lại danh sách chat
                      </Button>
                    </div>
                  </Alert>
                ) : (
                  <>
                    {/* Chat Header */}
                    <Card.Header className="bg-white border-bottom d-flex align-items-center p-3">
                      <div className="d-flex align-items-center">
                        <div 
                          className={`chat-icon rounded-circle d-flex align-items-center justify-content-center me-2 ${chat?.is_group ? 'bg-info' : 'bg-success'} text-white`}
                          style={{ width: 40, height: 40 }}
                        >
                          {chat?.is_group ? <FaUsers size={20} /> : <FaUserCircle size={20} />}
                        </div>
                        <div>
                          <h5 className="mb-0">{getChatName()}</h5>
                          <small className="text-muted">
                            {chat?.is_group ? 
                              `${chat.participants?.length || 0} thành viên` : 
                              'Trò chuyện riêng tư'}
                          </small>
                        </div>
                      </div>
                      
                      <div className="ms-auto">
                        <Button 
                          variant="outline-info" 
                          size="sm" 
                          onClick={() => setShowParticipants(true)}
                          className="d-flex align-items-center"
                        >
                          <FaInfoCircle className="me-1" /> Chi tiết
                        </Button>
                      </div>
                    </Card.Header>
                    
                    {/* Chat Messages */}
                    <Card.Body 
                      className="p-3 overflow-auto" 
                      style={{ maxHeight: '60vh', minHeight: '60vh' }}
                      ref={chatBodyRef}
                    >
                      {messages.length === 0 ? (
                        <div className="text-center text-muted p-5">
                          <div className="mb-3">
                            {chat?.is_group ? 
                              <FaUsers size={48} className="text-secondary" /> : 
                              <FaUserCircle size={48} className="text-secondary" />
                            }
                          </div>
                          <h5>Chưa có tin nhắn nào</h5>
                          <p>Hãy bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn đầu tiên!</p>
                        </div>
                      ) :  
                        // Sắp xếp tin nhắn từ cũ đến mới dựa trên thời gian tạo
                        [...messages]
                          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                          .map((message) => (
                            <ChatMessage 
                              key={message.id} 
                              message={message} 
                              isOwnMessage={currentUser && message.user_id === currentUser.id}
                            />
                          ))
                      }
                      
                      <div ref={messagesEndRef} />
                    </Card.Body>
                    
                    {/* Message Input */}
                    <Card.Footer className="bg-white border-top p-3">
                      <Form onSubmit={handleSendMessage}>
                        {attachments.length > 0 && (
                          <div className="attachments-preview mb-2 p-2 border rounded bg-light">
                            <div className="d-flex justify-content-between mb-1">
                              <small className="text-muted">Đính kèm ({attachments.length})</small>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-muted"
                                onClick={() => {
                                  // Revoke all object URLs before clearing
                                  attachments.forEach(att => {
                                    if (att.preview) URL.revokeObjectURL(att.preview);
                                  });
                                  setAttachments([]);
                                }}
                              >
                                Xóa tất cả
                              </Button>
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                              {attachments.map((attachment, index) => (
                                <div key={index} className="attachment-item border rounded p-2 position-relative"
                                     style={{ maxWidth: 120 }}>
                                  {attachment.preview ? (
                                    <div className="text-center mb-1">
                                      <img 
                                        src={attachment.preview} 
                                        alt={attachment.name} 
                                        className="img-fluid rounded" 
                                        style={{ maxHeight: 60, maxWidth: 100 }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="text-center mb-1">
                                      <FaFile className="text-muted" size={24} />
                                    </div>
                                  )}
                                  <small className="text-truncate d-block" style={{ fontSize: '0.7rem' }}>
                                    {attachment.name}
                                  </small>
                                  <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>
                                    {(attachment.size / 1024).toFixed(1)} KB
                                  </small>
                                  <Button
                                    variant="light"
                                    size="sm"
                                    className="position-absolute top-0 end-0 p-0 rounded-circle"
                                    style={{ width: '20px', height: '20px', fontSize: '10px' }}
                                    onClick={() => removeAttachment(index)}
                                  >
                                    <FaTimesCircle size={12} />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="d-flex">
                          <div className="me-2">
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Đính kèm tệp</Tooltip>}
                            >
                              <Button 
                                variant="light" 
                                className="border d-flex align-items-center justify-content-center"
                                style={{ width: 40, height: 40 }}
                                onClick={() => document.getElementById('file-upload').click()}
                                disabled={sending}
                              >
                                <FaFile />
                              </Button>
                            </OverlayTrigger>
                            <input 
                              type="file" 
                              id="file-upload"
                              className="d-none"
                              onChange={handleAttachmentChange}
                              multiple
                              disabled={sending}
                            />
                          </div>
                          
                          <div className="me-2">
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Đính kèm hình ảnh</Tooltip>}
                            >
                              <Button 
                                variant="light" 
                                className="border d-flex align-items-center justify-content-center"
                                style={{ width: 40, height: 40 }}
                                onClick={() => document.getElementById('image-upload').click()}
                                disabled={sending}
                              >
                                <FaImage />
                              </Button>
                            </OverlayTrigger>
                            <input 
                              type="file" 
                              id="image-upload"
                              className="d-none"
                              onChange={handleAttachmentChange}
                              accept="image/*"
                              multiple
                              disabled={sending}
                            />
                          </div>
                          
                          <Form.Control
                            type="text"
                            placeholder="Nhập tin nhắn của bạn..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="me-2"
                            disabled={sending}
                          />
                          
                          <Button 
                            variant="primary" 
                            type="submit" 
                            className="d-flex align-items-center justify-content-center"
                            style={{ width: 45, height: 40 }}
                            disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                          >
                            {sending ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <FaPaperPlane />
                            )}
                          </Button>
                        </div>
                      </Form>
                    </Card.Footer>
                  </>
                )}
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Participants Modal */}
      <Modal show={showParticipants} onHide={() => setShowParticipants(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Thành viên cuộc trò chuyện</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {chat?.participants?.length > 0 ? (
            <div className="participant-list">
              {chat.participants.map((participant, index) => (
                <div key={index} className="d-flex align-items-center mb-2 p-2 border-bottom">
                  <div 
                    className="rounded-circle bg-light d-flex align-items-center justify-content-center me-2"
                    style={{ width: 40, height: 40, overflow: 'hidden' }}
                  >
                    {participant.user?.avatar ? (
                      <img 
                        src={participant.user.avatar} 
                        alt={participant.user?.name} 
                        className="img-fluid"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <FaUserCircle size={24} className="text-secondary" />
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold">
                      {participant.user?.name || 'Người dùng không xác định'}
                      {participant.is_admin && (
                        <Badge bg="info" className="ms-2">Admin</Badge>
                      )}
                      {participant.user?.id === currentUser?.id && (
                        <Badge bg="secondary" className="ms-2">Bạn</Badge>
                      )}
                    </div>
                    <small className="text-muted">
                      {participant.joined_at ? `Tham gia: ${new Date(participant.joined_at).toLocaleDateString('vi-VN')}` : ''}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">Không có thành viên nào</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowParticipants(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      <Footer />
    </>
  );
};

export default ChatPage;
