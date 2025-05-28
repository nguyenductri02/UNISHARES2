import React, { useState, useEffect } from 'react';
import { Dropdown } from 'react-bootstrap';
import { FaSearch, FaBell, FaSignOutAlt, FaUser, FaCog } from 'react-icons/fa';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '../../assets/avatar-1.png';

const Header = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // First check if we have a user in local storage
        const storedUser = authService.getUser();
        
        if (storedUser) {
          setUser(storedUser);
        }
        
        // Try to get fresh data from server
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Get role display name
  const getRoleDisplay = () => {
    if (!user || !user.roles || user.roles.length === 0) {
      return 'User';
    }

    const role = user.roles[0].name;
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'moderator':
        return 'Người kiểm duyệt';
      case 'lecturer':
        return 'Giảng viên';
      case 'student':
        return 'Sinh viên';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const getAvatar = () => {
    if (user && user.avatar_url) {
      return user.avatar_url;
    }
    return defaultAvatar;
  };

  return (
    <header className="admin-header" style={{ padding: '15px 20px' }}>
      <div className="container-fluid px-0">
        <div className="row align-items-center">
          <div className="col">
            <div className="search-bar position-relative">
              <input 
                type="text" 
                className="form-control"
                placeholder="Tìm kiếm..." 
                style={{ 
                  height: '38px', 
                  paddingLeft: '38px', 
                  paddingRight: '15px',
                  fontSize: '13px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #f0f0f0',
                  borderRadius: '6px'
                }}
              />
              <FaSearch 
                className="position-absolute text-muted" 
                style={{ left: '14px', top: '12px', fontSize: '13px' }}
              />
            </div>
          </div>
          <div className="col-auto">
            <div className="d-flex align-items-center">
              <div className="notification-bell position-relative me-3">
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '6px',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaBell size={16} color="#555" />
                  <span 
                    className="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: '0.6rem' }}
                  >
                    3
                  </span>
                </div>
              </div>
              <Dropdown>
                <Dropdown.Toggle
                  as="div"
                  id="dropdown-user"
                  className="user-profile d-flex align-items-center"
                  style={{ cursor: 'pointer' }}
                >
                  <div className="user-avatar me-2">
                    <img 
                      src={getAvatar()}
                      alt={user ? user.name : 'User'} 
                      style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                  <div>
                    <span className="fw-medium d-block" style={{ fontSize: '13px', color: '#333' }}>
                      {loading ? 'Đang tải...' : (user ? user.name : 'Chưa đăng nhập')}
                    </span>
                    <small className="text-muted" style={{ fontSize: '11px' }}>
                      {loading ? '' : (user ? getRoleDisplay() : 'Khách')}
                    </small>
                  </div>
                  <div className="ms-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9L12 15L18 9" stroke="#888888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu align="end" className="shadow-sm border-0 py-2">
                  <Dropdown.Item href="/profile">
                    <FaUser className="me-2" size={14} />
                    Trang cá nhân
                  </Dropdown.Item>
                  <Dropdown.Item href="/admin/settings">
                    <FaCog className="me-2" size={14} />
                    Cài đặt
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" size={14} />
                    Đăng xuất
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
