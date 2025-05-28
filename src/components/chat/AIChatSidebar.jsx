import React, { useState, useEffect, useRef } from 'react';
import { Card, ListGroup, Button, Badge, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { FaPlus, FaRobot, FaTrash, FaEdit, FaComment } from 'react-icons/fa';
import { aiChatService, authService } from '../../services';

const AIChatSidebar = ({ activeChatId, onChatSelect, onNewChat }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingChat, setEditingChat] = useState(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [newChatModel, setNewChatModel] = useState('gpt-4');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const isComponentMounted = useRef(true);

  useEffect(() => {
    isComponentMounted.current = true;
    fetchChats();
    
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      console.log('AIChatSidebar: Fetching AI chats list');
      const response = await aiChatService.getUserAIChats(null, false);
      
      if (!isComponentMounted.current) {
        console.log('Component unmounted during fetch, aborting update');
        return;
      }
      
      if (response) {
        console.log('AI Chat response received:', response);
        
        let chatsData = [];
        
        if (response.success === true && response.data) {
          chatsData = Array.isArray(response.data) ? response.data : response.data.data || [];
        } else if (response.data) {
          chatsData = Array.isArray(response.data) ? response.data : response.data.data || [];
        } else if (Array.isArray(response)) {
          chatsData = response;
        }
        
        console.log('Processed AI chats data:', chatsData);
        setChats(chatsData);
        
        if (response.success === false) {
          setError(response.message || 'Không thể tải danh sách trò chuyện AI');
        } else {
          setError('');
        }
      } else {
        console.warn('No response received for AI chats');
        setError('Không có phản hồi từ máy chủ');
        setChats([]);
      }
    } catch (error) {
      console.error('Error fetching AI chats:', error);
      if (isComponentMounted.current) {
        setError('Lỗi khi tải danh sách trò chuyện AI: ' + (error.message || 'Lỗi không xác định'));
        setChats([]);
      }
    } finally {
      if (isComponentMounted.current) {
        setLoading(false);
      }
    }
  };
  const handleCreateChat = async () => {
    if (!newChatTitle.trim()) {
      setError('Vui lòng nhập tiêu đề trò chuyện');
      return;
    }

    try {
      setCreating(true);
      setError('');
      
      const chatData = {
        title: newChatTitle.trim(),
        model: newChatModel
      };
      
      const response = await aiChatService.createAIChat(chatData);
      
      if (response.success) {
        console.log('AI Chat created successfully:', response.data);
        
        // Add the new chat to the list
        const newChat = response.data;
        setChats(prevChats => [newChat, ...prevChats]);
        
        // Reset form and close modal
        setNewChatTitle('');
        setNewChatModel('gpt-4');
        setShowNewChatModal(false);
        
        // Select the new chat
        if (onNewChat) {
          onNewChat(newChat);
        }
        if (onChatSelect) {
          onChatSelect(newChat.id);
        }
      } else {
        setError(response.message || 'Không thể tạo trò chuyện AI');
      }
    } catch (error) {
      console.error('Error creating AI chat:', error);
      setError('Lỗi khi tạo trò chuyện AI: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setCreating(false);
    }
  };

  const handleEditChat = async () => {    if (!editingChat || !newChatTitle.trim()) {
      setError('Vui lòng nhập tiêu đề trò chuyện');
      return;
    }

    try {
      setUpdating(true);
      setError('');
      
      const updateData = {
        title: newChatTitle.trim(),
        model: newChatModel
      };
      
      const response = await aiChatService.updateAIChat(editingChat.id, updateData);
      
      if (response.success) {
        console.log('AI Chat updated successfully:', response.data);
        
        // Update the chat in the list
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === editingChat.id 
              ? { ...chat, ...response.data }
              : chat
          )
        );
        
        // Reset form and close modal
        setNewChatTitle('');
        setNewChatModel('gpt-4');
        setEditingChat(null);
        setShowEditModal(false);
      } else {
        setError(response.message || 'Không thể cập nhật trò chuyện AI');
      }
    } catch (error) {
      console.error('Error updating AI chat:', error);
      setError('Lỗi khi cập nhật trò chuyện AI: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteChat = async (chatId, event) => {
    event.stopPropagation();
    
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện AI này?')) {
      return;
    }

    try {
      const response = await aiChatService.deleteAIChat(chatId);
      
      if (response.success) {
        console.log('AI Chat deleted successfully');
        
        // Remove the chat from the list
        setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
        
        // If this was the active chat, clear selection
        if (activeChatId === chatId && onChatSelect) {
          onChatSelect(null);
        }
      } else {
        setError(response.message || 'Không thể xóa trò chuyện AI');
      }
    } catch (error) {
      console.error('Error deleting AI chat:', error);
      setError('Lỗi khi xóa trò chuyện AI: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const handleEditClick = (chat, event) => {
    event.stopPropagation();
    setEditingChat(chat);
    setNewChatTitle(chat.title);
    setNewChatModel(chat.model || 'gpt-4');
    setShowEditModal(true);
  };

  const availableModels = aiChatService.getAvailableModels();

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <Card className="h-100">        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <FaRobot className="me-2" />
            Trò chuyện AI
          </h6>
        </Card.Header>
        <Card.Body className="d-flex justify-content-center align-items-center">
          <Spinner animation="border" variant="primary" />
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-100">
        <Card.Header className="d-flex justify-content-between align-items-center">          <h6 className="mb-0">
            <FaRobot className="me-2" />
            Trò chuyện AI
          </h6>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => setShowNewChatModal(true)}
            title="Tạo cuộc trò chuyện AI mới"
          >
            <FaPlus />
          </Button>
        </Card.Header>
        
        <Card.Body className="p-0" style={{ overflowY: 'auto' }}>
          {error && (
            <Alert variant="danger" className="m-2 small">
              {error}
            </Alert>
          )}
          
          {chats.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <FaComment size={48} className="mb-3 opacity-50" />
              <p>Chưa có cuộc trò chuyện AI nào</p>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => setShowNewChatModal(true)}
              >
                Bắt đầu cuộc trò chuyện AI đầu tiên của bạn
              </Button>
            </div>
          ) : (
            <ListGroup variant="flush">
              {chats.map((chat) => (
                <ListGroup.Item
                  key={chat.id}
                  action
                  active={activeChatId === chat.id}
                  onClick={() => onChatSelect && onChatSelect(chat.id)}
                  className="d-flex justify-content-between align-items-start border-0"
                  style={{ cursor: 'pointer' }}
                >
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-1 text-truncate" style={{ maxWidth: '180px' }}>
                        {chat.title || 'Cuộc trò chuyện không có tiêu đề'}
                      </h6>
                      <div className="d-flex align-items-center">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="me-1 p-1"
                          onClick={(e) => handleEditClick(chat, e)}
                          title="Chỉnh sửa cuộc trò chuyện"
                        >
                          <FaEdit size={12} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="p-1"
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          title="Xóa cuộc trò chuyện"
                        >
                          <FaTrash size={12} />
                        </Button>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {chat.model && (
                          <Badge variant="secondary" className="me-2">
                            {chat.model}
                          </Badge>
                        )}
                        {chat.messages_count || 0} tin nhắn
                      </small>
                      <small className="text-muted">
                        {formatTimestamp(chat.updated_at)}
                      </small>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>      {/* New Chat Modal */}
      <Modal show={showNewChatModal} onHide={() => setShowNewChatModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tạo Cuộc Trò Chuyện AI Mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tiêu Đề Cuộc Trò Chuyện</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập tiêu đề cuộc trò chuyện..."
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                maxLength={100}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô Hình AI</Form.Label>
              <Form.Select
                value={newChatModel}
                onChange={(e) => setNewChatModel(e.target.value)}
              >
                {availableModels.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label} - {model.description}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>          <Button variant="secondary" onClick={() => setShowNewChatModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateChat}
            disabled={creating || !newChatTitle.trim()}
          >
            {creating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang tạo...
              </>
            ) : (
              'Tạo Cuộc Trò Chuyện'
            )}
          </Button>
        </Modal.Footer>
      </Modal>      {/* Edit Chat Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh Sửa Cuộc Trò Chuyện AI</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tiêu Đề Cuộc Trò Chuyện</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập tiêu đề cuộc trò chuyện..."
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                maxLength={100}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô Hình AI</Form.Label>
              <Form.Select
                value={newChatModel}
                onChange={(e) => setNewChatModel(e.target.value)}
              >
                {availableModels.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label} - {model.description}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={handleEditChat}
            disabled={updating || !newChatTitle.trim()}
          >
            {updating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang cập nhật...
              </>
            ) : (
              'Cập Nhật Cuộc Trò Chuyện'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AIChatSidebar;
