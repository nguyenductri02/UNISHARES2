import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/Layout';
import Dashboard from '../components/admin/Dashboard';
import { Row, Col, Card, Nav, Spinner, Alert, Button } from 'react-bootstrap';
import DocumentPreview from '../components/admin/DocumentPreview';
import StatisticsCards from '../components/admin/StatisticsCards';
import UserManagement from '../components/admin/UserManagement';
import PermissionsManager from '../components/admin/PermissionsManager';
import DocumentsManagement from '../components/admin/DocumentsManagement';
import GroupManagement from '../components/admin/GroupManagement';
import UserStatisticsCard from '../components/admin/UserStatisticsCard';
import DocumentStatisticsCard from '../components/admin/DocumentStatisticsCard';
import GroupStatisticsCard from '../components/admin/GroupStatisticsCard';
import adminService from '../services/adminService';
import authService from '../services/authService';
import ReportManagement from '../components/admin/ReportManagement';

const AdminPage = () => {
  // Get tab from URL params and navigation function
  const { tab } = useParams();
  const navigate = useNavigate();
  
  // Default to 'dashboard' if no tab is specified
  const [activeTab, setActiveTab] = useState(tab || 'dashboard');
  const [permissionTab, setPermissionTab] = useState('teacher');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Giảng Viên');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Add loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Current user
  const [currentUser, setCurrentUser] = useState(null);
  
  // Add state for API data
  const [dashboardStats, setDashboardStats] = useState(null);
  const [documentStats, setDocumentStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [groupStats, setGroupStats] = useState(null);
  
  // Use refs to track if API calls are already in progress
  const loadingRef = useRef({
    dashboard: false,
    reports: false,
    teachers: false,
    userStats: false,
    documentStats: false,
    groupStats: false
  });

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Update activeTab when URL parameter changes
  useEffect(() => {
    if (tab) {
      // Redirect home to dashboard
      if (tab === 'home') {
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      setActiveTab(tab);
    } else {
      setActiveTab('dashboard');
    }
  }, [tab, navigate]);

  // Fetch dashboard stats when dashboard tab is active
  useEffect(() => {
    if (activeTab === 'dashboard') {
      if (!loadingRef.current.dashboard) {
        fetchDashboardStats();
      }
      if (!loadingRef.current.userStats) {
        fetchUserStats();
      }
      if (!loadingRef.current.documentStats) {
        fetchDocumentStats();
      }
      if (!loadingRef.current.groupStats) {
        fetchGroupStats();
      }
    }
  }, [activeTab]);
  
  // Fetch reports when reports tab is active
  useEffect(() => {
    if (activeTab === 'reports' && !loadingRef.current.reports) {
      fetchReports();
    }
  }, [activeTab]);
  
  // Fetch favorite teachers for dashboard
  useEffect(() => {
    if (activeTab === 'dashboard' && !loadingRef.current.teachers) {
      fetchTeachers();
    }
  }, [activeTab]);
  
  // API fetch functions
  const fetchDashboardStats = async () => {
    // Skip if already loading
    if (loadingRef.current.dashboard || loading) return;
    
    setLoading(true);
    loadingRef.current.dashboard = true;
    setError('');
    
    try {
      const data = await adminService.getDashboardStats();
      setDashboardStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Failed to load dashboard statistics. Please try again later.');
    } finally {
      setLoading(false);
      loadingRef.current.dashboard = false;
    }
  };
  
  const fetchUserStats = async () => {
    if (loadingRef.current.userStats || loading) return;
    
    loadingRef.current.userStats = true;
    
    try {
      const response = await adminService.getUsers({ stats: true });
      setUserStats(response.data || response);
    } catch (err) {
      console.error('Failed to fetch user statistics:', err);
    } finally {
      loadingRef.current.userStats = false;
    }
  };
  
  const fetchDocumentStats = async () => {
    if (loadingRef.current.documentStats || loading) return;
    
    loadingRef.current.documentStats = true;
    
    try {
      const response = await adminService.getDocumentStatistics();
      setDocumentStats(response.data || response);
    } catch (err) {
      console.error('Failed to fetch document statistics:', err);
    } finally {
      loadingRef.current.documentStats = false;
    }
  };
  
  const fetchGroupStats = async () => {
    if (loadingRef.current.groupStats || loading) return;
    
    loadingRef.current.groupStats = true;
    
    try {
      // First try to get statistics data
      let response;
      try {
        response = await adminService.getGroups({ stats: true });
      } catch (err) {
        console.error('Failed to fetch group statistics:', err);
        // If that fails, just get the regular group list
        response = await adminService.getGroups();
      }
      
      setGroupStats(response);
    } catch (err) {
      console.error('Failed to fetch group statistics:', err);
    } finally {
      loadingRef.current.groupStats = false;
    }
  };
  
  const fetchReports = useCallback(async () => {
    if (loadingRef.current.reports || loading) return;
    
    setLoading(true);
    loadingRef.current.reports = true;
    setError('');
    
    try {
      const response = await adminService.getReports();
      
      // Format reports data for our component
      let formattedReports = [];
      
      // Check if response has the expected structure
      if (response && response.data) {
        // Handle array or object response
        const reportsData = Array.isArray(response.data) ? response.data : 
                            (response.data.data ? response.data.data : []);
        
        // Safely map over the data if it's an array
        if (Array.isArray(reportsData)) {
          formattedReports = reportsData.map(report => ({
            id: report.id,
            document: report.reportable_type === 'App\\Models\\Document' ? 
              (report.reportable?.title || 'Tài liệu đã bị xóa') : 
              'Nội dung khác',
            content: report.reason || 'Không có lý do cụ thể',
            reporterEmail: report.user?.email || 'Không xác định',
            // Add all original report data for potential use
            originalReport: report
          }));
        } else {
          console.warn('Reports data is not an array:', reportsData);
        }
      } else {
        console.warn('Unexpected reports response structure:', response);
      }
      
      setReports(formattedReports);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError('Failed to load reports data. Please try again later.');
    } finally {
      setLoading(false);
      loadingRef.current.reports = false;
    }
  }, [loading]);
  
  const fetchTeachers = useCallback(async () => {
    if (loadingRef.current.teachers || loading) return;
    
    setLoading(true);
    loadingRef.current.teachers = true;
    
    try {
      const response = await adminService.getTeachers({ sort: 'rating', limit: 4 });
      
      // Format teachers data for our component
      const formattedTeachers = response.data?.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        rating: teacher.rating?.toFixed(1) + '/5.0' || '4.5/5.0',
        image: teacher.avatar || `https://i.pravatar.cc/150?img=${10 + teacher.id % 10}`
      })) || [];
      
      if (formattedTeachers.length > 0) {
        setTeachers(formattedTeachers);
      } else {
        // Fallback to mock data if no teachers found
        setTeachers([
          { id: 1, name: 'Nguyễn Văn Nam', rating: '5.0/5.0', image: 'https://i.pravatar.cc/150?img=11' },
          { id: 2, name: 'Nguyễn Thái Văn', rating: '4.8/5.0', image: 'https://i.pravatar.cc/150?img=12' },
          { id: 3, name: 'Nguyễn Thái Nhân', rating: '4.8/5.0', image: 'https://i.pravatar.cc/150?img=13' },
          { id: 4, name: 'Nguyễn Văn Minh', rating: '4.7/5.0', image: 'https://i.pravatar.cc/150?img=14' }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
      // Fallback to mock data if API fails
      setTeachers([
        { id: 1, name: 'Nguyễn Văn Nam', rating: '5.0/5.0', image: 'https://i.pravatar.cc/150?img=11' },
        { id: 2, name: 'Nguyễn Thái Văn', rating: '4.8/5.0', image: 'https://i.pravatar.cc/150?img=12' },
        { id: 3, name: 'Nguyễn Thái Nhân', rating: '4.8/5.0', image: 'https://i.pravatar.cc/150?img=13' },
        { id: 4, name: 'Nguyễn Văn Minh', rating: '4.7/5.0', image: 'https://i.pravatar.cc/150?img=14' }
      ]);
    } finally {
      setLoading(false);
      loadingRef.current.teachers = false;
    }
  }, []);

  // Report handlers
  const handleInspect = async (report) => {
    setLoading(true);
    setError('');
    
    try {
      const reportDetails = await adminService.getReportDetails(report.id);
      setSelectedReport({
        ...report,
        details: reportDetails
      });
      setShowDocumentPreview(true);
    } catch (err) {
      console.error('Failed to fetch report details:', err);
      setError('Failed to load report details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await adminService.resolveReport(id, 'reject', 'Report rejected by admin');
      // Refresh reports list
      fetchReports();
    } catch (err) {
      console.error('Failed to delete report:', err);
      setError('Failed to delete report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePreview = () => {
    setShowDocumentPreview(false);
    setSelectedReport(null);
  };

  const handleDeleteDocument = async () => {
    if (!selectedReport || !selectedReport.details?.reportable?.id) {
      setShowDocumentPreview(false);
      setSelectedReport(null);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Delete the document
      await adminService.deleteDocument(
        selectedReport.details.reportable.id,
        'Deleted due to report: ' + selectedReport.content
      );
      
      // Mark report as resolved
      await adminService.resolveReport(
        selectedReport.id,
        'resolve',
        'Document deleted due to valid report'
      );
      
      // Refresh reports list and close preview
      fetchReports();
      setShowDocumentPreview(false);
      setSelectedReport(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
      setError('Failed to delete document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle tab changes with navigation
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    navigate(`/admin/${tabName}`);
  };

  // If showing document preview from Reports
  if (showDocumentPreview) {
    return (
      <DocumentPreview 
        report={selectedReport} 
        onClose={handleClosePreview}
        onDelete={handleDeleteDocument}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <AdminLayout>
      {/* Page Title */}
      <div className="mb-4">
        <h4 className="mb-0 fw-bold">Dashboard</h4>
      </div>
      
      {/* Error display */}
      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      
      {/* Tab Navigation */}
      <Nav className="mb-4" variant="tabs">
        <Nav.Item>
          <Nav.Link 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => handleTabChange('dashboard')}
            style={{ 
              color: activeTab === 'dashboard' ? '#0370B7' : '#6c757d',
              cursor: 'pointer'
            }}
          >
            Dashboard
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => handleTabChange('users')}
            style={{ 
              color: activeTab === 'users' ? '#0370B7' : '#6c757d',
              cursor: 'pointer'
            }}
          >
            Quản Lý Người Dùng
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            className={activeTab === 'documents' ? 'active' : ''}
            onClick={() => handleTabChange('documents')}
            style={{ 
              color: activeTab === 'documents' ? '#0370B7' : '#6c757d',
              cursor: 'pointer'
            }}
          >
            Quản Lý Tài Liệu
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            className={activeTab === 'groups' ? 'active' : ''}
            onClick={() => handleTabChange('groups')}
            style={{ 
              color: activeTab === 'groups' ? '#0370B7' : '#6c757d',
              cursor: 'pointer'
            }}
          >
            Quản Lý Nhóm
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => handleTabChange('reports')}
            style={{ 
              color: activeTab === 'reports' ? '#0370B7' : '#6c757d',
              cursor: 'pointer'
            }}
          >
            Quản Lý Báo Cáo
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            className={activeTab === 'permissions' ? 'active' : ''}
            onClick={() => handleTabChange('permissions')}
            style={{ 
              color: activeTab === 'permissions' ? '#0370B7' : '#6c757d',
              cursor: 'pointer'
            }}
          >
            Quản Lý Phân Quyền
          </Nav.Link>
        </Nav.Item>
      </Nav>
      
      {loading && activeTab === 'dashboard' && !dashboardStats && (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2 text-muted">Đang tải dữ liệu thống kê...</p>
        </div>
      )}
      
      {/* Dashboard Tab Content */}
      {activeTab === 'dashboard' && (
        <>
          {/* Welcome Banner */}
          <Dashboard user={currentUser} />
          
          {/* Statistics Cards */}
          <StatisticsCards stats={dashboardStats} documentStats={documentStats} />
          
          {/* System Statistics */}
          <Row>
            <Col lg={4} className="mb-4">
              <UserStatisticsCard stats={userStats} />
            </Col>
            <Col lg={4} className="mb-4">
              <DocumentStatisticsCard stats={documentStats} />
            </Col>
            <Col lg={4} className="mb-4">
              <GroupStatisticsCard stats={groupStats} />
            </Col>
          </Row>
        </>
      )}

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <UserManagement />
      )}

      {/* Documents Tab Content */}
      {activeTab === 'documents' && (
        <DocumentsManagement />
      )}

      {/* Groups Tab Content */}
      {activeTab === 'groups' && (
        <GroupManagement />
      )}

      {/* Reports Tab Content - Replace with our new component */}
      {activeTab === 'reports' && (
        <ReportManagement />
      )}

      {/* Permissions Tab Content */}
      {activeTab === 'permissions' && (
        <PermissionsManager />
      )}
    </AdminLayout>
  );
};

export default AdminPage;
