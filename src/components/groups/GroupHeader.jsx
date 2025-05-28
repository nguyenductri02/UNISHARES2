import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Spinner, Alert, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { BsPeopleFill, BsChatDots, BsCalendar3, BsBook, BsDoorOpen, BsExclamationTriangle, BsThreeDotsVertical } from 'react-icons/bs';
import defaultAvatar from '../../assets/avatar-1.png';
import { profileService, groupService, reportService, chatService } from '../../services';
import LeaveGroupModal from './LeaveGroupModal';
import ReportModal from '../common/ReportModal';

const GroupHeader = ({ group, isMember, isAdmin, onJoinGroup, onRefresh }) => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);  const [joinError, setJoinError] = useState('');
  const [joinRequestPending, setJoinRequestPending] = useState(false);
  const [isGroupReported, setIsGroupReported] = useState(false); // New state for report status
  const [creatingGroupChat, setCreatingGroupChat] = useState(false);
  const navigate = useNavigate();

  // Handle group chat creation and navigation
  const handleGroupChat = async () => {
    try {
      setCreatingGroupChat(true);
      const response = await chatService.getGroupChat(group.id);
      
      if (response.success) {
        navigate(`/unishare/chats/${response.data.id}`);
      } else {
        console.error('Failed to get group chat:', response.message);
      }
    } catch (error) {
      console.error('Error creating/getting group chat:', error);
    } finally {
      setCreatingGroupChat(false);
    }
  };
  
  // Use a fallback cover style instead of requiring an image file
  const defaultCoverStyle = {
    backgroundColor: '#6c757d',
    backgroundImage: 'linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)'
  };

  // Check for pending join requests when component mounts
  useEffect(() => {
    if (group && group.id && !isMember) {
      checkJoinRequestStatus();
    }
  }, [group, isMember]);

  // Check if the user has a pending join request
  const checkJoinRequestStatus = async () => {
    try {
      const response = await groupService.checkJoinRequestStatus(group.id);
      if (response.success && response.data.status === 'pending') {
        setJoinRequestPending(true);
      }
    } catch (error) {
      console.error("Error checking join request status:", error);
    }
  };

  const handleJoinGroup = async () => {
    if (!group) return;
    
    try {
      setJoinError('');
      setJoiningGroup(true);
      
      const response = await groupService.joinGroup(group.id);      if (response.success) {
        console.log("Successfully joined group:", response.message);
        setShowJoinModal(false);
        
        // If the join was successful without pending
        if (response.data?.status === 'approved' || (response.message && response.message.includes('successfully'))) {
          if (onJoinGroup) onJoinGroup(true);
        } else {
          // A join request was sent (for private groups)
          setJoinRequestPending(true);
          if (onJoinGroup) onJoinGroup(false, true);
        }
      } else {
        // Handle error response without throwing
        console.error("Error joining group:", response.message);
        setJoinError(response.message || 'Không thể tham gia nhóm. Vui lòng thử lại sau.');
      }
    } catch (err) {
      // This will only catch unexpected errors that weren't handled by the service
      console.error("Unexpected error joining group:", err);
      setJoinError('Không thể tham gia nhóm. Vui lòng thử lại sau.');
    } finally {
      setJoiningGroup(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      setLeavingGroup(true);
      
      const response = await groupService.leaveGroup(group.id);
      
      if (response.success) {
        setShowLeaveModal(false);
        
        // Notify parent component to refresh
        if (onRefresh) onRefresh();
      } else {
        throw new Error(response.message || 'Không thể rời nhóm');
      }
    } catch (err) {
      console.error("Error leaving group:", err);
      alert(`Lỗi: ${err.message || 'Không thể rời nhóm'}`);
    } finally {
      setLeavingGroup(false);
    }
  };

  const handleReportSubmit = async (reportData) => {
    try {
      const response = await reportService.reportGroup(group.id, reportData);
      if (response.success) {
        setIsGroupReported(true); // Set reported status on success
      }
      return response;
    } catch (error) {
      console.error("Error reporting group:", error);
      return {
        success: false,
        message: 'Không thể gửi báo cáo. Vui lòng thử lại sau.'
      };
    }
  };

  if (!group) {
    return null;
  }

  return (
    <>
      <Card className="mb-4 group-header shadow" style={{ width: '70%', margin: 'auto' }}>
        <div 
          className="group-cover position-relative"
          style={{
            height: '250px',
            ...(group.cover_image ? 
              { backgroundImage: `url(${group.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : 
              defaultCoverStyle),
            borderTopLeftRadius: 'calc(0.375rem - 1px)',
            borderTopRightRadius: 'calc(0.375rem - 1px)',
          }}
        >
          {isAdmin && (
            <Button
              variant="light"
              size="sm"
              className="position-absolute top-0 end-0 m-3 edit-group-btn"
              as={Link}
              to={`/unishare/groups/${group.id}/edit`}
            >
              <i className="fas fa-edit me-1"></i> Chỉnh sửa nhóm
            </Button>
          )}
          
          {!isAdmin && (
            <Dropdown className="position-absolute top-0 end-0 m-3">
              <Dropdown.Toggle variant="light" size="sm" id="group-options-dropdown" className="no-arrow">
                <BsThreeDotsVertical />
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item 
                  onClick={() => !isGroupReported && setShowReportModal(true)} 
                  disabled={isGroupReported}
                >
                  <BsExclamationTriangle className={`me-2 ${isGroupReported ? 'text-muted' : 'text-danger'}`} />
                  {isGroupReported ? 'Đã báo cáo' : 'Báo cáo nhóm'}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
          
          <div className="group-cover-overlay"></div>
          
          <div className="position-absolute bottom-0 start-0 p-4 text-white z-index-1">
            <Badge 
              bg={group.is_private ? 'secondary' : 'success'}
              className="mb-2 group-privacy-badge"
            >
              {group.is_private ? 'Nhóm kín' : 'Nhóm công khai'}
            </Badge>
            
            {group.type === 'course' ? (
              <Badge bg="primary" className="ms-2 mb-2 group-type-badge">Khóa học</Badge>
            ) : group.type === 'university' ? (
              <Badge bg="info" className="ms-2 mb-2 group-type-badge">Trường đại học</Badge>
            ) : (
              <Badge bg="secondary" className="ms-2 mb-2 group-type-badge">Sở thích</Badge>
            )}
          </div>
        </div>
        
        <Card.Body className="p-4">
          <Row>
            <Col lg={8} className="d-flex flex-column mb-3">
              <div className="d-flex align-items-center mb-3">
                <h2 className="group-title mb-0 me-2">{group.name}</h2>
              </div>
              
              <div className="d-flex align-items-center mb-3 group-stats">
                <div className="d-flex align-items-center me-4">
                  <div className="stats-icon-circle bg-primary bg-opacity-10 me-2">
                    <BsPeopleFill className="text-primary" />
                  </div>
                  <span>{group.member_count || 0} thành viên</span>
                </div>
                
                {group.type === 'course' && (
                  <div className="d-flex align-items-center">
                    <div className="stats-icon-circle bg-info bg-opacity-10 me-2">
                      <BsBook className="text-info" />
                    </div>
                    <span>{group.course_code || 'Không có mã môn học'}</span>
                  </div>
                )}
              </div>
              
              <div className="group-description my-3 p-3">
                <h5 className="description-title mb-2">Giới thiệu nhóm</h5>
                <p className="mb-0">{group.description || 'Không có mô tả'}</p>
              </div>
              
              {group.created_at && (
                <div className="text-muted mt-auto d-flex align-items-center">
                  <div className="stats-icon-circle bg-secondary bg-opacity-10 me-2">
                    <BsCalendar3 className="text-secondary" />
                  </div>
                  <span>Ngày tạo: {new Date(group.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
            </Col>
            
            <Col lg={4} className="d-flex flex-column align-items-end justify-content-between">
              <div className="group-actions mt-3 mt-lg-0 w-100">
                {!isMember ? (
                  joinRequestPending ? (
                    <Alert variant="info" className="p-3 mb-0 d-flex align-items-center pending-request-alert">
                      <BsExclamationTriangle className="me-2 fs-4" />
                      <div>
                        <strong>Đang chờ duyệt</strong>
                        <p className="mb-0 small">Yêu cầu tham gia của bạn đang được xem xét</p>
                      </div>
                    </Alert>
                  ) : (
                    <Button 
                      variant="primary"
                      onClick={() => setShowJoinModal(true)}
                      className="d-inline-flex align-items-center join-group-btn w-100 py-2"
                      size="lg"
                    >
                      <BsPeopleFill className="me-2" />
                      Tham gia nhóm
                    </Button>
                  )
                ) : (                  <div className="d-flex flex-column w-100 gap-2">
                    <Button 
                      variant="primary"
                      onClick={handleGroupChat}
                      disabled={creatingGroupChat}
                      className="d-inline-flex align-items-center justify-content-center chat-btn py-2"
                      size="lg"
                    >
                      {creatingGroupChat ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <BsChatDots className="me-2" />
                          Trò chuyện nhóm
                        </>
                      )}
                    </Button>
                    
                    {isAdmin ? (
                      <Button 
                        as={Link}
                        to={`/unishare/groups/${group.id}/members/manage`}
                        variant="outline-primary"
                        className="d-inline-flex align-items-center justify-content-center manage-members-btn py-2"
                        size="lg"
                      >
                        <BsPeopleFill className="me-2" />
                        Quản lý thành viên
                      </Button>
                    ) : (
                      <Button 
                        variant="outline-danger"
                        onClick={() => setShowLeaveModal(true)}
                        className="d-inline-flex align-items-center justify-content-center leave-group-btn py-2"
                        size="lg"
                      >
                        <BsDoorOpen className="me-2" />
                        Rời khỏi nhóm
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
        
        <style jsx="true">{`
          .group-cover-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 70%;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
            z-index: 1;
          }
          
          .z-index-1 {
            z-index: 2;
          }
          
          .group-title {
            font-weight: 800;
            font-size: 2rem;
            background: linear-gradient(90deg, #0d6efd, #6610f2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .group-privacy-badge, .group-type-badge {
            font-size: 0.85rem;
            padding: 0.5em 0.85em;
            border-radius: 20px;
            font-weight: 600;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
          }
          
          .group-privacy-badge:hover, .group-type-badge:hover {
            transform: translateY(-2px);
          }
          
          .stats-icon-circle {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          }
          
          .group-stats:hover .stats-icon-circle {
            transform: scale(1.1) rotate(10deg);
          }
          
          .group-description {
            background-color: #f8f9fa;
            border-radius: 12px;
            border-left: 4px solid #0d6efd;
            transition: all 0.3s ease;
          }
          
          .group-description:hover {
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            transform: translateX(5px);
          }
          
          .description-title {
            font-weight: 600;
            color: #0d6efd;
            font-size: 1.1rem;
          }
          
          .edit-group-btn {
            border-radius: 20px;
            font-weight: 500;
            padding: 0.4rem 1rem;
            transition: all 0.3s ease;
            border: none;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          }
          
          .edit-group-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
          }
          
          .join-group-btn, .chat-btn, .manage-members-btn, .leave-group-btn {
            border-radius: 10px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }
          
          .join-group-btn:hover, .chat-btn:hover, .manage-members-btn:hover, .leave-group-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
          }
          
          .pending-request-alert {
            border-radius: 10px;
            border-left: 4px solid #0dcaf0;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          }
          
          .no-arrow::after {
            display: none !important;
          }
        `}</style>
      </Card>
      
      {/* Leave Group Modal */}
      <LeaveGroupModal 
        show={showLeaveModal} 
        onHide={() => setShowLeaveModal(false)} 
        onConfirm={handleLeaveGroup} 
        groupName={group.name}
        isLoading={leavingGroup}
      />
      
      {/* Report Group Modal */}
      <ReportModal
        show={showReportModal}
        onHide={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
        title="Báo cáo nhóm"
        entityName={group.name}
        entityType="nhóm"
      />
      
      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="modal join-group-modal" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom-0 pb-0">
                <h4 className="modal-title fw-bold">Tham gia nhóm</h4>
                <button type="button" className="btn-close" onClick={() => setShowJoinModal(false)} disabled={joiningGroup}></button>
              </div>
              <div className="modal-body pt-2 pb-4 px-4">
                <div className="text-center mb-4">
                  <div className="join-icon-container mb-3">
                    <div className="join-icon-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center">
                      <BsPeopleFill className="display-4 text-primary" />
                    </div>
                  </div>
                  <h5 className="mb-3">Bạn muốn tham gia nhóm <strong className="text-primary">{group.name}</strong>?</h5>
                </div>
                
                {group.is_private && (
                  <div className="alert alert-info border-0 rounded-3 shadow-sm">
                    <div className="d-flex">
                      <div className="me-3">
                        <BsExclamationTriangle className="fs-4" />
                      </div>
                      <div>
                        <strong>Lưu ý:</strong> Đây là nhóm kín. Yêu cầu tham gia của bạn sẽ được gửi đến quản trị viên nhóm để duyệt.
                      </div>
                    </div>
                  </div>
                )}
                
                {joinError && (
                  <div className="alert alert-danger border-0 rounded-3 shadow-sm">
                    <div className="d-flex">
                      <div className="me-3">
                        <BsExclamationTriangle className="fs-4" />
                      </div>
                      <div>
                        {joinError}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button 
                  type="button" 
                  className="btn btn-light rounded-pill px-4 py-2" 
                  onClick={() => setShowJoinModal(false)} 
                  disabled={joiningGroup}
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary rounded-pill px-4 py-2 join-btn" 
                  onClick={handleJoinGroup} 
                  disabled={joiningGroup}
                >
                  {joiningGroup ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Đang xử lý...
                    </>
                  ) : group.is_private ? 'Gửi yêu cầu tham gia' : 'Tham gia ngay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx="true">{`
        .join-group-modal .modal-content {
          border-radius: 16px;
          overflow: hidden;
        }
        
        .join-icon-circle {
          width: 100px;
          height: 100px;
          border-radius: 50px;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .join-btn {
          box-shadow: 0 4px 10px rgba(13, 110, 253, 0.3);
          transition: all 0.3s ease;
        }
        
        .join-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(13, 110, 253, 0.4);
        }
      `}</style>
    </>
  );
};

export default GroupHeader;
