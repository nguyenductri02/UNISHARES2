import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Button, Table, Badge } from 'react-bootstrap';
import { FaBook, FaClock, FaCheck, FaTimesCircle, FaFlag, FaExclamationTriangle, FaChartBar, FaArrowRight } from 'react-icons/fa';
import { moderatorService } from '../../services/moderatorService';
import { Link } from 'react-router-dom';

const Dashboard = ({ user, stats: initialStats }) => {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(!initialStats);
  const [recentReports, setRecentReports] = useState([]);
  const [pendingReportsLoading, setPendingReportsLoading] = useState(true);

  useEffect(() => {
    // If stats were passed as prop, use them
    if (initialStats) {
      setStats(initialStats);
      setLoading(false);
    } else {
      // Otherwise fetch stats
      fetchStats();
    }

    // Fetch recent pending reports
    fetchRecentPendingReports();
  }, [initialStats]);

  const fetchStats = async () => {
    try {
      const data = await moderatorService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPendingReports = async () => {
    try {
      setPendingReportsLoading(true);
      const response = await moderatorService.getReports({
        status: 'pending',
        per_page: 5,
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      if (response.success && response.data) {
        // Handle both data formats
        const reportsData = Array.isArray(response.data.data) 
          ? response.data.data 
          : (response.data.data?.data || []);
        
        setRecentReports(reportsData);
      }
    } catch (error) {
      console.error('Error fetching recent pending reports:', error);
    } finally {
      setPendingReportsLoading(false);
    }
  };

  // Background style for the welcome banner
  const backgroundStyle = {
    background: 'linear-gradient(to bottom right, #d4eafb, #e6f4fd)',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative',
    height: '220px'
  };

  // Central large circle with welcome text
  const mainCircleStyle = {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    background: '#ffffff',
    boxShadow: '0 2px 15px rgba(0, 0, 0, 0.05)',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 4
  };

  // Get current time to show appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  // Stats cards data
  const getStatsCards = () => {
    if (!stats) {
      return [
        { title: 'Tài liệu đã duyệt', value: '0', icon: FaCheck, color: '#28A745', bgColor: '#E8F9EF' },
        { title: 'Tài liệu chờ duyệt', value: '0', icon: FaClock, color: '#FFC107', bgColor: '#FFF8E6' },
        { title: 'Báo cáo chờ xử lý', value: '0', icon: FaFlag, color: '#DC3545', bgColor: '#FEECEE' },
        { title: 'Đã từ chối', value: '0', icon: FaTimesCircle, color: '#6F42C1', bgColor: '#F0E7FA' }
      ];
    }

    return [
      { 
        title: 'Tài liệu đã duyệt', 
        value: stats.documents?.approved || '0', 
        icon: FaCheck, 
        color: '#28A745', 
        bgColor: '#E8F9EF' 
      },
      { 
        title: 'Tài liệu chờ duyệt', 
        value: stats.documents?.pending || '0', 
        icon: FaClock, 
        color: '#FFC107', 
        bgColor: '#FFF8E6' 
      },
      { 
        title: 'Báo cáo chờ xử lý', 
        value: stats.reports?.pending || '0', 
        icon: FaFlag, 
        color: '#DC3545', 
        bgColor: '#FEECEE' 
      },
      { 
        title: 'Báo cáo từ chối', 
        value: stats.reports?.rejected || '0',  // Fix: Use reports.rejected instead of documents.rejected
        icon: FaTimesCircle, 
        color: '#6F42C1', 
        bgColor: '#F0E7FA' 
      }
    ];
  };

  // Render report type text
  const getReportableTypeText = (typeString) => {
    if (!typeString) return 'Không xác định';
    
    const type = typeString.split('\\').pop().toLowerCase();
    
    switch (type) {
      case 'document':
        return 'Tài liệu';
      case 'group':
        return 'Nhóm';
      case 'post':
        return 'Bài viết';
      case 'comment':
        return 'Bình luận';
      case 'user':
        return 'Người dùng';
      default:
        return type;
    }
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning" text="dark">Chưa xử lý</Badge>;
      case 'resolved':
        return <Badge bg="success">Đã giải quyết</Badge>;
      case 'rejected':
        return <Badge bg="danger">Từ chối</Badge>;
      default:
        return <Badge bg="secondary">Không xác định</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="welcome-section mb-4 d-flex justify-content-center align-items-center" style={backgroundStyle}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <>
      <div className="welcome-section mb-4" style={backgroundStyle}>
        {/* Main circle with welcome text */}
        <div style={mainCircleStyle}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            width: '100%'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#0370B7',
              marginBottom: '4px'
            }}>
              {getGreeting()}
            </div>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: '#0370B7',
              marginBottom: '4px',
              letterSpacing: '0.5px'
            }}>
              {user?.name || 'Moderator'}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#0370B7', 
              opacity: 0.8,
              letterSpacing: '0.5px'
            }}>
              Người Kiểm Duyệt
            </div>
          </div>
        </div>
        
        {/* Design elements */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: 'linear-gradient(to bottom right, transparent, rgba(255, 255, 255, 0.3))',
          borderTopLeftRadius: '100%',
          zIndex: 1
        }}></div>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        {getStatsCards().map((stat, index) => {
          const IconComponent = stat.icon;
          
          return (
            <Col md={3} sm={6} className="mb-3" key={index}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center">
                  <div
                    style={{
                      backgroundColor: stat.bgColor,
                      color: stat.color,
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '16px'
                    }}
                  >
                    <IconComponent size={24} />
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: '14px' }}>
                      {stat.title}
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: '600' }}>
                      {stat.value}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Two-column layout for Recent Reports and Report Metrics */}
      <Row className="mb-4">
        {/* Recent Reports Column */}
        <Col lg={8} className="mb-4 mb-lg-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">
                  <FaExclamationTriangle className="me-2 text-warning" />
                  Báo Cáo Cần Xử Lý
                </h5>
                <Link to="/moderator/reports">
                  <Button variant="outline-primary" size="sm">
                    Xem tất cả <FaArrowRight className="ms-1" size={12} />
                  </Button>
                </Link>
              </div>
              
              {pendingReportsLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" variant="primary" />
                  <p className="text-muted mt-2 mb-0">Đang tải báo cáo...</p>
                </div>
              ) : recentReports.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Nội dung</th>
                        <th>Loại</th>
                        <th>Lý do</th>
                        <th>Thời gian</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReports.map((report) => (
                        <tr key={report.id}>
                          <td className="text-truncate" style={{ maxWidth: '200px' }}>
                            {report.reportable?.title || report.reportable?.name || 'Nội dung không xác định'}
                          </td>
                          <td>{getReportableTypeText(report.reportable_type)}</td>
                          <td className="text-truncate" style={{ maxWidth: '150px' }}>{report.reason}</td>
                          <td>{new Date(report.created_at).toLocaleDateString('vi-VN')}</td>
                          <td>{renderStatusBadge(report.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">Không có báo cáo nào cần xử lý.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        {/* Report Metrics Column */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h5 className="mb-4">
                <FaChartBar className="me-2 text-primary" />
                Thống Kê Báo Cáo
              </h5>
              
              {loading ? (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" variant="primary" />
                  <p className="text-muted mt-2 mb-0">Đang tải thống kê...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <div className="text-muted">Tổng số báo cáo</div>
                      <div className="fw-bold">{stats?.reports?.total || 0}</div>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <div className="text-muted">Đang chờ xử lý</div>
                      <div className="fw-bold text-warning">{stats?.reports?.pending || 0}</div>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <div className="text-muted">Đã giải quyết</div>
                      <div className="fw-bold text-success">{stats?.reports?.resolved || 0}</div>
                    </div>
                    <div className="d-flex justify-content-between">
                      <div className="text-muted">Đã từ chối</div>
                      <div className="fw-bold text-danger">{stats?.reports?.rejected || 0}</div>
                    </div>
                  </div>
                  
                  {/* Show report types distribution if available */}
                  {stats?.report_types && (
                    <div className="mt-4">
                      <h6 className="mb-3">Phân Loại Báo Cáo</h6>
                      {Object.entries(stats.report_types).map(([type, count]) => (
                        <div className="d-flex justify-content-between mb-2" key={type}>
                          <div className="text-muted">{getReportableTypeText(type)}</div>
                          <div className="fw-bold">{count}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Work efficiency metrics if available */}
                  {stats?.resolution_metrics && (
                    <div className="mt-4">
                      <h6 className="mb-3">Hiệu Suất Xử Lý</h6>
                      <div className="d-flex justify-content-between mb-2">
                        <div className="text-muted">Thời gian TB</div>
                        <div className="fw-bold">
                          {stats.resolution_metrics.average ? 
                           `${Math.round(stats.resolution_metrics.average / 60)} giờ` : 
                           'N/A'}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between">
                        <div className="text-muted">Báo cáo 7 ngày qua</div>
                        <div className="fw-bold">{stats.reports?.new_reports || 0}</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity Section */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <h5 className="mb-4">Hoạt Động Gần Đây</h5>
          
          {loading ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" variant="primary" />
              <p className="text-muted mt-2 mb-0">Đang tải hoạt động gần đây...</p>
            </div>
          ) : stats?.recent_activities && stats.recent_activities.length > 0 ? (
            <div className="timeline">
              {stats.recent_activities.slice(0, 5).map((activity, index) => (
                <div className="activity-item d-flex pb-3 mb-3 border-bottom" key={index}>
                  <div className="activity-icon me-3">
                    <div 
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 
                          activity.type === 'document_approved' ? '#E8F9EF' :
                          activity.type === 'document_rejected' ? '#FEECEE' : 
                          activity.type === 'report_resolved' ? '#E6F3FB' : '#FFF8E6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 
                          activity.type === 'document_approved' ? '#28A745' :
                          activity.type === 'document_rejected' ? '#DC3545' : 
                          activity.type === 'report_resolved' ? '#0370B7' : '#FFC107'
                      }}
                    >
                      {activity.type === 'document_approved' && <FaCheck />}
                      {activity.type === 'document_rejected' && <FaTimesCircle />}
                      {activity.type === 'report_resolved' && <FaFlag />}
                      {activity.type === 'document_pending' && <FaClock />}
                    </div>
                  </div>
                  <div className="activity-content flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <div className="activity-title fw-medium">{activity.title}</div>
                      <div className="activity-time text-muted small">
                        {new Date(activity.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit', 
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="text-muted small mt-1">{activity.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center mb-0">Không có hoạt động nào gần đây.</p>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default Dashboard;
