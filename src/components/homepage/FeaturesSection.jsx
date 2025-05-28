import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Image, Card, Spinner } from 'react-bootstrap';
import featureImage from '../../assets/feature-image.png';
import { BsCheckCircle } from 'react-icons/bs';
// Import homeService directly for use within this component only
import homeService from '../../services/homeService';

// Assuming icon assets are in src/assets/
import iconHeSinhThai from '../../assets/icon-he-sinh-thai.png';
import iconKienThuc from '../../assets/icon-kien-thuc.png';
import iconNoiDung from '../../assets/icon-noi-dung.png';
import iconKetNoi from '../../assets/icon-ket-noi.png';

const featuresData = {
  left: [
    {
      icon: iconHeSinhThai,
      title: 'Hệ sinh thái đa dạng',
      description: 'UNISHARE hướng tới xây dựng và phát triển hệ sinh thái học tập trực tuyến trên nhiều lĩnh vực, dành cho tất cả người dùng sử dụng trang web'
    },
    {
      icon: iconKienThuc,
      title: 'Kiến thức đến từ các chuyên gia hàng đầu',
      description: 'UNISHARE chọn hợp tác với chuyên gia hàng đầu trong các lĩnh vực để cung cấp đến bạn kiến thức chất lượng, chính xác'
    }
  ],
  right: [
    {
      icon: iconNoiDung,
      title: 'Nội dung phong phú, đa dạng',
      description: 'Bạn có thể học ngoại ngữ, ôn luyện kiến thức, học kỹ năng mềm, ... Bạn cũng có thể học tập nâng cao kiến thức để phát triển nghề nghiệp của bạn với UNISHARE'
    },
    {
      icon: iconKetNoi,
      title: 'Kết nối với bạn 24/7',
      description: 'Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng lắng nghe và giải đáp tất cả các thắc mắc của bạn'
    }
  ]
};

const FeatureItem = ({ icon, title, description }) => (
  <div className="feature-item mb-4 pb-2">
    <Row className="g-2 align-items-start">
      <Col xs="auto">
        <Image src={icon} alt={title} style={{ width: '35px', height: '35px', marginTop: '5px' }} />
      </Col>
      <Col>
        <h5 className="text-primary fw-bold mb-1" style={{ fontSize: '1.1rem' }}>{title}</h5>
        <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: '#333' }}>{description}</p>
      </Col>
    </Row>
  </div>
);

const ValuePropCard = ({ text, value }) => (
  <Col md={3} sm={6} className="mb-4">
    <Card className="h-100 text-center py-3 px-2 rounded-3 border shadow-sm">
      <Card.Body className="d-flex flex-column align-items-center justify-content-center">
        <BsCheckCircle size={28} className="text-warning mb-2" />
        {value && <h4 className="fw-bold text-primary mb-2">{value.toLocaleString()}</h4>}
        <p className="fw-medium mb-0" style={{ fontSize: '0.95rem' }}>{text}</p>
      </Card.Body>
    </Card>
  </Col>
);

const FeaturesSection = () => {
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    documents: 0,
    completions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await homeService.getPlatformStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching platform stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <section className="features-section py-5 bg-white">
      <Container>
        <div className="text-center mb-5">
          <h4 className="fw-normal" style={{ marginBottom: '0.25rem', fontSize: '1.2rem' }}>Vì sao nên chọn</h4>
          <h2 className="text-primary fw-bold" style={{ fontSize: '2.2rem' }}>UNISHARE để học tập ?</h2>
        </div>

        <Row className="align-items-center justify-content-center">
          <Col lg={3} md={5} className="mb-4 mb-lg-0 text-lg-end">
            {featuresData.left.map(feature => (
              <FeatureItem key={feature.title} icon={feature.icon} title={feature.title} description={feature.description} />
            ))}
          </Col>

          <Col lg={5} md={7} className="text-center mb-4 mb-lg-0 px-lg-4">
            <Image src={featureImage} alt="UNISHARE để học tập" className="img-fluid mb-4" style={{ maxHeight: '350px' }} />
            <Button variant="outline-primary" className="px-4 py-2" style={{borderRadius: '8px', borderWidth: '1.5px'}}>
              Đăng ký ngay <span className="ms-2">&rarr;</span>
            </Button>
          </Col>

          <Col lg={3} md={5} className="mb-4 mb-lg-0 text-lg-start">
            {featuresData.right.map(feature => (
              <FeatureItem key={feature.title} icon={feature.icon} title={feature.title} description={feature.description} />
            ))}
          </Col>
        </Row>

        {/* Platform Stats Section */}
        <Row className="mt-5 pt-4 justify-content-center">
          {loading ? (
            <Col className="text-center">
              <Spinner animation="border" variant="primary" size="sm" />
            </Col>
          ) : (
            <>
              <ValuePropCard text="Người dùng" value={stats.users} />
              <ValuePropCard text="Khóa học" value={stats.courses} />
              <ValuePropCard text="Tài liệu" value={stats.documents} />
              <ValuePropCard text="Lượt hoàn thành" value={stats.completions} />
            </>
          )}
        </Row>
      </Container>
    </section>
  );
};

// Export at the end to avoid circular dependencies
export default FeaturesSection;
