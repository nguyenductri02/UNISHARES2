import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Badge, Spinner, Alert, Modal } from 'react-bootstrap';
import { FaSearch, FaEdit, FaBan, FaUnlock, FaTrash } from 'react-icons/fa';
import adminService from '../../services/adminService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [banReason, setBanReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Default roles if API fails
  const defaultRoles = [
    { value: 'student', label: 'Sinh viên' },
    { value: 'lecturer', label: 'Giảng viên' },
    { value: 'moderator', label: 'Người kiểm duyệt' },
    { value: 'admin', label: 'Quản trị viên' }
  ];

  // Fetch users and roles data
  useEffect(() => {
    const fetchData = async () => {
      // Mock data for users, to be used as a fallback
      const mockUsersArray = [
        { id: 1, name: 'Admin User (Mẫu)', email: 'admin@example.com', role: 'admin', is_active: true, roles: [{name: 'admin'}] },
        { id: 2, name: 'Moderator User (Mẫu)', email: 'moderator@example.com', role: 'moderator', is_active: true, roles: [{name: 'moderator'}] },
        { id: 3, name: 'Lecturer User (Mẫu)', email: 'lecturer@example.com', role: 'lecturer', is_active: true, roles: [{name: 'lecturer'}] },
        { id: 4, name: 'Student User (Mẫu)', email: 'student@example.com', role: 'student', is_active: true, roles: [{name: 'student'}] }
      ];

      try {
        setLoading(true);
        setError('');
        
        let usersApiResponse;
        try {
          // Fetch users, passing the current page
          usersApiResponse = await adminService.getUsers({ page }); 
        } catch (err) {
          console.error('Failed to fetch users:', err);
          // Fallback to mock data structure if API fails
          usersApiResponse = { 
            success: false, 
            data: { 
              data: mockUsersArray, 
              meta: { last_page: 1, current_page: 1, total: mockUsersArray.length }
            }
          };
          setError("Lỗi tải người dùng, hiển thị dữ liệu mẫu.");
        }
        
        let rolesList = defaultRoles; // Use defaultRoles as a fallback
        try {
          const rolesApiResponse = await adminService.getRoles();
          // Assuming getRoles() returns an array of role objects {value: 'admin', label: 'Admin'}
          // or { data: [role objects] }
          if (Array.isArray(rolesApiResponse)) {
            rolesList = rolesApiResponse;
          } else if (rolesApiResponse && Array.isArray(rolesApiResponse.data)) {
            rolesList = rolesApiResponse.data;
          }
          // If rolesList is empty after API call, it will use defaultRoles
        } catch (err) {
          console.error('Failed to fetch roles:', err);
          // rolesList remains defaultRoles if API fails
        }
        setRoles(rolesList.length > 0 ? rolesList : defaultRoles);
        
        // Process user data from usersApiResponse
        // The actual user array is nested in usersApiResponse.data.data
        const actualUsersArray = usersApiResponse?.data?.data; 
        if (Array.isArray(actualUsersArray) && actualUsersArray.length > 0) {
          setUsers(actualUsersArray);
        } else {
          // If API failed, usersApiResponse.data.data would be mockUsersArray from the catch block
          // If API succeeded but returned empty list (actualUsersArray = []), fall back to mockUsersArray
          setUsers(mockUsersArray); 
          if (usersApiResponse?.success && (!actualUsersArray || actualUsersArray.length === 0)) {
            // Optionally set a message if API returned no users
            // setError("Không có người dùng nào được tìm thấy.");
          }
        }
        
        // Use meta for pagination if available, otherwise derive from usersApiResponse.data
        const meta = usersApiResponse?.data?.meta || usersApiResponse?.data;
        setTotalPages(meta?.last_page || 1);
        
      } catch (e) { // Catch for any other unexpected errors in this block
        console.error('Error in fetchData initialization:', e);
        setError('Có lỗi xảy ra khi khởi tạo dữ liệu người dùng.');
        setUsers(mockUsersArray); 
        setRoles(defaultRoles); 
        setTotalPages(1); 
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [page]);

  // Filter users by search term
  const filteredUsers = users.filter(user => 
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle role edit
  const handleEditUser = (user) => {
    setSelectedUser(user);
    
    // Determine the role from user data
    let role = 'student';
    if (user.roles && user.roles.length > 0) {
      role = user.roles[0].name;
    } else if (user.role) {
      role = typeof user.role === 'string' ? user.role.toLowerCase() : 'student';
    }
    
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    
    try {
      setProcessing(true);
      setError('');
      setSuccess(''); // Clear previous success messages
      
      const response = await adminService.updateUserRole(selectedUser.id, selectedRole);
      
      if (response.success === false) {
        throw new Error(response.message || 'Không thể cập nhật vai trò người dùng');
      }
      
      // The actual updated user object is in response.data
      const updatedUserFromApi = response.data;

      if (!updatedUserFromApi || !updatedUserFromApi.id) {
        console.error('Updated user data not found in API response:', response);
        throw new Error('Không nhận được dữ liệu người dùng đã cập nhật từ máy chủ.');
      }
      
      setUsers(users.map(user => 
        user.id === selectedUser.id ? updatedUserFromApi : user
      ));
      
      setSuccess(response.message || 'Cập nhật vai trò thành công');
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update user role:', err);
      setError('Không thể cập nhật vai trò người dùng. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle user ban
  const handleBanUser = (user) => {
    setSelectedUser(user);
    setBanReason('');
    setShowBanModal(true);
  };

  const handleSaveBan = async () => {
    if (!selectedUser || !banReason) return;
    
    try {
      setProcessing(true);
      setError('');
      
      await adminService.banUser(selectedUser.id, banReason);
      
      // Update user in the list
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, is_active: false } : user
      ));
      
      setSuccess('Đã khóa tài khoản người dùng thành công');
      setShowBanModal(false);
    } catch (err) {
      console.error('Failed to ban user:', err);
      setError('Không thể khóa tài khoản người dùng. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle user unban
  const handleUnbanUser = async (userId) => {
    try {
      setProcessing(true);
      setError('');
      
      await adminService.unbanUser(userId);
      
      // Update user in the list
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: true } : user
      ));
      
      setSuccess('Đã mở khóa tài khoản người dùng thành công');
    } catch (err) {
      console.error('Failed to unban user:', err);
      setError('Không thể mở khóa tài khoản người dùng. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle user delete
  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      setProcessing(true);
      setError('');
      
      await adminService.deleteUser(selectedUser.id);
      
      // Remove user from the list
      setUsers(users.filter(user => user.id !== selectedUser.id));
      
      setSuccess('Đã xóa người dùng thành công');
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Không thể xóa người dùng. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  // Change page
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Get user role display name
  const getUserRoleDisplay = (user) => {
    let roleName = 'student'; // Default role value

    if (user && user.roles && user.roles.length > 0 && user.roles[0].name) {
      roleName = user.roles[0].name;
    }
    // 'roles' state is [{value: 'admin', label: 'Quản trị viên'}, ...]
    const roleDefinition = roles.find(r => r.value === roleName);
    // Fallback to capitalizing the role name if no label is found
    return roleDefinition ? roleDefinition.label : (roleName.charAt(0).toUpperCase() + roleName.slice(1));
  };

  // Get user status
  const getUserStatus = (user) => {
    // Default to active if not specified to prevent UI issues
    return user.is_active === false || user.is_active === 0 || user.is_active === "0" ? false : true;
  };

  // Render loading state
  if (loading && users.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải dữ liệu người dùng...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <h4 className="mb-4">Quản Lý Người Dùng</h4>
          
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          <div className="d-flex justify-content-between mb-4">
            <Form.Group className="position-relative" style={{ width: '300px' }}>
              <Form.Control
                type="text"
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-5"
              />
              <FaSearch style={{ position: 'absolute', right: '10px', top: '10px', color: '#6c757d' }} />
            </Form.Group>
          </div>
          
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <Badge bg={
                          getUserRoleDisplay(user) === 'Quản trị viên' ? 'primary' :
                          getUserRoleDisplay(user) === 'Người kiểm duyệt' ? 'info' :
                          getUserRoleDisplay(user) === 'Giảng viên' ? 'success' : 'secondary'
                        }>
                          {getUserRoleDisplay(user)}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={getUserStatus(user) ? 'success' : 'danger'}>
                          {getUserStatus(user) ? 'Hoạt động' : 'Bị khóa'}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => handleEditUser(user)}
                            disabled={processing}
                          >
                            <FaEdit /> Quyền
                          </Button>
                          
                          {getUserStatus(user) ? (
                            <Button 
                              variant="outline-warning" 
                              size="sm" 
                              onClick={() => handleBanUser(user)}
                              disabled={processing || getUserRoleDisplay(user) === 'Quản trị viên'}
                            >
                              <FaBan /> Khóa
                            </Button>
                          ) : (
                            <Button 
                              variant="outline-success" 
                              size="sm" 
                              onClick={() => handleUnbanUser(user.id)}
                              disabled={processing}
                            >
                              <FaUnlock /> Mở khóa
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => handleDeleteUser(user)}
                            disabled={processing || getUserRoleDisplay(user) === 'Quản trị viên'}
                          >
                            <FaTrash /> Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      {searchTerm ? 'Không tìm thấy người dùng phù hợp với từ khóa tìm kiếm' : 'Không có người dùng nào'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Button
                variant="outline-primary"
                size="sm"
                className="me-2"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || loading}
              >
                Trang trước
              </Button>
              
              <span className="align-self-center mx-3">
                Trang {page} / {totalPages}
              </span>
              
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || loading}
              >
                Trang sau
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Edit Role Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa vai trò người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Người dùng: <strong>{selectedUser?.name}</strong></p>
          
          <Form.Group>
            <Form.Label>Vai trò</Form.Label>
            <Form.Select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={processing}
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={processing}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSaveRole} disabled={processing}>
            {processing ? <Spinner size="sm" animation="border" className="me-2" /> : null}
            Lưu thay đổi
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Ban User Modal */}
      <Modal show={showBanModal} onHide={() => setShowBanModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Khóa tài khoản người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn sắp khóa tài khoản của <strong>{selectedUser?.name}</strong>.</p>
          <p>Người dùng này sẽ không thể đăng nhập vào hệ thống cho đến khi được mở khóa.</p>
          
          <Form.Group>
            <Form.Label>Lý do khóa tài khoản</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              disabled={processing}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBanModal(false)} disabled={processing}>
            Hủy
          </Button>
          <Button 
            variant="danger" 
            onClick={handleSaveBan} 
            disabled={processing || !banReason.trim()}
          >
            {processing ? <Spinner size="sm" animation="border" className="me-2" /> : null}
            Khóa tài khoản
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Delete User Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xóa người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser?.name}</strong>?</p>
          <p className="text-danger">Lưu ý: Hành động này không thể hoàn tác. Tất cả dữ liệu của người dùng sẽ bị xóa vĩnh viễn.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={processing}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={processing}>
            {processing ? <Spinner size="sm" animation="border" className="me-2" /> : null}
            Xác nhận xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserManagement;
