import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Form, InputGroup, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaDownload, FaEye, FaUser } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { documentService } from '../services';
import documentPlaceholder from '../assets/document-placeholder.png';

const PopularDocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    sortBy: 'downloads' // Default sort by downloads for popular documents
  });

  useEffect(() => {
    fetchPopularDocuments();
  }, [filters]);
  const fetchPopularDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create params object with filters
      const params = {
        ...filters,
        search: searchQuery
      };
      
      const response = await documentService.getPopularDocuments(params);
      
      if (response.success) {
        setDocuments(response.data);
      } else {
        setError(response.message || 'Không thể tải tài liệu. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error fetching popular documents:', error);
      setError('Đã xảy ra lỗi khi tải tài liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPopularDocuments();
  };

  const handleFilterChange = (name, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  return (
    <>
      <Header />
      <Container className="py-4">
        <h1 className="mb-4">Tài liệu phổ biến</h1>
        
        {/* Search and filters */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Form onSubmit={handleSearch}>
              <Row className="align-items-end">
                <Col md={6}>
                  <Form.Group className="mb-3 mb-md-0">
                    <Form.Label>Tìm kiếm tài liệu</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Nhập tên tài liệu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Button variant="primary" type="submit">
                        <FaSearch /> Tìm
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3 mb-md-0">
                    <Form.Label>Môn học</Form.Label>
                    <Form.Select
                      value={filters.subject}
                      onChange={(e) => handleFilterChange('subject', e.target.value)}
                    >
                      <option value="">Tất cả môn học</option>
                      <option value="mathematics">Toán học</option>
                      <option value="physics">Vật lý</option>
                      <option value="chemistry">Hóa học</option>
                      <option value="biology">Sinh học</option>
                      <option value="computer_science">Khoa học máy tính</option>
                      <option value="literature">Văn học</option>
                      <option value="history">Lịch sử</option>
                      <option value="geography">Địa lý</option>
                      <option value="english">Tiếng Anh</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3 mb-md-0">
                    <Form.Label>Sắp xếp theo</Form.Label>
                    <Form.Select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    >
                      <option value="downloads">Lượt tải</option>
                      <option value="views">Lượt xem</option>
                      <option value="latest">Mới nhất</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
        
        {/* Error message */}
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}
        
        {/* Documents list */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Đang tải tài liệu...</p>
          </div>
        ) : documents.length > 0 ? (
          <Row>
            {documents.map((document) => (
              <Col md={4} sm={6} className="mb-4" key={document.id}>
                <Card className="h-100 shadow-sm hover-card">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="mb-0 text-truncate" style={{ maxWidth: '80%' }}>
                        {document.title}
                      </Card.Title>
                    </div>
                    
                    <Card.Text className="small text-muted mb-3">
                      <FaUser className="me-1" /> {document.author || 'Không có tác giả'}
                    </Card.Text>
                    
                    <div className="document-stats d-flex mb-3">
                      <span className="me-3">
                        <FaDownload className="text-success me-1" /> {document.download_count || 0}
                      </span>
                      <span>
                        <FaEye className="text-primary me-1" /> {document.view_count || 0}
                      </span>
                    </div>
                    
                    <Card.Text className="small text-truncate mb-3">
                      {document.description || 'Không có mô tả'}
                    </Card.Text>
                    
                    <div className="mt-auto">
                      <Button
                        as={Link}
                        to={`/unishare-files/view/${document.id}`}
                        variant="outline-primary"
                        className="w-100"
                      >
                        Xem tài liệu
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center py-5">
            <p>Không tìm thấy tài liệu nào.</p>
          </div>
        )}
      </Container>
      <Footer />
    </>
  );
};

export default PopularDocumentsPage;
