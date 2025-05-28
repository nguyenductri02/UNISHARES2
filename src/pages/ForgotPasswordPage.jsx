import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import uniShareLogo from '../assets/unishare-logo.png';
import registerBackground from '../assets/register-background.png';
import { authService } from '../services';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const pageBackgroundStyle = {
    backgroundColor: '#d4eafb',
    backgroundImage: `url(${registerBackground})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: '100vh'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.forgotPassword(email);
      setSuccess(response.message || 'Email đặt lại mật khẩu đã được gửi');
      setEmail('');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      if (err.response && err.response.data) {
        if (err.response.data.errors && err.response.data.errors.email) {
          setError(err.response.data.errors.email[0]);
        } else if (err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Có lỗi xảy ra khi gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.');
        }
      } else {
        setError('Có lỗi xảy ra khi gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page" style={pageBackgroundStyle}>
      <Header />
      
      <div className="container my-3">
        <div className="d-flex justify-content-between align-items-center">
          <span className="breadcrumb-text" style={{ color: '#333' }}>Trang chủ &gt; Quên mật khẩu</span>
          <Link to="/" className="back-link" style={{ color: '#003366', fontWeight: 500 }}>Quay Lại <i className="fas fa-arrow-right"></i></Link>
        </div>
      </div>

      <main className="container mb-5">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            <div className="forgot-password-container p-4 p-md-5 shadow-sm" style={{ backgroundColor: '#fff', borderRadius: '12px' }}>
              <h2 className="text-center mb-3" style={{ fontSize: '2rem', color: '#0070C0', fontWeight: 'bold' }}>QUÊN MẬT KHẨU</h2>
              
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="form-label">Email đã đăng ký</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    id="email"
                    placeholder="Nhập email của bạn" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="d-flex justify-content-between mb-4">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ width: '45%' }}
                    onClick={() => navigate('/login')}
                    disabled={loading}
                  >
                    Quay lại
                  </button>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '45%', backgroundColor: '#0070C0' }}
                    disabled={loading}
                  >
                    {loading ? 'Đang xử lý...' : 'Tiếp tục'}
                  </button>
                </div>
              </form>
              
              <div className="text-center mt-4">
                <img 
                  src={uniShareLogo} 
                  alt="Unishare Logo" 
                  style={{ height: '60px', marginBottom: '10px' }}
                />
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

export default ForgotPasswordPage;
