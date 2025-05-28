import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPaperPlane, FaRobot, FaArrowLeft, FaTrash, FaCog, FaChevronDown } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { aiChatService, authService } from '../services';
import AIChatSidebar from '../components/chat/AIChatSidebar';
import AIChatMessage from '../components/chat/AIChatMessage';

const AIChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');  const [activeChatId, setActiveChatId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isComponentMounted = useRef(true);
  const currentChatIdRef = useRef(null);
  const isNearBottom = useRef(true);
  const userHasScrolled = useRef(false);

  // Update refs when chatId changes
  useEffect(() => {
    currentChatIdRef.current = chatId;
    setActiveChatId(chatId ? parseInt(chatId) : null);
  }, [chatId]);

  useEffect(() => {
    isComponentMounted.current = true;
    
    return () => {
      console.log('AIChatPage unmounted');
      isComponentMounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (chatId) {
      loadChatData(chatId);
    } else {
      setLoading(false);
      setChat(null);
      setMessages([]);
      setShowScrollButton(false);
      userHasScrolled.current = false;
      isNearBottom.current = true;
    }
  }, [chatId]);

  // Monitor messages changes to update scroll button visibility
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      // Check scroll position after messages render
      setTimeout(checkIfNearBottom, 100);
    }
  }, [messages.length]);

  const loadChatData = async (chatId) => {
    try {
      setLoading(true);
      setError('');
      
      console.log(`Loading AI chat data for chat ${chatId}`);
      
      const chatResponse = await aiChatService.getAIChat(chatId);
      
      if (!isComponentMounted.current) return;
      
      if (chatResponse.success) {
        const chatData = chatResponse.data;
        console.log('AI Chat data loaded:', chatData);
        
        setChat(chatData);
          // Set messages from the chat data
        if (chatData.messages && Array.isArray(chatData.messages)) {
          setMessages(chatData.messages);
        } else {
          setMessages([]);
        }
        
        // Only scroll to bottom on initial load if this is a new chat with no messages
        // or if user was previously at bottom
        setTimeout(() => {
          if (chatData.messages && chatData.messages.length === 0) {
            // New empty chat - safe to scroll
            scrollToBottom('auto');
            isNearBottom.current = true;
            userHasScrolled.current = false;
          } else {
            // Existing chat with messages - don't auto scroll, let user choose
            // Just update the refs without scrolling
            isNearBottom.current = false;
            userHasScrolled.current = true;
            setShowScrollButton(true);
          }
        }, 100);
      } else {        console.error('Failed to load AI chat:', chatResponse.message);
        setError(chatResponse.message || 'Không thể tải dữ liệu AI chat');
      }
    } catch (error) {
      console.error('Error loading AI chat data:', error);
      if (isComponentMounted.current) {
        setError('Lỗi khi tải dữ liệu AI chat: ' + (error.message || 'Lỗi không xác định'));
      }
    } finally {
      if (isComponentMounted.current) {
        setLoading(false);
      }
    }
  };
  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };  // Check if user is near bottom of messages container
  const checkIfNearBottom = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const threshold = 150; // pixels from bottom
      const nearBottom = scrollHeight - scrollTop - clientHeight < threshold;
      
      // Update refs
      const wasNearBottom = isNearBottom.current;
      isNearBottom.current = nearBottom;
      
      // Update scroll button visibility - only show if:
      // 1. Not near bottom AND
      // 2. Has messages AND  
      // 3. Container is scrollable
      const shouldShowButton = !nearBottom && 
                              messages.length > 0 && 
                              scrollHeight > clientHeight;
      setShowScrollButton(shouldShowButton);
      
      // If user scrolled up significantly, mark as scrolled
      if (!nearBottom && !userHasScrolled.current) {
        userHasScrolled.current = true;
      }
      // If user scrolled back to bottom, reset the flag
      else if (nearBottom && userHasScrolled.current) {
        userHasScrolled.current = false;
      }
      
      console.log('Scroll check:', { 
        scrollTop, 
        scrollHeight, 
        clientHeight, 
        nearBottom, 
        userHasScrolled: userHasScrolled.current,
        showButton: shouldShowButton
      });
    }
  };
  // Smart scroll: only auto-scroll if user is near bottom
  const smartScrollToBottom = (behavior = 'smooth') => {
    if (isNearBottom.current && !userHasScrolled.current) {
      scrollToBottom(behavior);
    }
  };

  // Force scroll to bottom (for button click)
  const forceScrollToBottom = () => {
    scrollToBottom('smooth');
    setShowScrollButton(false);
    userHasScrolled.current = false;
    isNearBottom.current = true;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeChatId || sending) {
      return;
    }
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setError('');
    
    // Add user message to the UI immediately
    const userMessage = {
      id: Date.now(), // Temporary ID
      content: messageContent,
      is_ai: false,
      created_at: new Date().toISOString(),
      user: authService.getUser()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);    // Show typing indicator
    setIsTyping(true);
    
    // Always scroll when user sends a message (they initiated the action)
    setTimeout(() => {
      scrollToBottom('smooth');
      isNearBottom.current = true;
      userHasScrolled.current = false;
      setShowScrollButton(false);
    }, 100);
    
    try {
      console.log('Sending message to AI:', messageContent);
      
      const response = await aiChatService.sendMessageToAI(activeChatId, {
        content: messageContent
      });
      
      if (!isComponentMounted.current || currentChatIdRef.current !== chatId) {
        console.log('Component unmounted or chat changed, aborting message update');
        return;
      }
      
      if (response.success) {
        console.log('AI response received:', response.data);
        
        // Remove typing indicator
        setIsTyping(false);
        
        // Update messages with actual response data
        if (response.data) {
          // Handle different response structures
          let userMsg = null;
          let aiMsg = null;
          
          if (response.data.user_message && response.data.ai_message) {
            // Separate user and AI messages
            userMsg = response.data.user_message;
            aiMsg = response.data.ai_message;
          } else if (Array.isArray(response.data)) {
            // Array of messages
            const newMessages = response.data;
            userMsg = newMessages.find(msg => !msg.is_ai);
            aiMsg = newMessages.find(msg => msg.is_ai);
          } else if (response.data.is_ai !== undefined) {
            // Single message
            if (response.data.is_ai) {
              aiMsg = response.data;
            } else {
              userMsg = response.data;
            }
          }
          
          // Update messages with actual data
          setMessages(prevMessages => {
            // Remove the temporary user message
            const filteredMessages = prevMessages.filter(msg => msg.id !== userMessage.id);
            
            // Add the actual messages
            const newMessages = [...filteredMessages];
            
            if (userMsg) {
              newMessages.push(userMsg);
            }
            
            if (aiMsg) {
              newMessages.push(aiMsg);
            }
            
            return newMessages;
          });        }
        
        // Don't auto-scroll when AI responds - let user control scrolling
        // Only scroll if user is already at bottom
        setTimeout(() => {
          if (isNearBottom.current && !userHasScrolled.current) {
            scrollToBottom('smooth');
          }
        }, 100);
      } else {
        console.error('Failed to send message to AI:', response.message);
        setError(response.message || 'Không thể gửi tin nhắn tới AI');
        setIsTyping(false);
        
        // Remove the temporary user message on error
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== userMessage.id)
        );
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      setError('Lỗi khi gửi tin nhắn: ' + (error.message || 'Lỗi không xác định'));
      setIsTyping(false);
      
      // Remove the temporary user message on error
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== userMessage.id)
      );
    } finally {
      setSending(false);
    }
  };

  const handleChatSelect = useCallback((selectedChatId) => {
    if (selectedChatId) {
      navigate(`/ai-chat/${selectedChatId}`);
    } else {
      navigate('/ai-chat');
    }
  }, [navigate]);

  const handleNewChat = useCallback((newChat) => {
    console.log('New AI chat created:', newChat);
    if (newChat && newChat.id) {
      navigate(`/ai-chat/${newChat.id}`);
    }
  }, [navigate]);
  const handleClearHistory = async () => {
    if (!activeChatId || !window.confirm('Bạn có chắc chắn muốn xóa lịch sử trò chuyện? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      const response = await aiChatService.clearAIChatHistory(activeChatId);
      
      if (response.success) {
        setMessages([]);
        console.log('AI chat history cleared successfully');
      } else {
        setError(response.message || 'Không thể xóa lịch sử trò chuyện');
      }
    } catch (error) {
      console.error('Error clearing AI chat history:', error);
      setError('Lỗi khi xóa lịch sử trò chuyện: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const handleBackToChats = () => {
    navigate('/ai-chat');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      
      <Container fluid className="flex-grow-1 py-4">
        <Row className="h-100">
          {/* Sidebar */}
          <Col md={4} lg={3} className="mb-3 mb-md-0">
            <AIChatSidebar 
              activeChatId={activeChatId}
              onChatSelect={handleChatSelect}
              onNewChat={handleNewChat}
            />
          </Col>
          
          {/* Main Chat Area */}
          <Col md={8} lg={9}>
            {activeChatId ? (
              <Card className="h-100 d-flex flex-column">
                {/* Chat Header */}
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="me-3 d-md-none"
                      onClick={handleBackToChats}
                    >
                      <FaArrowLeft />
                    </Button>
                    <div>
                      <h6 className="mb-0 d-flex align-items-center">
                        <FaRobot className="me-2 text-primary" />
                        {loading ? 'Đang tải...' : (chat?.title || 'Trò chuyện AI')}
                      </h6>
                      {chat?.model && (
                        <small className="text-muted">
                          <Badge variant="secondary" className="mt-1">
                            {chat.model}
                          </Badge>
                        </small>
                      )}
                    </div>
                  </div>
                  <div>
                    {messages.length > 0 && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={handleClearHistory}
                        title="Xóa lịch sử trò chuyện"
                        className="me-2"
                      >
                        <FaTrash />
                      </Button>
                    )}
                  </div>
                </Card.Header>                {/* Messages Area */}
                <Card.Body 
                  ref={messagesContainerRef}
                  className="flex-grow-1 overflow-auto position-relative"
                  style={{ maxHeight: 'calc(100vh - 300px)' }}
                  onScroll={checkIfNearBottom}
                >
                  {loading ? (
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : error ? (
                    <Alert variant="danger" className="text-center">
                      {error}
                      <div className="mt-2">
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => loadChatData(activeChatId)}
                        >
                          Thử lại
                        </Button>
                      </div>
                    </Alert>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted mt-5">
                      <FaRobot size={64} className="mb-3 opacity-50" />                      <h5>Bắt đầu trò chuyện với AI</h5>
                      <p>Hỏi tôi bất cứ điều gì, tôi sẽ rất vui lòng giúp đỡ!</p>
                    </div>
                  ) : (                    <div>
                      {messages.map((message, index) => (
                        <AIChatMessage
                          key={message.id || index}
                          message={message}
                          isAI={message.role === 'assistant'}
                        />
                      ))}
                      {isTyping && <AIChatMessage isTyping={true} />}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                  
                  {/* Scroll to bottom button */}
                  {showScrollButton && (
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: '20px',
                        right: '20px',
                        zIndex: 1000
                      }}
                    >
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={forceScrollToBottom}
                        className="rounded-circle shadow"
                        style={{ width: '40px', height: '40px' }}
                        title="Cuộn xuống tin nhắn mới nhất"
                      >
                        <FaChevronDown />
                      </Button>
                    </div>
                  )}
                </Card.Body>
                
                {/* Message Input */}
                <Card.Footer>
                  <Form onSubmit={handleSendMessage}>
                    <div className="d-flex">
                      <Form.Control
                        type="text"
                        placeholder="Nhập tin nhắn của bạn cho AI..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sending || loading}
                        className="me-2"
                        maxLength={2000}
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={sending || loading || !newMessage.trim()}
                      >
                        {sending ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <FaPaperPlane />
                        )}
                      </Button>
                    </div>
                  </Form>
                  
                  {error && (
                    <Alert variant="danger" className="mt-2 mb-0 small">
                      {error}
                    </Alert>
                  )}
                </Card.Footer>
              </Card>
            ) : (
              /* Welcome Screen */
              <Card className="h-100 d-flex flex-column justify-content-center align-items-center text-center">
                <Card.Body>
                  <FaRobot size={96} className="text-primary mb-4 opacity-75" />                  <h3>Chào mừng đến với Trò chuyện AI</h3>
                  <p className="text-muted mb-4">
                    Tạo cuộc trò chuyện AI mới hoặc chọn cuộc trò chuyện hiện có từ thanh bên để bắt đầu trò chuyện với AI.
                  </p>
                  <Button 
                    variant="primary" 
                    onClick={() => handleChatSelect(null)}
                  >
                    <FaRobot className="me-2" />
                    Bắt đầu Trò chuyện AI mới
                  </Button>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
      
      <Footer />
    </div>
  );
};

export default AIChatPage;
