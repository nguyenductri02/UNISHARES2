import React, { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Card, Spinner, Badge, Alert, Modal, Pagination, Row, Col, Dropdown } from 'react-bootstrap';
import { FaSearch, FaEye, FaTrash, FaCheck, FaTimes, FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaEllipsisV } from 'react-icons/fa';
import moderatorService from '../../services/moderatorService';
import DocumentPreviewModal from './DocumentPreviewModal';

const ModeratorDocumentManagement = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDesc, setSortDesc] = useState(true);

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [currentPage, statusFilter, sortBy, sortDesc]);

  const fetchDocuments = async (search = '') => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page: currentPage,
        per_page: 10,
        sort_by: sortBy,
        sort_desc: sortDesc,
        search: search || searchTerm
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Use the combined service with built-in normalization
      const response = await moderatorService.getDocuments(params);

      setDocuments(response.data || []);
      setTotalPages(response.meta?.last_page || 1);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError('Không thể tải danh sách tài liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDocuments(searchTerm);
  };

  // File icon based on file type
  const getFileIcon = (fileType) => {
    if (!fileType) return <FaFileAlt />;

    fileType = fileType.toLowerCase();

    if (fileType.includes('pdf')) return <FaFilePdf className="text-danger" />;
    if (fileType.includes('word') || fileType.includes('doc')) return <FaFileWord className="text-primary" />;
    if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('xls')) return <FaFileExcel className="text-success" />;

    return <FaFileAlt />;
  };

  // Action handlers
  const handleView = (document) => {
    setSelectedDocument(document);
    setShowPreviewModal(true);
  };

  const handleApprove = (document) => {
    if (document.is_approved) {
      return;
    }

    setSelectedDocument(document);
    setShowApproveModal(true);
  };

  const handleReject = (document) => {
    setSelectedDocument(document);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleDelete = (document) => {
    setSelectedDocument(document);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedDocument) return;

    setActionLoading(true);

    try {
      if (selectedDocument.is_approved) {
        setShowApproveModal(false);
        return;
      }

      const response = await moderatorService.approveDocument(selectedDocument.id);

      setDocuments(prevDocs =>
        prevDocs.map(doc =>
          doc.id === selectedDocument.id ? { ...doc, is_approved: true } : doc
        )
      );

      setShowApproveModal(false);
    } catch (err) {
      console.error("Error approving document:", err);

      if (err.message && (
          err.message.includes('already approved') ||
          (err.response?.data?.message && err.response.data.message.includes('already approved'))
      )) {
        setDocuments(prevDocs =>
          prevDocs.map(doc =>
            doc.id === selectedDocument.id ? { ...doc, is_approved: true } : doc
          )
        );
        setShowApproveModal(false);
      } else {
        setError('Không thể phê duyệt tài liệu. Vui lòng thử lại sau.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedDocument || !rejectReason) return;

    setActionLoading(true);

    try {
      const response = await moderatorService.rejectDocument(selectedDocument.id, rejectReason);

      setDocuments(prevDocs =>
        prevDocs.map(doc =>
          doc.id === selectedDocument.id ? { ...doc, is_approved: false } : doc
        )
      );

      setShowRejectModal(false);
    } catch (err) {
      console.error("Error rejecting document:", err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Không thể từ chối tài liệu. Vui lòng thử lại sau.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedDocument) return;

    setActionLoading(true);

    try {
      await moderatorService.deleteDocument(selectedDocument.id, deleteReason);

      setDocuments(prevDocs =>
        prevDocs.filter(doc => doc.id !== selectedDocument.id)
      );

      setShowDeleteModal(false);
    } catch (err) {
      console.error("Error deleting document:", err);
      setError('Không thể xóa tài liệu. Vui lòng thử lại sau.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

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

  const renderActionButtons = (doc) => {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      return (
        <Dropdown align="end">
          <Dropdown.Toggle variant="light" size="sm" id={`dropdown-${doc.id}`} className="btn-icon">
            <FaEllipsisV />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => handleView(doc)}>
              <FaEye className="me-2" /> Xem
            </Dropdown.Item>
            
            {!doc.is_approved && (
              <Dropdown.Item onClick={() => handleApprove(doc)}>
                <FaCheck className="me-2" /> Phê duyệt
              </Dropdown.Item>
            )}
            
            <Dropdown.Item onClick={() => handleReject(doc)}>
              <FaTimes className="me-2" /> Từ chối
            </Dropdown.Item>
            
            <Dropdown.Item onClick={() => handleDelete(doc)} className="text-danger">
              <FaTrash className="me-2" /> Xóa
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      );
    }

    return (
      <div className="d-flex justify-content-center">
        <Button 
          variant="light" 
          size="sm" 
          className="me-1" 
          title="Xem"
          onClick={() => handleView(doc)}
        >
          <FaEye />
        </Button>
        
        {!doc.is_approved && (
          <Button 
            variant="success" 
            size="sm" 
            className="me-1" 
            title="Phê duyệt"
            onClick={() => handleApprove(doc)}
          >
            <FaCheck />
          </Button>
        )}
        
        <Button 
          variant="warning" 
          size="sm" 
          className="me-1" 
          title="Từ chối"
          onClick={() => handleReject(doc)}
        >
          <FaTimes />
        </Button>
        
        <Button 
          variant="danger" 
          size="sm" 
          title="Xóa"
          onClick={() => handleDelete(doc)}
        >
          <FaTrash />
        </Button>
      </div>
    );
  };

  // Helper function to safely get user name
  const getUserName = (doc) => {
    if (doc.user && doc.user.name) {
      return doc.user.name;
    }
    if (doc.user_id) {
      return `User ID: ${doc.user_id}`;
    }
    return 'Không xác định';
  };

  const renderMobileDocumentCard = (doc) => {
    return (
      <Card className="mb-3" key={doc.id}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start">
            <div className="d-flex align-items-center mb-2">
              <div className="me-2" style={{ fontSize: '24px' }}>
                {getFileIcon(doc.file_type)}
              </div>
              <div>
                <h6 className="mb-0">{doc.title}</h6>
                <small className="text-muted">{doc.subject || 'Không có môn học'}</small>
              </div>
            </div>
            <div>
              {renderActionButtons(doc)}
            </div>
          </div>
          
          <div className="mt-2">
            <Row className="g-2 text-muted small">
              <Col xs={6}>
                <strong>Người đăng:</strong> {getUserName(doc)}
              </Col>
              <Col xs={6}>
                <strong>Trạng thái:</strong>{' '}
                {doc.is_approved ? (
                  <Badge bg="success">Đã duyệt</Badge>
                ) : (
                  <Badge bg="warning" text="dark">Chờ duyệt</Badge>
                )}
              </Col>
              <Col xs={6}>
                <strong>Ngày tạo:</strong> {new Date(doc.created_at).toLocaleDateString()}
              </Col>
            </Row>
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="document-management-container">
      <h4 className="mb-4">Quản Lý Tài Liệu</h4>
      
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Form className="d-flex" onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Tìm kiếm tài liệu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="primary" type="submit">
                    <FaSearch />
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            
            <Col xs={12} md={6}>
              <Row className="g-2">
                <Col xs={6}>
                  <Form.Select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-100"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="pending">Chờ duyệt</option>
                  </Form.Select>
                </Col>
                <Col xs={6}>
                  <Form.Select 
                    value={`${sortBy}-${sortDesc ? 'desc' : 'asc'}`}
                    onChange={(e) => {
                      const [newSortBy, direction] = e.target.value.split('-');
                      setSortBy(newSortBy);
                      setSortDesc(direction === 'desc');
                    }}
                    className="w-100"
                  >
                    <option value="created_at-desc">Mới nhất</option>
                    <option value="created_at-asc">Cũ nhất</option>
                    <option value="title-asc">Tên (A-Z)</option>
                    <option value="title-desc">Tên (Z-A)</option>
                    <option value="downloads-desc">Lượt tải (cao-thấp)</option>
                    <option value="views-desc">Lượt xem (cao-thấp)</option>
                  </Form.Select>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : documents && documents.length > 0 ? (
        <>
          <div className="d-block d-md-none">
            {documents.map(doc => renderMobileDocumentCard(doc))}
          </div>
          
          <div className="d-none d-md-block table-responsive">
            <Table hover className="align-middle">
              <thead>
                <tr>
                  <th>Tên tài liệu</th>
                  <th>Người đăng</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="me-2" style={{ width: '40px', height: '40px', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getFileIcon(doc.file_type)}
                        </div>
                        <div>
                          <div className="fw-medium">{doc.title}</div>
                          <div className="text-muted small">{doc.subject || 'Không có môn học'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{getUserName(doc)}</td>
                    <td>
                      {doc.is_approved ? (
                        <Badge bg="success">Đã duyệt</Badge>
                      ) : (
                        <Badge bg="warning" text="dark">Chờ duyệt</Badge>
                      )}
                    </td>
                    <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td>{renderActionButtons(doc)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          
          {renderPagination()}
        </>
      ) : (
        <Alert variant="info">
          Không tìm thấy tài liệu nào phù hợp với bộ lọc.
        </Alert>
      )}
      
      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title>Chi tiết tài liệu</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          {selectedDocument && (
            <div>
              <h5>{selectedDocument.title}</h5>
              <p className="text-muted">{selectedDocument.description || 'Không có mô tả'}</p>
              
              <hr />
              
              <Row className="g-3">
                <Col xs={12} sm={6}>
                  <div className="mb-2">
                    <strong>Người đăng:</strong> {selectedDocument.user?.name || 'Không xác định'}
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div className="mb-2">
                    <strong>Môn học:</strong> {selectedDocument.subject || 'N/A'}
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div className="mb-2">
                    <strong>Mã môn học:</strong> {selectedDocument.course_code || 'N/A'}
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div className="mb-2">
                    <strong>Loại file:</strong> {selectedDocument.file_type || 'N/A'}
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div className="mb-2">
                    <strong>Lượt xem:</strong> {selectedDocument.view_count || 0}
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div className="mb-2">
                    <strong>Trạng thái:</strong>{' '}
                    {selectedDocument.is_approved ? (
                      <Badge bg="success">Đã duyệt</Badge>
                    ) : (
                      <Badge bg="warning" text="dark">Chờ duyệt</Badge>
                    )}
                  </div>
                </Col>
                <Col xs={12}>
                  <div className="mb-2">
                    <strong>Ngày tạo:</strong> {new Date(selectedDocument.created_at).toLocaleString()}
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Đóng
          </Button>
          {selectedDocument && !selectedDocument.is_approved && (
            <Button variant="success" onClick={() => {
              setShowViewModal(false);
              handleApprove(selectedDocument);
            }}>
              Phê duyệt
            </Button>
          )}
        </Modal.Footer>
      </Modal>
      
      {/* Approve Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Phê duyệt tài liệu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn phê duyệt tài liệu "{selectedDocument?.title}"?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)} disabled={actionLoading}>
            Hủy
          </Button>
          <Button variant="success" onClick={confirmApprove} disabled={actionLoading}>
            {actionLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Phê duyệt'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Reject Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Từ chối tài liệu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn từ chối tài liệu "{selectedDocument?.title}"?</p>
          <Form.Group>
            <Form.Label>Lý do từ chối</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              value={rejectReason} 
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối tài liệu..."
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)} disabled={actionLoading}>
            Hủy
          </Button>
          <Button 
            variant="warning" 
            onClick={confirmReject} 
            disabled={actionLoading || !rejectReason.trim()}
          >
            {actionLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Từ chối'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xóa tài liệu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xóa tài liệu "{selectedDocument?.title}"?</p>
          <div className="text-danger mb-3">
            <small>Lưu ý: Hành động này không thể hoàn tác.</small>
          </div>
          <Form.Group>
            <Form.Label>Lý do xóa</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              value={deleteReason} 
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Nhập lý do xóa tài liệu (không bắt buộc)..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={actionLoading}>
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={actionLoading}>
            {actionLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Xóa'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        document={selectedDocument}
      />
    </div>
  );
};

export default ModeratorDocumentManagement;
