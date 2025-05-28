import React from 'react';
import { Link } from 'react-router-dom';

const SocialRegister = () => {
  return (
    <>
      <div className="social-login text-center mt-4">
        <p className="mb-2">Đăng Ký Với</p>
        <div className="d-flex justify-content-center">
          <Link to="#" className="social-icon-link mx-2">
            <img src="https://img.icons8.com/color/48/000000/twitter--v1.png" alt="Twitter" style={{ width: '40px', height: '40px', objectFit: 'contain' }}/>
          </Link>
          <Link to="#" className="social-icon-link mx-2">
            <img src="https://img.icons8.com/color/48/000000/facebook-new.png" alt="Facebook" style={{ width: '40px', height: '40px', objectFit: 'contain' }}/>
          </Link>
          <Link to="#" className="social-icon-link mx-2">
            <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google" style={{ width: '40px', height: '40px', objectFit: 'contain' }}/>
          </Link>
        </div>
      </div>
      <div className="text-center mt-4">
        <p>Đã có tài khoản? <Link to="/login" className="fw-bold" style={{color: '#007bff'}}>Đăng nhập ngay</Link></p>
      </div>
    </>
  );
};

export default SocialRegister;
