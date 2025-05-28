import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Image, Button, Badge, Spinner, Alert, Pagination } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { profileService, chatService, authService } from '../../services';
import defaultAvatar from '../../assets/avatar-1.png';

const GroupMembers = ({ groupId, isAdmin }) => {  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [creatingChat, setCreatingChat] = useState({});
  const [creatingGroupChat, setCreatingGroupChat] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMembers(currentPage);
  }, [groupId, currentPage]);

  const fetchMembers = async (page) => {
    try {
      setLoading(true);
      setError('');
      
      // For testing - log the request parameters
      console.log(`Fetching members for group ${groupId}, page ${page}`);
      
      const response = await profileService.getGroupMembers(groupId, { page, per_page: 10 });
      
      // For testing - log the entire response to debug
      console.log('Group members response:', response);
      
      if (response.success) {
        // Make sure we handle the data whether it has nested 'user' objects or not
        setMembers(response.data || []);
        setTotalPages(response.meta?.last_page || 1);
      } else {
        throw new Error(response.message || 'Không thể tải danh sách thành viên');
      }
    } catch (err) {
      console.error("Error fetching group members:", err);
      setError('Không thể tải danh sách thành viên. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis-start" />);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item 
          key={i} 
          active={i === currentPage}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis-end" />);
      }
      items.push(
        <Pagination.Item key={totalPages} onClick={() => setCurrentPage(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="justify-content-center mt-4">
        <Pagination.Prev 
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        />
        {items}
        <Pagination.Next 
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        />
      </Pagination>
    );
  };
  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge bg="danger">Quản trị viên</Badge>;
      case 'moderator':
        return <Badge bg="warning">Điều hành viên</Badge>;
      default:
        return <Badge bg="secondary">Thành viên</Badge>;
    }
  };
  const handleStartChat = async (member) => {
    // Don't allow chat with self
    const currentUser = authService.getUser();
    if (currentUser && currentUser.id === member.id) {
      return;
    }

    try {
      setCreatingChat(prev => ({ ...prev, [member.id]: true }));
      
      // Create or find existing direct chat
      const response = await chatService.createChat({
        user_id: member.id
      });
      
      if (response && response.data) {
        // Navigate to the chat
        const chatId = response.data.id;
        navigate(`/unishare/chats/${chatId}`);
      } else {
        throw new Error('Không thể tạo cuộc trò chuyện');
      }
    } catch (err) {
      console.error('Error creating/finding chat:', err);
      setError('Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.');
    } finally {
      setCreatingChat(prev => ({ ...prev, [member.id]: false }));
    }
  };

  const handleCreateGroupChat = async () => {
    try {
      setCreatingGroupChat(true);
      
      // Get group information first
      const response = await profileService.getGroup(groupId);
      if (!response.success) {
        throw new Error('Không thể lấy thông tin nhóm');
      }
      
      const group = response.data;
      
      // Create group chat
      const chatResponse = await chatService.createGroupChat({
        name: `Chat nhóm: ${group.name}`,
        description: `Cuộc trò chuyện cho nhóm ${group.name}`,
        group_id: groupId
      });
      
      if (chatResponse && chatResponse.data) {
        // Navigate to the group chat
        const chatId = chatResponse.data.id;
        navigate(`/unishare/chats/${chatId}`);
      } else {
        throw new Error('Không thể tạo cuộc trò chuyện nhóm');
      }
    } catch (err) {
      console.error('Error creating group chat:', err);
      setError('Không thể tạo cuộc trò chuyện nhóm. Vui lòng thử lại sau.');
    } finally {
      setCreatingGroupChat(false);
    }
  };

  if (loading && members.length === 0) {
    return <div className="text-center py-4"><Spinner animation="border" /></div>;
  }

  if (error && members.length === 0) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="group-members-container">
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      {loading && members.length > 0 && (
        <div className="text-center py-2 mb-3"><Spinner animation="border" size="sm" /></div>
      )}
      
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <span>Thành viên nhóm</span>
            {isAdmin && (
              <Button
                variant="outline-primary"
                size="sm"
                as={Link}
                to={`/unishare/groups/${groupId}/members/manage`}
              >
                Quản lý thành viên
              </Button>
            )}
          </div>
        </Card.Header>
        <ListGroup variant="flush">
          {members.length === 0 && !loading ? (
            <ListGroup.Item className="text-center py-4">
              <p className="text-muted mb-0">Không tìm thấy thành viên nào</p>
            </ListGroup.Item>
          ) : (            members.map((member) => (
              <ListGroup.Item key={member.id} className="d-flex justify-content-between align-items-center p-3">
                <div className="d-flex align-items-center">
                  <Image 
                    src={member.avatar || defaultAvatar} 
                    roundedCircle 
                    width={40} 
                    height={40} 
                    className="me-3" 
                    style={{ objectFit: 'cover' }}
                  />
                  <div>
                    <div className="fw-bold">{member.name || 'Người dùng'}</div>
                    <div className="d-flex align-items-center">
                      {getRoleBadge(member.role)}
                      {member.joined_at && (
                        <small className="text-muted ms-2">
                          Tham gia: {new Date(member.joined_at).toLocaleDateString('vi-VN')}
                        </small>
                      )}
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <Button 
                    as={Link}
                    to={`/profile/${member.id}`}
                    variant="outline-primary" 
                    size="sm"
                    className="text-decoration-none"
                  >
                    Xem hồ sơ
                  </Button>
                  {authService.getUser()?.id !== member.id && (
                    <Button 
                      variant="outline-success" 
                      size="sm"
                      onClick={() => handleStartChat(member)}
                      disabled={creatingChat[member.id]}
                    >
                      {creatingChat[member.id] ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-1" />
                          Đang tạo...
                        </>
                      ) : (
                        'Nhắn tin'
                      )}
                    </Button>
                  )}
                </div>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      </Card>
      
      {renderPagination()}
    </div>
  );
};

export default GroupMembers;
