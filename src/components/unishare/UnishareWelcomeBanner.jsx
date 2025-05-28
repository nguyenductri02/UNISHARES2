import React from 'react';
import unishareBannerBg from '../../assets/unishare-bg.png';

const UnishareWelcomeBanner = () => {
  const bannerStyle = {
    backgroundImage: `url(${unishareBannerBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    width: '100%',
    minHeight: 320,
    borderRadius: '1.2rem',
    boxShadow: '0 4px 24px 0 rgba(3,112,183,0.10)',
    marginBottom: '2rem',
    border: 'none',
    overflow: 'hidden',
    backgroundColor: '#d4eafb', // Light blue background to match the login page
  };

  return (
    <div className="welcome-banner" style={bannerStyle}>
      {/* You could add content here similar to the login page content if needed */}
    </div>
  );
};

export default UnishareWelcomeBanner;
