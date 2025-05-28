import React, { useState, useEffect, useRef } from 'react';
import { ListGroup, Image, Badge, Spinner, Alert, Form, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaUsers, FaUser, FaCircle } from 'react-icons/fa';
import userAvatar from '../../assets/avatar-1.png';
import { chatService, authService } from '../../services';

const ChatSidebar = ({ activeChatId }) => {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const isComponentMounted = useRef(true);
  const pollIntervalRef = useRef(null);
  // Define fetchChats function
  const fetchChats = async () => {
    if (!isComponentMounted.current) {
      console.log('Component unmounted, skipping fetchChats');
      return;
    }
    
    try {
      setLoading(true);
      console.log('ChatSidebar: Fetching chats list');
      const response = await chatService.getUserChats(null, false); // Add useCache: false to ensure fresh data
      
      // Check if component is still mounted before updating state
      if (!isComponentMounted.current) {
        console.log('Component unmounted during fetch, aborting update');
        return;
      }
      
      // Better error detection - response exists and has expected structure
      if (response) {
        console.log('Chat response received:', response);
        
        // Handle different response structures
        let chatsData = [];
        
        if (response.success === true && response.data) {
          // Success response with data property
          chatsData = Array.isArray(response.data) ? response.data : response.data.data || [];
        } else if (response.data) {
          // Direct data property
          chatsData = Array.isArray(response.data) ? response.data : response.data.data || [];
        } else if (Array.isArray(response)) {
          // Response is directly an array
          chatsData = response;
        }
        
        console.log('Chats data processed, count:', chatsData.length);
        setChats(chatsData);
      } else {
        console.error('Error in chat response:', response);
        // Only throw error if response completely missing
        if (!response) {
          throw new Error('Không thể tải danh sách cuộc trò chuyện');
        } else {
          // Empty chats list is acceptable
          setChats([]);
        }
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
      if (isComponentMounted.current) {
        setError('Không thể tải danh sách cuộc trò chuyện. Vui lòng thử lại sau.');
      }
    } finally {
      if (isComponentMounted.current) {
        setLoading(false);
      }
    }
  };

  // Track component mount/unmount and setup real-time events
  useEffect(() => {
    console.log('ChatSidebar mounted');
    isComponentMounted.current = true;
    
    // Setup real-time event listeners only if not already set up
    const handleChatListUpdated = () => {
      console.log('Real-time: Chat list updated, refreshing...');
      if (isComponentMounted.current) {
        fetchChats();
      }
    };

    const handleNewMessage = (newMessage, chat) => {
      console.log('Real-time: New message received in ChatSidebar', newMessage, chat);
      // Update the specific chat in the list
      if (isComponentMounted.current) {
        setChats(prevChats => {
          return prevChats.map(c => {
            if (c.id === (chat?.id || newMessage?.chat_id)) {
              return {
                ...c,
                last_message: newMessage,
                last_message_at: newMessage.created_at,
                is_read: newMessage.user_id === authService.getUser()?.id, // Only mark as read if it's from current user
                unread_count: newMessage.user_id === authService.getUser()?.id ? 
                  c.unread_count : (c.unread_count || 0) + 1
              };
            }
            return c;
          });
        });
      }
    };

    // Check if real-time is already connected before subscribing
    let isRealTimeSetup = false;
    if (chatService && typeof chatService.subscribeToRealTimeEvents === 'function') {
      try {
        // Check if already connected
        if (chatService.pusher && chatService.pusher.connection.state === 'connected') {
          console.log('Pusher already connected, updating callbacks for ChatSidebar');
          // Update callbacks without reconnecting
          chatService.realTimeCallbacks = {
            ...chatService.realTimeCallbacks,
            onNewMessage: handleNewMessage,
            onChatListUpdated: handleChatListUpdated
          };
          isRealTimeSetup = true;
        } else {
          // Set up new connection
          isRealTimeSetup = chatService.subscribeToRealTimeEvents(
            handleNewMessage,
            null, // Don't need individual chat updates in sidebar
            handleChatListUpdated
          );
        }
      } catch (error) {
        console.error('Error setting up real-time events in ChatSidebar:', error);
        isRealTimeSetup = false;
      }
    }

    if (!isRealTimeSetup) {
      console.log('Real-time setup failed in ChatSidebar, falling back to polling');
      setupPolling();
    }
    
    return () => {
      console.log('ChatSidebar unmounted');
      isComponentMounted.current = false;
      
      // Clear any intervals when component unmounts
      if (pollIntervalRef.current) {
        console.log('Clearing poll interval on unmount');
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      
      // Don't clean up the global chatService connection here since other components might be using it
    };
  }, []); // Empty dependency array to run only once on mount

  const setupPolling = () => {
    // Poll for new chats/messages every 60 seconds as fallback
    console.log('Setting up polling for chats list');
    pollIntervalRef.current = setInterval(() => {
      if (isComponentMounted.current) {
        console.log('Polling for new chats');
        fetchChats();
      } else {
        // Safety check - clear interval if component is unmounted
        console.log('Component unmounted during polling, clearing interval');
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }, 60000); // 60 seconds
  };  // Initial fetch
  useEffect(() => {
    // Initial fetch
    fetchChats();
  }, []);

  // React to activeChatId changes
  useEffect(() => {
    if (activeChatId) {
      console.log('Active chat ID changed to:', activeChatId);
      // Refetch chats to ensure the active chat is in the list
      fetchChats();
    }
  }, [activeChatId]);
  
  // Format timestamp to a readable format
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // If less than 1 minute ago
    if (diffMins < 1) {
      return 'Vừa xong';
    }
    
    // If less than 1 hour ago, show minutes
    if (diffHours < 1) {
      return `${diffMins} phút trước`;
    }
    
    // If less than 24 hours ago, show hours
    if (diffDays < 1) {
      return `${diffHours} giờ trước`;
    }
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    }
    
    // If this year, show date without year
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString('vi-VN');
  };

  // Get chat label based on type and members
  const getChatLabel = (chat) => {
    if (chat.name) return chat.name;
    
    // For private chats, get the other user's name
    if (!chat.is_group && chat.participants && chat.participants.length > 0) {
      const otherParticipant = chat.participants.find(
        p => p.user?.id !== chat.current_user?.id
      );
      return otherParticipant?.user?.name || 'Người dùng không xác định';
    }
    
    return 'Cuộc trò chuyện không có tên';
  };

  // Filter chats based on search term
  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      chat.name?.toLowerCase().includes(searchTermLower) ||
      chat.participants?.some(participant => 
        participant.user?.name?.toLowerCase().includes(searchTermLower)
      ) ||
      chat.last_message?.content?.toLowerCase().includes(searchTermLower)
    );
  });
  
  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Đang tải danh sách chat...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        {error}
      </Alert>
    );
  }
  
  return (
    <div className="chat-sidebar">
      <div className="mb-3">
        <InputGroup>
          <InputGroup.Text>
            <FaSearch />
          </InputGroup.Text>
          <Form.Control
            placeholder="Tìm kiếm chat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </div>
      
      <ListGroup className="shadow-sm chat-list">
        {filteredChats.length === 0 ? (
          <ListGroup.Item className="text-center py-4">
            <p className="mb-0 text-muted">Không có cuộc trò chuyện nào</p>
          </ListGroup.Item>
        ) : (
          filteredChats.map((chat) => {
            const chatLabel = getChatLabel(chat);
            return (
              <ListGroup.Item 
                key={chat.id}
                action
                as={Link}
                to={`/unishare/chats/${chat.id}`}
                active={chat.id.toString() === activeChatId}
                className={`d-flex align-items-center p-3 chat-item ${!chat.is_read ? 'fw-bold' : ''}`}
              >
                <div className="position-relative">
                  <Image 
                    src={chat.avatar || userAvatar} 
                    roundedCircle 
                    width={48} 
                    height={48}
                    className="me-3"
                    style={{ objectFit: 'cover', border: '1px solid #e0e0e0' }}
                  />
                  <div 
                    className="chat-type-indicator position-absolute"
                    style={{ 
                      bottom: '0', 
                      right: '8px', 
                      backgroundColor: chat.is_group ? '#5bc0de' : '#5cb85c',
                      padding: '4px',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: '2px solid white'
                    }}
                  >
                    {chat.is_group ? 
                      <FaUsers size={10} color="white" /> : 
                      <FaUser size={10} color="white" />
                    }
                  </div>
                </div>
                
                <div className="flex-grow-1 text-truncate">
                  <div className="d-flex justify-content-between align-items-center">
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip id={`tooltip-${chat.id}`}>{chatLabel}</Tooltip>}
                    >
                      <div className="chat-name text-truncate fw-semibold">
                        {chatLabel}
                      </div>
                    </OverlayTrigger>
                    <div className="d-flex align-items-center">
                      {!chat.is_read && (
                        <div className="me-2">
                          <FaCircle size={8} color="#0d6efd" />
                        </div>
                      )}
                      <small className="text-muted timestamp">
                        {formatLastMessageTime(chat.last_message?.created_at || chat.updated_at)}
                      </small>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="last-message text-truncate text-muted small">
                      {chat.last_message ? (
                        <>
                          <span className="sender-name me-1 fw-medium">
                            {chat.last_message.user?.name === chat.current_user?.name ? 'Bạn:' : 
                             chat.last_message.user?.name ? `${chat.last_message.user.name.split(' ').pop()}:` : ''}
                          </span>
                          {chat.last_message.content || 
                           (chat.last_message.attachments?.length ? 'Đã gửi một file đính kèm' : '(Không có nội dung)')}
                        </>
                      ) : (
                        'Chưa có tin nhắn'
                      )}
                    </div>
                    
                    {chat.unread_count > 0 && (
                      <Badge 
                        bg="primary" 
                        pill 
                        className="ms-2 unread-badge"
                        style={{ 
                          minWidth: '20px', 
                          height: '20px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center'
                        }}
                      >
                        {chat.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </ListGroup.Item>
            );
          })
        )}
      </ListGroup>
      
      <style jsx="true">{`
        .chat-list .chat-item {
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        
        .chat-list .chat-item:hover {
          background-color: rgba(13, 110, 253, 0.05);
        }
        
        .chat-list .chat-item.active {
          border-left-color: #0d6efd;
        }
        
        .chat-list .unread-badge {
          font-size: 0.7rem;
        }
        
        .chat-list .timestamp {
          font-size: 0.75rem;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default ChatSidebar;
