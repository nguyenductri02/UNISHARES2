import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert, Form, InputGroup, Dropdown, Modal, Nav, Pagination, Row, Col } from 'react-bootstrap';
import { FaSearch, FaEye, FaCheckCircle, FaTimesCircle, FaTrash, FaFilter } from 'react-icons/fa';
import { adminService } from '../../services';

const ReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionLoading, setResolutionLoading] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [reportType, setReportType] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'pending',
    type: 'all',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Load reports when component mounts or filters change
  useEffect(() => {
    fetchReports();
  }, [currentPage, filters, refreshTrigger]);

  // Function to fetch reports with current filters
  const fetchReports = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        page: currentPage,
        per_page: 10,
        ...filters
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await adminService.getReports(params);
      
      console.log('API Response:', response);
      
      // Handle the double nesting structure in the response
      if (response && response.success) {
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // Handle the response.success -> response.data -> response.data.data nesting
          setReports(response.data.data);
          setTotalPages(response.data.last_page || 1);
        } 
        else if (response.data && Array.isArray(response.data)) {
          // Handle response.success -> response.data (array) structure
          setReports(response.data);
          setTotalPages(1);
        }
        else {
          console.warn('Unexpected data format:', response.data);
          setReports([]);
          setTotalPages(1);
        }
      } else {
        console.warn('API response did not contain expected success data:', response);
        setReports([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError('Không thể tải danh sách báo cáo. Vui lòng thử lại sau.');
      setReports([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReports();
  };

  // View report details
  const handleViewDetails = async (report) => {
    setSelectedReport(report);
    setResolutionNote('');
    
    try {
      console.log('Selected report:', report);
      
      // The report already contains all the needed data
      // Just use it directly without fetching additional details
      setSelectedReport(report);
    } catch (error) {
      console.error("Error preparing report details:", error);
    }
    
    setShowDetailsModal(true);
  };

  // Handle report resolution (approve, reject, delete)
  const handleResolveReport = async (action) => {
    if (!selectedReport) return;
    
    if (!resolutionNote.trim()) {
      alert('Vui lòng nhập ghi chú giải quyết báo cáo.');
      return;
    }
    
    setResolutionLoading(true);
    setError('');
    
    try {
      let finalResolutionNote = resolutionNote;

      if (action === 'resolve') {
        // If accepting the report, also action the content
        const reportableType = selectedReport.reportable_type?.split('\\').pop().toLowerCase() || '';
        const reportableId = selectedReport.reportable_id;
        let contentActionMessage = '';

        if (reportableId) {
          try {
            if (reportableType === 'document') {
              await adminService.deleteDocument(reportableId, `Nội dung bị xóa do báo cáo: ${resolutionNote}`);
              contentActionMessage = 'Tài liệu đã bị xóa.';
            } else if (reportableType === 'group') {
              await adminService.deleteGroup(reportableId);
              contentActionMessage = 'Nhóm đã bị xóa.';
            } else if (reportableType === 'post') {
              await adminService.deletePost(reportableId, `Bài viết bị xóa do báo cáo: ${resolutionNote}`);
              contentActionMessage = 'Bài viết đã bị xóa.';
            } else if (reportableType === 'user') {
              await adminService.banUser(reportableId, `Người dùng bị cấm do báo cáo: ${resolutionNote}`);
              contentActionMessage = 'Người dùng đã bị cấm.';
            } else if (reportableType === 'comment') {
              console.warn(`Action for comment type not fully implemented yet for report ID ${selectedReport.id}`);
              contentActionMessage = 'Hành động cho bình luận chưa được triển khai đầy đủ.';
            }
            finalResolutionNote = `${contentActionMessage} ${resolutionNote}`;
          } catch (contentError) {
            console.error('Error actioning reported content:', contentError);
            setError(`Không thể xử lý nội dung báo cáo: ${contentError.message || 'Lỗi không xác định'}. Tuy nhiên, báo cáo sẽ vẫn được đánh dấu là đã giải quyết.`);
            finalResolutionNote = `Lỗi khi xử lý nội dung (${contentError.message}). ${resolutionNote}`;
          }
        } else {
          finalResolutionNote = `Không tìm thấy ID nội dung để xử lý. ${resolutionNote}`;
        }
      }
      
      await adminService.resolveReport(selectedReport.id, action, finalResolutionNote);
      
      // Close modal and refresh reports
      setShowDetailsModal(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(`Error ${action} report:`, err);
      setError(`Không thể xử lý báo cáo. Lỗi: ${err.message || 'Lỗi không xác định'}`);
    } finally {
      setResolutionLoading(false);
    }
  };

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Update filters based on tab
    const newFilters = { ...filters };
    
    if (tab === 'pending') {
      newFilters.status = 'pending';
    } else if (tab === 'resolved') {
      newFilters.status = 'resolved';
    } else if (tab === 'rejected') {
      newFilters.status = 'rejected';
    } else {
      // 'all' tab - remove status filter
      delete newFilters.status;
    }
    
    setFilters(newFilters);
    setCurrentPage(1);
  };
  
  // Handle report type filtering
  const handleTypeFilter = (type) => {
    setReportType(type);
    
    const newFilters = { ...filters };
    if (type === 'all') {
      delete newFilters.type;
    } else {
      newFilters.type = type;
    }
    
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Generate pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const items = [];
    const maxVisible = 5; // Maximum number of page links to show
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    // Adjust start page if end page is at maximum
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // Add first page button if not included in visible range
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis-start" />);
      }
    }

    // Add visible page links
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item 
          key={i} 
          active={i === currentPage}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Add last page button if not included in visible range
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis-end" />);
      }
      items.push(
        <Pagination.Item key={totalPages} onClick={() => setCurrentPage(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="justify-content-center mt-4">
        <Pagination.Prev 
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        />
        {items}
        <Pagination.Next 
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        />
      </Pagination>
    );
  };

  // Render the badge for report status
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning" text="dark">Chưa xử lý</Badge>;
      case 'resolved':
        return <Badge bg="success">Đã giải quyết</Badge>;
      case 'rejected':
        return <Badge bg="danger">Từ chối</Badge>;
      case 'cancelled':
        return <Badge bg="secondary">Đã hủy</Badge>;
      default:
        return <Badge bg="info">Không xác định</Badge>;
    }
  };
  
  // Function to determine report type text
  const getReportableTypeText = (typeString) => {
    if (!typeString) return 'Không xác định';
    
    const type = typeString.split('\\').pop().toLowerCase();
    
    switch (type) {
      case 'document':
        return 'Tài liệu';
      case 'group':
        return 'Nhóm';
      case 'post':
        return 'Bài viết';
      case 'comment':
        return 'Bình luận';
      case 'user':
        return 'Người dùng';
      default:
        return type;
    }
  };

  return (
    <div className="report-management-container">
      <h4 className="mb-4">Quản Lý Báo Cáo</h4>
      
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          {/* Tabs for different report statuses */}
          <Nav variant="tabs" className="mb-3" activeKey={activeTab}>
            <Nav.Item>
              <Nav.Link 
                eventKey="all" 
                onClick={() => handleTabChange('all')}
              >
                Tất cả báo cáo
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="pending" 
                onClick={() => handleTabChange('pending')}
              >
                Chưa xử lý
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="resolved" 
                onClick={() => handleTabChange('resolved')}
              >
                Đã giải quyết
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="rejected" 
                onClick={() => handleTabChange('rejected')}
              >
                Đã từ chối
              </Nav.Link>
            </Nav.Item>
          </Nav>
          
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
            {/* Search bar */}
            <Form className="d-flex mb-2 mb-md-0" onSubmit={handleSearch} style={{ maxWidth: '400px' }}>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm báo cáo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="primary" type="submit">
                  <FaSearch />
                </Button>
              </InputGroup>
            </Form>
            
            {/* Filters */}
            <div className="d-flex">
              <Dropdown className="me-2">
                <Dropdown.Toggle variant="light" id="dropdown-type-filter">
                  <FaFilter className="me-2" />
                  {reportType === 'all' ? 'Tất cả loại' : 
                   reportType === 'document' ? 'Tài liệu' : 
                   reportType === 'group' ? 'Nhóm' :
                   reportType === 'post' ? 'Bài viết' :
                   reportType === 'user' ? 'Người dùng' : 'Loại báo cáo'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleTypeFilter('all')}>Tất cả loại</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleTypeFilter('document')}>Tài liệu</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleTypeFilter('group')}>Nhóm</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleTypeFilter('post')}>Bài viết</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleTypeFilter('user')}>Người dùng</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              
              <Form.Select 
                style={{ width: 'auto' }}
                value={`${filters.sort_by}-${filters.sort_order}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  setFilters({
                    ...filters,
                    sort_by: sortBy,
                    sort_order: sortOrder
                  });
                }}
              >
                <option value="created_at-desc">Mới nhất</option>
                <option value="created_at-asc">Cũ nhất</option>
                <option value="reason-asc">Lý do (A-Z)</option>
                <option value="reason-desc">Lý do (Z-A)</option>
              </Form.Select>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu báo cáo...</p>
        </div>
      ) : reports && reports.length > 0 ? (
        <>
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead>
                <tr>
                  <th>Nội dung báo cáo</th>
                  <th>Loại</th>
                  <th>Lý do</th>
                  <th>Người báo cáo</th>
                  <th>Ngày báo cáo</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div>
                          <div className="fw-medium text-truncate" style={{maxWidth: '200px'}}>
                            {report.reportable?.title || 
                             report.reportable?.name || 
                             'Nội dung không xác định'}
                          </div>
                          <div className="text-muted small">
                            ID: {report.reportable_id || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {getReportableTypeText(report.reportable_type)}
                    </td>
                    <td className="text-truncate" style={{maxWidth: '200px'}}>
                      {report.reason}
                    </td>
                    <td>
                      {report.user?.name || 'Người dùng ẩn danh'}
                    </td>
                    <td>
                      {new Date(report.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      {renderStatusBadge(report.status)}
                    </td>
                    <td>
                      <div className="d-flex justify-content-center">
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="me-1" 
                          title="Xem chi tiết"
                          onClick={() => handleViewDetails(report)}
                        >
                          <FaEye />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          
          {renderPagination()}
        </>
      ) : (
        <Alert variant="info">
          Không tìm thấy báo cáo nào {filters.status ? `với trạng thái "${filters.status}"` : ''}.
        </Alert>
      )}
      
      {/* Report Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết báo cáo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReport ? (
            <div>
              <div className="mb-4">
                <h5 className="mb-3">Thông tin báo cáo</h5>
                <Row>
                  <Col md={6}>
                    <p><strong>Loại báo cáo:</strong> {getReportableTypeText(selectedReport.reportable_type)}</p>
                    <p><strong>Trạng thái:</strong> {renderStatusBadge(selectedReport.status)}</p>
                    <p><strong>Người báo cáo:</strong> {selectedReport.user?.name || 'Không xác định'}</p>
                    <p><strong>Email:</strong> {selectedReport.user?.email || 'Không xác định'}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Ngày báo cáo:</strong> {new Date(selectedReport.created_at).toLocaleDateString('vi-VN')}</p>
                    {selectedReport.resolved_at && (
                      <p><strong>Ngày xử lý:</strong> {new Date(selectedReport.resolved_at).toLocaleDateString('vi-VN')}</p>
                    )}
                    {selectedReport.resolved_by && (
                      <p><strong>Người xử lý:</strong> {selectedReport.resolver?.name || 'Admin'}</p>
                    )}
                  </Col>
                </Row>
              </div>
              
              <div className="mb-4">
                <h5 className="mb-3">Nội dung báo cáo</h5>
                <div className="p-3 bg-light rounded">
                  <p><strong>Lý do:</strong> {selectedReport.reason}</p>
                  <p><strong>Chi tiết:</strong> {selectedReport.details || 'Không có chi tiết'}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h5 className="mb-3">Thông tin nội dung bị báo cáo</h5>
                <div className="p-3 bg-light rounded">
                  <p><strong>Tiêu đề/Tên:</strong> {selectedReport.reportable?.title || selectedReport.reportable?.name || 'Không có tiêu đề'}</p>
                  <p><strong>Nội dung:</strong> {selectedReport.reportable?.description || selectedReport.reportable?.content || 'Không có nội dung'}</p>
                  {selectedReport.reportable?.user && (
                    <p><strong>Người tạo:</strong> {selectedReport.reportable.user.name} ({selectedReport.reportable.user.email})</p>
                  )}
                </div>
              </div>
              
              {/* Show resolution form only for pending reports */}
              {selectedReport.status === 'pending' && (
                <div className="mt-4">
                  <h5 className="mb-3">Xử lý báo cáo</h5>
                  <Form.Group className="mb-3">
                    <Form.Label>Ghi chú xử lý</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Nhập ghi chú về cách xử lý báo cáo này..."
                    />
                  </Form.Group>
                </div>
              )}
              
              {/* If report is already resolved, show resolution note */}
              {selectedReport.status !== 'pending' && selectedReport.resolution_note && (
                <div className="mt-4">
                  <h5 className="mb-3">Ghi chú xử lý</h5>
                  <Alert variant={
                    selectedReport.status === 'resolved' ? 'success' : 
                    selectedReport.status === 'rejected' ? 'danger' : 'secondary'
                  }>
                    {selectedReport.resolution_note}
                  </Alert>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" size="sm" />
              <p>Đang tải dữ liệu...</p>
            </div>
          )}
        </Modal.Body>
        {selectedReport && selectedReport.status === 'pending' && (
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Đóng
            </Button>
            <Button 
              variant="success" 
              onClick={() => handleResolveReport('resolve')}
              disabled={resolutionLoading}
            >
              {resolutionLoading ? <Spinner as="span" animation="border" size="sm" /> : <FaCheckCircle className="me-2" />}
              Chấp nhận và Xử lý nội dung
            </Button>
            <Button 
              variant="danger" 
              onClick={() => handleResolveReport('reject')}
              disabled={resolutionLoading}
            >
              {resolutionLoading ? <Spinner as="span" animation="border" size="sm" /> : <FaTimesCircle className="me-2" />}
              Từ chối báo cáo
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </div>
  );
};

export default ReportManagement;
