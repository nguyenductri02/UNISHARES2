import React, { useState, useEffect, useCallback } from 'react';
import { Nav, Image, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import userAvatar from '../../assets/avatar-1.png';
import { FaHome, FaUsers, FaComments, FaHistory, FaCog, FaFileContract, FaPlus, FaClock } from 'react-icons/fa';
import { authService, groupService } from '../../services';

// Thời gian cache (1 giờ)
const PERMISSION_CACHE_DURATION = 60 * 60 * 1000;

const UnshareSidebar = ({ activeSection = 'home', hasNewMessages = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [canCreateGroups, setCanCreateGroups] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  
  // Lấy thông tin người dùng từ local storage
  const fetchUserData = useCallback(() => {
    try {
      // Lấy thông tin người dùng từ local storage thay vì gọi API
      const userData = authService.getUser();
      if (userData) {
        setUser(userData);
        
        // Kiểm tra quyền tạo nhóm trực tiếp từ thông tin người dùng
        checkCreatePermissionFromUser(userData);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  }, []);
  
  // Kiểm tra quyền từ thông tin người dùng
  const checkCreatePermissionFromUser = useCallback((userData) => {
    if (!userData) return;
    
    try {
      // Lấy thông tin quyền từ localStorage để tránh gọi API
      const permissionCacheKey = `can_create_groups_${userData.id}`;
      const permissionCache = localStorage.getItem(permissionCacheKey);
      
      if (permissionCache) {
        const { value, timestamp } = JSON.parse(permissionCache);
        const now = Date.now();
        
        // Kiểm tra xem cache có còn hợp lệ không
        if (now - timestamp < PERMISSION_CACHE_DURATION) {
          console.log('Using cached permission value:', value);
          setCanCreateGroups(value);
          setPermissionChecked(true);
          return;
        }
      }
      
      // Kiểm tra quyền tạo nhóm từ roles
      let hasPermission = false;
      if (userData.roles) {
        const roles = Array.isArray(userData.roles) ? userData.roles : [userData.roles];
        const roleNames = roles.map(role => 
          typeof role === 'string' ? role.toLowerCase() : (role.name || '').toLowerCase()
        );
        
        // Người dùng có thể tạo nhóm nếu là admin, moderator hoặc lecturer
        if (roleNames.some(name => ['admin', 'moderator', 'lecturer'].includes(name))) {
          hasPermission = true;
        }
      }
        // Kiểm tra quyền rõ ràng từ danh sách permissions
      if (!hasPermission && userData.permissions && userData.permissions.includes('create groups')) {
        hasPermission = true;
      }
      
      setCanCreateGroups(hasPermission);
      setPermissionChecked(true);
      
      // Lưu kết quả vào localStorage để dùng sau
      localStorage.setItem(permissionCacheKey, JSON.stringify({
        value: hasPermission,
        timestamp: Date.now()
      }));
      
    } catch (err) {
      console.error('Error checking permission from user data:', err);
      setPermissionChecked(true);
    }
  }, []);
  
  useEffect(() => {
    fetchUserData();
    
    // Thêm event listener để cập nhật khi user thay đổi
    const handleUserChange = () => {
      fetchUserData();
    };
    
    window.addEventListener('user-updated', handleUserChange);
    
    return () => {
      window.removeEventListener('user-updated', handleUserChange);
    };
  }, [fetchUserData]);

  return (
    <>
      <div
        className="sidebar bg-white shadow-sm mb-4 p-3"
        style={{
          border: '2px solid #b3d8f6',
          borderRadius: '1rem',
          minWidth: 250,
        }}
      >
        {/* Always show the Create Group button regardless of permission */}
        <Link to="/unishare/create-course" className="text-decoration-none">
          <Button
            variant="primary"
            className="w-100 mb-3 d-flex align-items-center justify-content-center fw-bold"
            style={{
              background: 'linear-gradient(90deg, #0370b7 60%, #4fc3f7 100%)',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1rem',
              boxShadow: '0 2px 8px rgba(3,112,183,0.08)'
            }}
          >
            <FaPlus className="me-2" /> Tạo nhóm học
          </Button>
        </Link>
        
        <Nav className="flex-column gap-1">
          <Nav.Link
            as={Link}
            to="/unishare"
            active={activeSection === 'home'}
            className={`d-flex align-items-center py-2 px-3 fw-bold ${activeSection !== 'home' ? 'text-primary sidebar-link' : ''}`}
            style={{
              borderRadius: '0.5rem',
              marginBottom: 2,
              boxShadow: activeSection === 'home' ? '0 1px 4px rgba(3,112,183,0.04)' : 'none',
            }}
          >
            <FaHome className="me-2" />
            Trang chủ
          </Nav.Link>          <Nav.Link
            as={Link}
            to="/unishare/my-groups"
            active={activeSection === 'my-groups'}
            className={`d-flex align-items-center py-2 px-3 fw-bold ${activeSection !== 'my-groups' ? 'text-primary sidebar-link' : ''}`}
            style={{ borderRadius: '0.5rem' }}
          >
            <FaUsers className="me-2" />
            Nhóm của tôi
          </Nav.Link>
          
          <Nav.Link
            as={Link}
            to="/unishare"
            active={activeSection === 'popular-groups'}
            className={`d-flex align-items-center py-2 px-3 fw-bold ${activeSection !== 'popular-groups' ? 'text-primary sidebar-link' : ''}`}
            style={{ borderRadius: '0.5rem' }}
          >
            <FaUsers className="me-2" />
            Nhóm phổ biến
          </Nav.Link>
             
          <Nav.Link
            as={Link}
            to="/unishare/new-groups"
            active={activeSection === 'new-groups'}
            className={`d-flex align-items-center py-2 px-3 fw-bold ${activeSection !== 'new-groups' ? 'text-primary sidebar-link' : ''}`}
            style={{ borderRadius: '0.5rem' }}
          >
            <FaClock className="me-2" />
            Nhóm học mới nhất
          </Nav.Link>
          
          <Nav.Link
            as={Link}
            to="/unishare/messages"
            active={activeSection === 'messages'}
            className={`d-flex align-items-center py-2 px-3 fw-bold position-relative ${activeSection !== 'messages' ? 'text-primary sidebar-link' : ''}`}
            style={{ borderRadius: '0.5rem' }}
          >
            <FaComments className="me-2" />
            Tin nhắn
            {hasNewMessages && (
              <span 
                className="position-absolute bg-danger rounded-circle"
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  top: '10px', 
                  right: '12px' 
                }}
              />
            )}
          </Nav.Link>
          
          <Nav.Link
            as={Link}
            to="/unishare/history"
            active={activeSection === 'history'}
            className={`d-flex align-items-center py-2 px-3 fw-bold ${activeSection !== 'history' ? 'text-primary sidebar-link' : ''}`}
            style={{ borderRadius: '0.5rem' }}
          >
            <FaHistory className="me-2" />
            Lịch sử tham gia
          </Nav.Link>
          
          <Nav.Link
            as={Link}
            to="/unishare/terms"
            active={activeSection === 'terms'}
            className={`d-flex align-items-center py-2 px-3 fw-bold ${activeSection !== 'terms' ? 'text-primary sidebar-link' : ''}`}
            style={{ borderRadius: '0.5rem' }}
          >
            <FaFileContract className="me-2" />
            Điều khoản người dùng
          </Nav.Link>
        </Nav>
      </div>
      <div
        className="announcements bg-white shadow-sm p-3"
        style={{
          border: '2px solid #b3d8f6',
          borderRadius: '1rem',
        }}
      >
        <h5 className="mb-3 fw-bold" style={{ color: '#0370b7', fontSize: '1.15rem' }}>Thông báo</h5>
        {user?.activity?.notifications && user.activity.notifications.length > 0 ? (
          user.activity.notifications.slice(0, 5).map((notif, idx, arr) => (
            <div
              key={notif.id}
              className={`announcement-item d-flex align-items-center mb-3 pb-3${idx !== arr.length - 1 ? ' border-bottom' : ''}`}
              style={{ borderColor: '#e3f1fb' }}
            >
              <Image
                src={user.avatar_url || userAvatar}
                roundedCircle
                width={32}
                height={32}
                className="me-2"
                style={{ border: '1.5px solid #b3d8f6' }}
              />
              <div>
                <strong className="d-block" style={{ color: '#0370b7', fontSize: '0.98rem' }}>
                  {notif.data.title || 'Thông báo'}
                </strong>
                <small className="text-muted" style={{ fontSize: '0.85rem' }}>
                  {notif.data.body || notif.message || 'Không có nội dung'}
                </small>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted small">Không có thông báo mới.</p>
        )}
      </div>
      <style>{`
        .sidebar-link:hover {
          background: #e3f1fb !important;
          color: #0370b7 !important;
        }
        .sidebar .nav-link.active, .sidebar .nav-link.active:focus {
          background: #0370b7 !important;
          color: #fff !important;
        }
      `}</style>
    </>
  );
};

export default UnshareSidebar;
