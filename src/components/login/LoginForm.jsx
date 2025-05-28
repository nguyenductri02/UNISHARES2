import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { authService } from '../../services';
import { getRedirectPathForUser, isAdmin } from '../../utils/roleUtils';

const LoginForm = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate input
    if (!credentials.email || !credentials.password) {
      setError('Vui lòng nhập cả email và mật khẩu');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login...');
      const response = await authService.login(credentials);
      
      if (!response || !response.user) {
        throw new Error('Đăng nhập không thành công. Dữ liệu người dùng không hợp lệ.');
      }
      
      const user = response.user;
      console.log('Login successful!');
      
      // Dispatch custom event for Header to detect login
      window.dispatchEvent(new Event('storage'));
      
      // Determine redirect path based on user role
      const redirectPath = getRedirectPathForUser(user);
      console.log(`Redirecting to: ${redirectPath}`);
      
      // Log the redirect for admin users
      if (isAdmin(user)) {
        console.log("Admin user logged in. Redirecting to admin dashboard.");
      }
      
      // Redirect to appropriate page
      navigate(redirectPath);
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle different types of errors
      if (err.errors && err.errors.email) {
        setError(err.errors.email[0]);
      } else if (err.errors && err.errors.password) {
        setError(err.errors.password[0]);
      } else {
        setError(
          err.message || 
          'Đăng nhập không thành công. Vui lòng kiểm tra lại email và mật khẩu.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            placeholder="Nhập email của bạn"
            value={credentials.email}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Mật khẩu</Form.Label>
          <Form.Control
            type="password"
            name="password"
            placeholder="Nhập mật khẩu của bạn"
            value={credentials.password}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <Form.Check
            type="checkbox"
            id="rememberMe"
            label="Ghi nhớ đăng nhập"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <Link to="/forgot-password" className="forgot-password-link" style={{ color: '#0070C0', textDecoration: 'none' }}>
            Quên mật khẩu?
          </Link>
        </div>

        <Button
          variant="primary"
          type="submit"
          className="w-100 mb-3 py-2"
          style={{ backgroundColor: '#0070C0' }}
          disabled={loading}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
        
        <div className="text-center mb-3">
          <span>Chưa có tài khoản? </span>
          <Link to="/register" style={{ color: '#0070C0', textDecoration: 'none' }}>
            Đăng ký ngay
          </Link>
        </div>
      </Form>
    </>
  );
};

export default LoginForm;
