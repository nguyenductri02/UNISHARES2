import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ModeratorLayout from '../components/moderator/Layout';
import Dashboard from '../components/moderator/Dashboard';
import { Row, Col, Card, Nav, Spinner, Alert } from 'react-bootstrap';
import ModeratorDocumentManagement from '../components/moderator/DocumentManagement';
import ModeratorReportManagement from '../components/moderator/ReportManagement';
import DocumentPreview from '../components/moderator/DocumentPreview';
import authService from '../services/authService';
import { moderatorService } from '../services/moderatorService';

const ModeratorPage = () => {
  // Get tab from URL params and navigation function
  const { tab } = useParams();
  const navigate = useNavigate();
  
  // Default to 'dashboard' if no tab is specified
  const [activeTab, setActiveTab] = useState(tab || 'dashboard');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  
  // Add loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Current user
  const [currentUser, setCurrentUser] = useState(null);
  
  // Add state for API data
  const [dashboardStats, setDashboardStats] = useState(null);
  
  // Use refs to track if API calls are already in progress
  const loadingRef = useRef({
    dashboard: false,
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
      setActiveTab(tab);
    } else {
      setActiveTab('dashboard');
    }
  }, [tab]);

  // Fetch dashboard stats when dashboard tab is active
  useEffect(() => {
    if (activeTab === 'dashboard') {
      if (!loadingRef.current.dashboard) {
        fetchDashboardStats();
      }
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
      const data = await moderatorService.getDashboardStats();
      setDashboardStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Failed to load dashboard statistics. Please try again later.');
    } finally {
      setLoading(false);
      loadingRef.current.dashboard = false;
    }
  };

  // Report handlers
  const handleInspect = async (report) => {
    setLoading(true);
    setError('');
    
    try {
      const reportDetails = await moderatorService.getReportDetails(report.id);
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
      await moderatorService.deleteDocument(
        selectedReport.details.reportable.id,
        'Deleted due to report: ' + selectedReport.content
      );
      
      // Mark report as resolved
      await moderatorService.resolveReport(
        selectedReport.id,
        'resolve',
        'Document deleted due to valid report'
      );
      
      setShowDocumentPreview(false);
      setSelectedReport(null);
      
      // Refresh if we're on the reports tab
      if (activeTab === 'reports') {
        // We need to somehow trigger a refresh in the ReportManagement component
        // This will be handled by the component's internal refresh mechanism
      }
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
    navigate(`/moderator/${tabName}`);
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
    <ModeratorLayout>
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
          <Dashboard user={currentUser} stats={dashboardStats} />
        </>
      )}

      {/* Documents Tab Content */}
      {activeTab === 'documents' && (
        <ModeratorDocumentManagement />
      )}

      {/* Reports Tab Content */}
      {activeTab === 'reports' && (
        <ModeratorReportManagement />
      )}
    </ModeratorLayout>
  );
};

export default ModeratorPage;
