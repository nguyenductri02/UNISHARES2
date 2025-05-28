import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { authService } from '../services';

// Import subcomponents
import UnishareSidebar from '../components/unishareupload/UnishareSidebar';
import UploadForm from '../components/unishareupload/UploadForm';
import MyFiles from '../components/unishareupload/MyFiles';
import SharedFiles from '../components/unishareupload/SharedFiles';
import UploadHistory from '../components/unishareupload/UploadHistory';
import TrashFiles from '../components/unishareupload/TrashFiles';
import Welcome from '../components/unishareupload/Welcome';

const UniShareUpload = ({ activeSection: propSection }) => {
  const { section: paramSection } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Use the prop if available, otherwise fallback to URL param, then default to 'home'
  const activeSection = propSection || paramSection || 'home';
  
  // Check authentication for protected sections
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Only check authentication for sections that require it
        const protectedSections = ['upload', 'my-files', 'history', 'shared', 'trash'];
        
        if (protectedSections.includes(activeSection)) {
          const isLoggedIn = authService.isLoggedIn();
          
          if (!isLoggedIn) {
            // Redirect to login page with return URL
            navigate(`/login?redirect=/unishare-files/${activeSection}`);
            return;
          }
          
          setIsAuthenticated(true);
        } else {
          // For public sections, we don't need to wait for auth check
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Không thể xác thực người dùng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [activeSection, navigate]);
  
  // If navigating directly to /unishare-files without a section, show home by default
  useEffect(() => {
    if (!propSection && !paramSection) {
      navigate('/unishare-files/home');
    }
  }, [propSection, paramSection, navigate]);

  // Render content based on active section
  const renderContent = () => {
    // Show loading state
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải...</p>
        </div>
      );
    }
    
    // Show error state
    if (error) {
      return (
        <Alert variant="danger">
          {error}
          <div className="mt-3">
            <button 
              className="btn btn-outline-danger" 
              onClick={() => window.location.reload()}
            >
              Thử lại
            </button>
          </div>
        </Alert>
      );
    }
    
    // Protected routes require authentication
    const protectedSections = ['upload', 'my-files', 'history', 'shared', 'trash'];
    if (protectedSections.includes(activeSection) && !isAuthenticated) {
      return (
        <Alert variant="warning">
          Vui lòng đăng nhập để truy cập tính năng này.
          <div className="mt-3">
            <button 
              className="btn btn-primary" 
              onClick={() => navigate(`/login?redirect=/unishare-files/${activeSection}`)}
            >
              Đăng nhập
            </button>
          </div>
        </Alert>
      );
    }
    
    // Render the appropriate content for the active section
    switch (activeSection) {
      case 'upload':
        return <UploadForm />;
      case 'my-files':
        return <MyFiles />;
      case 'shared':
        return <SharedFiles />;
      case 'history':
        return <UploadHistory />;
      case 'trash':
        return <TrashFiles />;
      case 'home':
      default:
        return <Welcome />;
    }
  };

  return (
    <>
      <Header />
      <div className="bg-light py-4" style={{ minHeight: '100vh' }}>
        <Container>
          <Row>
            {/* Left sidebar */}
            <Col md={3}>
              <UnishareSidebar activeSection={activeSection} />
            </Col>

            {/* Main content area */}
            <Col md={9}>
              <div className="bg-white rounded p-4 shadow-sm" style={{ borderRadius: '0.75rem' }}>
                {renderContent()}
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default UniShareUpload;
