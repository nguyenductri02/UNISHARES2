import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaLock, FaSyncAlt } from 'react-icons/fa';

const ResetPasswordForm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Mật khẩu không khớp');
      return;
    }
    
    setIsSubmitting(true);
    
    // Here you would handle the password reset request
    // For now, we'll simulate navigation to the login screen
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text" style={{ backgroundColor: 'white', border: '1px solid #ced4da' }}>
            <FaLock style={{ color: '#0070C0' }} />
          </span>
          <input 
            type="password" 
            className="form-control" 
            placeholder="Mật khẩu mới" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
      </div>
      
      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text" style={{ backgroundColor: 'white', border: '1px solid #ced4da' }}>
            <FaLock style={{ color: '#0070C0' }} />
          </span>
          <input 
            type="password" 
            className="form-control" 
            placeholder="Xác nhận mật khẩu mới" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required 
          />
        </div>
      </div>
      
      <div className="mb-4 d-flex">
        <div className="captcha-container p-2 me-2 bg-dark text-white" style={{ width: '60%', borderRadius: '5px' }}>
          R27F0
        </div>
        <button 
          type="button" 
          className="btn btn-outline-secondary" 
          style={{ width: '40px' }}
        >
          <FaSyncAlt />
        </button>
      </div>
      
      <div className="mb-4">
        <input 
          type="text" 
          className="form-control" 
          placeholder="CAPTCHA" 
          value={captcha}
          onChange={(e) => setCaptcha(e.target.value)}
          required 
        />
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
          Xác nhận
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
