import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Nav, Container, Button, NavDropdown, Image, Badge, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaBell, FaSearch, FaBook, FaUsers, FaFile, FaRobot } from 'react-icons/fa';
import uniShareLogo from '../assets/unishare-logo.png';
import userAvatar from '../assets/avatar-1.png';
import { authService, homeService, groupService } from '../services';
import { isAdmin, isModerator } from '../utils/roleUtils';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    courses: [],
    groups: [],
    documents: []
  });
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const loggedIn = authService.isLoggedIn();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        try {
          const localUser = authService.getUser();
          if (localUser) {
            setUser(localUser);
          }
          
          const freshUser = await authService.getCurrentUser();
          if (freshUser) {
            setUser(freshUser);
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      }
    };
    
    checkLoginStatus();
    
    const handleStorageChange = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    if (showSearch && !searchQuery) {
      loadPopularItems();
    }
  }, [showSearch]);
  
  useEffect(() => {
    if (searchQuery.length > 2) {
      performSearch(searchQuery);
    }
  }, [searchQuery]);
  
  const loadPopularItems = async () => {
    setLoading(true);
    try {
      const [courses, documents, groups] = await Promise.all([
        homeService.getPopularCourses(),
        homeService.getFreeDocuments(),
        loadPublicGroups()
      ]);
      
      setSearchResults({
        courses: courses.slice(0, 3),
        groups: groups.slice(0, 3),
        documents: documents.slice(0, 3)
      });
    } catch (error) {
      console.error('Error loading popular items:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadPublicGroups = async () => {
    try {
      const response = await groupService.getAllGroups({
        sort_by: 'member_count',
        sort_direction: 'desc',
        per_page: 10,
        requires_approval: false,
      });
      
      const groups = (response.data || []).filter(group => group.type !== 'course');
      return groups;
    } catch (error) {
      console.error('Error loading public groups:', error);
      return [];
    }
  };
  
  const performSearch = async (query) => {
    setLoading(true);
    try {
      const groupsResponse = await groupService.getAllGroups({
        search: query,
        per_page: 10,
        requires_approval: false
      });
      
      const groups = (groupsResponse.data || []).filter(group => group.type !== 'course');
      
      const [courses, documents] = await Promise.all([
        homeService.getPopularCourses(),
        homeService.getFreeDocuments()
      ]);
      
      const filteredCourses = courses.filter(course => 
        course.title.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3);
      
      const filteredDocuments = documents.filter(doc => 
        doc.title.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3);
      
      setSearchResults({
        courses: filteredCourses,
        groups: groups,
        documents: filteredDocuments
      });
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      
      // Clear all authentication data from local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user');
      
      // Clear any other application-specific stored data
      localStorage.removeItem('last_activity');
      localStorage.removeItem('app_settings');
      
      // Reset the component state
      setIsLoggedIn(false);
      setUser(null);
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
    }
  };
  
  const handleGroupSearch = (e, type = null) => {
    e.preventDefault();
    let queryParams = '';
    
    if (searchQuery.trim()) {
      queryParams += `search=${encodeURIComponent(searchQuery)}`;
    }
    
    if (type) {
      queryParams += queryParams ? `&type=${type}` : `type=${type}`;
    }
    
    navigate(`/unishare/groups${queryParams ? `?${queryParams}` : ''}`);
    setShowSearch(false);
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img
            src={uniShareLogo}
            alt="UniShare Logo"
            style={{ height: '40px', objectFit: 'contain' }}
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Trang chủ</Nav.Link>
            <Nav.Link as={Link} to="/unishare">UniShare</Nav.Link>            {isLoggedIn && (
              <Nav.Link as={Link} to="/ai-chat">
                <FaRobot className="me-1" />
                Trò chuyện AI
              </Nav.Link>
            )}
                     
            <NavDropdown title="Nhóm học" id="groups-dropdown">
              <NavDropdown.Item as={Link} to="/unishare/popular-groups">Nhóm học phổ biến</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/unishare/new-groups">Nhóm học mới nhất</NavDropdown.Item>
              {isLoggedIn && (
                <NavDropdown.Item as={Link} to="/unishare/my-groups">Nhóm của tôi</NavDropdown.Item>
              )}
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/unishare">Tất cả nhóm học</NavDropdown.Item>
            </NavDropdown><NavDropdown title="Tài liệu" id="documents-dropdown">
              <NavDropdown.Item as={Link} to="/unishare-files/popular">Tài liệu phổ biến</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/unishare-files/new">Tài liệu mới</NavDropdown.Item>
              {isLoggedIn && (
                <NavDropdown.Item as={Link} to="/unishare-files/my-files">Tài liệu của tôi</NavDropdown.Item>
              )}
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/unishare-files">Tất cả tài liệu</NavDropdown.Item>
            </NavDropdown>

            
            {isLoggedIn && user && (isAdmin(user) || isModerator(user)) && (
              <Nav.Link as={Link} to="/admin" className="text-danger">
                Quản trị
                {isAdmin(user) && <Badge bg="danger" className="ms-1">Admin</Badge>}
                {isModerator(user) && !isAdmin(user) && <Badge bg="warning" className="ms-1">Mod</Badge>}
              </Nav.Link>
            )}
          </Nav>
          
          <div className="position-relative me-3" ref={searchRef}>
            <Form onSubmit={handleSearch} className="d-flex">
              <InputGroup>
                <Form.Control
                  placeholder="Tìm kiếm khóa học, nhóm, tài liệu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  className="rounded-pill pe-5"
                  style={{ minWidth: '250px' }}
                />
                <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                  <FaSearch color="#0370b7" />
                </div>
              </InputGroup>
            </Form>
            
            {showSearch && (
              <div className="position-absolute bg-white shadow rounded p-3 mt-1 w-100" style={{ zIndex: 1000, minWidth: '350px' }}>
                {loading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Đang tìm...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {searchQuery.length > 0 && (
                      <div className="d-flex justify-content-between mb-2">
                        <span>Kết quả tìm kiếm cho "{searchQuery}"</span>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-decoration-none p-0"
                          onClick={handleSearch}
                        >
                          Xem tất cả
                        </Button>
                      </div>
                    )}
                    
                    <div className="mb-3">

                      {searchResults.courses.length > 0 ? (
                        <ul className="list-unstyled">
                          {searchResults.courses.map(course => (
                            <li key={course.id} className="py-1">
                              <Link 
                                to={`/unishare/groups/${course.id}`}
                                className="text-decoration-none text-dark d-block"
                                onClick={() => setShowSearch(false)}
                              >
                                {course.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="small text-muted">Không tìm thấy khóa học phù hợp</p>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="d-flex align-items-center mb-0">
                          <FaUsers className="me-2 text-success" /> Nhóm học
                        </h6>
                        {searchQuery.length > 0 && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="text-decoration-none p-0"
                            onClick={(e) => handleGroupSearch(e)}
                          >
                            Xem tất cả nhóm
                          </Button>
                        )}
                      </div>
                      {searchResults.groups.length > 0 ? (
                        <ul className="list-unstyled">
                          {searchResults.groups.map(group => (
                            <li key={group.id} className="py-1 border-bottom">
                              <Link 
                                to={`/unishare/groups/${group.id}`}
                                className="text-decoration-none text-dark d-block py-1"
                                onClick={() => setShowSearch(false)}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <span className="fw-medium">{group.name}</span>
                                    {group.type && group.type !== 'course' && (
                                      <Badge 
                                        bg="success" 
                                        className="ms-2"
                                      >
                                        {group.type === 'university' ? 'Nhóm đại học' : 'Nhóm hứng thú'}
                                      </Badge>
                                    )}
                                  </div>
                                  <Badge bg="light" text="dark" className="px-2">
                                    {group.member_count || 0} thành viên
                                  </Badge>
                                </div>
                                {group.description && (
                                  <small className="text-muted d-block text-truncate">
                                    {group.description.substring(0, 60)}{group.description.length > 60 ? '...' : ''}
                                  </small>
                                )}
                              </Link>
                            </li>
                          ))}
                          {searchQuery.length > 0 && (
                            <li className="mt-2">
                              <Button 
                                variant="outline-success" 
                                size="sm" 
                                className="w-100"
                                onClick={(e) => handleGroupSearch(e, 'study')}
                              >
                                Xem tất cả nhóm học
                              </Button>
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="small text-muted">Không tìm thấy nhóm học phù hợp</p>
                      )}
                    </div>
                    
                    <div>
                      <h6 className="d-flex align-items-center">
                        <FaFile className="me-2 text-warning" /> Tài liệu
                      </h6>
                      {searchResults.documents.length > 0 ? (
                        <ul className="list-unstyled">
                          {searchResults.documents.map(doc => (
                            <li key={doc.id} className="py-1">
                              <Link 
                                to={`/unishare-files/view/${doc.id}`}
                                className="text-decoration-none text-dark d-block"
                                onClick={() => setShowSearch(false)}
                              >
                                {doc.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="small text-muted">Không tìm thấy tài liệu phù hợp</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          {isLoggedIn && user ? (
            <Nav className="align-items-center">
              <Nav.Link href="#notifications" className="me-2">
                <FaBell size={20} style={{ color: '#0370b7' }} />
              </Nav.Link>
              <NavDropdown
                title={
                  <>
                    <Image
                      src={user.avatar || userAvatar}
                      roundedCircle
                      className="me-2"
                      style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = userAvatar;
                      }}
                    />
                    {user.name}
                  </>
                }
                id="user-profile-dropdown"
                align="end"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  Hồ Sơ Tài Khoản
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/profile/settings">
                  Cài đặt
                </NavDropdown.Item>
                {(isAdmin(user) || isModerator(user)) && (
                  <NavDropdown.Item as={Link} to="/admin">
                    Quản trị hệ thống
                  </NavDropdown.Item>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Đăng xuất
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          ) : (
            <div className="d-flex gap-2">
              <Button as={Link} to="/login" variant="primary" className="rounded-pill">Đăng nhập</Button>
              <Button as={Link} to="/register" variant="outline-primary" className="rounded-pill">Đăng ký</Button>
            </div>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
