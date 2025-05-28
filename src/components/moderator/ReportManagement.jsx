import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert, Form, InputGroup, Dropdown, Modal, Nav, Pagination, Row, Col } from 'react-bootstrap';
import { FaSearch, FaEye, FaCheckCircle, FaTimesCircle, FaTrash, FaFilter } from 'react-icons/fa';
import { moderatorService } from '../../services/moderatorService';

const ModeratorReportManagement = () => {
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
  const [activeTab, setActiveTab] = useState('pending');
  const [reportType, setReportType] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewAllReports, setViewAllReports] = useState(false);
  
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
  }, [currentPage, filters, refreshTrigger, viewAllReports]);

  // Function to test the API directly
  const testAPI = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await moderatorService.testReportsAPI();
      console.log("API Test Result:", result);
      
      if (result.success) {
        alert("API test successful. Check console for details.");
      } else {
        setError(`API test failed: ${result.error}`);
      }
    } catch (err) {
      console.error("Error in API test:", err);
      setError('API test failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch reports with current filters
  const fetchReports = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log("Fetching reports with filters:", filters);
      
      const params = {
        page: currentPage,
        per_page: 10,
        ...filters
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      let response;
      
      // Use getAllReports if viewAllReports is true, otherwise use regular getReports
      if (viewAllReports) {
        response = await moderatorService.getAllReports(params);
        console.log("All reports response:", response);
      } else {
        response = await moderatorService.getReports(params);
        console.log("Filtered reports response:", response);
      }
      
      if (!response) {
        console.error("Empty response from getReports");
        setError("Received empty response from server");
        setReports([]);
        setTotalPages(1);
        return;
      }
      
      if (response.success && response.data) {
        console.log("Setting reports from data:", response.data);
        setReports(response.data.data || []);
        setTotalPages(response.data.last_page || 1);
        setCurrentPage(response.data.current_page || 1);
      } else {
        console.warn("Unexpected response format:", response);
        setError("Unexpected response format from server");
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
      
      // Fetch the detailed report data if needed
      const reportDetails = await moderatorService.getReportDetails(report.id);
      console.log('Fetched report details:', reportDetails);
      
      // Make sure we're extracting the actual data from the response
      // and not trying to use the entire response object
      if (reportDetails && reportDetails.success) {
        // Use data from successful response
        const reportData = reportDetails.data.report || reportDetails.data;
        const reportableInfo = reportDetails.data.reportable_info || {};
        
        setSelectedReport({
          ...report,
          ...reportData,
          reportable_info: reportableInfo
        });
      } else if (reportDetails && typeof reportDetails === 'object') {
        // Directly use report details if it's already formatted correctly
        setSelectedReport({
          ...report,
          ...reportDetails
        });
      } else {
        // Keep original report data if details aren't available
        console.warn('Report details in unexpected format', reportDetails);
      }
    } catch (error) {
      console.error("Error preparing report details:", error);
      // Keep the original report data if details fetch fails
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
              await moderatorService.deleteDocument(reportableId, `Nội dung bị xóa do báo cáo: ${resolutionNote}`);
              contentActionMessage = 'Tài liệu đã bị xóa.';
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
      
      await moderatorService.resolveReport(selectedReport.id, action, finalResolutionNote);
      
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

  // Toggle view all reports
  const toggleViewAllReports = () => {
    setViewAllReports(!viewAllReports);
    setCurrentPage(1); // Reset to page 1 when switching views
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
    
    // Check if we have a clean type name already
    if (typeString === 'document' || 
        typeString === 'group' || 
        typeString === 'post' || 
        typeString === 'comment' || 
        typeString === 'user') {
      // Use the clean type directly
    } else {
      // Extract class name from namespace path
      typeString = typeString.split('\\').pop().toLowerCase();
    }
    
    switch (typeString) {
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
        return typeString;
    }
  };

  // Function to get report content from reportable object
  const getReportContent = (report) => {
    if (!report) return 'Nội dung không xác định';
    
    // Try to find content in various properties based on report type
    if (report.reportable) {
      return report.reportable.title || 
             report.reportable.name || 
             report.reportable.content ||
             report.reportable.description ||
             'Nội dung không xác định';
    }
    
    // Fall back to report reason if no reportable content is available
    return report.reason || 'Nội dung không xác định';
  };

  return (
    <div className="report-management-container">
      <h4 className="mb-4">Quản Lý Báo Cáo</h4>
      
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
          <div className="mt-2">
            <Button variant="outline-danger" size="sm" onClick={testAPI}>
              Test API Connection
            </Button>
          </div>
        </Alert>
      )}
      
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          {/* Tabs for different report statuses */}
          <Nav variant="tabs" className="mb-3" activeKey={viewAllReports ? 'view-all' : activeTab}>
            <Nav.Item>
              <Nav.Link 
                eventKey="view-all" 
                active={viewAllReports}
                onClick={() => {
                  setViewAllReports(true);
                  setActiveTab('all');
                }}
              >
                Tất cả báo cáo (không lọc)
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="all" 
                active={!viewAllReports && activeTab === 'all'}
                onClick={() => {
                  setViewAllReports(false);
                  handleTabChange('all');
                }}
              >
                Tất cả báo cáo (có lọc)
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
                  <Dropdown.Item onClick={() => handleTypeFilter('post')}>Bài viết</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleTypeFilter('comment')}>Bình luận</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              
              <Button 
                variant={viewAllReports ? "primary" : "outline-primary"} 
                className="me-2"
                onClick={toggleViewAllReports}
              >
                {viewAllReports ? "Xem Lọc Báo Cáo" : "Xem Tất Cả Báo Cáo"}
              </Button>
              
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
                            {getReportContent(report)}
                          </div>
                          <div className="text-muted small">
                            ID: {report.reportable_id || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {getReportableTypeText(report.reportable_type || report.reportable_type_name)}
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
                      <p><strong>Người xử lý:</strong> {selectedReport.resolver?.name || 'Người kiểm duyệt'}</p>
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
                  {/* Access reportable directly if it exists, or try to use reportable_info if available */}
                  {selectedReport.reportable ? (
                    <>
                      <p><strong>Tiêu đề/Tên:</strong> {selectedReport.reportable.title || selectedReport.reportable.name || 'Không có tiêu đề'}</p>
                      <p><strong>Nội dung:</strong> {selectedReport.reportable.description || selectedReport.reportable.content || 'Không có nội dung'}</p>
                      {selectedReport.reportable.user && (
                        <p><strong>Người tạo:</strong> {selectedReport.reportable.user.name} ({selectedReport.reportable.user.email})</p>
                      )}
                    </>
                  ) : selectedReport.reportable_info ? (
                    <>
                      <p><strong>Tiêu đề/Tên:</strong> {selectedReport.reportable_info.title || 'Không có tiêu đề'}</p>
                      <p><strong>Nội dung:</strong> {selectedReport.reportable_info.details || 'Không có nội dung'}</p>
                      <p><strong>Người tạo:</strong> {selectedReport.reportable_info.user || 'Không xác định'}</p>
                    </>
                  ) : (
                    <p>Không có thông tin chi tiết về nội dung bị báo cáo.</p>
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

export default ModeratorReportManagement;
