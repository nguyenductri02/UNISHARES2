import React, { useContext, useEffect } from 'react';
import { Nav, Image, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  BsPersonCircle, BsPencilSquare, BsKey, BsFileEarmarkText, BsClockHistory,
  BsPeople, BsBoxArrowRight
} from 'react-icons/bs';
import defaultAvatar from '../../assets/avatar-1.png';
import { ProfileContext } from '../../pages/ProfilePage';
import { authService } from '../../services';

const ProfileSidebar = ({ activeSection }) => {
  const { userData: user, loading } = useContext(ProfileContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      
      // Clear all authentication data from local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user');
      
      // Clear any other application-specific stored data
      localStorage.removeItem('last_activity');
      localStorage.removeItem('app_settings');
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const sidebarNavItems = [
    { icon: <BsPersonCircle size={20} className="me-2" />, text: 'Hồ sơ cá nhân', pathSuffix: undefined, basePath: 'profile', id: 'details' },
    { icon: <BsPencilSquare size={20} className="me-2" />, text: 'Chỉnh sửa thông tin', pathSuffix: 'edit', basePath: 'profile', id: 'edit' },
    { icon: <BsKey size={20} className="me-2" />, text: 'Đổi mật khẩu', pathSuffix: 'change-password', basePath: 'profile', id: 'change-password' },
    { icon: <BsFileEarmarkText size={20} className="me-2" />, text: 'Tài liệu', pathSuffix: 'documents', basePath: 'profile', id: 'documents' },
    { icon: <BsPeople size={20} className="me-2" />, text: 'Nhóm học', pathSuffix: 'groups', basePath: 'profile', id: 'groups' }
  ];

  const getFullPath = (basePath, pathSuffix) => {
    return pathSuffix ? `/${basePath}/${pathSuffix}` : `/${basePath}`;
  };

  const isActive = (item) => {
    const currentSection = activeSection || 'details';
    return currentSection === item.id;
  };

  return (
    <div className="profile-sidebar bg-white p-3 rounded shadow-sm mb-4">
      <div className="text-center mb-4">
        {loading ? (
          <div className="py-2">
            <Spinner animation="border" size="sm" />
          </div>
        ) : (
          <>
            <Image 
              src={user?.avatar || defaultAvatar} 
              roundedCircle 
              width={80} 
              height={80} 
              className="mb-2"
              style={{ objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultAvatar;
              }}
            />
            <h5>{user?.name || 'Người dùng'}</h5>
            <Link to="/profile/edit" className="text-decoration-none text-primary small">
              <BsPencilSquare className="me-1" /> Sửa hồ sơ
            </Link>
          </>
        )}
      </div>

      <Nav className="flex-column profile-nav">
        {sidebarNavItems.map((item, index) => (
          <Nav.Link
            key={item.id || index}
            as={Link}
            to={getFullPath(item.basePath, item.pathSuffix)}
            className={`d-flex align-items-center ${isActive(item) ? 'active' : ''}`}
          >
            {item.icon} {item.text}
          </Nav.Link>
        ))}
        
        <Nav.Link
          onClick={handleLogout}
          className="d-flex align-items-center text-danger cursor-pointer"
          style={{ cursor: 'pointer' }}
        >
          <BsBoxArrowRight size={20} className="me-2" /> Đăng xuất
        </Nav.Link>
      </Nav>
    </div>
  );
};

export default ProfileSidebar;
