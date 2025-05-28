import React, { useState, useEffect } from 'react';
import { InputGroup, Form, Row, Col, Card, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { BsSearch, BsFileEarmark, BsThreeDotsVertical, BsEye, BsDownload, BsTrash, BsPencil } from 'react-icons/bs';
import { profileService } from '../../services';
import UnishareDropdown from './UnishareDropdown';

const MyFiles = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Fetch user documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filter documents when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDocuments(documents);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredDocuments(
        documents.filter(doc => 
          doc.title.toLowerCase().includes(term) || 
          doc.subject?.toLowerCase().includes(term) ||
          doc.course_code?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, documents]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await profileService.getUserDocuments();
      
      if (response && response.data) {
        setDocuments(response.data);
        setFilteredDocuments(response.data);
      } else {
        throw new Error('Không thể tải danh sách tài liệu');
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError('Không thể tải danh sách tài liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleViewDocument = (id) => {
    navigate(`/unishare-files/view/${id}`);
  };

  const handleEditDocument = (id) => {
    navigate(`/unishare-files/edit/${id}`);
  };

  const handleDownloadDocument = async (id) => {
    try {
      await profileService.downloadDocument(id);
    } catch (error) {
      console.error("Download error:", error);
      alert(error.message || 'Không thể tải xuống tài liệu');
    }
  };

  const handleDeleteDocument = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài liệu này không?')) {
      try {
        await profileService.deleteDocument(id);
        // After successful deletion, refresh document list
        fetchDocuments();
      } catch (error) {
        console.error("Delete error:", error);
        alert(error.message || 'Không thể xóa tài liệu');
      }
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (!fileType) return <BsFileEarmark className="text-primary" size={20} />;
    
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) {
      return <BsFileEarmark className="text-danger" size={20} />;
    } else if (type.includes('word') || type.includes('doc')) {
      return <BsFileEarmark className="text-primary" size={20} />;
    } else if (type.includes('excel') || type.includes('sheet')) {
      return <BsFileEarmark className="text-success" size={20} />;
    } else if (type.includes('powerpoint') || type.includes('presentation')) {
      return <BsFileEarmark className="text-warning" size={20} />;
    } else {
      return <BsFileEarmark className="text-primary" size={20} />;
    }
  };

  return (
    <>
      {/* Search bar */}
      <InputGroup className="mb-4">
        <InputGroup.Text className="bg-light border-end-0">
          <BsSearch />
        </InputGroup.Text>
        <Form.Control
          placeholder="Tìm kiếm"
          className="bg-light border-start-0"
          value={searchTerm}
          onChange={handleSearch}
        />
      </InputGroup>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">File của tôi</h4>
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
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-3">
            <BsFileEarmark size={50} className="text-muted" />
          </div>
          <h5 className="text-muted">
            {searchTerm ? 'Không tìm thấy tài liệu phù hợp' : 'Chưa có tài liệu nào'}
          </h5>
          {!searchTerm && (
            <Button 
              as={Link}
              to="/unishare-files/upload"
              variant="primary"
              className="mt-3"
            >
              Tải lên tài liệu đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Document cards */}
          <Row className="g-3">
            {filteredDocuments.map((doc) => (
              <Col lg={4} md={6} key={doc.id}>
                <Card className="shadow-sm h-100">
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center w-75">
                        <div className="me-2">
                          {getFileIcon(doc.file_type)}
                        </div>
                        <div className="text-truncate">
                          <div className="fw-bold text-truncate">{doc.title}</div>
                          <div className="text-muted small">
                            {formatFileSize(doc.file_size)}
                          </div>
                        </div>
                      </div>
                      <UnishareDropdown>
                        <UnishareDropdown.Toggle as="div" className="btn btn-link p-0">
                          <BsThreeDotsVertical />
                        </UnishareDropdown.Toggle>
                        <UnishareDropdown.Menu align="end">
                          <UnishareDropdown.Item onClick={() => handleViewDocument(doc.id)}>
                            <BsEye className="me-2" /> Xem
                          </UnishareDropdown.Item>
                          <UnishareDropdown.Item onClick={() => handleDownloadDocument(doc.id)}>
                            <BsDownload className="me-2" /> Tải xuống
                          </UnishareDropdown.Item>
                          <UnishareDropdown.Item onClick={() => handleEditDocument(doc.id)}>
                            <BsPencil className="me-2" /> Chỉnh sửa
                          </UnishareDropdown.Item>
                          <UnishareDropdown.Item className="text-danger" onClick={() => handleDeleteDocument(doc.id)}>
                            <BsTrash className="me-2" /> Xóa
                          </UnishareDropdown.Item>
                        </UnishareDropdown.Menu>
                      </UnishareDropdown>
                    </div>
                    
                    <div className="mb-2">
                      {doc.subject && <small className="d-block text-muted">Môn học: {doc.subject}</small>}
                      {doc.course_code && <small className="d-block text-muted">Mã môn: {doc.course_code}</small>}
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        {doc.is_approved ? (
                          <Badge bg="success" pill>Đã duyệt</Badge>
                        ) : (
                          <Badge bg="warning" text="dark" pill>Chờ duyệt</Badge>
                        )}
                        {doc.is_official && (
                          <Badge bg="primary" pill className="ms-1">Chính thức</Badge>
                        )}
                      </div>
                      <div className="text-muted small">
                        {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          {documents.length > 6 && (
            <div className="text-center mt-4">
              <Button variant="outline-primary">Xem thêm</Button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default MyFiles;
