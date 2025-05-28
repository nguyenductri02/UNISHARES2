import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Nav, Spinner, Alert, Badge, Dropdown } from 'react-bootstrap';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GroupHeader from '../components/groups/GroupHeader';
import GroupMembers from '../components/groups/GroupMembers';
import GroupPosts from '../components/groups/GroupPosts';
import { profileService, authService, reportService } from '../services';
import { BsArrowLeft, BsInfoCircle, BsPeople, BsChatDots, BsCalendar3, BsChevronLeft, BsShare, BsThreeDots, BsExclamationTriangle } from 'react-icons/bs';
import ReportModal from '../components/common/ReportModal';

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);

  // Get current user on component mount
  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, []);

  // Fetch group details whenever groupId or refreshKey changes
  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId, refreshKey]);

  // Fetch group details from the API
  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await profileService.getGroupDetails(groupId);
      
      if (response.success) {
        setGroup(response.data);
        
        // Check membership status from response
        const memberStatus = 
          response.data.is_member === true || 
          (response.data.role && ['admin', 'moderator', 'member'].includes(response.data.role));
        
        setIsMember(memberStatus);
        
        // Check admin status from response
        const adminStatus = 
          response.data.is_admin === true || 
          (response.data.role && ['admin', 'moderator'].includes(response.data.role));
        
        setIsAdmin(adminStatus);
      } else {
        throw new Error(response.message || 'Failed to load group details');
      }
    } catch (err) {
      console.error('Error fetching group details:', err);
      setError('Could not load group details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle group join status changes
  const handleJoinGroup = async (joined, pendingApproval = false) => {
    if (joined) {
      setIsMember(true);
      refreshGroup();
    } else if (pendingApproval) {
      // Show some UI feedback for pending approval
      alert("Yêu cầu tham gia đã được gửi và đang chờ duyệt");
    }
  };

  // Refresh the group data
  const refreshGroup = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle group report
  const handleReportSubmit = async (reportData) => {
    try {
      const response = await reportService.reportGroup(groupId, reportData);
      return response;
    } catch (error) {
      console.error('Error reporting group:', error);
      return {
        success: false,
        message: 'Không thể gửi báo cáo. Vui lòng thử lại sau.'
      };
    }
  };

  // Loading state with enhanced modern UI
  if (loading) {
    return (
      <>
        <Header />
        <div className="py-5 loading-background min-vh-100 d-flex align-items-center justify-content-center">
          <Container>
            <div className="text-center loading-animation">
              <div className="loading-pulse mb-4">
                <div className="spinner-container">
                  <div className="spinner-grow text-primary spinner-grow-lg" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div className="spinner-grow text-info spinner-grow-sm delay-1" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div className="spinner-grow text-success spinner-grow-sm delay-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
              <h3 className="loading-title mb-3">Đang tải thông tin nhóm</h3>
              <p className="text-muted mb-4">Vui lòng đợi trong giây lát...</p>
              <div className="progress-container">
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar progress-bar-striped progress-bar-animated" 
                       role="progressbar" 
                       style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </Container>
          
          <style jsx="true">{`
            .loading-background {
              background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
              position: relative;
            }
            
            .loading-background::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
              pointer-events: none;
            }
            
            .loading-animation {
              background: white;
              border-radius: 20px;
              padding: 3rem;
              box-shadow: 0 15px 50px rgba(0, 0, 0, 0.1);
              max-width: 500px;
              margin: 0 auto;
              position: relative;
              overflow: hidden;
            }
            
            .loading-animation::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 6px;
              background: linear-gradient(90deg, #0d6efd, #6610f2, #0dcaf0, #20c997);
              background-size: 300% 100%;
              animation: gradient-move 2s linear infinite;
            }
            
            @keyframes gradient-move {
              0% {
                background-position: 0% 50%;
              }
              100% {
                background-position: 100% 50%;
              }
            }
            
            .spinner-container {
              position: relative;
              width: 80px;
              height: 80px;
              margin: 0 auto;
            }
            
            .spinner-grow-lg {
              width: 3.5rem;
              height: 3.5rem;
              position: absolute;
              top: 50%;
              left: 50%;
              margin-top: -1.75rem;
              margin-left: -1.75rem;
              z-index: 3;
            }
            
            .spinner-grow-sm {
              width: 1.5rem;
              height: 1.5rem;
              position: absolute;
              z-index: 2;
            }
            
            .delay-1 {
              top: 15%;
              left: 20%;
              animation-delay: 0.2s;
            }
            
            .delay-2 {
              top: 15%;
              right: 20%;
              animation-delay: 0.4s;
            }
            
            .loading-title {
              font-weight: 700;
              margin-top: 1rem;
              background: linear-gradient(90deg, #0d6efd, #6610f2);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              display: inline-block;
            }
            
            .progress-container {
              max-width: 300px;
              margin: 0 auto;
            }
            
            .progress {
              border-radius: 10px;
              overflow: hidden;
              background-color: #e9ecef;
              box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .progress-bar {
              background: linear-gradient(90deg, #0d6efd, #6610f2, #0dcaf0, #20c997);
              background-size: 300% 100%;
              animation: gradient-move 2s linear infinite;
            }
          `}</style>
        </div>
        <Footer />
      </>
    );
  }

  // Error state with enhanced modern UI
  if (error) {
    return (
      <>
        <Header />
        <div className="py-5 error-background min-vh-100 d-flex align-items-center justify-content-center">
          <Container>
            <Card className="border-0 shadow-lg mx-auto error-card" style={{ maxWidth: '600px' }}>
              <Card.Body className="p-5 text-center">
                <div className="error-icon-container mb-4">
                  <div className="error-icon-circle bg-danger bg-opacity-10 d-inline-flex align-items-center justify-content-center">
                    <BsInfoCircle className="display-1 text-danger" />
                  </div>
                </div>
                <h2 className="error-title mb-3">Đã xảy ra lỗi</h2>
                <p className="text-muted mb-4 fs-5">{error}</p>
                <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
                  <Button as={Link} to="/groups" variant="primary" size="lg" className="px-4 py-2 rounded-pill back-button">
                    <BsChevronLeft className="me-2" /> Quay lại danh sách nhóm
                  </Button>
                  <Button onClick={() => window.location.reload()} variant="outline-secondary" size="lg" className="px-4 py-2 rounded-pill retry-button">
                    <i className="fas fa-sync-alt me-2"></i> Thử lại
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Container>
          
          <style jsx="true">{`
            .error-background {
              background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
              position: relative;
            }
            
            .error-background::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
              pointer-events: none;
            }
            
            .error-card {
              border-radius: 24px !important;
              overflow: hidden;
              transition: all 0.4s ease;
              border: none !important;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1) !important;
              background: white;
              position: relative;
            }
            
            .error-card::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 6px;
              background: linear-gradient(90deg, #dc3545, #fd7e14);
            }
            
            .error-card:hover {
              transform: translateY(-10px);
              box-shadow: 0 30px 70px rgba(0, 0, 0, 0.15) !important;
            }
            
            .error-icon-circle {
              width: 160px;
              height: 160px;
              border-radius: 80px;
              transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              box-shadow: 0 10px 30px rgba(220, 53, 69, 0.2);
              animation: pulse-error 2s infinite;
            }
            
            @keyframes pulse-error {
              0% {
                box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4);
              }
              70% {
                box-shadow: 0 0 0 15px rgba(220, 53, 69, 0);
              }
              100% {
                box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
              }
            }
            
            .error-card:hover .error-icon-circle {
              transform: scale(1.1) rotate(5deg);
            }
            
            .error-title {
              font-weight: 800;
              color: #dc3545;
              font-size: 2.2rem;
            }
            
            .back-button, .retry-button {
              font-weight: 600;
              letter-spacing: 0.5px;
              transition: all 0.3s ease;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            }
            
            .back-button:hover, .retry-button:hover {
              transform: translateY(-3px);
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            }
          `}</style>
        </div>
        <Footer />
      </>
    );
  }

  // Group not found state with enhanced modern UI
  if (!group) {
    return (
      <>
        <Header />
        <div className="py-5 not-found-background min-vh-100 d-flex align-items-center justify-content-center">
          <Container>
            <Card className="border-0 shadow-lg mx-auto not-found-card" style={{ maxWidth: '600px' }}>
              <Card.Body className="p-5 text-center">
                <div className="not-found-icon-container mb-4">
                  <div className="not-found-icon-circle bg-warning bg-opacity-10 d-inline-flex align-items-center justify-content-center">
                    <BsInfoCircle className="display-1 text-warning" />
                  </div>
                </div>
                <h2 className="not-found-title mb-3">Không tìm thấy nhóm</h2>
                <p className="text-muted mb-4 fs-5">Nhóm này có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
                <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
                  <Button as={Link} to="/groups" variant="primary" size="lg" className="px-4 py-2 rounded-pill back-button">
                    <BsChevronLeft className="me-2" /> Quay lại danh sách nhóm
                  </Button>
                  <Button as={Link} to="/groups/discover" variant="outline-primary" size="lg" className="px-4 py-2 rounded-pill discover-button">
                    <i className="fas fa-compass me-2"></i> Khám phá nhóm khác
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Container>
          
          <style jsx="true">{`
            .not-found-background {
              background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
              position: relative;
            }
            
            .not-found-background::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
              pointer-events: none;
            }
            
            .not-found-card {
              border-radius: 24px !important;
              overflow: hidden;
              transition: all 0.4s ease;
              border: none !important;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1) !important;
              background: white;
              position: relative;
            }
            
            .not-found-card::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 6px;
              background: linear-gradient(90deg, #ffc107, #fd7e14);
            }
            
            .not-found-card:hover {
              transform: translateY(-10px);
              box-shadow: 0 30px 70px rgba(0, 0, 0, 0.15) !important;
            }
            
            .not-found-icon-circle {
              width: 160px;
              height: 160px;
              border-radius: 80px;
              transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              box-shadow: 0 10px 30px rgba(255, 193, 7, 0.2);
              animation: pulse-warning 2s infinite;
            }
            
            @keyframes pulse-warning {
              0% {
                box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.4);
              }
              70% {
                box-shadow: 0 0 0 15px rgba(255, 193, 7, 0);
              }
              100% {
                box-shadow: 0 0 0 0 rgba(255, 193, 7, 0);
              }
            }
            
            .not-found-card:hover .not-found-icon-circle {
              transform: scale(1.1) rotate(-5deg);
            }
            
            .not-found-title {
              font-weight: 800;
              color: #ffc107;
              font-size: 2.2rem;
            }
            
            .back-button, .discover-button {
              font-weight: 600;
              letter-spacing: 0.5px;
              transition: all 0.3s ease;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            }
            
            .back-button:hover, .discover-button:hover {
              transform: translateY(-3px);
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            }
          `}</style>
        </div>
        <Footer />
      </>
    );
  }

  // Main content with modern UI
  return (
    <>
      <Header />
      <div className="group-detail-page bg-light pb-5">
        {/* Enhanced navigation bar */}
        <div className="bg-white border-bottom py-3 navigation-bar">
          <Container>
            <div className="d-flex align-items-center">
              <Link to="/unishare" className="text-decoration-none d-flex align-items-center back-link">
                <BsChevronLeft className="me-2" /> 
                <span className="d-none d-sm-inline">Danh sách nhóm</span>
                <span className="d-inline d-sm-none">Quay lại</span>
              </Link>
              
              <div className="breadcrumb-divider mx-3">
                <span>/</span>
              </div>
              
              <div className="group-name-badge">
                <span className="text-truncate">{group.name}</span>
              </div>
              
              {/* Add dropdown with report option */}
              <div className="ms-auto d-flex align-items-center">
                
                {/* Share button with enhanced styling */}
                <Button 
                  variant="light" 
                  className="d-flex align-items-center share-button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: group.name,
                        text: group.description || 'Tham gia nhóm với tôi!',
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Đã sao chép liên kết vào clipboard!');
                    }
                  }}
                >
                  <BsShare className="me-2" /> 
                  <span className="d-none d-md-inline">Chia sẻ nhóm</span>
                  <span className="d-inline d-md-none">Chia sẻ</span>
                </Button>
              </div>
            </div>
          </Container>
          
          <style jsx="true">{`
            .navigation-bar {
              box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
            }
            
            .back-link {
              color: #495057;
              font-weight: 500;
              transition: all 0.3s ease;
              padding: 0.5rem 0.75rem;
              border-radius: 20px;
            }
            
            .back-link:hover {
              color: #0d6efd;
              background-color: rgba(13, 110, 253, 0.05);
              transform: translateX(-3px);
            }
            
            .breadcrumb-divider {
              color: #adb5bd;
              font-weight: 300;
            }
            
            .group-name-badge {
              background-color: #f8f9fa;
              padding: 0.5rem 1rem;
              border-radius: 20px;
              font-weight: 500;
              color: #495057;
              max-width: 250px;
              overflow: hidden;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
              border: 1px solid #e9ecef;
              transition: all 0.3s ease;
            }
            
            .group-name-badge:hover {
              background-color: #e9ecef;
              transform: translateY(-2px);
            }
            
            .share-button {
              border-radius: 20px;
              padding: 0.5rem 1rem;
              font-weight: 500;
              transition: all 0.3s ease;
              border: 1px solid #e9ecef;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
            }
            
            .share-button:hover {
              background-color: #f8f9fa;
              transform: translateY(-2px);
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
            }
            
            .action-button {
              width: 38px;
              height: 38px;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s ease;
            }
            
            .action-button:hover {
              background-color: #f0f0f0;
              transform: rotate(90deg);
            }
            
            .action-button::after {
              display: none !important;
            }
            
            @media (max-width: 576px) {
              .group-name-badge {
                max-width: 150px;
              }
            }
          `}</style>
        </div>
        
        {/* Group header section with improved styling */}
        <GroupHeader 
          group={group} 
          isMember={isMember} 
          isAdmin={isAdmin} 
          onJoinGroup={handleJoinGroup}
          onRefresh={refreshGroup}
        />
        
        <Container className="mt-n5">
          {/* Group quick stats */}
          <div className="group-stats-bar mb-4">
            <Row className="g-3">
              <Col md={4}>
                <Card className="border-0 shadow-sm h-100 stat-card">
                  <Card.Body className="d-flex align-items-center">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3 stat-icon">
                      <BsPeople className="text-primary fs-4" />
                    </div>
                    <div>
                      <h6 className="mb-0 text-muted">Thành viên</h6>
                      <h4 className="mb-0 fw-bold">{group.member_count || 0}</h4>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4}>
                <Card className="border-0 shadow-sm h-100 stat-card">
                  <Card.Body className="d-flex align-items-center">
                    <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3 stat-icon">
                      <BsChatDots className="text-success fs-4" />
                    </div>
                    <div>
                      <h6 className="mb-0 text-muted">Loại nhóm</h6>
                      <h4 className="mb-0 fw-bold">
                        {group.type === 'course' ? 'Khóa học' : 
                         group.type === 'university' ? 'Trường đại học' : 'Sở thích'}
                      </h4>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4}>
                <Card className="border-0 shadow-sm h-100 stat-card">
                  <Card.Body className="d-flex align-items-center">
                    <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3 stat-icon">
                      <BsCalendar3 className="text-info fs-4" />
                    </div>
                    <div>
                      <h6 className="mb-0 text-muted">Ngày tạo</h6>
                      <h4 className="mb-0 fw-bold">
                        {group.created_at ? new Date(group.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                      </h4>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
          
          {/* Main content area with tabs */}
          <Card className="border-0 shadow content-card">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
              <Nav 
                variant="tabs" 
                activeKey={activeTab} 
                onSelect={handleTabChange}
                className="nav-tabs-modern"
              >
                <Nav.Item>
                  <Nav.Link 
                    eventKey="posts" 
                    className="px-4 py-3 rounded-top tab-link posts-tab"
                  >
                    <div className="d-flex align-items-center">
                      <BsChatDots className="me-2 posts-icon" />
                      <span className="me-2">Bài viết</span>
                      {group.post_count > 0 && (
                        <Badge pill bg="primary" className="posts-badge">{group.post_count}</Badge>
                      )}
                    </div>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="members" 
                    className="px-4 py-3 rounded-top tab-link members-tab"
                  >
                    <div className="d-flex align-items-center">
                      <BsPeople className="me-2 members-icon" />
                      <span className="me-2">Thành viên</span>
                      <Badge pill bg="primary" className="members-badge">{group.member_count || 0}</Badge>
                    </div>
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>
            
            <Card.Body className="p-4">
              {activeTab === 'posts' && (
                <GroupPosts 
                  groupId={group.id} 
                  isMember={isMember} 
                  onPostCreated={refreshGroup}
                />
              )}
              
              {activeTab === 'members' && (
                <GroupMembers 
                  groupId={group.id} 
                  isAdmin={isAdmin} 
                  currentUser={user}
                />
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
      
      {/* Report Group Modal */}
      <ReportModal
        show={showReportModal}
        onHide={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
        title="Báo cáo nhóm"
        entityName={group?.name}
        entityType="nhóm"
      />
      
      {/* Add custom CSS for the page */}
      <style jsx="true">{`
        /* Main page styling */
        .group-detail-page {
          min-height: calc(100vh - 200px);
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
          position: relative;
        }
        
        .group-detail-page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }
        
        /* Navigation bar styling */
        .bg-white.border-bottom {
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
          position: relative;
          z-index: 10;
        }
        
        .bg-white.border-bottom .text-decoration-none {
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .bg-white.border-bottom .text-decoration-none:hover {
          color: #0d6efd !important;
          transform: translateX(-2px);
        }
        
        .bg-white.border-bottom .btn-light {
          border-radius: 20px;
          padding: 0.25rem 0.75rem;
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
        }
        
        .bg-white.border-bottom .btn-light:hover {
          background-color: #f8f9fa;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }
        
        /* Group header styling */
        .group-header {
          border: none !important;
          border-radius: 16px !important;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.3s ease;
          transform: translateY(0);
          margin-top: 20px;
        }
        
        .group-header:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15) !important;
        }
        
        .group-cover {
          position: relative;
          overflow: hidden;
        }
        
        .group-cover::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 50%;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
          z-index: 1;
        }
        
        .group-cover .btn-light {
          z-index: 2;
          border-radius: 20px;
          font-weight: 500;
          padding: 0.4rem 1rem;
          transition: all 0.3s ease;
          border: none;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        
        .group-cover .btn-light:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
        }
        
        .group-header h3 {
          font-weight: 700;
          background: linear-gradient(90deg, #0d6efd, #6610f2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline;
        }
        
        .group-description {
          line-height: 1.6;
          color: #495057;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 3px solid #0d6efd;
        }
        
        /* Stats cards styling */
        .group-stats-bar {
          position: relative;
          z-index: 5;
        }
        
        .stat-card {
          border-radius: 16px !important;
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          overflow: hidden;
          background: white;
          position: relative;
        }
        
        .stat-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
          z-index: 1;
          pointer-events: none;
        }
        
        .stat-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1) !important;
        }
        
        .stat-card:hover .stat-icon {
          transform: scale(1.2) rotate(10deg);
        }
        
        .stat-icon {
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .stat-card h6 {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-card h4 {
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        /* Modern tab styling */
        .nav-tabs-modern {
          border-bottom: none;
          gap: 15px;
          padding: 0 10px;
        }
        
        .nav-tabs-modern .nav-item {
          position: relative;
          z-index: 1;
          flex: 1;
          max-width: 200px;
        }
        
        .nav-tabs-modern .nav-link {
          border: none;
          font-weight: 600;
          color: #6c757d;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
          border-radius: 12px 12px 0 0;
          text-align: center;
          padding: 1rem 1.5rem;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.03);
        }
        
        .nav-tabs-modern .nav-link:hover {
          color: #0d6efd;
          background-color: rgba(13, 110, 253, 0.05);
          transform: translateY(-5px);
        }
        
        .nav-tabs-modern .nav-link.active {
          color: #0d6efd;
          background-color: #fff;
          border-top: 4px solid #0d6efd;
          border-left: 1px solid #dee2e6;
          border-right: 1px solid #dee2e6;
          border-bottom: none;
          transform: translateY(-8px);
          box-shadow: 0 -8px 20px rgba(0, 0, 0, 0.08);
        }
        
        .nav-tabs-modern .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background-color: #fff;
          z-index: 1;
        }
        
        /* Badge animation */
        .pulse-badge {
          animation: pulse-animation 2s infinite;
        }
        
        @keyframes pulse-animation {
          0% {
            box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.7);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(13, 110, 253, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(13, 110, 253, 0);
          }
        }
        
        /* Enhanced badge animations */
        .members-badge, .posts-badge {
          position: relative;
          overflow: hidden;
          padding: 0.35em 0.8em;
          font-size: 0.85em;
          font-weight: 600;
          letter-spacing: 0.5px;
          border: none;
        }
        
        .members-badge::after, .posts-badge::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(30deg);
          animation: shine-animation 3s infinite;
        }
        
        @keyframes shine-animation {
          0% {
            transform: rotate(30deg) translateX(-150%);
          }
          30%, 100% {
            transform: rotate(30deg) translateX(150%);
          }
        }
        
        /* Content card styling */
        .content-card {
          border-radius: 16px !important;
          overflow: hidden;
          transition: all 0.4s ease;
          border: none !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
          margin-bottom: 30px;
        }
        
        .content-card:hover {
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12) !important;
          transform: translateY(-5px);
        }
        
        .content-card .card-header {
          padding-top: 1.5rem;
          border-bottom: none;
        }
        
        .content-card .card-body {
          padding: 1.5rem;
        }
        
        /* Loading animation */
        .loading-animation {
          padding: 3rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }
        
        .loading-animation .loading-pulse {
          animation: scale-animation 1.5s infinite;
        }
        
        @keyframes scale-animation {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }
        
        .loading-animation h4 {
          font-size: 1.5rem;
          margin-top: 1.5rem;
          background: linear-gradient(90deg, #0d6efd, #6610f2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .loading-animation .progress {
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          background-color: #e9ecef;
        }
        
        .loading-animation .progress-bar {
          background: linear-gradient(90deg, #0d6efd, #6610f2);
        }
        
        /* Error and not found cards */
        .error-card, .not-found-card {
          border-radius: 20px !important;
          overflow: hidden;
          transition: all 0.4s ease;
          border: none !important;
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.1) !important;
        }
        
        .error-card:hover, .not-found-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
        }
        
        .error-icon-circle, .not-found-icon-circle {
          width: 140px;
          height: 140px;
          border-radius: 70px;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .error-card:hover .error-icon-circle, 
        .not-found-card:hover .not-found-icon-circle {
          transform: scale(1.1) rotate(5deg);
        }
        
        .error-card .btn, .not-found-card .btn {
          padding: 0.6rem 1.5rem;
          font-weight: 500;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
        }
        
        .error-card .btn:hover, .not-found-card .btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        /* Members tab styling */
        .members-tab {
          position: relative;
          overflow: hidden;
        }
        
        .members-tab:hover {
          background: linear-gradient(135deg, rgba(13, 110, 253, 0.05), rgba(13, 110, 253, 0.1));
        }
        
        .members-tab.active {
          background: linear-gradient(135deg, #ffffff, #f8f9fa);
          border-top: 4px solid #0d6efd !important;
          box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.08);
        }
        
        .members-tab.active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, #0d6efd, #6610f2);
        }
        
        .members-icon {
          font-size: 1.3rem;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .members-tab:hover .members-icon {
          transform: scale(1.3) rotate(10deg);
        }
        
        .members-badge {
          background: linear-gradient(135deg, #0d6efd, #6610f2);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 8px rgba(13, 110, 253, 0.3);
          animation: pulse-animation 2s infinite;
        }
        
        .members-tab:hover .members-badge {
          transform: scale(1.2) rotate(-5deg);
        }
        
        /* Posts tab styling */
        .posts-tab {
          position: relative;
          overflow: hidden;
        }
        
        .posts-tab:hover {
          background: linear-gradient(135deg, rgba(40, 167, 69, 0.05), rgba(40, 167, 69, 0.1));
        }
        
        .posts-tab.active {
          background: linear-gradient(135deg, #ffffff, #f8f9fa);
          border-top: 4px solid #28a745 !important;
          box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.08);
        }
        
        .posts-tab.active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, #28a745, #20c997);
        }
        
        .posts-icon {
          font-size: 1.3rem;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .posts-tab:hover .posts-icon {
          transform: scale(1.3) rotate(-10deg);
        }
        
        .posts-badge {
          background: linear-gradient(135deg, #28a745, #20c997);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
          animation: pulse-animation 2s infinite;
        }
        
        .posts-tab:hover .posts-badge {
          transform: scale(1.2) rotate(5deg);
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .nav-tabs-modern {
            gap: 5px;
          }
          
          .nav-tabs-modern .nav-link {
            padding: 0.75rem 1rem;
          }
          
          .stat-card {
            margin-bottom: 15px;
          }
          
          .group-header h3 {
            font-size: 1.5rem;
          }
          
          .error-icon-circle, .not-found-icon-circle {
            width: 100px;
            height: 100px;
          }
        }
      `}</style>
      
      <Footer />
    </>
  );
};

export default GroupDetailPage;
