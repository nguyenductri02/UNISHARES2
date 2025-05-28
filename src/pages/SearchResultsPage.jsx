import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Form, Button, Badge, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FaSearch, FaBook, FaUsers, FaFile, FaStar, FaDownload, FaUser, FaInfoCircle } from 'react-icons/fa';
import { homeService, groupService, documentService } from '../services';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Simple NoDataMessage component defined inline
const NoDataMessage = ({ message, icon: Icon = FaInfoCircle }) => {
  return (
    <Card className="text-center p-4 border-light">
      <Card.Body>
        <Icon size={40} className="text-muted mb-3" />
        <p className="text-muted">{message}</p>
      </Card.Body>
    </Card>
  );
};

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';
  const initialCategory = queryParams.get('category') || 'all';

  const [category, setCategory] = useState(initialCategory);
  const [results, setResults] = useState({
    courses: [],
    groups: [],
    documents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(searchQuery);
  const [filters, setFilters] = useState({
    sortBy: queryParams.get('sort') || 'relevance',
    type: queryParams.get('type') || ''
  });

  // Fetch results when search query or category changes
  useEffect(() => {
    if (searchQuery) {
      fetchResults(searchQuery, category);
    } else {
      setLoading(false);
    }
  }, [searchQuery, category]);

  const fetchResults = async (query, cat) => {
    setLoading(true);
    setError(null);
    
    try {
      const requests = [];
      
      // Only fetch the selected category or all categories
      if (cat === 'all' || cat === 'courses') {
        requests.push(homeService.getPopularCourses().then(data => ({ type: 'courses', data })));
      } else {
        requests.push(Promise.resolve({ type: 'courses', data: [] }));
      }
      
      if (cat === 'all' || cat === 'documents') {
        requests.push(homeService.getFreeDocuments().then(data => ({ type: 'documents', data })));
      } else {
        requests.push(Promise.resolve({ type: 'documents', data: [] }));
      }
      
      if (cat === 'all' || cat === 'groups') {
        requests.push(groupService.getAllGroups({ search: query, per_page: 20 })
          .then(response => ({ type: 'groups', data: response.data || [] })));
      } else {
        requests.push(Promise.resolve({ type: 'groups', data: [] }));
      }
      
      const responses = await Promise.all(requests);
      
      // Process and filter results
      const newResults = {
        courses: [],
        groups: [],
        documents: []
      };
      
      responses.forEach(response => {
        let filteredData = response.data || [];
        
        // Filter data based on search query
        if (query && filteredData.length > 0) {
          filteredData = filteredData.filter(item => {
            const title = item.title || item.name || '';
            const description = item.description || '';
            return title.toLowerCase().includes(query.toLowerCase()) || 
                   description.toLowerCase().includes(query.toLowerCase());
          });
        }
        
        // Apply type filter for groups
        if (response.type === 'groups' && filters.type) {
          if (filters.type === 'course') {
            filteredData = filteredData.filter(group => group.type === 'course');
          } else if (filters.type === 'study') {
            filteredData = filteredData.filter(group => group.type !== 'course');
          }
        }
        
        // Sort results
        if (filters.sortBy === 'newest') {
          filteredData.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        } else if (filters.sortBy === 'popular') {
          filteredData.sort((a, b) => (b.download_count || b.member_count || 0) - (a.download_count || a.member_count || 0));
        }
        
        newResults[response.type] = filteredData;
      });
      
      setResults(newResults);
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (search.trim()) {
      const params = new URLSearchParams();
      params.set('q', search);
      params.set('category', category);
      
      if (filters.sortBy !== 'relevance') {
        params.set('sort', filters.sortBy);
      }
      
      if (filters.type) {
        params.set('type', filters.type);
      }
      
      navigate(`/search?${params.toString()}`);
    }
  };

  const handleCategoryChange = (selectedCategory) => {
    setCategory(selectedCategory);
    
    // Update URL to reflect category change
    const params = new URLSearchParams(location.search);
    params.set('category', selectedCategory);
    navigate(`/search?${params.toString()}`);
  };

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    
    // Update URL to reflect filter changes
    const params = new URLSearchParams(location.search);
    
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    
    navigate(`/search?${params.toString()}`);
  };

  // Helper function to get result count
  const getResultCount = () => {
    let count = 0;
    if (category === 'all') {
      count = results.courses.length + results.groups.length + results.documents.length;
    } else if (category === 'courses') {
      count = results.courses.length;
    } else if (category === 'groups') {
      count = results.groups.length;
    } else if (category === 'documents') {
      count = results.documents.length;
    }
    return count;
  };

  return (
    <>
      <Header />
      <div className="search-results-page py-4">
        <Container>
          <h2 className="mb-3">Kết quả tìm kiếm</h2>
          {searchQuery && <p className="text-muted mb-4">Kết quả tìm kiếm cho "{searchQuery}"</p>}
          
          {/* Search Box */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    placeholder="Tìm kiếm khóa học, nhóm, tài liệu..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-end-0"
                  />
                  <Button type="submit" variant="primary">
                    <FaSearch className="me-2" /> Tìm kiếm
                  </Button>
                </InputGroup>
              </Form>
            </Card.Body>
          </Card>

          <Row>
            {/* Filters Sidebar */}
            <Col lg={3} md={4} className="mb-4">
              <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white">
                  <strong>Bộ lọc</strong>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <Form.Label>Sắp xếp theo</Form.Label>
                    <Form.Select 
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    >
                      <option value="relevance">Độ phù hợp</option>
                      <option value="newest">Mới nhất</option>
                      <option value="popular">Phổ biến nhất</option>
                    </Form.Select>
                  </div>

                  {category === 'groups' && (
                    <div className="mb-3">
                      <Form.Label>Loại nhóm</Form.Label>
                      <Form.Select 
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                      >
                        <option value="">Tất cả</option>
                        <option value="course">Khóa học</option>
                        <option value="study">Nhóm học</option>
                      </Form.Select>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Results Area */}
            <Col lg={9} md={8}>
              {/* Category Tabs */}
              <Card className="mb-4 shadow-sm">
                <Card.Body>
                  <Nav variant="tabs" className="mb-3" activeKey={category}>
                    <Nav.Item>
                      <Nav.Link 
                        eventKey="all" 
                        onClick={() => handleCategoryChange('all')}
                      >
                        Tất cả
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link 
                        eventKey="courses" 
                        onClick={() => handleCategoryChange('courses')}
                      >
                        Khóa học
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link 
                        eventKey="groups" 
                        onClick={() => handleCategoryChange('groups')}
                      >
                        Nhóm học
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link 
                        eventKey="documents" 
                        onClick={() => handleCategoryChange('documents')}
                      >
                        Tài liệu
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      {!loading && searchQuery && (
                        <span>Tìm thấy {getResultCount()} kết quả cho "{searchQuery}"</span>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Error Message */}
              {error && (
                <Alert variant="danger">{error}</Alert>
              )}

              {/* Loading Spinner */}
              {loading && (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Đang tìm kiếm...</p>
                </div>
              )}

              {/* Results Display */}
              {!loading && (
                <>
                  {/* Courses Results */}
                  {(category === 'all' || category === 'courses') && (
                    <div className="mb-4">
                      {category !== 'all' && <h4 className="mb-3">Khóa học</h4>}
                      
                      {results.courses.length > 0 ? (
                        results.courses.map(course => (
                          <Card key={course.id} className="mb-3 shadow-sm hover-shadow">
                            <Card.Body>
                              <Row>
                                <Col md={3} className="mb-3 mb-md-0">
                                  <img 
                                    src={course.thumbnail} 
                                    alt={course.title} 
                                    className="img-fluid rounded"
                                    style={{ maxHeight: '120px', width: '100%', objectFit: 'cover' }}
                                  />
                                </Col>
                                <Col md={9}>
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <Link to={`/courses/${course.id}`} className="text-decoration-none">
                                      <h5 className="mb-1">{course.title}</h5>
                                    </Link>
                                    <Badge bg="primary">Khóa học</Badge>
                                  </div>
                                  
                                  <p className="text-muted small mb-2">
                                    {course.description ? (
                                      course.description.length > 150 
                                        ? `${course.description.substring(0, 150)}...` 
                                        : course.description
                                    ) : 'Không có mô tả'}
                                  </p>
                                  
                                  <div className="d-flex mt-2">
                                    {course.member_count !== undefined && (
                                      <span className="me-3 text-muted small">
                                        <FaUser className="me-1" />
                                        {course.member_count} thành viên
                                      </span>
                                    )}
                                    {course.course_code && (
                                      <span className="me-3 text-muted small">
                                        <FaBook className="me-1" />
                                        Mã KH: {course.course_code}
                                      </span>
                                    )}
                                  </div>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        ))
                      ) : (
                        <NoDataMessage 
                          message={searchQuery 
                            ? "Không tìm thấy khóa học phù hợp với tìm kiếm của bạn" 
                            : "Không có khóa học nào để hiển thị"
                          }
                        />
                      )}
                    </div>
                  )}

                  {/* Groups Results */}
                  {(category === 'all' || category === 'groups') && (
                    <div className="mb-4">
                      {category !== 'all' && <h4 className="mb-3">Nhóm học</h4>}
                      
                      {results.groups.length > 0 ? (
                        results.groups.map(group => (
                          <Card key={group.id} className="mb-3 shadow-sm hover-shadow">
                            <Card.Body>
                              <Row>
                                <Col md={3} className="mb-3 mb-md-0">
                                  <img 
                                    src={group.cover_image ? `${process.env.REACT_APP_API_URL}/storage/${group.cover_image}` : 
                                         `/images/group-placeholder-${(group.id % 4) + 1}.jpg`} 
                                    alt={group.name} 
                                    className="img-fluid rounded"
                                    style={{ maxHeight: '120px', width: '100%', objectFit: 'cover' }}
                                  />
                                </Col>
                                <Col md={9}>
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <Link to={`/unishare/groups/${group.id}`} className="text-decoration-none">
                                      <h5 className="mb-1">{group.name}</h5>
                                    </Link>
                                    <Badge bg={group.type === 'course' ? 'primary' : 'success'}>
                                      {group.type === 'course' ? 'Khóa học' : 
                                       group.type === 'university' ? 'Nhóm đại học' : 'Nhóm hứng thú'}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-muted small mb-2">
                                    {group.description ? (
                                      group.description.length > 150 
                                        ? `${group.description.substring(0, 150)}...` 
                                        : group.description
                                    ) : 'Không có mô tả'}
                                  </p>
                                  
                                  <div className="d-flex mt-2">
                                    <span className="me-3 text-muted small">
                                      <FaUser className="me-1" />
                                      {group.member_count || 0} thành viên
                                    </span>
                                    {group.course_code && (
                                      <span className="text-muted small">
                                        <FaBook className="me-1" />
                                        Mã KH: {group.course_code}
                                      </span>
                                    )}
                                  </div>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        ))
                      ) : (
                        <NoDataMessage 
                          message={searchQuery 
                            ? "Không tìm thấy nhóm học phù hợp với tìm kiếm của bạn" 
                            : "Không có nhóm học nào để hiển thị"
                          }
                        />
                      )}
                    </div>
                  )}

                  {/* Documents Results */}
                  {(category === 'all' || category === 'documents') && (
                    <div className="mb-4">
                      {category !== 'all' && <h4 className="mb-3">Tài liệu</h4>}
                      
                      {results.documents.length > 0 ? (
                        results.documents.map(document => (
                          <Card key={document.id} className="mb-3 shadow-sm hover-shadow">
                            <Card.Body>
                              <Row>
                                <Col md={2} className="mb-3 mb-md-0 text-center">
                                  <img 
                                    src={document.thumbnail} 
                                    alt={document.title} 
                                    className="img-fluid rounded"
                                    style={{ maxHeight: '80px', maxWidth: '80px', objectFit: 'contain' }}
                                  />
                                </Col>
                                <Col md={10}>
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <Link to={`/unishare-files/view/${document.id}`} className="text-decoration-none">
                                      <h5 className="mb-1">{document.title}</h5>
                                    </Link>
                                    <Badge bg="warning" text="dark">Tài liệu</Badge>
                                  </div>
                                  
                                  <p className="text-muted small mb-2">
                                    {document.description ? (
                                      document.description.length > 150 
                                        ? `${document.description.substring(0, 150)}...` 
                                        : document.description
                                    ) : 'Không có mô tả'}
                                  </p>
                                  
                                  <div className="d-flex mt-2">
                                    {document.downloads !== undefined && (
                                      <span className="me-3 text-muted small">
                                        <FaDownload className="me-1" />
                                        {document.downloads} lượt tải
                                      </span>
                                    )}
                                    {document.file_type && (
                                      <span className="text-muted small">
                                        <FaFile className="me-1" />
                                        {document.file_type.toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        ))
                      ) : (
                        <NoDataMessage 
                          message={searchQuery 
                            ? "Không tìm thấy tài liệu phù hợp với tìm kiếm của bạn" 
                            : "Không có tài liệu nào để hiển thị"
                          }
                        />
                      )}
                    </div>
                  )}

                  {/* No Results Message */}
                  {!loading && searchQuery && getResultCount() === 0 && (
                    <Alert variant="info">
                      Không tìm thấy kết quả nào cho "{searchQuery}". Vui lòng thử từ khóa khác.
                    </Alert>
                  )}
                </>
              )}
            </Col>
          </Row>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default SearchResultsPage;
