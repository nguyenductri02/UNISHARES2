import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { profileService, authService } from '../../services';
import { ProfileContext } from '../../pages/ProfilePage';

const EditProfileInfoForm = () => {
  const { userData, loading: contextLoading, refreshUserData } = useContext(ProfileContext);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    university: '',
    department: '',
    student_id: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Use the user data from context
    if (userData) {
      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
        email: userData.email || '',
        university: userData.university || '',
        department: userData.department || '',
        student_id: userData.student_id || '',
        bio: userData.bio || ''
      });
    }
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Họ và tên không được để trống';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Số điện thoại không được để trống';
    } else if (!/^\d{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      setGeneralError('');
      setSuccess('');
      
      const response = await profileService.updateProfile(formData);
      
      if (response.success) {
        // Invalidate the cache
        authService.invalidateCache();
        
        // Refresh user data using the context function
        await refreshUserData(true);
        
        setSuccess('Thông tin hồ sơ đã được cập nhật thành công');
        
        // Redirect after successful update
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        // Don't throw an error, just set the error message from the response
        setGeneralError(response.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setGeneralError(err.message || 'Không thể cập nhật thông tin hồ sơ. Vui lòng thử lại sau.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (contextLoading || loading) {
    return <div className="text-center py-4"><Spinner animation="border" /></div>;
  }

  return (
    <div className="edit-profile-form-container">
      {generalError && <Alert variant="danger" className="mb-4">{generalError}</Alert>}
      {success && <Alert variant="success" className="mb-4">{success}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Họ và tên</Form.Label>
              <Form.Control 
                type="text" 
                name="name"
                value={formData.name} 
                onChange={handleChange}
                isInvalid={!!errors.name}
                required
              />
              <Form.Control.Feedback type="invalid">
                {errors.name}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control 
                type="tel" 
                name="phone"
                value={formData.phone} 
                onChange={handleChange}
                isInvalid={!!errors.phone}
                required
              />
              <Form.Control.Feedback type="invalid">
                {errors.phone}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                name="email"
                value={formData.email} 
                onChange={handleChange}
                isInvalid={!!errors.email}
                required
              />
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Trường đại học</Form.Label>
              <Form.Control 
                type="text" 
                name="university"
                value={formData.university} 
                onChange={handleChange}
                isInvalid={!!errors.university}
              />
              <Form.Control.Feedback type="invalid">
                {errors.university}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Ngành học</Form.Label>
              <Form.Control 
                type="text" 
                name="department"
                value={formData.department} 
                onChange={handleChange}
                isInvalid={!!errors.department}
              />
              <Form.Control.Feedback type="invalid">
                {errors.department}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Mã sinh viên</Form.Label>
              <Form.Control 
                type="text" 
                name="student_id"
                value={formData.student_id} 
                onChange={handleChange}
                isInvalid={!!errors.student_id}
              />
              <Form.Control.Feedback type="invalid">
                {errors.student_id}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-4">
          <Form.Label>Giới thiệu</Form.Label>
          <Form.Control 
            as="textarea" 
            rows={3} 
            name="bio"
            value={formData.bio} 
            onChange={handleChange}
            isInvalid={!!errors.bio}
            placeholder="Viết giới thiệu ngắn về bạn..."
          />
          <Form.Control.Feedback type="invalid">
            {errors.bio}
          </Form.Control.Feedback>
        </Form.Group>

        <div className="d-flex justify-content-between">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/profile')}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={saving}
          >
            {saving ? <><Spinner as="span" animation="border" size="sm" /> Đang lưu...</> : 'Lưu thay đổi'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default EditProfileInfoForm;
