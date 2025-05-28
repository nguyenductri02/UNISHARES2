import React from 'react';
import registerVisual from '../../assets/register-visual.png';

const RegisterImage = () => {
  return (
    <div className="register-image-container text-center" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100%'
    }}>
      <img 
        src={registerVisual}
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

export default RegisterImage;
