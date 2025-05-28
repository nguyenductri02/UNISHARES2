import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import authService from '../services/authService';

const PrivateRoute = ({ children, roles = [] }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!authService.isLoggedIn()) {
          setAuthenticated(false);
          setLoading(false);
          return;
        }

        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        setAuthenticated(!!user);
        setLoading(false);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setAuthenticated(false);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Check if user has required role
  const hasRequiredRole = () => {
    if (!roles || roles.length === 0) return true; // No specific role required
    if (!currentUser || !currentUser.roles || currentUser.roles.length === 0) return false;

    // Extract role names from user object
    const userRoles = currentUser.roles.map(role => 
      typeof role === 'string' ? role : role.name
    );

    return roles.some(role => userRoles.includes(role));
  };

  // Handle redirects based on roles
  const handleRoleBasedRedirect = () => {
    if (!currentUser || !currentUser.roles || currentUser.roles.length === 0) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Extract user's role
    const userRoles = currentUser.roles.map(role => 
      typeof role === 'string' ? role : role.name
    );

    // Check if user is attempting to access admin page but doesn't have admin role
    if (
      location.pathname.startsWith('/admin') && 
      !userRoles.includes('admin')
    ) {
      // If user is moderator, redirect to moderator dashboard
      if (userRoles.includes('moderator')) {
        return <Navigate to="/moderator/dashboard" replace />;
      }
      // Otherwise redirect to home
      return <Navigate to="/" replace />;
    }

    // Check if user is attempting to access moderator page but doesn't have moderator role
    if (
      location.pathname.startsWith('/moderator') && 
      !userRoles.includes('moderator')
    ) {
      // If user is admin, redirect to admin dashboard
      if (userRoles.includes('admin')) {
        return <Navigate to="/admin/dashboard" replace />;
      }
      // Otherwise redirect to home
      return <Navigate to="/" replace />;
    }

    // If user doesn't have required role, redirect to home
    if (!hasRequiredRole()) {
      return <Navigate to="/" replace />;
    }

    return children;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return handleRoleBasedRedirect();
};

export default PrivateRoute;
