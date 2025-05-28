import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaFileAlt, FaSave, FaTimes } from 'react-icons/fa';
import { profileService } from '../services';
import Header from '../components/Header';
import Footer from '../components/Footer';

const EditDocument = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    course_code: '',
    is_official: false
  });
  
  const [formErrors, setFormErrors] = useState({});

  // Load document data
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await profileService.getDocument(id);
        
        if (response.data) {
          setDocument(response.data);
          setFormData({
            title: response.data.title || '',
            description: response.data.description || '',
            subject: response.data.subject || '',
            course_code: response.data.course_code || '',
            is_official: response.data.is_official || false
          });
        } else {
          throw new Error('Không thể tải thông tin tài liệu');
        }
      } catch (err) {
        console.error('Error fetching document:', err);
        setError('Không thể tải thông tin tài liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: undefined
      });
    }
  };

  // Validate the form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Vui lòng nhập tên tài liệu';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      // Determine the appropriate update method based on role
      const userData = localStorage.getItem('user');
      let isTeacher = false;
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.roles && Array.isArray(user.roles)) {
            isTeacher = user.roles.some(r => 
              (typeof r === 'object' && r.name === 'lecturer') || 
              (typeof r === 'string' && r === 'lecturer')
            );
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      let response;
      if (isTeacher) {
        response = await profileService.updateTeacherDocument(id, formData);
      } else {
        response = await profileService.updateDocument(id, formData);
      }
      
      if (response.data) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/unishare-files/view/${id}`);
        }, 1500);
      } else {
        throw new Error('Không thể cập nhật tài liệu');
      }
    } catch (err) {
      console.error('Error updating document:', err);
      
      if (err.errors) {
        setFormErrors(err.errors);
      } else {
        setError(err.message || 'Không thể cập nhật tài liệu. Vui lòng thử lại sau.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    navigate(`/unishare-files/view/${id}`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" />
            <p className="mt-3">Đang tải thông tin tài liệu...</p>
          </div>
        </Container>
        <Footer />
      </>
    );
  }

  if (error && !document) {
    return (
      <>
        <Header />
        <Container className="py-5">
          <Alert variant="danger">
            <p className="mb-0">{error}</p>
            <div className="mt-3">
              <Button 
                variant="outline-primary" 
                onClick={() => navigate('/unishare-files')}
              >
                Quay lại trang chủ
              </Button>
            </div>
          </Alert>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div 
        className="py-4"
        style={{ 
          backgroundColor: '#e9f5ff',
          minHeight: 'calc(100vh - 200px)' // Adjust based on your header/footer height
        }}
      >
        <Container>
          <div className="mb-3">
            <Link to={`/unishare-files/view/${id}`} className="text-decoration-none">
              <FaArrowLeft className="me-2" />
              Quay lại xem tài liệu
            </Link>
          </div>

          <Card className="shadow-sm">
            <Card.Body>
              <h4 className="mb-4">Chỉnh sửa thông tin tài liệu</h4>
              
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">Cập nhật tài liệu thành công!</Alert>}
              
              <Row className="mb-3">
                <Col md={12}>
                  <div className="bg-light p-3 rounded d-flex align-items-center mb-4">
                    <FaFileAlt className="text-primary me-3" size={24} />
                    <div className="overflow-hidden">
                      <div className="fw-bold text-truncate">{document.file_name}</div>
                      <small className="text-muted">
                        Tệp gốc không thể thay đổi. Bạn chỉ có thể chỉnh sửa thông tin mô tả.
                      </small>
                    </div>
                  </div>
                </Col>
              </Row>

              <Form onSubmit={handleSubmit}>
                <Form.Group as={Row} className="mb-3">
                  <Form.Label column md={3}>Tên tài liệu <span className="text-danger">*</span></Form.Label>
                  <Col md={9}>
                    <Form.Control
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      isInvalid={!!formErrors.title}
                      disabled={saving}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.title}
                    </Form.Control.Feedback>
                  </Col>
                </Form.Group>

                <Form.Group as={Row} className="mb-3">
                  <Form.Label column md={3}>Mô tả</Form.Label>
                  <Col md={9}>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      isInvalid={!!formErrors.description}
                      disabled={saving}
                      placeholder="Mô tả chi tiết về tài liệu này..."
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.description}
                    </Form.Control.Feedback>
                  </Col>
                </Form.Group>

                <Form.Group as={Row} className="mb-3">
                  <Form.Label column md={3}>Môn học</Form.Label>
                  <Col md={9}>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      isInvalid={!!formErrors.subject}
                      disabled={saving}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.subject}
                    </Form.Control.Feedback>
                  </Col>
                </Form.Group>

                <Form.Group as={Row} className="mb-3">
                  <Form.Label column md={3}>Mã môn học</Form.Label>
                  <Col md={9}>
                    <Form.Control
                      type="text"
                      name="course_code"
                      value={formData.course_code}
                      onChange={handleChange}
                      isInvalid={!!formErrors.course_code}
                      disabled={saving}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.course_code}
                    </Form.Control.Feedback>
                  </Col>
                </Form.Group>

                {document.user_role === 'lecturer' && (
                  <Form.Group as={Row} className="mb-3">
                    <Col md={{ span: 9, offset: 3 }}>
                      <Form.Check
                        type="checkbox"
                        id="is-official-checkbox"
                        label="Đánh dấu là tài liệu chính thức"
                        name="is_official"
                        checked={formData.is_official}
                        onChange={handleChange}
                        disabled={saving}
                      />
                    </Col>
                  </Form.Group>
                )}

                <Row className="mt-4">
                  <Col md={{ span: 9, offset: 3 }}>
                    <div className="d-flex">
                      <Button
                        variant="outline-secondary"
                        className="me-2 d-flex align-items-center"
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        <FaTimes className="me-2" /> Hủy
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        className="d-flex align-items-center"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" /> Lưu thay đổi
                          </>
                        )}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default EditDocument;
