import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaSyncAlt } from 'react-icons/fa';
import { authService } from '../../services';
import { Alert } from 'react-bootstrap';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    
    try {
      // Call the forgot password API
      const response = await authService.forgotPassword(email);
      setSuccess(response.message || 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.');
      
      // Clear form
      setEmail('');
      setCaptcha('');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(
        err.message || 
        'Không thể gửi email đặt lại mật khẩu. Vui lòng kiểm tra kết nối và thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text" style={{ backgroundColor: 'white', border: '1px solid #ced4da' }}>
            <FaEnvelope style={{ color: '#0070C0' }} />
          </span>
          <input 
            type="email" 
            className="form-control" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
      </div>
      
      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text" style={{ backgroundColor: 'white', border: '1px solid #ced4da' }}>
            <FaSyncAlt style={{ color: '#0070C0' }} />
          </span>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Mã xác nhận" 
            value={captcha}
            onChange={(e) => setCaptcha(e.target.value)}
            required 
          />
        </div>
      </div>
      
      <div className="d-flex justify-content-between mb-4">
        <button 
          type="button" 
          className="btn btn-secondary" 
          style={{ 
            borderRadius: '5px',
            width: '45%',
            backgroundColor: '#6c757d',
            border: 'none'
          }}
          onClick={() => window.history.back()}
        >
          Quay lại
        </button>
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={isSubmitting}
          style={{ 
            borderRadius: '5px',
            width: '45%',
            backgroundColor: '#0070C0',
            border: 'none'
          }}
        >
          {isSubmitting ? 'Đang xử lý...' : 'Tiếp tục'}
        </button>
      </div>

      <div className="text-center mt-4 mb-3">
        <small>Đã nhớ mật khẩu? <Link to="/login" style={{ color: '#0070C0', fontWeight: 'bold' }}>Đăng nhập ngay</Link></small>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
