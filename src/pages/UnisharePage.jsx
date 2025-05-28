import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col, Spinner, Alert, Button, Form, InputGroup } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { FaSearch, FaFilter } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UnishareWelcomeBanner from '../components/unishare/UnishareWelcomeBanner';
import UnshareSidebar from '../components/unishare/UnishareSidebar';
import UnishareCourseSection from '../components/unishare/UnishareCourseSection';
import UnishareCreateCourseForm from '../components/unishare/UnishareCreateCourseForm';
import UnishareMyGroups from '../components/unishare/UnishareMyGroups';
import UnishareMessages from '../components/unishare/UnishareMessages';
import UnishareRoleDebugger from '../components/unishare/UnishareRoleDebugger';
import { groupService, chatService, homeService } from '../services';

// Thời gian cache (10 phút)
const CACHE_DURATION = 10 * 60 * 1000;

const UnisharePage = () => {
  const { section } = useParams();
  const [activeSection, setActiveSection] = useState('home');
  const [appData, setAppData] = useState({
    featuredGroups: [],
    popularGroups: [],
    myGroups: [],
    chats: []
  });
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    sort_by: 'member_count',
    sort_direction: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Theo dõi thời điểm cuối cùng dữ liệu được tải
  const [lastDataFetch, setLastDataFetch] = useState(null);
  
  // Cập nhật activeSection dựa trên URL parameter
  useEffect(() => {
    setActiveSection(section || 'home');
  }, [section]);

  // Hàm tải dữ liệu tập trung - tải tất cả dữ liệu cần thiết trong một lần
  const fetchAllData = useCallback(async (force = false) => {
    // Kiểm tra xem có cần tải lại dữ liệu không
    const now = Date.now();
    if (!force && lastDataFetch && now - lastDataFetch < CACHE_DURATION) {
      console.log('Using cached data, last fetch:', new Date(lastDataFetch).toLocaleTimeString());
      setLoading(false);
      return;
    }
    
    console.log('Fetching all app data at:', new Date().toLocaleTimeString());
    setLoading(true);
    setError(null);
    
    try {
      // Tạo tất cả các promise trước khi chờ kết quả
      const featuredGroupsPromise = groupService.getAllGroups({
        per_page: 6,
        sort_by: 'member_count',
        sort_direction: 'desc'
      }, true);
      
      // Dùng API của header để tìm kiếm nhóm học
      const searchPromise = searchQuery || (filters.type || filters.sort_by !== 'member_count' || filters.sort_direction !== 'desc') 
        ? loadPublicGroups(searchQuery, filters) 
        : Promise.resolve([]);
      
      const myGroupsPromise = groupService.getUserGroups({}, true);
      
      const chatsPromise = chatService.getUserChats({}, true);
      
      // Sử dụng Promise.allSettled để đảm bảo tất cả request hoàn thành
      // Ngay cả khi một số request thất bại
      const [featuredGroupsResult, searchResultsResult, myGroupsResult, chatsResult] = 
        await Promise.allSettled([
          featuredGroupsPromise,
          searchPromise,
          myGroupsPromise,
          chatsPromise
        ]);
      
      // Xử lý kết quả featuredGroups
      let featuredGroups = [];
      if (featuredGroupsResult.status === 'fulfilled') {
        console.log('Featured groups response:', featuredGroupsResult.value);
        
        if (featuredGroupsResult.value.success) {
          featuredGroups = featuredGroupsResult.value.data || [];
        } else if (featuredGroupsResult.value.data) {
          // Direct API response format
          featuredGroups = featuredGroupsResult.value.data || [];
        } else if (Array.isArray(featuredGroupsResult.value)) {
          // Handle array response format
          featuredGroups = featuredGroupsResult.value;
        }
        
        // Ensure we have all needed properties for each group
        featuredGroups = featuredGroups.map(group => ({
          ...group,
          // Make sure member_count is a number 
          member_count: typeof group.member_count === 'number' ? group.member_count : parseInt(group.member_count) || 0
        }));
      } else if (featuredGroupsResult.status === 'rejected') {
        console.error('Error fetching featured groups:', featuredGroupsResult.reason);
      }
      
      // Xử lý kết quả tìm kiếm
      let popularGroups = [];
      if (searchResultsResult.status === 'fulfilled') {
        console.log('Search results response:', searchResultsResult.value);
        
        popularGroups = searchResultsResult.value;
        
        // Ensure we have all needed properties for each group
        popularGroups = popularGroups.map(group => ({
          ...group,
          // Make sure member_count is a number 
          member_count: typeof group.member_count === 'number' ? group.member_count : parseInt(group.member_count) || 0
        }));
      } else if (searchResultsResult.status === 'rejected') {
        console.error('Error fetching search results:', searchResultsResult.reason);
      }
      
      // Xử lý kết quả myGroups
      let myGroups = [];
      if (myGroupsResult.status === 'fulfilled' && myGroupsResult.value.success) {
        myGroups = myGroupsResult.value.data || [];
      } else if (myGroupsResult.status === 'rejected') {
        console.error('Error fetching my groups:', myGroupsResult.reason);
      }
      
      // Xử lý kết quả chats
      let chats = [];
      if (chatsResult.status === 'fulfilled' && chatsResult.value.success) {
        chats = chatsResult.value.data || [];
      } else if (chatsResult.status === 'rejected') {
        console.error('Error fetching chats:', chatsResult.reason);
      }
      
      // Cập nhật trạng thái với tất cả dữ liệu
      setAppData({
        featuredGroups,
        popularGroups,
        myGroups,
        chats
      });
      
      // Log to verify data
      console.log('Loaded featured groups:', featuredGroups);
      console.log('Loaded search results:', popularGroups);
      
      // Cập nhật thời gian tải dữ liệu
      setLastDataFetch(now);
      
      // Kiểm tra tất cả các request có thành công không để hiển thị lỗi nếu cần
      const allSuccessful = 
        featuredGroupsResult.status === 'fulfilled' && 
        searchResultsResult.status === 'fulfilled' && 
        myGroupsResult.status === 'fulfilled' && 
        chatsResult.status === 'fulfilled';
        
      if (!allSuccessful) {
        setError('Một số dữ liệu có thể không được tải đầy đủ. Vui lòng làm mới trang.');
      }
    } catch (err) {
      console.error('Error fetching app data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [lastDataFetch, filters, searchQuery]);

  // Hàm tìm kiếm nhóm (dùng API từ header component)
  const loadPublicGroups = async (query, filterOptions = {}) => {
    try {
      console.log('Searching groups with query:', query, 'and filters:', filterOptions);
      
      // Chuẩn bị tham số truy vấn
      const queryParams = {
        search: query,
        sort_by: filterOptions.sort_by || 'member_count',
        sort_direction: filterOptions.sort_direction || 'desc',
        per_page: 9,
        requires_approval: false
      };
      
      // Thêm filter loại nhóm nếu có
      if (filterOptions.type) {
        queryParams.type = filterOptions.type;
      }
      
      // Gọi API để tìm kiếm nhóm
      const groupsResponse = await groupService.getAllGroups(queryParams);
      
      if (groupsResponse.success) {
        return groupsResponse.data || [];
      } else if (groupsResponse.data) {
        return groupsResponse.data || [];
      } else if (Array.isArray(groupsResponse)) {
        return groupsResponse;
      }
      
      console.log('Loaded groups from search:', groupsResponse);
      return [];
    } catch (error) {
      console.error('Error searching groups:', error);
      return [];
    }
  };

  // Tải dữ liệu khi component được mount hoặc khi yêu cầu làm mới
  useEffect(() => {
    fetchAllData();
    
    // Thêm event listener để tải lại dữ liệu khi cần
    const handleDataRefresh = () => {
      fetchAllData(true);
    };
    
    window.addEventListener('refresh-app-data', handleDataRefresh);
    
    return () => {
      window.removeEventListener('refresh-app-data', handleDataRefresh);
    };
  }, [fetchAllData]);

  // Handler khi nhóm được tạo, rời hoặc chat mới được tạo
  const handleDataUpdated = useCallback(() => {
    // Dispatch custom event để reload dữ liệu
    window.dispatchEvent(new Event('refresh-app-data'));
  }, []);
  
  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    fetchAllData(true);
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
    fetchAllData(true);
    setShowFilters(false);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      type: '',
      sort_by: 'member_count',
      sort_direction: 'desc'
    });
    setSearchQuery('');
    fetchAllData(true);
  };

  // Tối ưu hóa renderMainContent với useMemo
  const renderMainContent = useMemo(() => {
    if (loading && !lastDataFetch) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger" className="my-3">
          {error}
          <div className="mt-2">
            <button 
              className="btn btn-outline-primary btn-sm" 
              onClick={() => fetchAllData(true)}
            >
              Thử lại
            </button>
          </div>
        </Alert>
      );
    }

    const { featuredGroups, popularGroups, myGroups, chats } = appData;

    switch (activeSection) {
      case 'create-course':
        return (
          <>
            <UnishareRoleDebugger />
            <UnishareCreateCourseForm onGroupCreated={handleDataUpdated} />
          </>
        );
      
      case 'my-groups':
        return (
          <UnishareMyGroups 
            groups={myGroups} 
            onGroupLeft={handleDataUpdated} 
          />
        );
      
      case 'messages':
        return (
          <UnishareMessages 
            chats={chats} 
            loading={loading && chats.length === 0}
            onChatCreated={handleDataUpdated}
          />
        );
        case 'home':
      default:
        return (
          <>
            {/* Search and Filters Section */}
            <div className="bg-white rounded shadow-sm p-4 mb-4" style={{ border: '2px solid #b3d8f6', borderRadius: '1rem' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0" style={{ color: '#0370b7' }}>Tìm kiếm nhóm học</h4>
                <Button 
                  variant="outline-primary" 
                  className="d-flex align-items-center"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FaFilter className="me-2" /> Bộ lọc
                </Button>
              </div>
              
              {/* Search Bar */}
              <Form onSubmit={handleSearch} className="mb-4">
                <InputGroup>
                  <Form.Control
                    placeholder="Tìm kiếm nhóm học..."
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
                          <option value="member_count">Số thành viên</option>
                          <option value="created_at">Ngày tạo</option>
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
                          <option value="desc">Giảm dần</option>
                          <option value="asc">Tăng dần</option>
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
            </div>
            
            {/* Search Results Section - Moved above featured groups */}
            {searchQuery || (filters.type || filters.sort_by !== 'member_count' || filters.sort_direction !== 'desc') ? (
              <div className="mb-4">
                <h5 className="fw-bold mb-3" style={{ color: '#0370b7' }}>Kết quả tìm kiếm</h5>
                {loading ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Đang tải danh sách nhóm...</p>
                  </div>
                ) : popularGroups.length > 0 ? (
                  <UnishareCourseSection 
                    courses={popularGroups}
                  />
                ) : (
                  <Alert variant="info">
                    Không tìm thấy nhóm học nào phù hợp với tiêu chí tìm kiếm.
                  </Alert>
                )}
              </div>
            ) : null}
            
            {/* Featured Groups Section - Now at the bottom */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0" style={{ color: '#0370b7' }}>Nhóm học phổ biến</h5>
              <Button
                as={Link}
                to="/unishare/create-course"
                className="d-flex align-items-center fw-bold"
                style={{
                  background: 'linear-gradient(90deg, #0370b7 60%, #4fc3f7 100%)',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '0.9rem',
                  padding: '0.5rem 1.2rem',
                  boxShadow: '0 2px 8px rgba(3,112,183,0.15)'
                }}
              >
                <i className="fas fa-plus me-2"></i> Tạo nhóm học
              </Button>
            </div>
            <UnishareCourseSection 
              title=""
              courses={featuredGroups}
            />
          </>
        );
    }
  }, [activeSection, loading, error, appData, lastDataFetch, fetchAllData, handleDataUpdated, searchQuery, filters, showFilters]);

  // Tối ưu hóa sidebar props
  const sidebarProps = useMemo(() => ({
    activeSection,
    hasNewMessages: appData.chats.some(chat => chat.unread_count > 0)
  }), [activeSection, appData.chats]);

  return (
    <>
      <Header />
      <div className="unishare-page py-4" style={{ backgroundColor: '#e9f5ff', minHeight: 'calc(100vh - 120px)' }}>
        <Container>
          <Row>
            {/* Sidebar Component */}
            <Col md={3}>
              <UnshareSidebar {...sidebarProps} />
            </Col>
            
            {/* Main Content: Rendered based on activeSection */}
            <Col md={9}>
              {renderMainContent}
            </Col>
          </Row>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default UnisharePage;
