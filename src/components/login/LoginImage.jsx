import React from 'react';
import loginVisual from '../../assets/login-visual.png';

const LoginImage = () => {
  return (
    <div className="login-image-container text-center" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100%'
    }}>
      <img 
        src={loginVisual}
        alt="Educational resources illustration" 
        className="img-fluid" 
        style={{ 
          maxHeight: '400px',
          maxWidth: '100%',
          objectFit: 'contain',
          background: 'transparent' 
        }}
      />
    </div>
  );
};

export default LoginImage;
