import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileAlt, FaDownload } from 'react-icons/fa';
import { adminService } from '../../services';

const DocumentPreviewModal = ({ show, onHide, document }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('preview');

  const [documentDetails, setDocumentDetails] = useState(null);

  useEffect(() => {
    if (show && document) {
      setLoading(true);
      setError('');
      
      const loadDocumentDetails = async () => {        try {
          // If we need more detailed document information
          if (document.id) {
            const detailedDocument = await adminService.getDocument(document.id);
            if (detailedDocument) {
              // Extract the document data from the resource wrapper
              const documentData = detailedDocument.data || detailedDocument;
              setDocumentDetails(documentData);
            }
          } else {
            // If no id, just use the document as is
            setDocumentDetails(document);
          }
          setLoading(false);
        } catch (err) {
          console.error("Error loading document details:", err);
          setError('Không thể tải thông tin chi tiết tài liệu.');
          // Still use the original document data
          setDocumentDetails(document);
          setLoading(false);
        }
      };
      
      loadDocumentDetails();
    }
  }, [show, document]);

  // Get file icon based on file type
  const getFileIcon = (fileType) => {
    if (!fileType) return <FaFileAlt size={24} />;

    fileType = fileType.toLowerCase();

    if (fileType.includes('pdf')) return <FaFilePdf size={24} className="text-danger" />;
    if (fileType.includes('word') || fileType.includes('doc')) return <FaFileWord size={24} className="text-primary" />;
    if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('xls')) return <FaFileExcel size={24} className="text-success" />;
    if (fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('png') || fileType.includes('gif')) 
      return <FaFileImage size={24} className="text-info" />;

    return <FaFileAlt size={24} />;
  };

  // Determine if the file can be previewed in browser
  const canPreviewInBrowser = (fileType) => {
    if (!fileType) return false;
    
    fileType = fileType.toLowerCase();
    
    return fileType.includes('pdf') || 
           fileType.includes('jpg') || 
           fileType.includes('jpeg') || 
           fileType.includes('png') || 
           fileType.includes('gif');
  };
  // Render the appropriate preview based on file type
  const renderPreview = () => {
    if (!documentDetails) {
      return (
        <div className="text-center p-5">
          <Alert variant="warning">
            Không thể tải thông tin tài liệu.
          </Alert>
        </div>
      );
    }    if (!documentDetails.file_url && !documentDetails.preview_url) {
      return (
        <div className="text-center p-5">
          <Alert variant="warning">
            Không thể tải xem trước tài liệu. URL tài liệu không hợp lệ.
          </Alert>
        </div>
      );
    }

    const previewUrl = documentDetails.file_url || documentDetails.preview_url;
    const fileType = documentDetails.file_type?.toLowerCase() || '';
    
    // For PDF files
    if (fileType.includes('pdf')) {
      return (
        <iframe 
          src={previewUrl}
          title={documentDetails.title}
          width="100%"
          height="500px"
          style={{ border: 'none' }}
        />
      );
    }
    
    // For image files
    if (fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('png') || fileType.includes('gif')) {      return (
        <div className="text-center">
          <img 
            src={previewUrl} 
            alt={documentDetails.title}
            style={{ maxWidth: '100%', maxHeight: '500px' }}
          />
        </div>
      );
    }
    
    // For other file types that can't be previewed directly
    return (
      <div className="text-center p-5">
        <div className="mb-4">
          {getFileIcon(documentDetails.file_type)}
          <h5 className="mt-3">{documentDetails.title}</h5>
          <p className="text-muted">{documentDetails.file_type} - Không thể xem trước trực tiếp</p>
        </div>
        <Button 
          variant="primary" 
          href={previewUrl} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <FaDownload className="me-2" />
          Tải xuống để xem
        </Button>
      </div>
    );
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg" 
      centered
      dialogClassName="document-preview-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          {documentDetails && getFileIcon(documentDetails?.file_type)}
          <span className="ms-2">{documentDetails?.title || document?.title || 'Xem trước tài liệu'}</span>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-0 border-bottom"
        >
          <Tab eventKey="preview" title="Xem trước">
            <div className="p-3">
              {loading ? (
                <div className="text-center p-5">
                  <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Đang tải...</span>
                  </Spinner>
                  <p className="mt-2">Đang tải xem trước tài liệu...</p>
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : (
                <div className="document-preview-container">
                  {renderPreview()}
                </div>
              )}
            </div>
          </Tab>
          
          <Tab eventKey="info" title="Thông tin">
            <div className="p-4">
              {documentDetails ? (
                <div>
                  <h5 className="mb-3">Thông tin tài liệu</h5>
                  
                  <table className="table">
                    <tbody>
                      <tr>
                        <td width="30%"><strong>Tiêu đề:</strong></td>
                        <td>{documentDetails.title}</td>
                      </tr>
                      <tr>
                        <td><strong>Mô tả:</strong></td>
                        <td>{documentDetails.description || 'Không có mô tả'}</td>
                      </tr>
                      <tr>
                        <td><strong>Người đăng:</strong></td>
                        <td>{documentDetails.user?.name || 'Không xác định'}</td>
                      </tr>
                      <tr>
                        <td><strong>Môn học:</strong></td>
                        <td>{documentDetails.subject || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Mã môn học:</strong></td>
                        <td>{documentDetails.course_code || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Loại file:</strong></td>
                        <td>{documentDetails.file_type || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Kích thước:</strong></td>
                        <td>{documentDetails.file_size ? formatFileSize(documentDetails.file_size) : 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Lượt xem:</strong></td>
                        <td>{documentDetails.view_count || 0}</td>
                      </tr>
                      <tr>
                        <td><strong>Lượt tải:</strong></td>
                        <td>{documentDetails.download_count || 0}</td>
                      </tr>
                      <tr>
                        <td><strong>Ngày tạo:</strong></td>
                        <td>{documentDetails.created_at ? new Date(documentDetails.created_at).toLocaleString() : 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <Alert variant="warning">Không có thông tin tài liệu</Alert>
              )}
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
      
      <Modal.Footer>
        {documentDetails && documentDetails.file_url && (
          <Button 
            variant="primary" 
            href={documentDetails.file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="me-auto"
          >
            <FaDownload className="me-2" />
            Tải xuống
          </Button>
        )}
        <Button variant="secondary" onClick={onHide}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default DocumentPreviewModal;