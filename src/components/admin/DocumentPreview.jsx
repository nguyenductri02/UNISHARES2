import React from 'react';
import AdminLayout from './Layout';
import { Card, Button, Spinner, Alert } from 'react-bootstrap';
import mathDocImage from '../../assets/math-doc.png'; // You'll need to add this image

const DocumentPreview = ({ report, onClose, onDelete, loading, error }) => {
  return (
    <AdminLayout>
      <Card className="border-0 rounded-4 p-0">
        <Card.Body className="p-4">
          <h4 className="mb-4">Quản Lý Báo Cáo</h4>
          
          {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
          
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-light d-flex align-items-center py-3">
              <span className="me-2">Trạng thái báo cáo:</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-1">
                <path d="M8 15.5C12.1421 15.5 15.5 12.1421 15.5 8C15.5 3.85786 12.1421 0.5 8 0.5C3.85786 0.5 0.5 3.85786 0.5 8C0.5 12.1421 3.85786 15.5 8 15.5Z" stroke="#5DC03E" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 4V8L10.6667 9.33333" stroke="#5DC03E" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-success">Đang xem xét</span>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center p-5">
                  <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-2">Đang tải tài liệu...</p>
                </div>
              ) : (
                <div className="document-content text-center p-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {report?.details?.reportable?.file_url ? (
                    <iframe 
                      src={report.details.reportable.file_url}
                      title={report.document}
                      width="100%"
                      height="500px"
                      style={{ border: 'none' }}
                    />
                  ) : (
                    <img 
                      src={mathDocImage} 
                      alt="Tài liệu xem trước" 
                      style={{ 
                        maxWidth: '100%',
                        height: 'auto'
                      }}
                    />
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
          
          <div className="d-flex justify-content-center mt-4">
            <Button 
              variant="danger"
              className="me-3"
              style={{
                width: '100px',
                borderRadius: '4px',
                padding: '8px 16px'
              }}
              onClick={onDelete}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" animation="border" /> : 'Xóa'}
            </Button>
            <Button 
              variant="light"
              className="border"
              style={{
                width: '100px',
                borderRadius: '4px',
                padding: '8px 16px'
              }}
              onClick={onClose}
              disabled={loading}
            >
              Thoát
            </Button>
          </div>
        </Card.Body>
      </Card>
    </AdminLayout>
  );
};

export default DocumentPreview;
