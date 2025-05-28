import React from 'react';
import { Container, Row, Col, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaYoutube, FaInstagram, FaTwitter } from 'react-icons/fa';
import uniShareLogo from '../assets/unishare-logo.png';

const Footer = () => {
  return (
    <footer className="bg-white py-5">
      <Container>
        <Row className="mb-4">
          <Col md={4} className="mb-4 mb-md-0">
            <div className="mb-4">
              <Image src={uniShareLogo} alt="UNISHARE" style={{ maxWidth: '150px' }} />
            </div>
            <h5 className="text-primary mb-4">Thông Tin Liên Hệ :</h5>
            <div className="d-flex align-items-center mb-3">
              <div className="text-primary me-3">
                <i className="fas fa-phone-alt"></i>
              </div>
              <div>0917639460 / 0905817290</div>
            </div>
            <div className="d-flex align-items-center mb-3">
              <div className="text-primary me-3">
                <i className="fas fa-envelope"></i>
              </div>
              <div>nnntt1223344@gmail.com</div>
            </div>
            <div className="d-flex align-items-start mb-3">
              <div className="text-primary me-3 mt-1">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div>
                254 Nguyễn Văn Linh, Phường Thác Gián,<br />
                Quận Thanh Thế, Thành Phố Đà Nẵng
              </div>
            </div>
          </Col>
          
          <Col md={4} className="mb-4 mb-md-0">
            <div className="mb-4 invisible">
              <span style={{ maxWidth: '150px', display: 'block' }}>&nbsp;</span>
            </div>
            <h5 className="text-primary mb-4">Các Danh Mục :</h5>
            <ul className="list-unstyled">
              <li className="mb-3">
                <Link to="/" className="text-decoration-none text-dark">
                  › Về UNISHARE
                </Link>
              </li>
              <li className="mb-3">
                <Link to="/" className="text-decoration-none text-dark">
                  › Hỗ Trợ
                </Link>
              </li>
              <li className="mb-3">
                <Link to="/" className="text-decoration-none text-dark">
                  › Giảng Viên
                </Link>
              </li>
              <li className="mb-3">
                <Link to="/unishare-files" className="text-decoration-none text-dark">
                  › Tài Liệu
                </Link>
              </li>
              <li className="mb-3">
                <Link to="/unishare/groups" className="text-decoration-none text-dark">
                  › Group
                </Link>
              </li>
              <li className="mb-3">
                <Link to="/" className="text-decoration-none text-dark">
                  › Tin Tức
                </Link>
              </li>
            </ul>
          </Col>
          
          <Col md={4} className="mb-4 mb-md-0">
            <div className="mb-4 invisible">
              <span style={{ maxWidth: '150px', display: 'block' }}>&nbsp;</span>
            </div>
            <h5 className="text-primary mb-4">Theo Dõi Chúng Tôi :</h5>
            <div className="mb-4">
              <Link to="#" className="me-3">
                <FaFacebookF size={28} style={{color: '#1877F2'}} />
              </Link>
              <Link to="#" className="me-3">
                <FaYoutube size={28} style={{color: '#FF0000'}} />
              </Link>
              <Link to="#" className="me-3">
                <FaInstagram size={28} style={{color: '#C13584'}} />
              </Link>
              <Link to="#">
                <FaTwitter size={28} style={{color: '#1DA1F2'}} />
              </Link>
            </div>
            <div>
              <Link to="/" className="text-decoration-none text-dark d-block mb-3">
                › Chính sách bảo mật
              </Link>
              <Link to="/" className="text-decoration-none text-dark mb-3 d-block">
                › Điều khoản dịch vụ
              </Link>
            </div>
          </Col>
        </Row>
        <div className="pt-3 mt-3 border-top text-center">
          <p className="mb-0 text-muted">© {new Date().getFullYear()} UNISHARE. All Rights Reserved.</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
