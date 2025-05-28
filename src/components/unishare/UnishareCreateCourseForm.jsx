import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Image, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { BsUpload } from 'react-icons/bs';
import userAvatar from '../../assets/avatar-1.png';
import { groupService, authService } from '../../services';

const UnishareCreateCourseForm = ({ onGroupCreated }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [canCreateGroups, setCanCreateGroups] = useState(null);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'course',
    course_code: '',
    members_can_upload: true,
  });

  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);

  // Check permissions when component mounts
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setCheckingPermissions(true);
        
        // Get user information for logging
        const userData = authService.getUser();
        console.log('Current user checking permissions:', userData);
        
        // Check for lecturer role explicitly
        let isLecturer = false;
        
        if (userData?.roles) {
          const roles = Array.isArray(userData.roles) ? userData.roles : [userData.roles];
          console.log('User roles:', JSON.stringify(roles));
          
          isLecturer = roles.some(role => {
            const roleName = typeof role === 'string' ? role : (role.name || '');
            return roleName.toLowerCase() === 'lecturer';
          });
          
          console.log('Is user a lecturer based on role check?', isLecturer);
          
          if (isLecturer) {
            console.log('User is a lecturer, granting permission to create groups');
            setCanCreateGroups(true);
            setCheckingPermissions(false);
            return;
          }
        }
          // Log user permissions if available
        if (userData?.permissions) {
          console.log('User permissions:', userData.permissions);
          if (userData.permissions.includes('create groups')) {
            console.log('User has explicit "create groups" permission');
            setCanCreateGroups(true);
            setCheckingPermissions(false);
            return;
          }
        }
        
        // If not a lecturer, check with the service
        const canCreate = await groupService.canCreateGroups();
        console.log('Can create groups result:', canCreate);
        
        setCanCreateGroups(canCreate);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setCanCreateGroups(false);
      } finally {
        setCheckingPermissions(false);
      }
    };

    checkPermissions();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setCoverImage(selectedFile);
      setCoverImagePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canCreateGroups) {
      setError('Bạn không có quyền tạo nhóm học. Hãy liên hệ quản trị viên để được cấp quyền.');
      return;
    }
    
    // Check if user is logged in and has an ID
    const currentUser = authService.getUser();
    if (!currentUser || !currentUser.id) {
      setError('Không thể xác định thông tin người dùng. Vui lòng đăng nhập lại.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Build form data for API submission
      const groupData = { ...formData };
      
      // Explicitly add creator_id to the form data
      groupData.creator_id = currentUser.id;
      console.log('Setting creator_id in form:', currentUser.id);
      
      if (coverImage) {
        groupData.cover_image = coverImage;
      }
      
      const response = await groupService.createGroup(groupData);
      
      if (response.success) {
        setSuccess(true);
        
        // Notify parent component about the new group
        if (onGroupCreated) onGroupCreated();
        
        // Redirect to the new group page after a brief delay
        setTimeout(() => {
          navigate(`/unishare/groups/${response.data.id}`);
        }, 1500);
      } else {
        setError(response.message || 'Không thể tạo nhóm. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Đã xảy ra lỗi khi tạo nhóm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/unishare/my-groups');
  };

  // If still checking permissions, show loading indicator
  if (checkingPermissions) {
    return (
      <div className="bg-white rounded shadow p-4 text-center" style={{ border: '2px solid #b3d8f6', borderRadius: '1rem' }}>
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang kiểm tra quyền tạo nhóm...</p>
      </div>
    );
  }

  // If user can't create groups, show a helpful message
  if (canCreateGroups === false) {
    const user = authService.getUser();
    const userRoles = user?.roles 
      ? (Array.isArray(user.roles) ? user.roles : [user.roles])
        .map(r => typeof r === 'string' ? r : r.name)
        .join(', ')
      : 'Unknown';
    
    return (
      <div className="bg-white rounded shadow p-4" style={{ border: '2px solid #b3d8f6', borderRadius: '1rem' }}>
        <h4 className="text-primary mb-4 fw-bold">Tạo nhóm học</h4>
        
        <Alert variant="warning">
          <Alert.Heading>Không có quyền tạo nhóm</Alert.Heading>
          <p>
            Bạn không có quyền tạo nhóm học mới trong hệ thống. Điều này có thể do vai trò hiện tại của bạn 
            không được cấp quyền này.
          </p>
          <hr />
          <p>
            <strong>Vai trò hiện tại:</strong> {userRoles}
          </p>
          <p className="mb-0">
            Vui lòng liên hệ với quản trị viên để được cấp quyền tạo nhóm học hoặc tham gia các nhóm đã có.
          </p>
        </Alert>
        
        <div className="d-flex justify-content-end mt-3">
          <Button 
            variant="primary" 
            onClick={() => navigate('/unishare')}
            style={{ 
              background: 'linear-gradient(90deg, #0370b7 60%, #4fc3f7 100%)',
              borderRadius: '0.5rem',
              border: 'none'
            }}
          >
            Quay lại trang chủ
          </Button>
        </div>
      </div>
    );
  }

  // Normal form display
  return (
    <div className="bg-white rounded shadow p-4" style={{ border: '2px solid #b3d8f6', borderRadius: '1rem' }}>
      <h4 className="text-primary mb-4 fw-bold">Tạo nhóm học</h4>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-4">
          Nhóm học đã được tạo thành công! Đang chuyển hướng...
        </Alert>
      )}
      
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={8}>
            {/* Left side form */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">1. Ảnh nhóm:</Form.Label>
              <div className="d-flex align-items-center mb-2">
                <Image 
                  src={coverImagePreview || userAvatar} 
                  alt="Course thumbnail" 
                  style={{ 
                    width: 100, 
                    height: 100, 
                    objectFit: 'cover', 
                    borderRadius: '50%',
                    border: '2px solid #b3d8f6',
                  }}
                />
                <div className="ms-3">
                  <p className="text-muted mb-1">Chọn đăng Png, Jpg</p>
                  <div>
                    <Form.Control 
                      type="file" 
                      id="coverImage" 
                      onChange={handleImageChange}
                      hidden
                      accept="image/png,image/jpeg,image/jpg"
                    />
                    <label 
                      htmlFor="coverImage" 
                      className="btn btn-outline-primary"
                      style={{
                        fontSize: '0.9rem',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '0.5rem'
                      }}
                    >
                      <BsUpload className="me-2" />
                      Tải lên
                    </label>
                  </div>
                </div>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">2. Tên nhóm: <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Tên nhóm - Mô tả sơ lược..."
                style={{ borderRadius: '0.5rem', padding: '0.6rem 1rem' }}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">3. Mã khóa học:</Form.Label>
              <Form.Control 
                type="text" 
                name="course_code"
                value={formData.course_code}
                onChange={handleChange}
                placeholder="VD: CS101, MATH202..."
                style={{ borderRadius: '0.5rem', padding: '0.6rem 1rem' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">4. Mô tả: <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả chi tiết nhóm..."
                style={{ borderRadius: '0.5rem', padding: '0.6rem 1rem' }}
                required
              />
            </Form.Group>
          </Col>

          <Col md={4}>
            {/* Right side form */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">5. Loại nhóm:</Form.Label>
              <Form.Select 
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={{ borderRadius: '0.5rem', padding: '0.6rem 1rem' }}
              >
                <option value="course">Khóa học</option>
                <option value="university">Trường đại học</option>
                <option value="interest">Nhóm sở thích</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">6. Cài đặt:</Form.Label>
              
              <Form.Check 
                type="checkbox" 
                id="membersCanUpload"
                name="members_can_upload"
                checked={formData.members_can_upload}
                onChange={handleChange}
                label="Cho phép thành viên đăng tài liệu"
              />
            </Form.Group>

            <div className="d-flex gap-2 justify-content-end mt-5">
              <Button 
                variant="secondary" 
                className="px-4" 
                style={{ borderRadius: '0.5rem' }}
                onClick={handleCancel}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                className="px-4" 
                style={{ 
                  background: 'linear-gradient(90deg, #0370b7 60%, #4fc3f7 100%)',
                  borderRadius: '0.5rem',
                  border: 'none'
                }}
                disabled={loading}
              >
                {loading ? (
                  <><Spinner animation="border" size="sm" /> Đang tạo...</>
                ) : (
                  'Tạo nhóm'
                )}
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default UnishareCreateCourseForm;
