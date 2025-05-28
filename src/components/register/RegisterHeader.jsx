import React from 'react';

const RegisterHeader = () => {
  const titleStyle = {
    color: '#0070C0', 
    fontWeight: 'bold',
    position: 'relative',
    display: 'inline-block', 
    paddingBottom: '10px'
  };

  // This is a trick to create the underline using ::after in inline styles
  const TitleWithUnderline = ({ children }) => (
    <div style={{ position: 'relative', textAlign: 'center' }}>
      <h3 style={titleStyle}>{children}</h3>
      <div style={{
        content: '""',
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: '0',
        width: '50px',
        height: '3px',
        backgroundColor: '#0070C0'
      }} />
    </div>
  );

  return (
    <>
      <h2 className="text-center mb-3" style={{ fontSize: '1.75rem' }}>
        Học Tập Cùng <span style={{ color: '#0070C0', fontWeight: 'bold' }}>UNISHARE</span> Ngay Thôi Nào !
      </h2>
      <div className="text-center mb-4">
        <TitleWithUnderline>ĐĂNG KÝ</TitleWithUnderline>
      </div>
    </>
  );
};

export default RegisterHeader;
