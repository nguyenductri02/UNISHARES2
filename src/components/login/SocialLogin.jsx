import React from 'react';
import { Link } from 'react-router-dom';

const SocialLogin = () => {
  return (
    <>
      <div className="social-login text-center mt-4">
        <p className="mb-2">Đăng Nhập Với</p>
        <div className="d-flex justify-content-center">
          <Link to="#" className="social-icon-link mx-2">
            <img src="https://img.icons8.com/color/48/000000/twitter--v1.png" alt="Twitter" style={{ width: '40px', height: '40px' }}/>
          </Link>
          <Link to="#" className="social-icon-link mx-2">
            <img src="https://img.icons8.com/color/48/000000/facebook-new.png" alt="Facebook" style={{ width: '40px', height: '40px' }}/>
          </Link>
          <Link to="#" className="social-icon-link mx-2">
            <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google" style={{ width: '40px', height: '40px' }}/>
          </Link>
        </div>
      </div>
    </>
  );
};

export default SocialLogin;
