import React, { useState, useEffect } from 'react';
import { Table, Button, Pagination, Badge, Spinner, Alert, Card, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { profileService } from '../../services';
import { FaDownload, FaEye, FaEdit, FaTrash, FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint, FaFileImage, FaFileArchive } from 'react-icons/fa';

const DocumentsList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchDocuments(currentPage);
  }, [currentPage]);

  const fetchDocuments = async (page) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await profileService.getUserDocuments({ page, per_page: 10 });
      
      // The response is already successful if we received data
      if (response.data && Array.isArray(response.data)) {
        setDocuments(response.data);
        setTotalPages(response.meta?.last_page || 1);
      } else if (response.data === undefined) {
        throw new Error('Không nhận được dữ liệu từ máy chủ');
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      
      // Handle role-based errors specifically
      if (err.response && err.response.status === 403) {
        if (err.response.data?.message?.includes('role')) {
          setError('Bạn không có quyền truy cập tài liệu. Vui lòng đảm bảo bạn đã đăng nhập với tài khoản sinh viên.');
        } else {
          setError('Bạn không có quyền truy cập tài liệu.');
        }
      } else {
        setError('Không thể tải danh sách tài liệu. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (documentId) => {
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
      setDocumentToDelete(doc);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      setDeleteLoading(true);
      
      const response = await profileService.deleteDocument(documentToDelete.id);
      
      // Check if response contains a message property, which indicates success
      if (response.message && response.message.includes('thành công')) {
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentToDelete.id));
        setShowDeleteModal(false);
        setDocumentToDelete(null);
        
        // If we deleted the last item on the page, go to previous page
        if (documents.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          // Otherwise just refresh current page
          fetchDocuments(currentPage);
        }
      } else {
        throw new Error(response.message || 'Không thể xóa tài liệu');
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      setError('Không thể xóa tài liệu. Vui lòng thử lại sau.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let items = [];
    const maxVisible = 5; // Maximum number of page links to show
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    // Adjust start page if end page is at maximum
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // Add first page if not visible
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

    // Add last page if not visible
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

  const getFileIcon = (fileType) => {
    if (!fileType) return <FaFileAlt />;
    
    fileType = fileType.toLowerCase();
    
    if (fileType.includes('pdf')) return <FaFilePdf className="text-danger" />;
    if (fileType.includes('word') || fileType.includes('doc')) return <FaFileWord className="text-primary" />;
    if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('xls')) return <FaFileExcel className="text-success" />;
    if (fileType.includes('powerpoint') || fileType.includes('presentation') || fileType.includes('ppt')) return <FaFilePowerpoint className="text-warning" />;
    if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpg') || fileType.includes('jpeg')) return <FaFileImage className="text-info" />;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return <FaFileArchive className="text-secondary" />;
    
    return <FaFileAlt />;
  };

  if (loading && documents.length === 0) {
    return <div className="text-center py-4"><Spinner animation="border" /></div>;
  }

  if (error && documents.length === 0) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (documents.length === 0 && !loading) {
    return (
      <Card className="text-center p-5 mb-4">
        <Card.Body>
          <h5 className="mb-3">Bạn chưa tải lên tài liệu nào</h5>
          <p className="text-muted mb-4">Hãy bắt đầu chia sẻ tài liệu của bạn với cộng đồng.</p>
          <Button 
            as={Link} 
            to="/unishare-files/upload" 
            variant="primary"
          >
            Tải lên tài liệu mới
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="documents-list-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Tài liệu của bạn</h5>
        <Button 
          as={Link} 
          to="/unishare-files/upload" 
          variant="primary" 
          size="sm"
        >
          Tải lên tài liệu mới
        </Button>
      </div>
      
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      {loading && <div className="text-center py-2 mb-3"><Spinner animation="border" size="sm" /></div>}
      
      <div className="table-responsive">
        <Table hover className="align-middle">
          <thead>
            <tr>
              <th>Tên tài liệu</th>
              <th>Loại</th>
              <th>Kích thước</th>
              <th>Trạng thái</th>
              <th>Thống kê</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc.id}>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="file-icon me-1">
                      {getFileIcon(doc.file_type)}
                    </div>
                    <div>
                      <Link to={`/unishare-files/view/${doc.id}`} className="text-decoration-none">
                        {doc.title}
                      </Link>
                      <div className="text-muted small">{new Date(doc.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </td>
                <td>{doc.file_type || 'N/A'}</td>
                <td>{formatFileSize(doc.file_size)}</td>
                <td>
                  {doc.is_approved ? (
                    <Badge bg="success">Đã duyệt</Badge>
                  ) : (
                    <Badge bg="warning" text="dark">Chờ duyệt</Badge>
                  )}
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <span className="me-2">
                      <FaEye className="text-muted me-1" />
                      {doc.view_count || 0}
                    </span>
                    <span>
                      <FaDownload className="text-muted me-1" />
                      {doc.download_count || 0}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="d-flex">
                    <Button 
                      as={Link}
                      to={`/unishare-files/view/${doc.id}`}
                      variant="light" 
                      size="sm" 
                      className="me-1" 
                      title="Xem"
                    >
                      <FaEye />
                    </Button>
                    <Button 
                      as={Link}
                      to={`/unishare-files/edit/${doc.id}`}
                      variant="light" 
                      size="sm" 
                      className="me-1" 
                      title="Chỉnh sửa"
                    >
                      <FaEdit />
                    </Button>
                    <Button 
                      variant="light" 
                      size="sm" 
                      className="text-danger" 
                      title="Xóa"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      
      {renderPagination()}
      
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa tài liệu "{documentToDelete?.title}"?
          <div className="text-danger mt-2">
            <small>Lưu ý: Hành động này không thể hoàn tác.</small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleteLoading}>
            {deleteLoading ? <><Spinner as="span" animation="border" size="sm" /> Đang xóa...</> : 'Xóa'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DocumentsList;
