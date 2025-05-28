import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Dropdown } from 'react-bootstrap';
import { FaDownload, FaEye, FaEdit, FaTrash, FaArrowLeft, FaUser, FaCalendarAlt, FaFileAlt, FaEllipsisV, FaExclamationTriangle } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { profileService, reportService } from '../services';
import ReportModal from '../components/common/ReportModal';
import './DocumentView.css';

const DocumentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isDocumentReported, setIsDocumentReported] = useState(false); // New state

  // Fetch document details
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await profileService.getDocument(id);
        
        if (response.data) {
          setDocument(response.data);
        } else {
          throw new Error('Không thể tải thông tin tài liệu');
        }
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err.message || 'Không thể tải thông tin tài liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id]);

  // Handle document download
  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError('');
      
      // First try with download-info endpoint
      try {
        console.log(`Initiating download for document ${id}`);
        const downloadResult = await profileService.downloadDocument(id);
        
        if (downloadResult.success) {
          // Update download count in UI if successful
          if (document) {
            setDocument({
              ...document,
              download_count: (document.download_count || 0) + 1
            });
          }
          console.log('Download completed successfully');
        }
      } catch (downloadError) {
        console.error('Primary download method failed:', downloadError);
        
        // Try fallback method - direct browser download
        try {
          console.log('Attempting fallback download method');
          // Get document info first
          const docInfo = await profileService.getDocument(id);
          
          if (docInfo && docInfo.file_path) {
            // Try to construct a direct URL to the file
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/';
            const fileUrl = `${baseUrl}storage/${docInfo.file_path}`.replace('/api/api/', '/api/');
            
            console.log(`Opening direct file URL: ${fileUrl}`);
            window.open(fileUrl, '_blank');
            
            // Update download count in UI
            if (document) {
              setDocument({
                ...document,
                download_count: (document.download_count || 0) + 1
              });
            }
          } else {
            throw new Error('Không thể xác định đường dẫn file');
          }
        } catch (fallbackError) {
          console.error('Fallback download method failed:', fallbackError);
          throw downloadError; // Throw the original error
        }
      }
    } catch (err) {
      console.error('Error downloading document:', err);
      setError(err.message || 'Không thể tải xuống tài liệu. Vui lòng thử lại sau.');
    } finally {
      setDownloading(false);
    }
  };

  // Handle document report
  const handleReportSubmit = async (reportData) => {
    try {
      const response = await reportService.reportDocument(id, reportData);
      if (response.success) {
        setIsDocumentReported(true); // Set reported status on success
      }
      return response;
    } catch (error) {
      console.error('Error reporting document:', error);
      return {
        success: false,
        message: 'Không thể gửi báo cáo. Vui lòng thử lại sau.'
      };
    }
  };

  // Render loading state
  if (loading) {
    return (
      <>
        <Header />
        <div className="document-view-container">
          <Container>
            <div className="document-header-container">
              <Button 
                variant="outline-primary" 
                className="back-button" 
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft className="me-2" /> Quay lại
              </Button>
              <h2 className="page-title">Chi tiết tài liệu</h2>
              <div style={{ width: '100px' }}></div> {/* Empty div for flex spacing */}
            </div>
            <div className="loading-container">
              <Spinner animation="border" variant="primary" className="loading-spinner" size="lg" />
              <p className="loading-text">Đang tải thông tin tài liệu...</p>
            </div>
          </Container>
        </div>
        <Footer />
      </>
    );
  }

  // Render error state
  if (error) {
    return (
      <>
        <Header />
        <div className="document-view-container">
          <Container>
            <div className="document-header-container">
              <Button 
                variant="outline-primary" 
                className="back-button" 
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft className="me-2" /> Quay lại
              </Button>
              <h2 className="page-title">Chi tiết tài liệu</h2>
              <div style={{ width: '100px' }}></div> {/* Empty div for flex spacing */}
            </div>
            <div className="error-container">
              <Alert variant="danger" className="document-card">
                <Alert.Heading>Không thể tải thông tin tài liệu</Alert.Heading>
                <p>{error}</p>
                <div className="d-flex justify-content-between">
                  <Button variant="outline-primary" onClick={() => navigate('/unishare-files')} className="action-button">
                    <FaArrowLeft className="action-button-icon" /> Quay lại trang chủ
                  </Button>
                  <Button variant="outline-danger" onClick={() => window.location.reload()} className="action-button">
                    Thử lại
                  </Button>
                </div>
              </Alert>
            </div>
          </Container>
        </div>
        <Footer />
      </>
    );
  }

  // Render document not found
  if (!document) {
    return (
      <>
        <Header />
        <div className="document-view-container">
          <Container>
            <div className="document-header-container">
              <Button 
                variant="outline-primary" 
                className="back-button" 
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft className="me-2" /> Quay lại
              </Button>
              <h2 className="page-title">Chi tiết tài liệu</h2>
              <div style={{ width: '100px' }}></div> {/* Empty div for flex spacing */}
            </div>
            <div className="error-container">
              <Alert variant="warning" className="document-card">
                <Alert.Heading>Không tìm thấy tài liệu</Alert.Heading>
                <p>Tài liệu này không tồn tại hoặc đã bị xóa.</p>
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/unishare-files')}
                  className="action-button"
                >
                  <FaArrowLeft className="action-button-icon" /> Quay lại trang chủ
                </Button>
              </Alert>
            </div>
          </Container>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="document-view-container">
        <Container>
          <div className="document-header-container">
            <Button 
              variant="outline-primary" 
              className="back-button" 
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft className="me-2" /> Quay lại
            </Button>
            <h2 className="page-title">Chi tiết tài liệu</h2>
            <div style={{ width: '100px' }}>
              <Dropdown align="end">
                <Dropdown.Toggle variant="light" id="dropdown-basic" className="rounded-circle">
                  <FaEllipsisV />
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item 
                    onClick={() => !isDocumentReported && setShowReportModal(true)}
                    disabled={isDocumentReported}
                  >
                    <FaExclamationTriangle className={`me-2 ${isDocumentReported ? 'text-muted' : 'text-danger'}`} />
                     {isDocumentReported ? 'Đã báo cáo' : 'Báo cáo tài liệu'}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
          
          <Row>
            {/* Document info */}
            <Col lg={8} className="mb-4">
              <Card className="document-card">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-4 document-header">
                    <div>
                      <h3 className="document-title">{document.title}</h3>
                      <div className="document-subtitle">
                        {document.subject && <span className="me-3">Môn học: {document.subject}</span>}
                        {document.course_code && <span>Mã môn: {document.course_code}</span>}
                      </div>
                    </div>
                    <div className="document-badges">
                      {document.is_approved ? (
                        <Badge bg="success" className="document-badge">Đã duyệt</Badge>
                      ) : (
                        <Badge bg="warning" text="dark" className="document-badge">Chờ duyệt</Badge>
                      )}
                      {document.is_official && (
                        <Badge bg="primary" className="document-badge ms-2">Chính thức</Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="mb-4">
                    <h5 className="section-title">Mô tả</h5>
                    <div className="description-box">
                      <p className="mb-0">{document.description || 'Không có mô tả'}</p>
                    </div>
                  </div>
                  
                  {/* File details */}
                  <div className="mb-4">
                    <h5 className="section-title">Thông tin file</h5>
                    <div className="file-details">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="file-detail-item">
                            <span className="file-detail-label">Tên file:</span>
                            <span className="file-detail-value">{document.file_name}</span>
                          </div>
                          <div className="file-detail-item">
                            <span className="file-detail-label">Loại file:</span>
                            <span className="file-detail-value">{document.file_type}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="file-detail-item">
                            <span className="file-detail-label">Kích thước:</span>
                            <span className="file-detail-value">
                              {document.file_size ? (
                                (document.file_size / (1024 * 1024)).toFixed(2) + ' MB'
                              ) : 'N/A'}
                            </span>
                          </div>
                          <div className="file-detail-item">
                            <span className="file-detail-label">Ngày tải lên:</span>
                            <span className="file-detail-value">
                              {new Date(document.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Document actions */}
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="stats-container">
                      <div className="stat-item">
                        <FaEye className="stat-icon text-primary" /> 
                        <span>{document.view_count || 0} lượt xem</span>
                      </div>
                      <div className="stat-item">
                        <FaDownload className="stat-icon text-success" /> 
                        <span>{document.download_count || 0} lượt tải</span>
                      </div>
                    </div>
                    <div className="action-buttons">
                      {error && <span className="text-danger me-3">{error}</span>}
                      
                      {document.user_id === parseInt(localStorage.getItem('user_id')) && (
                        <Button 
                          as={Link}
                          to={`/unishare-files/edit/${document.id}`}
                          variant="outline-primary" 
                          className="action-button"
                        >
                          <FaEdit className="action-button-icon" /> Chỉnh sửa
                        </Button>
                      )}
                      
                      <Button 
                        variant="primary" 
                        onClick={handleDownload}
                        disabled={downloading}
                        className="action-button"
                      >
                        {downloading ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                            Đang tải xuống...
                          </>
                        ) : (
                          <>
                            <FaDownload className="action-button-icon" /> Tải xuống
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* User and file preview */}
            <Col lg={4}>
              {/* Document uploader info */}
              <Card className="uploader-card mb-4">
                <Card.Body className="p-4">
                  <h5 className="section-title">Người đăng tải</h5>
                  <div className="d-flex align-items-center">
                    <div className="uploader-avatar">
                      <FaUser />
                    </div>
                    <div>
                      <p className="uploader-name mb-1">{document.user?.name || 'Người dùng'}</p>
                      <p className="uploader-date mb-0">
                        <FaCalendarAlt className="me-1" /> Ngày đăng: {
                          new Date(document.created_at).toLocaleDateString('vi-VN')
                        }
                      </p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
              
              {/* Document preview */}
              <Card className="preview-card">
                <Card.Body className="p-4 text-center">
                  <div className="file-preview">
                    <FaFileAlt className="file-icon" />
                  </div>
                  <div className="file-info">
                    <p className="mb-1">
                      <strong>Dung lượng:</strong> {
                        document.file_size ? (
                          (document.file_size / (1024 * 1024)).toFixed(2) + ' MB'
                        ) : 'N/A'
                      }
                    </p>
                    <p className="mb-3">
                      <strong>Định dạng:</strong> {document.file_type}
                    </p>
                  </div>
                  <Button 
                    variant="primary" 
                    className="download-button w-100"
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Đang tải xuống...
                      </>
                    ) : (
                      <>
                        <FaDownload className="me-2" /> Tải xuống tài liệu
                      </>
                    )}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Report Document Modal */}
          <ReportModal
            show={showReportModal}
            onHide={() => setShowReportModal(false)}
            onSubmit={handleReportSubmit}
            title="Báo cáo tài liệu"
            entityName={document?.title}
            entityType="tài liệu"
          />
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default DocumentView;
