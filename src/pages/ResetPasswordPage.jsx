import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import uniShareLogo from '../assets/unishare-logo.png';
import registerBackground from '../assets/register-background.png';
import passwordService from '../services/passwordService';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  const pageBackgroundStyle = {
    backgroundColor: '#d4eafb',
    backgroundImage: `url(${registerBackground})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: '100vh'
  };

  useEffect(() => {
    // Extract token and email from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get('token');
    const emailParam = queryParams.get('email');

    if (!tokenParam || !emailParam) {
      setError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (password !== passwordConfirmation) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await passwordService.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation
      });
      
      setSuccess(response.message || 'Mật khẩu đã được đặt lại thành công.');
      setPassword('');
      setPasswordConfirmation('');
      
      // Redirect to login page after success
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      if (err.errors) {
        // Handle validation errors
        const errorMessages = Object.values(err.errors).flat();
        setError(errorMessages.join(', '));
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/login');
  };

  return (
    <div className="reset-password-page" style={pageBackgroundStyle}>
      <Header />
      
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center">
          <span className="breadcrumb-text" style={{ color: '#333' }}>Trang chủ &gt; Đặt lại mật khẩu</span>
          <Link to="/login" className="back-link" style={{ color: '#003366', fontWeight: 500 }}>
            Đăng nhập <i className="fas fa-sign-in-alt"></i>
          </Link>
        </div>
      </div>

      <main className="container my-4">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            <div className="reset-password-container p-4 p-md-5 shadow" style={{ backgroundColor: '#fff', borderRadius: '12px' }}>
              <h2 className="text-center mb-4" style={{ fontSize: '1.75rem', color: '#0070C0', fontWeight: 'bold' }}>
                ĐẶT LẠI MẬT KHẨU
              </h2>

              {email && (
                <p className="text-center mb-4 small text-muted">
                  Đặt lại mật khẩu cho tài khoản: <strong>{email}</strong>
                </p>
              )}

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <form onSubmit={handleSubmit}>
                {/* New Password Field */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Mật khẩu mới <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    placeholder="Nhập mật khẩu mới"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || !token || !email}
                    minLength={8}
                  />
                </div>

                {/* Confirm Password Field */}
                <div className="mb-4">
                  <label htmlFor="passwordConfirmation" className="form-label">
                    Xác nhận mật khẩu mới <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="passwordConfirmation"
                    placeholder="Xác nhận mật khẩu mới"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    required
                    disabled={loading || !token || !email}
                    minLength={8}
                  />
                </div>

                {/* Buttons */}
                <div className="d-flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-outline-secondary flex-grow-1"
                    disabled={loading}
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-grow-1"
                    style={{ backgroundColor: '#0070C0' }}
                    disabled={loading || !token || !email}
                  >
                    {loading ? 'Đang xử lý...' : 'Xác nhận'}
                  </button>
                </div>
              </form>

              {/* Footer Logo */}
              <div className="text-center mt-5">
                <Link to="/">
                  <img
                    src={uniShareLogo}
                    alt="UNISHARE"
                    style={{ height: '60px', marginBottom: '10px' }}
                  />
                </Link>
                <div className="fw-bold text-primary">UNISHARE</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
