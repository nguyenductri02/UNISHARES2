import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, Table, Row, Col, Accordion } from 'react-bootstrap';
import adminService from '../../services/adminService';

const PermissionsManager = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Group permissions by category for better UI organization
  const permissionCategories = {
    'Documents': [
      'view documents', 'create documents', 'edit documents', 'delete documents',
      'approve documents', 'reject documents', 'download documents', 'rate documents',
      'comment documents', 'mark official documents'
    ],
    'Posts': [
      'view posts', 'create posts', 'edit posts', 'delete posts',
      'like posts', 'comment posts'
    ],
    'Groups': [
      'view groups', 'create groups', 'edit groups', 'delete groups',
      'join groups', 'leave groups', 'manage group members'
    ],
    'Chat': [
      'view chats', 'create chats', 'send messages', 'delete messages',
      'create group chats', 'manage group chats', 'use ai chat'
    ],
    'User Management': [
      'view users', 'create users', 'edit users', 'delete users',
      'ban users', 'unban users', 'assign roles'
    ],
    'Reports': [
      'view reports', 'create reports', 'resolve reports'
    ],
    'System': [
      'view statistics'
    ]
  };

  // Default roles and permissions if API fails
  const defaultRoles = [
    { value: 'admin', label: 'Quản trị viên' },
    { value: 'moderator', label: 'Người kiểm duyệt' },
    { value: 'lecturer', label: 'Giảng viên' },
    { value: 'student', label: 'Sinh viên' }
  ];

  // Fetch roles and permissions on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        let rolesData;
        let permissionsData = [];
        
        try {
          rolesData = await adminService.getRoles();
          
          // If roles data is invalid, use defaults
          if (!rolesData || !Array.isArray(rolesData)) {
            rolesData = defaultRoles;
          }
        } catch (err) {
          console.error("Error fetching roles:", err);
          rolesData = defaultRoles;
        }
        
        try {
          permissionsData = await adminService.getPermissions();
          
          // If permissions data is invalid, extract from permissionCategories
          if (!permissionsData || !Array.isArray(permissionsData)) {
            Object.values(permissionCategories).forEach(category => {
              permissionsData = [...permissionsData, ...category];
            });
          }
        } catch (err) {
          console.error("Error fetching permissions:", err);
          Object.values(permissionCategories).forEach(category => {
            permissionsData = [...permissionsData, ...category];
          });
        }
        
        setRoles(rolesData);
        setPermissions(permissionsData);
        
        if (rolesData && rolesData.length > 0) {
          setSelectedRole(rolesData[0].value);
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError('Failed to load roles and permissions. Please try again.');
        
        // Set defaults
        setRoles(defaultRoles);
        let allPermissions = [];
        Object.values(permissionCategories).forEach(category => {
          allPermissions = [...allPermissions, ...category];
        });
        setPermissions(allPermissions);
        
        if (defaultRoles.length > 0) {
          setSelectedRole(defaultRoles[0].value);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fetch permissions for the selected role
  useEffect(() => {
    const fetchRolePermissions = async () => {
      if (!selectedRole) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Set default permissions for each role if API fails
        const getDefaultRolePermissions = (role) => {
          switch (role) {
            case 'admin':
              return Object.values(permissionCategories).flat();
            case 'moderator':
              return [
                'view documents', 'approve documents', 'reject documents', 'download documents',
                'view posts', 'delete posts',
                'view reports', 'resolve reports',
                'view users', 'ban users', 'unban users',
                'view statistics', 'use ai chat'
              ];
            case 'lecturer':
              return [
                'view documents', 'create documents', 'edit documents', 'delete documents',
                'download documents', 'rate documents', 'comment documents', 'mark official documents',
                'view posts', 'create posts', 'edit posts', 'delete posts',
                'like posts', 'comment posts',
                'view groups', 'create groups', 'edit groups', 'join groups', 'leave groups',
                'view chats', 'create chats', 'send messages', 'create group chats',
                'view reports', 'create reports',
                'use ai chat'
              ];
            case 'student':
              return [
                'view documents', 'create documents', 'edit documents', 'delete documents',
                'download documents', 'rate documents', 'comment documents',
                'view posts', 'create posts', 'edit posts', 'delete posts',
                'like posts', 'comment posts',
                'view groups', 'create groups', 'edit groups', 'join groups', 'leave groups',
                'view chats', 'create chats', 'send messages', 'create group chats',
                'view reports', 'create reports',
                'use ai chat'
              ];
            default:
              return [];
          }
        };
        
        try {
          const data = await adminService.getRolePermissions(selectedRole);
          
          if (data && Array.isArray(data)) {
            setRolePermissions(data.map(permission => 
              typeof permission === 'string' ? permission : permission.name || ''
            ));
          } else {
            // Use defaults if API response is invalid
            setRolePermissions(getDefaultRolePermissions(selectedRole));
          }
        } catch (err) {
          console.error(`Error fetching permissions for role ${selectedRole}:`, err);
          // Use defaults if API fails
          setRolePermissions(getDefaultRolePermissions(selectedRole));
        }
      } catch (err) {
        console.error(`Error in role permissions process:`, err);
        setError(`Failed to load permissions for the selected role. Using default values.`);
        
        // Set default permissions based on role
        const getDefaultRolePermissions = (role) => {
          switch (role) {
            case 'admin':
              return Object.values(permissionCategories).flat();
            case 'moderator':
              return [
                'view documents', 'approve documents', 'reject documents', 'download documents',
                'view posts', 'delete posts',
                'view reports', 'resolve reports',
                'view users', 'ban users', 'unban users',
                'view statistics', 'use ai chat'
              ];
            case 'lecturer':
              return [
                'view documents', 'create documents', 'edit documents', 'delete documents',
                'download documents', 'rate documents', 'comment documents', 'mark official documents',
                'view posts', 'create posts', 'edit posts', 'delete posts',
                'like posts', 'comment posts',
                'view groups', 'create groups', 'edit groups', 'join groups', 'leave groups',
                'view chats', 'create chats', 'send messages', 'create group chats',
                'view reports', 'create reports',
                'use ai chat'
              ];
            case 'student':
              return [
                'view documents', 'create documents', 'edit documents', 'delete documents',
                'download documents', 'rate documents', 'comment documents',
                'view posts', 'create posts', 'edit posts', 'delete posts',
                'like posts', 'comment posts',
                'view groups', 'create groups', 'edit groups', 'join groups', 'leave groups',
                'view chats', 'create chats', 'send messages', 'create group chats',
                'view reports', 'create reports',
                'use ai chat'
              ];
            default:
              return [];
          }
        };
        
        setRolePermissions(getDefaultRolePermissions(selectedRole));
      } finally {
        setLoading(false);
      }
    };
    
    fetchRolePermissions();
  }, [selectedRole]);

  // Handle permission toggle
  const handlePermissionToggle = (permission) => {
    if (rolePermissions.includes(permission)) {
      setRolePermissions(rolePermissions.filter(p => p !== permission));
    } else {
      setRolePermissions([...rolePermissions, permission]);
    }
  };

  // Handle role change
  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    setError('');
    setSuccess('');
  };

  // Save updated permissions
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await adminService.updateRolePermissions(selectedRole, rolePermissions);
      
      setSuccess('Quyền hạn đã được cập nhật thành công!');
    } catch (err) {
      console.error("Error updating permissions:", err);
      setError('Không thể cập nhật quyền hạn. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // Render loading state
  if (loading && !roles.length) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải dữ liệu quyền hạn...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <h4 className="mb-3">Quản Lý Phân Quyền</h4>
        
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        <div className="mb-3">
          <Form.Group>
            <Form.Label>Chọn vai trò</Form.Label>
            <Form.Select 
              value={selectedRole} 
              onChange={handleRoleChange}
              disabled={saving}
              className="mb-3"
              style={{ maxWidth: '300px' }}
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
        
        <h5 className="mb-3">Quyền hạn</h5>
        
        <Accordion defaultActiveKey="0" className="mb-4">
          {Object.entries(permissionCategories).map(([category, categoryPermissions], index) => (
            <Accordion.Item key={category} eventKey={String(index)}>
              <Accordion.Header>{category}</Accordion.Header>
              <Accordion.Body>
                <Row>
                  {categoryPermissions.map(permission => {
                    const permissionExists = permissions.includes(permission);
                    return permissionExists || true ? ( // Show all for now
                      <Col key={permission} xs={12} md={6} lg={4} className="mb-2">
                        <Form.Check 
                          type="checkbox"
                          id={`permission-${permission}`}
                          label={permission}
                          checked={rolePermissions.includes(permission)}
                          onChange={() => handlePermissionToggle(permission)}
                          disabled={saving}
                        />
                      </Col>
                    ) : null;
                  })}
                </Row>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
        
        <div className="d-flex justify-content-end mt-4">
          <Button 
            variant="primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <><Spinner size="sm" animation="border" className="me-2" /> Đang lưu...</> : 'Lưu thay đổi'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PermissionsManager;
