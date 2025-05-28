import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Form, InputGroup, Alert, Pagination } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaDownload, FaEye, FaUser, FaSortAmountDown, FaSortAmountDownAlt } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { documentService } from '../services';
import documentPlaceholder from '../assets/document-placeholder.png';

const AllDocumentsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(queryParams.get('search') || '');
  const [pagination, setPagination] = useState({
    currentPage: parseInt(queryParams.get('page') || '1'),
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });
  const [filters, setFilters] = useState({
    subject: queryParams.get('subject') || '',
    sortBy: queryParams.get('sort') || 'latest',
    sortDirection: queryParams.get('direction') || 'desc'
  });

  useEffect(() => {
    fetchAllDocuments();
  }, [pagination.currentPage, filters]);

  const fetchAllDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create params object with filters and pagination
      const params = {
        ...filters,
        search: searchQuery,
        page: pagination.currentPage,
        per_page: pagination.itemsPerPage
      };
      
      const response = await documentService.getAllDocuments(params);
      
      if (response.success) {
        setDocuments(response.data);
        
        // Update pagination info
        if (response.meta) {
          setPagination(prev => ({
            ...prev,
            currentPage: response.meta.current_page || 1,
            totalPages: response.meta.last_page || 1,
            totalItems: response.meta.total || 0
          }));
        }
      } else {
        setError(response.message || 'Không thể tải tài liệu. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error fetching all documents:', error);
      setError('Đã xảy ra lỗi khi tải tài liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Reset to first page when searching
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
    
    // Update URL with search params
    updateUrlParams();
    
    fetchAllDocuments();
  };

  const handleFilterChange = (name, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
    
    // Reset to first page when changing filters
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
    
    // Update URL with new filters
    updateUrlParams({
      ...filters,
      [name]: value
    });
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
    
    // Update URL with new page
    updateUrlParams(null, page);
    
    // Scroll to top when changing page
    window.scrollTo(0, 0);
  };

  const updateUrlParams = (newFilters = null, newPage = null) => {
    const params = new URLSearchParams();
    
    // Use new filters if provided, otherwise use current filters
    const filtersToUse = newFilters || filters;
    
    // Use new page if provided, otherwise use current page
    const pageToUse = newPage || pagination.currentPage;
    
    // Add search query if not empty
    if (searchQuery) params.set('search', searchQuery);
    
    // Add filters if not empty
    if (filtersToUse.subject) params.set('subject', filtersToUse.subject);
    if (filtersToUse.sortBy) params.set('sort', filtersToUse.sortBy);
    if (filtersToUse.sortDirection) params.set('direction', filtersToUse.sortDirection);
    
    // Add page if not 1
    if (pageToUse > 1) params.set('page', pageToUse.toString());
    
    // Update URL without reloading page
    navigate({
      pathname: location.pathname,
      search: params.toString()
    }, { replace: true });
  };

  const toggleSortDirection = () => {
    const newDirection = filters.sortDirection === 'asc' ? 'desc' : 'asc';
    
    setFilters(prevFilters => ({
      ...prevFilters,
      sortDirection: newDirection
    }));
    
    // Update URL with new sort direction
    updateUrlParams({
      ...filters,
      sortDirection: newDirection
    });
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const { currentPage, totalPages } = pagination;
    
    // Always show first page
    items.push(
      <Pagination.Item 
        key={1} 
        active={currentPage === 1}
        onClick={() => handlePageChange(1)}
      >
        1
      </Pagination.Item>
    );
    
    // If there are more than 7 pages, show ellipsis
    if (totalPages > 7) {
      // Show first 3 pages, last 3 pages, and current page with neighbors
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust start and end to always show 5 pages in the middle
      if (currentPage <= 3) {
        endPage = 5;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis-1" disabled />);
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <Pagination.Item 
            key={i} 
            active={currentPage === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis-2" disabled />);
      }
    } else {
      // Show all pages if there are 7 or fewer
      for (let i = 2; i <= totalPages; i++) {
        items.push(
          <Pagination.Item 
            key={i} 
            active={currentPage === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }
    }
    
    return items;
  };

  return (
    <>
      <Header />
      <Container className="py-4">
        <h1 className="mb-4">Tất cả tài liệu</h1>
        
        {/* Search and filters */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Form onSubmit={handleSearch}>
              <Row className="align-items-end">
                <Col md={4}>
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
                      <option value="latest">Mới nhất</option>
                      <option value="downloads">Lượt tải</option>
                      <option value="views">Lượt xem</option>
                      <option value="title">Tên tài liệu</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2} className="text-md-end">
                  <Button 
                    variant="outline-secondary" 
                    onClick={toggleSortDirection}
                    className="mt-3 mt-md-0"
                    title={filters.sortDirection === 'asc' ? 'Sắp xếp tăng dần' : 'Sắp xếp giảm dần'}
                  >
                    {filters.sortDirection === 'asc' ? (
                      <><FaSortAmountDownAlt /> Tăng dần</>
                    ) : (
                      <><FaSortAmountDown /> Giảm dần</>
                    )}
                  </Button>
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
        
        {/* Total count and current filters */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="mb-0">
            Tìm thấy <strong>{pagination.totalItems}</strong> tài liệu
            {filters.subject && (
              <span> trong môn <strong>{filters.subject}</strong></span>
            )}
            {searchQuery && (
              <span> phù hợp với <strong>"{searchQuery}"</strong></span>
            )}
          </p>
        </div>
        
        {/* Documents list */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Đang tải tài liệu...</p>
          </div>
        ) : documents.length > 0 ? (
          <>
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
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.Prev
                    disabled={pagination.currentPage === 1}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                  />
                  
                  {renderPaginationItems()}
                  
                  <Pagination.Next
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                  />
                </Pagination>
              </div>
            )}
          </>
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

export default AllDocumentsPage;
