import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../services';

const ChangePasswordForm = () => {
  const [formData, setFormData] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [generalError, setGeneralError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear errors for this field when user starts typing
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.current_password) {
      newErrors.current_password = 'Vui lòng nhập mật khẩu hiện tại';
    }
    
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu mới';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Vui lòng xác nhận mật khẩu mới';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Xác nhận mật khẩu không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setGeneralError('');
      setSuccess('');
      
      await profileService.changePassword(formData);
      
      setSuccess('Mật khẩu đã được thay đổi thành công');
      setFormData({
        current_password: '',
        password: '',
        password_confirmation: ''
      });
      
      // Redirect after successful password change
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      console.error("Error changing password:", err);
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setGeneralError(err.message || 'Không thể thay đổi mật khẩu. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-form-container">
      {generalError && <Alert variant="danger" className="mb-4">{generalError}</Alert>}
      {success && <Alert variant="success" className="mb-4">{success}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Mật khẩu hiện tại</Form.Label>
          <Form.Control 
            type="password" 
            name="current_password"
            value={formData.current_password} 
            onChange={handleChange}
            isInvalid={!!errors.current_password}
          />
          <Form.Control.Feedback type="invalid">
            {errors.current_password}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Mật khẩu mới</Form.Label>
          <Form.Control 
            type="password" 
            name="password"
            value={formData.password} 
            onChange={handleChange}
            isInvalid={!!errors.password}
          />
          <Form.Control.Feedback type="invalid">
            {errors.password}
          </Form.Control.Feedback>
          <Form.Text className="text-muted">
            Mật khẩu phải có ít nhất 8 ký tự
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Xác nhận mật khẩu mới</Form.Label>
          <Form.Control 
            type="password" 
            name="password_confirmation"
            value={formData.password_confirmation} 
            onChange={handleChange}
            isInvalid={!!errors.password_confirmation}
          />
          <Form.Control.Feedback type="invalid">
            {errors.password_confirmation}
          </Form.Control.Feedback>
        </Form.Group>

        <div className="d-flex justify-content-between">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/profile')}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            style={{ backgroundColor: '#0070C0' }}
            disabled={loading}
          >
            {loading ? <><Spinner as="span" animation="border" size="sm" /> Đang xử lý...</> : 'Đổi mật khẩu'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ChangePasswordForm;
