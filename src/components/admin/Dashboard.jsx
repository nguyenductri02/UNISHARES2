import React from 'react';
import { Spinner } from 'react-bootstrap';

const Dashboard = ({ user }) => {
  // Light blue gradient background
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

  // Design elements - circles of varying sizes
  const designElements = [
    // Medium circle top right
    {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: '#ffffff',
      position: 'absolute',
      top: '16%',
      right: '30%',
      opacity: 0.7,
      zIndex: 2
    },
    // Large light circle top left
    {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: '#ffffff',
      position: 'absolute',
      top: '20%',
      left: '15%',
      opacity: 0.5,
      zIndex: 1
    },
    // Small circle bottom right
    {
      width: '35px',
      height: '35px',
      borderRadius: '50%',
      background: '#ffffff',
      position: 'absolute',
      bottom: '20%',
      right: '20%',
      opacity: 0.8,
      zIndex: 2
    },
    // Small circle bottom center
    {
      width: '25px',
      height: '25px',
      borderRadius: '50%',
      background: '#ffffff',
      position: 'absolute',
      bottom: '30%',
      left: '40%',
      opacity: 0.6,
      zIndex: 1
    }
  ];

  // Circular outline elements
  const outlineElements = [
    {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      border: '2px solid rgba(255, 255, 255, 0.4)',
      position: 'absolute',
      top: '60%',
      left: '10%',
      zIndex: 1
    },
    {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      border: '2px solid rgba(255, 255, 255, 0.4)',
      position: 'absolute',
      top: '20%',
      right: '10%',
      zIndex: 1
    }
  ];

  // Linear elements
  const linearElements = [
    {
      position: 'absolute',
      top: '40%',
      right: '5%',
      width: '30px',
      height: '2px',
      background: 'rgba(255, 255, 255, 0.6)',
      zIndex: 1
    },
    {
      position: 'absolute',
      bottom: '30%',
      left: '15%',
      width: '20px',
      height: '2px',
      background: 'rgba(255, 255, 255, 0.6)',
      zIndex: 1
    }
  ];

  // Get current time to show appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  // Get role display name
  const getRoleDisplay = () => {
    if (!user || !user.roles || user.roles.length === 0) {
      return 'Quản trị viên';
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

  if (!user) {
    return (
      <div className="welcome-section mb-4 d-flex justify-content-center align-items-center" style={backgroundStyle}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="welcome-section mb-4" style={backgroundStyle}>
      {/* Design elements */}
      {designElements.map((style, index) => (
        <div key={`circle-${index}`} style={style}></div>
      ))}
      
      {/* Outline elements */}
      {outlineElements.map((style, index) => (
        <div key={`outline-${index}`} style={style}></div>
      ))}
      
      {/* Linear elements */}
      {linearElements.map((style, index) => (
        <div key={`line-${index}`} style={style}></div>
      ))}

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
            {user.name || 'Admin'}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#0370B7', 
            opacity: 0.8,
            letterSpacing: '0.5px'
          }}>
            {getRoleDisplay()}
          </div>
        </div>
      </div>
      
      {/* Additional background decorations */}
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
      
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#ffffff',
        opacity: 0.6,
        zIndex: 1
      }}></div>
    </div>
  );
};

export default Dashboard;
