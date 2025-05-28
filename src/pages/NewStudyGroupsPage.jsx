import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { FaSearch, FaFilter, FaClock } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UnshareSidebar from '../components/unishare/UnishareSidebar';
import UnishareCourseSection from '../components/unishare/UnishareCourseSection';
import { groupService } from '../services';

const NewStudyGroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    sort_by: 'created_at',
    sort_direction: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch groups based on current filters
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = {
        ...filters,
        search: searchQuery,
        per_page: 12
      };
      
      const response = await groupService.getAllGroups(queryParams);
      
      if (response.success) {
        setGroups(response.data || []);
      } else {
        setError('Không thể tải dữ liệu nhóm. Vui lòng thử lại sau.');
        setGroups([]);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  // Load groups when component mounts or filters change
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    fetchGroups();
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchGroups();
    setShowFilters(false);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      type: '',
      sort_by: 'created_at',
      sort_direction: 'desc'
    });
    setSearchQuery('');
  };

  return (
    <>
      <Header />
      <div className="py-4" style={{ backgroundColor: '#e9f5ff', minHeight: 'calc(100vh - 120px)' }}>
        <Container>
          <Row>
            {/* Sidebar */}
            <Col md={3}>
              <UnshareSidebar activeSection="new-groups" />
            </Col>
            
            {/* Main Content */}
            <Col md={9}>
              <div className="bg-white rounded shadow p-4 mb-4" style={{ border: '2px solid #b3d8f6', borderRadius: '1rem' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold mb-0 d-flex align-items-center" style={{ color: '#0370b7' }}>
                    <FaClock className="me-2" />
                    Nhóm Học Mới Nhất
                  </h4>
                  <Button 
                    variant="outline-primary" 
                    className="d-flex align-items-center"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FaFilter className="me-2" /> Bộ lọc
                  </Button>
                </div>
                
                {/* Description */}
                <div className="alert alert-info mb-4">
                  <small>
                    <FaClock className="me-2" />
                    Khám phá các nhóm học mới được tạo gần đây. Tham gia ngay để kết nối với các thành viên mới và cùng nhau học tập!
                  </small>
                </div>
                
                {/* Search Bar */}
                <Form onSubmit={handleSearch} className="mb-4">
                  <InputGroup>
                    <Form.Control
                      placeholder="Tìm kiếm nhóm học mới..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button type="submit" variant="primary">
                      <FaSearch /> Tìm
                    </Button>
                  </InputGroup>
                </Form>
                
                {/* Filters */}
                {showFilters && (
                  <div className="filter-section bg-light p-3 mb-4 rounded">
                    <h6 className="mb-3">Tùy chọn lọc</h6>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Loại nhóm</Form.Label>
                          <Form.Select 
                            name="type" 
                            value={filters.type}
                            onChange={handleFilterChange}
                          >
                            <option value="">Tất cả</option>
                            <option value="course">Khóa học</option>
                            <option value="university">Trường đại học</option>
                            <option value="interest">Sở thích</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Sắp xếp theo</Form.Label>
                          <Form.Select 
                            name="sort_by" 
                            value={filters.sort_by}
                            onChange={handleFilterChange}
                          >
                            <option value="created_at">Ngày tạo</option>
                            <option value="member_count">Số thành viên</option>
                            <option value="name">Tên nhóm</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Thứ tự</Form.Label>
                          <Form.Select 
                            name="sort_direction" 
                            value={filters.sort_direction}
                            onChange={handleFilterChange}
                          >
                            <option value="desc">Mới nhất trước</option>
                            <option value="asc">Cũ nhất trước</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="d-flex justify-content-end">
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="me-2"
                        onClick={resetFilters}
                      >
                        Đặt lại
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={applyFilters}
                      >
                        Áp dụng
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Error message */}
                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}
                
                {/* Groups Display */}
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Đang tải danh sách nhóm mới...</p>
                  </div>
                ) : groups.length > 0 ? (
                  <UnishareCourseSection 
                    courses={groups}
                  />
                ) : (
                  <Alert variant="info">
                    Không tìm thấy nhóm học mới nào phù hợp với tiêu chí tìm kiếm.
                  </Alert>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default NewStudyGroupsPage;
