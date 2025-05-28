import React, { useState, useEffect } from 'react';
import { InputGroup, Form, Row, Col, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { BsSearch, BsFileEarmark, BsThreeDotsVertical, BsEye, BsDownload, BsShare } from 'react-icons/bs';
import { profileService } from '../../services';

const SharedFiles = () => {
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  // Fetch shared documents on component mount
  useEffect(() => {
    fetchSharedDocuments();
  }, []);

  // Filter documents when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDocuments(sharedDocuments);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredDocuments(
        sharedDocuments.filter(doc => 
          doc.title?.toLowerCase().includes(term) || 
          doc.subject?.toLowerCase().includes(term) ||
          doc.course_code?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, sharedDocuments]);

  const fetchSharedDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get documents that have been shared with the user
      const response = await profileService.getAllDocuments({
        shared_with_me: true,
        per_page: 20
      });
      
      if (response && response.data) {
        setSharedDocuments(response.data);
        setFilteredDocuments(response.data);
      } else {
        throw new Error('Không thể tải tài liệu được chia sẻ');
      }
    } catch (err) {
      console.error("Error fetching shared documents:", err);
      setError('Không thể tải tài liệu được chia sẻ. Vui lòng thử lại sau.');
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

  const handleDownloadDocument = async (id) => {
    try {
      await profileService.downloadDocument(id);
    } catch (error) {
      console.error("Download error:", error);
      alert(error.message || 'Không thể tải xuống tài liệu');
    }
  };

  // Group documents by time periods
  const groupDocumentsByTime = (documents) => {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    const thisWeek = [];
    const lastWeek = [];
    const lastMonth = [];
    const older = [];
    
    documents.forEach(doc => {
      const docDate = new Date(doc.created_at);
      
      if (docDate >= oneWeekAgo) {
        thisWeek.push(doc);
      } else if (docDate >= oneMonthAgo) {
        lastWeek.push(doc);
      } else if (docDate >= new Date(now.setMonth(now.getMonth() - 3))) {
        lastMonth.push(doc);
      } else {
        older.push(doc);
      }
    });
    
    return {
      thisWeek,
      lastWeek,
      lastMonth,
      older
    };
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
    if (!fileType) return <BsFileEarmark className="text-primary" />;
    
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) {
      return <BsFileEarmark className="text-danger" />;
    } else if (type.includes('word') || type.includes('doc')) {
      return <BsFileEarmark className="text-primary" />;
    } else if (type.includes('excel') || type.includes('sheet')) {
      return <BsFileEarmark className="text-success" />;
    } else if (type.includes('powerpoint') || type.includes('presentation')) {
      return <BsFileEarmark className="text-warning" />;
    } else {
      return <BsFileEarmark className="text-primary" />;
    }
  };

  // Render document groups
  const renderDocumentGroup = (title, documents) => {
    if (!documents || documents.length === 0) return null;
    
    return (
      <>
        <Row>
          <Col md={12}>
            <h6 className="text-muted mb-3">{title}</h6>
          </Col>
        </Row>
        
        <Row className="mb-4 g-3">
          {documents.map((doc) => (
            <Col lg={4} md={6} key={doc.id}>
              <Card className="shadow-sm h-100">
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center mb-2">
                    <div className="bg-light rounded p-2 me-2">
                      {getFileIcon(doc.file_type)}
                    </div>
                    <div className="me-auto">
                      <Card.Title className="fs-6 mb-0 text-truncate" style={{maxWidth: "150px"}}>
                        {doc.title}
                      </Card.Title>
                      <small className="text-muted">{formatFileSize(doc.file_size)}</small>
                    </div>
                    <div className="dropdown">
                      <button className="btn btn-link btn-sm text-muted p-0" type="button" data-bs-toggle="dropdown">
                        <BsThreeDotsVertical />
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                          <button className="dropdown-item" onClick={() => handleViewDocument(doc.id)}>
                            <BsEye className="me-2" /> Xem chi tiết
                          </button>
                        </li>
                        <li>
                          <button className="dropdown-item" onClick={() => handleDownloadDocument(doc.id)}>
                            <BsDownload className="me-2" /> Tải xuống
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                  {doc.shared_by && (
                    <div className="small text-muted">
                      Được chia sẻ bởi: {doc.shared_by.name || 'Không xác định'}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </>
    );
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

      <h4 className="mb-3">Được chia sẻ</h4>

      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-3">
            <BsShare size={50} className="text-muted" />
          </div>
          <h5 className="text-muted">
            {searchTerm ? 'Không tìm thấy tài liệu phù hợp' : 'Chưa có tài liệu được chia sẻ'}
          </h5>
          {!searchTerm && (
            <p className="text-muted mt-2">
              Tài liệu được chia sẻ với bạn sẽ hiển thị ở đây.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Group documents by time periods */}
          {(() => {
            const { thisWeek, lastWeek, lastMonth, older } = groupDocumentsByTime(filteredDocuments);
            return (
              <>
                {renderDocumentGroup('Tuần này', thisWeek)}
                {renderDocumentGroup('Tuần trước', lastWeek)}
                {renderDocumentGroup('Tháng trước', lastMonth)}
                {renderDocumentGroup('Cũ hơn', older)}
              </>
            );
          })()}
        </>
      )}
    </>
  );
};

export default SharedFiles;
