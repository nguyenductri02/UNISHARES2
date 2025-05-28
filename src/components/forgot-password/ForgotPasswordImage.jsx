import React from 'react';
import registerVisual from '../../assets/register-visual.png';

const ForgotPasswordImage = () => {
  return (
    <div className="forgot-password-image-container text-center" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100%'
    }}>
      <img 
        src={registerVisual}
        alt="Forgot password illustration" 
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

export default ForgotPasswordImage;
