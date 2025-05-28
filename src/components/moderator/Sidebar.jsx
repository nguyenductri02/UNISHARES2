import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBook, FaFlag, FaChartBar, FaSignOutAlt,
         FaBars, FaTimes } from 'react-icons/fa';
import { authService } from '../../services';

const NavItem = ({ icon: Icon, text, link, active, collapsed }) => (
  <Link
    to={link}
    className={`nav-link d-flex align-items-center py-3 px-3 rounded-3 mb-2`}
    style={{
      color: active ? '#ffffff' : '#5A5A5A',
      backgroundColor: active ? '#55A5E9' : 'transparent',
      fontSize: '14px',
      fontWeight: '400'
    }}
  >
    <div className="me-3 d-flex align-items-center justify-content-center" style={{ width: '20px' }}>
      <Icon size={16} />
    </div>
    {!collapsed && <span>{text}</span>}
  </Link>
);

const ModeratorSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Check screen size and adjust sidebar state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      setCollapsed(mobile);
      setSidebarVisible(!mobile);
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // The moderator has a limited menu compared to admin
  const menuItems = [
    { icon: FaChartBar, text: 'Dashboard', link: '/moderator/dashboard', active: currentPath === '/moderator/dashboard' },
    { icon: FaBook, text: 'Quản Lý Tài Liệu', link: '/moderator/documents', active: currentPath.includes('/moderator/documents') },
    { icon: FaFlag, text: 'Quản Lý Báo Cáo', link: '/moderator/reports', active: currentPath === '/moderator/reports' },
  ];

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
      // Force redirect even if logout API fails
      navigate('/');
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarVisible(!sidebarVisible);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // Mobile toggle button (visible outside the sidebar)
  const MobileToggle = () => (
    <button 
      className="btn btn-primary d-lg-none position-fixed"
      onClick={toggleSidebar}
      style={{
        top: '10px', 
        left: '10px',
        zIndex: 1040,
        padding: '0.5rem',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%'
      }}
    >
      {sidebarVisible ? <FaTimes /> : <FaBars />}
    </button>
  );

  return (
    <>
      {isMobile && <MobileToggle />}
      <div 
        className={`moderator-sidebar bg-white shadow-sm p-3 h-100 ${collapsed && !isMobile ? 'collapsed' : ''}`}
        style={{
          width: collapsed && !isMobile ? '300px' : '300px',
          transition: 'all 0.3s ease',
          display: (isMobile && !sidebarVisible) ? 'none' : 'block',
          position: isMobile ? 'fixed' : 'relative',
          zIndex: isMobile ? 1030 : 'auto',
          top: 0,
          left: 0,
          height: '100vh',
          overflowY: 'auto'
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-4 py-2">
          {!collapsed && <h5 className="mb-0 fw-bold text-primary">UNISHARE</h5>}
          {collapsed && !isMobile && <h5 className="mb-0 fw-bold text-primary">US</h5>}
          {!isMobile && (
            <button 
              className="btn btn-sm btn-light rounded-circle p-1"
              onClick={toggleSidebar}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <FaBars size={14} /> : <FaTimes size={14} />}
            </button>
          )}
        </div>

        <div className="sidebar-menu">
          {menuItems.map((item, index) => (
            <NavItem 
              key={index}
              icon={item.icon}
              text={item.text}
              link={item.link}
              active={item.active}
              collapsed={collapsed}
            />
          ))}
          
          <div className="sidebar-divider my-3"></div>
          
          <button
            onClick={handleLogout}
            className={`nav-link d-flex align-items-center py-3 px-3 rounded-3 mb-2 w-100 border-0`}
            style={{
              color: '#5A5A5A',
              backgroundColor: 'transparent',
              fontSize: '14px',
              fontWeight: '400'
            }}
          >
            <div className="me-3 d-flex align-items-center justify-content-center" style={{ width: '20px' }}>
              <FaSignOutAlt size={16} />
            </div>
            {!collapsed && <span>Đăng Xuất</span>}
          </button>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isMobile && sidebarVisible && (
        <div 
          className="sidebar-overlay position-fixed top-0 left-0 w-100 h-100 bg-dark"
          style={{ opacity: 0.5, zIndex: 1020 }}
          onClick={() => setSidebarVisible(false)}
        ></div>
      )}
    </>
  );
};

export default ModeratorSidebar;
