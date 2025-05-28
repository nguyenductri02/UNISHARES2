import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Row, Col, Image, Spinner, Alert, Modal, Badge, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BsPeopleFill, BsInfoCircle, BsChatDots, BsCalendarEvent } from 'react-icons/bs';
import { profileService, chatService } from '../../services';
import defaultAvatar from '../../assets/avatar-1.png';

const CurrentGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [groupToLeave, setGroupToLeave] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [groupChatUrls, setGroupChatUrls] = useState({});
  const isComponentMounted = useRef(true);
  const lastFetchTime = useRef({
    groups: 0,
    chats: {}
  });
  const isFetching = useRef({
    groups: false,
    chats: {}
  });

  // Track component mount/unmount
  useEffect(() => {
    console.log('CurrentGroups mounted');
    isComponentMounted.current = true;
    
    return () => {
      console.log('CurrentGroups unmounted');
      isComponentMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isComponentMounted.current) {
      fetchGroups(currentPage);
    }
  }, [currentPage]);

  const fetchGroups = async (page) => {
    // Prevent concurrent fetches
    if (isFetching.current.groups) {
      console.log('Already fetching groups, skipping');
      return;
    }
    
    // Throttle API calls - only fetch if it's been at least 5 seconds since last fetch
    const now = Date.now();
    if (now - lastFetchTime.current.groups < 5000) {
      console.log('Throttling groups fetch - last fetch was too recent');
      return;
    }
    
    try {
      isFetching.current.groups = true;
      lastFetchTime.current.groups = now;
      
      if (isComponentMounted.current) {
        setLoading(true);
        setError('');
      }
      
      console.log('Fetching user groups, page:', page);
      const response = await profileService.getUserGroups({ 
        status: 'active',
        page,
        per_page: 5
      });
      
      // Check if component is still mounted before updating state
      if (!isComponentMounted.current) {
        console.log('Component unmounted during fetch, aborting update');
        return;
      }
      
      if (response.success) {
        setGroups(response.data || []);
        setTotalPages(response.meta?.last_page || 1);
        
        // Fetch chat links for each group
        if (response.data && response.data.length > 0) {
          getGroupChatUrls(response.data);
        }
      } else {
        throw new Error(response.message || 'Không thể tải danh sách nhóm');
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
      if (isComponentMounted.current) {
        setError('Không thể tải danh sách nhóm. Vui lòng thử lại sau.');
      }
    } finally {
      if (isComponentMounted.current) {
        setLoading(false);
      }
      isFetching.current.groups = false;
    }
  };

  const getGroupChatUrls = async (groupsList) => {
    if (!isComponentMounted.current) return;
    
    try {
      const chatUrlsObj = {};
      
      for (const group of groupsList) {
        // Skip if component unmounted during processing
        if (!isComponentMounted.current) {
          console.log('Component unmounted during chat URL fetching, aborting');
          return;
        }
        
        // Prevent concurrent fetches for the same group
        if (isFetching.current.chats[group.id]) {
          console.log(`Already fetching chat for group ${group.id}, skipping`);
          continue;
        }
        
        // Throttle API calls - only fetch if it's been at least 10 seconds since last fetch
        const now = Date.now();
        if (lastFetchTime.current.chats[group.id] && 
            now - lastFetchTime.current.chats[group.id] < 10000) {
          console.log(`Throttling chat fetch for group ${group.id} - last fetch was too recent`);
          continue;
        }
        
        try {
          // Mark as fetching and update last fetch time
          isFetching.current.chats[group.id] = true;
          lastFetchTime.current.chats[group.id] = now;
          
          console.log(`Fetching chat for group ${group.id}`);
          const chatResponse = await chatService.getGroupChat(group.id);
          
          // Check if component is still mounted
          if (!isComponentMounted.current) {
            console.log('Component unmounted during chat fetch, aborting update');
            return;
          }
          
          if (chatResponse.success && chatResponse.data) {
            chatUrlsObj[group.id] = `/unishare/chats/${chatResponse.data.id}`;
          }
        } catch (err) {
          console.error(`Error fetching chat for group ${group.id}:`, err);
        } finally {
          isFetching.current.chats[group.id] = false;
        }
      }
      
      if (isComponentMounted.current) {
        setGroupChatUrls(prev => ({...prev, ...chatUrlsObj}));
      }
    } catch (err) {
      console.error("Error getting group chat URLs:", err);
    }
  };

  const handleLeaveGroup = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setGroupToLeave(group);
      setShowLeaveModal(true);
    }
  };
  const confirmLeaveGroup = async () => {
    if (!groupToLeave || !isComponentMounted.current) return;
    
    try {
      setLeaveLoading(true);
      if (isComponentMounted.current) {
        setError(''); // Clear any previous errors
      }
      
      console.log(`Leaving group ${groupToLeave.id}`);
      const response = await profileService.leaveGroup(groupToLeave.id);
      
      // Check if component is still mounted
      if (!isComponentMounted.current) {
        console.log('Component unmounted during leave group, aborting update');
        return;
      }
      
      if (response.success) {
        // Remove the group from the list
        setGroups(prevGroups => prevGroups.filter(group => group.id !== groupToLeave.id));
        setShowLeaveModal(false);
        setGroupToLeave(null);
        
        // Hiển thị thông báo thành công
        console.log('Successfully left group');
      } else {
        // Hiển thị thông báo lỗi cụ thể từ server
        const errorMessage = response.message || 'Không thể rời nhóm. Vui lòng thử lại sau.';
        console.error("Error leaving group:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Exception when leaving group:", err);
      if (isComponentMounted.current) {
        setError('Có lỗi xảy ra khi rời nhóm. Vui lòng thử lại sau.');
      }
    } finally {
      if (isComponentMounted.current) {
        setLeaveLoading(false);
      }
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

  if (loading && groups.length === 0) {
    return <div className="text-center py-4"><Spinner animation="border" /></div>;
  }

  if (error && groups.length === 0) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (groups.length === 0 && !loading) {
    return (
      <Card className="text-center p-4">
        <Card.Body>
          <BsInfoCircle className="text-muted mb-3" size={30} />
          <h5>Bạn chưa tham gia nhóm nào</h5>
          <p className="text-muted">Tham gia các nhóm để chia sẻ và trao đổi tài liệu với những người khác.</p>
          <Button as={Link} to="/unishare/groups" variant="primary">
            Khám phá nhóm
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="current-groups-container">
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      {loading && groups.length > 0 && (
        <div className="text-center py-2 mb-3"><Spinner animation="border" size="sm" /></div>
      )}
      
      <Row xs={1} md={1} className="g-4">
        {groups.map((group) => (
          <Col key={group.id}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-3">
                <Row className="align-items-center">
                  <Col md={5} xs={12} className="mb-3 mb-md-0">
                    <div className="d-flex align-items-center mb-2">
                      <Image 
                        src={group.avatar || defaultAvatar} 
                        roundedCircle 
                        width={40} 
                        height={40} 
                        className="me-2" 
                        style={{ objectFit: 'cover' }}
                      />
                      <div>
                        <Card.Title as="h6" className="mb-0" style={{color: '#0056b3', fontWeight: 'bold'}}>
                          {group.name}
                        </Card.Title>
                        <div className="d-flex align-items-center text-muted">
                          <BsPeopleFill className="me-1" size={14} />
                          <small>{group.member_count || 0} thành viên</small>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center flex-wrap gap-1 mb-2">
                      <Badge bg={group.type === 'course' ? 'primary' : (group.type === 'university' ? 'success' : 'info')}>
                        {group.type === 'course' ? 'Khóa học' : (group.type === 'university' ? 'Trường đại học' : 'Sở thích')}
                      </Badge>
                      {group.role && (
                        <Badge bg={group.role === 'admin' ? 'danger' : (group.role === 'moderator' ? 'warning' : 'secondary')}>
                          {group.role === 'admin' ? 'Quản trị viên' : (group.role === 'moderator' ? 'Điều hành viên' : 'Thành viên')}
                        </Badge>
                      )}
                    </div>
                    {group.course_code && (
                      <small className="text-muted d-block">Mã học phần: {group.course_code}</small>
                    )}
                    {group.description && (
                      <small className="text-muted d-block text-truncate" style={{maxWidth: '100%'}}>
                        {group.description.length > 60 ? group.description.substring(0, 60) + '...' : group.description}
                      </small>
                    )}
                  </Col>
                  <Col md={4} xs={12} className="d-flex align-items-center mb-3 mb-md-0">
                    {group.creator && (
                      <div className="d-flex align-items-center">
                        <Image 
                          src={group.creator.avatar || defaultAvatar} 
                          roundedCircle 
                          width={36} 
                          height={36} 
                          className="me-2" 
                          style={{ objectFit: 'cover' }}
                        />
                        <div>
                          <small className="d-block text-muted" style={{fontSize: '0.8rem'}}>
                            {group.type === 'course' ? 'Giảng viên:' : 'Người tạo:'}
                          </small>
                          <Link to={`/profile/${group.creator.id}`} className="small fw-bold text-decoration-none" style={{fontSize: '0.9rem'}}>
                            {group.creator.name}
                          </Link>
                        </div>
                      </div>
                    )}
                  </Col>
                  <Col md={3} xs={12} className="text-md-end">
                    <div className="d-flex flex-column flex-md-row gap-2 justify-content-md-end">
                      <Button 
                        as={Link}
                        to={`/unishare/groups/${group.id}`} 
                        variant="primary" 
                        size="sm" 
                        className="d-flex align-items-center justify-content-center"
                      >
                        <BsInfoCircle className="me-1" />
                        <span>Chi tiết</span>
                      </Button>
                      {groupChatUrls[group.id] && (
                        <Button 
                          as={Link}
                          to={groupChatUrls[group.id]} 
                          variant="outline-primary" 
                          size="sm" 
                          className="d-flex align-items-center justify-content-center"
                        >
                          <BsChatDots className="me-1" />
                          <span>Trò chuyện</span>
                        </Button>
                      )}
                      {group.role !== 'admin' && (
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          className="d-flex align-items-center justify-content-center"
                          onClick={() => handleLeaveGroup(group.id)}
                        >
                          <span>Rời nhóm</span>
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              {group.joined_at && (
                <Card.Footer className="bg-white text-muted py-1">
                  <small className="d-flex align-items-center">
                    <BsCalendarEvent className="me-1" />
                    Tham gia: {new Date(group.joined_at).toLocaleDateString('vi-VN')}
                  </small>
                </Card.Footer>
              )}
            </Card>
          </Col>
        ))}
      </Row>
      
      {renderPagination()}
      
      <Modal show={showLeaveModal} onHide={() => setShowLeaveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận rời nhóm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn rời khỏi nhóm "{groupToLeave?.name}"?</p>
          <p className="text-muted small">Lưu ý: Sau khi rời nhóm, bạn sẽ không thể truy cập vào nội dung và tài liệu của nhóm nữa. Nếu đây là nhóm kín, bạn có thể cần được duyệt lại nếu muốn tham gia lại sau này.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLeaveModal(false)} disabled={leaveLoading}>
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmLeaveGroup} disabled={leaveLoading}>
            {leaveLoading ? <><Spinner as="span" animation="border" size="sm" /> Đang xử lý...</> : 'Rời nhóm'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CurrentGroups;
