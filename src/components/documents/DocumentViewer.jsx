import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Button, Row, Col, Badge } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BsDownload, BsArrowLeft, BsFileEarmark, BsEye, BsCalendar3, BsPerson } from 'react-icons/bs';
import { documentService } from '../../services';

const DocumentViewer = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await documentService.getDocumentWithAccess(documentId);
      
      if (response.success) {
        setDocument(response.data);
        
        // Generate preview URL if it's a viewable file type
        if (isViewableDocument(response.data.file_type)) {
          setPreviewUrl(generatePreviewUrl(response.data));
        }
      } else {
        throw new Error(response.message || 'Không thể tải tài liệu');
      }
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err.message || 'Không thể tải tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await documentService.downloadDocument(documentId);
      // Update the view count locally
      if (document) {
        setDocument({
          ...document,
          download_count: (document.download_count || 0) + 1
        });
      }
    } catch (err) {
      setError('Không thể tải xuống tài liệu. Vui lòng thử lại.');
    } finally {
      setDownloading(false);
    }
  };

  const isViewableDocument = (fileType) => {
    if (!fileType) return false;
    const viewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'txt'];
    return viewableTypes.includes(fileType.toLowerCase());
  };

  const generatePreviewUrl = (doc) => {
    // For now, return a placeholder URL
    // In a real app, this would connect to your API or document preview service
    if (doc.preview_url) return doc.preview_url;
    
    return `/api/documents/${doc.id}/preview`;
  };

  const getDocumentIcon = (fileType) => {
    if (!fileType) return <BsFileEarmark size={48} className="text-primary" />;
    
    // Just return the default file icon for now
    // You could add more specific icons for different file types
    return <BsFileEarmark size={48} className="text-primary" />;
  };

  const renderDocumentPreview = () => {
    if (!document) return null;
    
    const fileType = document.file_type?.toLowerCase();
    
    if (fileType === 'pdf' && previewUrl) {
      return (
        <div className="pdf-container" style={{height: '600px'}}>
          <iframe
            src={previewUrl}
            title={document.title}
            width="100%"
            height="100%"
            className="border-0"
          />
        </div>
      );
    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(fileType) && previewUrl) {
      return (
        <div className="text-center">
          <img 
            src={previewUrl} 
            alt={document.title} 
            className="img-fluid" 
            style={{ maxHeight: '600px' }} 
          />
        </div>
      );
    } else {
      return (
        <div className="text-center p-5 border rounded">
          <div className="mb-4">
            {getDocumentIcon(fileType)}
            <h5 className="mt-3">{document.file_name}</h5>
            <p className="text-muted">
              {fileType?.toUpperCase()} • {formatFileSize(document.file_size)}
            </p>
          </div>
          <p className="mb-4">Xem trước không khả dụng cho định dạng này.</p>
          <Button 
            variant="primary" 
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" /> Đang tải xuống...
              </>
            ) : (
              <>
                <BsDownload className="me-2" /> Tải xuống để xem
              </>
            )}
          </Button>
        </div>
      );
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
        <p className="mt-3">Đang tải tài liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
        <div className="mt-3">
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>
            <BsArrowLeft className="me-2" /> Quay lại
          </Button>
        </div>
      </Alert>
    );
  }

  if (!document) {
    return (
      <Alert variant="warning">
        Không tìm thấy tài liệu
        <div className="mt-3">
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>
            <BsArrowLeft className="me-2" /> Quay lại
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="document-viewer">
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{document.title}</h5>
            <Button 
              variant="outline-secondary"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <BsArrowLeft className="me-1" /> Quay lại
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={8}>
              <div className="d-flex align-items-start mb-3">
                <div className="document-meta">
                  <div className="d-flex align-items-center mb-2">
                    <BsPerson className="me-2 text-muted" />
                    <span>Đăng bởi: {document.user?.name || 'Unknown'}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <BsCalendar3 className="me-2 text-muted" />
                    <span>Ngày đăng: {new Date(document.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <BsEye className="me-2 text-muted" />
                    <span>Lượt tải: {document.download_count || 0}</span>
                  </div>
                </div>
              </div>
              
              {document.description && (
                <div className="document-description p-3 bg-light rounded mb-3">
                  <h6>Mô tả:</h6>
                  <p className="mb-0">{document.description}</p>
                </div>
              )}
              
              {document.subject && (
                <Badge bg="info" className="me-2 mb-2">Môn học: {document.subject}</Badge>
              )}
              
              {document.course_code && (
                <Badge bg="secondary" className="me-2 mb-2">Mã khóa học: {document.course_code}</Badge>
              )}
            </Col>
            <Col md={4} className="text-md-end">
              <Button 
                variant="primary" 
                onClick={handleDownload}
                disabled={downloading}
                className="d-inline-flex align-items-center"
              >
                {downloading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Đang tải xuống...
                  </>
                ) : (
                  <>
                    <BsDownload className="me-2" /> Tải xuống
                  </>
                )}
              </Button>
              
              {document.group_id && (
                <div className="mt-3">
                  <Button 
                    as={Link}
                    to={`/unishare/groups/${document.group_id}`}
                    variant="outline-secondary"
                    size="sm"
                  >
                    Xem nhóm
                  </Button>
                </div>
              )}
            </Col>
          </Row>
          
          <div className="document-preview-container">
            {renderDocumentPreview()}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DocumentViewer;
