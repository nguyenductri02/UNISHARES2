import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import homeService from '../../services/homeService';
import defaultCourseImage from '../../assets/course-placeholder.png';

const CoursesSection = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await homeService.getPopularCourses();
        setCourses(data);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <section className="courses-section py-5 bg-light">
      <Container>
        <h2 className="text-center mb-5">Khóa học phổ biến nhất</h2>
        
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : error ? (
          <Alert variant="danger" className="text-center">
            {error}
          </Alert>
        ) : (
          <>
            <Row>
              {courses.length > 0 ? (
                courses.map(course => (
                  <Col md={3} sm={6} className="mb-4" key={course.id}>
                    <Card className="h-100 border-0 shadow-sm">
                      <div className="course-img-container" style={{ height: "160px", overflow: "hidden" }}>
                        <Card.Img 
                          variant="top" 
                          src={course.thumbnail || defaultCourseImage} 
                          alt={course.title}
                          style={{ objectFit: "cover", height: "100%", width: "100%" }}
                        />
                      </div>
                      <Card.Body>
                        <Card.Title>{course.title}</Card.Title>
                        <Card.Text>{course.description}</Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold text-primary">
                            {course.price ? `${course.price.toLocaleString()}đ` : 'Miễn phí'}
                          </span>
                          <Link to={`/unishare/groups/${course.id}`}>
                            <Button variant="outline-primary" size="sm">Chi tiết</Button>
                          </Link>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col className="text-center py-4">
                  <p>Không có khóa học nào hiện tại.</p>
                </Col>
              )}
            </Row>
          </>
        )}
      </Container>
    </section>
  );
};

export default CoursesSection;
