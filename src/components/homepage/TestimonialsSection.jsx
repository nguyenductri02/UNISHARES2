import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import avatar1 from '../../assets/avatar-1.png';
import avatar2 from '../../assets/avatar-2.png';
import avatar3 from '../../assets/avatar-3.png';

// Hardcoded testimonial data
const testimonials = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    role: 'Sinh viên Đại học Khoa học Tự nhiên',
    content: 'UniShare đã giúp tôi tìm được rất nhiều tài liệu học tập chất lượng. Tôi đã cải thiện điểm số đáng kể nhờ vào nền tảng này!',
    avatar: avatar1
  },
  {
    id: 2,
    name: 'Trần Thị B',
    role: 'Sinh viên năm 3, Đại học Công nghệ',
    content: 'Tôi thực sự ấn tượng với cộng đồng học tập tại UniShare. Mọi người rất nhiệt tình giúp đỡ và chia sẻ kiến thức với nhau.',
    avatar: avatar2
  },
  {
    id: 3,
    name: 'Lê Văn C',
    role: 'Sinh viên năm cuối, Đại học Bách Khoa',
    content: 'Nhờ các nhóm học tập trên UniShare, tôi đã kết nối được với nhiều bạn cùng ngành và tạo được mạng lưới quan hệ rộng lớn.',
    avatar: avatar3
  }
];

const TestimonialsSection = () => {
  return (
    <section className="testimonials-section py-5 bg-light">
      <Container>
        <h2 className="text-center mb-5">Học viên nói gì về Unishare</h2>
        <Row>
          {testimonials.map((testimonial) => (
            <Col md={4} className="mb-4" key={testimonial.id}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name} 
                      className="rounded-circle me-3" 
                      width="60" 
                      height="60"
                    />
                    <div>
                      <h5 className="mb-0">{testimonial.name}</h5>
                      <p className="text-muted mb-0">{testimonial.role}</p>
                    </div>
                  </div>
                  <Card.Text>"{testimonial.content}"</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default TestimonialsSection;
