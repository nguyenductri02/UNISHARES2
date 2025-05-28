import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { BsArrowRightShort } from 'react-icons/bs'; // Import arrow icon
import heroImage from '../../assets/hero-image.png'; // This is the image on the right in the screenshot

const HeroSection = () => {
  return (
    <section className="hero-section py-5" style={{ backgroundColor: '#e9f5ff' }}> {/* Light blue background */}
      <Container>
        <Row className="align-items-center">
          <Col lg={6} className="text-center text-lg-start"> {/* Centered text on small screens, left on large */}
            <h1 className="fw-bold mb-3" style={{ color: '#0a2540', fontSize: '2.8rem' }}>
              Chào mừng bạn đến với <span className="text-primary">UNISHARE</span> 🚀<br />
              Nền tảng học tập và chia sẻ tri thức hiện đại! 🚀
            </h1>
            <p className="my-4" style={{ fontSize: '1.1rem', color: '#333' }}>
              Kết nối, học hỏi, và phát triển cùng cộng đồng giáo dục năng động. Chia
              sẻ tài liệu, tham gia nhóm học tập, và trao đổi kiến thức dễ dàng hơn bao
              giờ hết.
            </p>
            <div className="d-flex flex-wrap justify-content-center justify-content-lg-start"> {/* Centered buttons on small screens */}
              <Button variant="primary" className="me-3 mb-2 rounded-pill px-4 py-2 fw-bold">Bắt đầu ngay hôm nay!</Button>
              <Button variant="outline-primary" className="mb-2 rounded-pill px-4 py-2 fw-bold d-flex align-items-center">
                Đăng ký ngay <BsArrowRightShort size={24} className="ms-1" />
              </Button>
            </div>
          </Col>
          <Col lg={6} className="mt-4 mt-lg-0">
            {/* The image in the screenshot shows a woman with multiple devices. 
                Ensure 'heroImage' (assets/hero-image.png) is this image. */}
            <img src={heroImage} alt="UniShare Platform - Nền tảng học tập" className="img-fluid" />
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default HeroSection;
