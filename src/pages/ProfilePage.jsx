import React, { useEffect, useState, createContext } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import ProfileForm from '../components/profile/ProfileForm';
import ProfileAvatarSection from '../components/profile/ProfileAvatarSection';
import EditProfileInfoForm from '../components/profile/EditProfileInfoForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import DocumentsList from '../components/profile/DocumentsList';
import CurrentGroups from '../components/profile/CurrentGroups';
import { authService } from '../services';

// Create a context to share user data with child components
export const ProfileContext = createContext({
  userData: null,
  loading: true,
  error: null,
  refreshUserData: () => {}
});

const ProfilePage = () => {
  const { section } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  // Function to refresh user data - can be called by child components
  const refreshUserData = async (forceRefresh = false) => {
    try {
      setError(null);
      
      // Get user data from cache or API
      const data = await authService.getCurrentUser(forceRefresh);
      setUserData(data);
      return data;
    } catch (refreshError) {
      console.error("ProfilePage: Error refreshing user data:", refreshError);
      setError("Không thể kết nối đến máy chủ để cập nhật thông tin. Đang hiển thị dữ liệu đã lưu.");
      
      // Try to get from local storage as fallback
      const localData = authService.getUser();
      if (localData) {
        setUserData(localData);
        return localData;
      }
      return null;
    }
  };

  useEffect(() => {
    // Check if user is logged in and load data
    const checkAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('ProfilePage: Checking authentication status');
        
        const isLoggedIn = authService.isLoggedIn();
        console.log('ProfilePage: User logged in status:', isLoggedIn);
        
        if (!isLoggedIn) {
          console.log('ProfilePage: User not logged in, redirecting to login page');
          navigate('/login');
          return;
        }
        
        // Load user data - this will use cache if available
        await refreshUserData();
      } catch (error) {
        console.error("ProfilePage: Authentication error:", error);
        setError("Lỗi xác thực. Vui lòng đăng nhập lại.");
        // Navigate after a short delay to allow error to be displayed
        setTimeout(() => navigate('/login'), 2000);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Define page content based on section
  let currentTitle = "Hồ Sơ Tài Khoản";
  let currentDescription = "Quản lý thông tin hồ sơ cá nhân để bảo mật";
  let ContentComponent;

  switch (section) {
    case 'edit':
      currentTitle = "Chỉnh sửa thông tin";
      currentDescription = "Cập nhật thông tin cá nhân của bạn.";
      ContentComponent = <EditProfileInfoForm />;
      break;
    case 'change-password':
      currentTitle = "Đổi mật khẩu";
      currentDescription = "";
      ContentComponent = <ChangePasswordForm />;
      break;
    case 'documents':
      currentTitle = "Tài liệu của tôi";
      currentDescription = "";
      ContentComponent = <DocumentsList />;
      break;
    case 'groups':
      currentTitle = "Nhóm đang tham gia";
      currentDescription = "";
      ContentComponent = <CurrentGroups />;
      break;
    default:
      ContentComponent = (
        <Row>
          <Col md={8}>
            <ProfileForm />
          </Col>
          <Col md={4}>
            <ProfileAvatarSection />
          </Col>
        </Row>
      );
  }

  // Context value to be provided to all child components
  const contextValue = {
    userData,
    loading,
    error,
    refreshUserData
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="profile-page-wrapper" style={{ backgroundColor: '#e9f5ff', paddingTop: '2rem', paddingBottom: '2rem' }}>
          <Container>
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Đang tải thông tin tài khoản...</p>
            </div>
          </Container>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <ProfileContext.Provider value={contextValue}>
      <Header />
      <div className="profile-page-wrapper" style={{ backgroundColor: '#e9f5ff', paddingTop: '2rem', paddingBottom: '2rem' }}>
        <Container>
          {error && (
            <Alert variant="warning" className="mb-4">
              {error}
            </Alert>
          )}
          <Row>
            {/* Sidebar */}
            <Col md={3}>
              <ProfileSidebar activeSection={section || 'details'} />
            </Col>

            {/* Main Content */}
            <Col md={9}>
              <div className="profile-content bg-white p-4 rounded shadow-sm">
                <h3 className="mb-1">{currentTitle}</h3>
                {currentDescription && (
                  <p className="text-muted mb-4">{currentDescription}</p>
                )}
                <hr />
                {ContentComponent}
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      <Footer />
    </ProfileContext.Provider>
  );
};

export default ProfilePage;
