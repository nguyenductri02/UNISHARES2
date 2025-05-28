import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Table } from 'react-bootstrap';
import { authService } from '../../services';

const UnishareRoleDebugger = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [refreshedUser, setRefreshedUser] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true);
        const userData = authService.getUser();
        setUser(userData);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Không thể lấy thông tin người dùng: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const handleRefreshUserInfo = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const userData = await authService.refreshUserInfo();
      setRefreshedUser(userData);
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError('Không thể làm mới thông tin người dùng: ' + (err.message || 'Unknown error'));
    } finally {
      setRefreshing(false);
    }
  };

  // Format roles array for display
  const formatRoles = (roles) => {
    if (!roles) return 'Không có vai trò nào';
    
    // Handle different formats of roles data
    if (Array.isArray(roles)) {
      return roles.map(role => 
        typeof role === 'string' ? role : (role.name || JSON.stringify(role))
      ).join(', ');
    } else if (typeof roles === 'object') {
      return roles.name || JSON.stringify(roles);
    } else {
      return String(roles);
    }
  };

  // Format permissions array for display
  const formatPermissions = (permissions) => {
    if (!permissions) return 'Không có quyền nào';
    if (Array.isArray(permissions)) {
      return permissions.join(', ');
    }
    return String(permissions);
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Đang tải thông tin người dùng...</p>
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Header className="bg-white border-0 pt-3">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0" style={{ color: '#0370b7' }}>Thông tin người dùng</h5>
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Ẩn thông tin' : 'Hiển thị thông tin'}
          </Button>
        </div>
      </Card.Header>
      
      {showDebug && (
        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          
          <div className="mb-3">
            <h6 className="fw-bold">Thông tin người dùng từ bộ nhớ cục bộ:</h6>
            <Table bordered hover size="sm" className="mt-2">
              <tbody>
                <tr>
                  <td width="150" className="fw-semibold">ID:</td>
                  <td>{user?.id || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="fw-semibold">Tên:</td>
                  <td>{user?.name || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="fw-semibold">Email:</td>
                  <td>{user?.email || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="fw-semibold">Vai trò:</td>
                  <td>{formatRoles(user?.roles)}</td>
                </tr>
                <tr>
                  <td className="fw-semibold">Quyền:</td>
                  <td>{formatPermissions(user?.permissions)}</td>
                </tr>
              </tbody>
            </Table>
          </div>
          
          <div className="d-flex justify-content-center mb-3">
            <Button 
              variant="primary" 
              onClick={handleRefreshUserInfo}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang làm mới...
                </>
              ) : (
                'Làm mới thông tin từ máy chủ'
              )}
            </Button>
          </div>
          
          {refreshedUser && (
            <div className="mb-3">
              <h6 className="fw-bold">Thông tin người dùng từ máy chủ:</h6>
              <Table bordered hover size="sm" className="mt-2">
                <tbody>
                  <tr>
                    <td width="150" className="fw-semibold">ID:</td>
                    <td>{refreshedUser?.id || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-semibold">Tên:</td>
                    <td>{refreshedUser?.name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-semibold">Email:</td>
                    <td>{refreshedUser?.email || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="fw-semibold">Vai trò:</td>
                    <td>{formatRoles(refreshedUser?.roles)}</td>
                  </tr>
                  <tr>
                    <td className="fw-semibold">Quyền:</td>
                    <td>{formatPermissions(refreshedUser?.permissions)}</td>
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
          
          <Alert variant="info">
            <Alert.Heading>Hướng dẫn khắc phục</Alert.Heading>            <p>
              Nếu bạn không thấy quyền "create groups" trong danh sách quyền hoặc vai trò của bạn không phải là admin, 
              moderator hoặc lecturer, bạn sẽ không thể tạo nhóm học mới. Hãy liên hệ với quản trị viên để được cấp quyền.
            </p>
          </Alert>
        </Card.Body>
      )}
    </Card>
  );
};

export default UnishareRoleDebugger;
