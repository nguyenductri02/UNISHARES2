import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginHeader from '../components/login/LoginHeader';
import LoginForm from '../components/login/LoginForm';
import SocialLogin from '../components/login/SocialLogin';
import LoginImage from '../components/login/LoginImage';
import { Link, useNavigate } from 'react-router-dom';
import loginBackground from '../assets/login-background.png';
import authService from '../services/authService';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const redirect = '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Submitting login form with email:", email);
    
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Log the attempt before sending
      console.log("Calling authService.login with email:", email);
      
      const response = await authService.login({ email, password });
      
      console.log("Login successful, response:", response ? "data received" : "no data");
      
      // On success, redirect
      navigate(redirect || '/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const pageBackgroundStyle = {
    backgroundColor: '#d4eafb',
    backgroundImage: `url(${loginBackground})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: '100vh'
  };

  return (
    <div className="login-page" style={pageBackgroundStyle}>
      <Header />
      {/* Breadcrumb and Back link section */}
      <div className="container my-3">
        <div className="d-flex justify-content-between align-items-center">
          <span className="breadcrumb-text" style={{ color: '#333' }}>Trang chủ &gt; Đăng Nhập</span>
          <Link to="/" className="back-link" style={{ color: '#003366', fontWeight: 500 }}>Quay Lại <i className="fas fa-arrow-right"></i></Link>
        </div>
      </div>

      <main className="container mb-5">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-9">
            <div className="login-container p-4 p-md-5 shadow-sm" style={{ backgroundColor: '#fff', borderRadius: '12px' }}>
              <div className="row align-items-center">
                <div className="col-md-6 login-form-section">
                  <LoginHeader />
                  <LoginForm onSubmit={handleSubmit} setEmail={setEmail} setPassword={setPassword} error={error} loading={loading} />
                  <SocialLogin />
                </div>
                <div className="col-md-6 login-image-section d-none d-md-block">
                  <LoginImage />
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

export default LoginPage;
