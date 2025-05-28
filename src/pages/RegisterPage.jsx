import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import RegisterHeader from '../components/register/RegisterHeader';
import RegisterForm from '../components/register/RegisterForm';
import RegisterImage from '../components/register/RegisterImage';
import registerBackground from '../assets/register-background.png';

const RegisterPage = () => {
  const pageBackgroundStyle = {
    backgroundColor: '#d4eafb',
    backgroundImage: `url(${registerBackground})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: '100vh'
  };

  return (
    <div className="register-page" style={pageBackgroundStyle}>
      <Header />
      
      <div className="container my-3">
        <div className="d-flex justify-content-between align-items-center">
          <span className="breadcrumb-text" style={{ color: '#333' }}>Trang chủ &gt; Đăng ký</span>
          <Link to="/" className="back-link" style={{ color: '#003366', fontWeight: 500 }}>Quay Lại <i className="fas fa-arrow-right"></i></Link>
        </div>
      </div>

      <main className="container mb-5">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-9">
            <div className="register-container p-4 p-md-5 shadow-sm" style={{ backgroundColor: '#fff', borderRadius: '12px' }}>
              <div className="row align-items-center">
                <div className="col-md-6 order-md-2 register-image-section d-none d-md-block">
                  <RegisterImage />
                </div>
                <div className="col-md-6 order-md-1 register-form-section">
                  <RegisterHeader />
                  <RegisterForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RegisterPage;
