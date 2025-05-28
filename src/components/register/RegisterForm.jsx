import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import { getRedirectPathForUser } from '../../utils/roleUtils';

const RegisterForm = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    university: '',
    department: '',
    student_id: '',
    bio: '',
  });
    const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const navigate = useNavigate();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value,
    });
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!agreeTerms) {
      setGeneralError('Bạn cần đồng ý với Điều khoản dịch vụ để tiếp tục');
      return;
    }
    
    setLoading(true);
    setErrors({});
    setGeneralError('');

    try {
      const response = await authService.register(userData);
      const user = response.user;
      
      // Dispatch custom event for Header to detect login
      window.dispatchEvent(new Event('storage'));
      
      // Determine redirect path based on user role
      const redirectPath = getRedirectPathForUser(user);
      
      // Redirect to appropriate page
      navigate(redirectPath);
    } catch (err) {
      console.error("Registration error:", err);
      
      if (err.errors) {
        // Server returned field-specific validation errors
        setErrors(err.errors);
      } else {
        setGeneralError(
          err.message || 
          'Đăng ký không thành công. Vui lòng thử lại.'
        );
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      {generalError && <Alert variant="danger">{generalError}</Alert>}
      
      <Form onSubmit={handleSubmit}>        <Form.Group className="mb-3" controlId="name">
          <Form.Label>Họ và tên</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={userData.name}
            onChange={handleChange}
            placeholder="Nhập họ và tên"
            isInvalid={!!errors.name}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.name}
          </Form.Control.Feedback>
        </Form.Group>        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            placeholder="Nhập email"
            isInvalid={!!errors.email}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.email}
          </Form.Control.Feedback>
        </Form.Group>        <Form.Group className="mb-3" controlId="phone">
          <Form.Label>Số điện thoại</Form.Label>
          <Form.Control
            type="tel"
            name="phone"
            value={userData.phone}
            onChange={handleChange}
            placeholder="Nhập số điện thoại"
            isInvalid={!!errors.phone}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.phone}
          </Form.Control.Feedback>
        </Form.Group>        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Mật khẩu</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={userData.password}
            onChange={handleChange}
            placeholder="Tạo mật khẩu"
            isInvalid={!!errors.password}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.password}
          </Form.Control.Feedback>
        </Form.Group>        <Form.Group className="mb-3" controlId="password_confirmation">
          <Form.Label>Xác nhận mật khẩu</Form.Label>
          <Form.Control
            type="password"
            name="password_confirmation"
            value={userData.password_confirmation}
            onChange={handleChange}
            placeholder="Nhập lại mật khẩu"
            isInvalid={!!errors.password_confirmation}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.password_confirmation}
          </Form.Control.Feedback>
        </Form.Group>        <Form.Group className="mb-3" controlId="university">
          <Form.Label>Trường đại học</Form.Label>
          <Form.Control
            type="text"
            name="university"
            value={userData.university}
            onChange={handleChange}
            placeholder="Nhập tên trường đại học"
            isInvalid={!!errors.university}
          />
          <Form.Control.Feedback type="invalid">
            {errors.university}
          </Form.Control.Feedback>
        </Form.Group>        <Form.Group className="mb-3" controlId="department">
          <Form.Label>Ngành học</Form.Label>
          <Form.Control
            type="text"
            name="department"
            value={userData.department}
            onChange={handleChange}
            placeholder="Nhập ngành học"
            isInvalid={!!errors.department}
          />
          <Form.Control.Feedback type="invalid">
            {errors.department}
          </Form.Control.Feedback>
        </Form.Group>        <Form.Group className="mb-3" controlId="student_id">
          <Form.Label>Mã sinh viên</Form.Label>
          <Form.Control
            type="text"
            name="student_id"
            value={userData.student_id}
            onChange={handleChange}
            placeholder="Nhập mã sinh viên"
            isInvalid={!!errors.student_id}
          />
          <Form.Control.Feedback type="invalid">
            {errors.student_id}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="terms">
          <Form.Check
            type="checkbox"
            label={
              <span>
                Tôi đồng ý với{' '}
                <Link to="/terms" style={{ color: '#0070C0' }}>
                  Điều khoản dịch vụ
                </Link>
              </span>
            }
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            required
          />
        </Form.Group>

        <Button
          variant="primary"
          type="submit"
          className="w-100 mb-3 py-2"
          style={{ backgroundColor: '#0070C0' }}
          disabled={loading || !agreeTerms}
        >
          {loading ? 'Đang xử lý...' : 'Đăng ký'}
        </Button>

        <div className="text-center mb-3">
          <span>Đã có tài khoản? </span>
          <Link to="/login" style={{ color: '#0070C0', textDecoration: 'none' }}>
            Đăng nhập
          </Link>
        </div>
      </Form>
    </>
  );
};

export default RegisterForm;
