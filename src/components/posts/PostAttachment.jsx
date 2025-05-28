import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { BsFileEarmark, BsFileEarmarkPdf, BsFileEarmarkImage, BsDownload, BsEye } from 'react-icons/bs';

const PostAttachment = ({ attachment, onView, onDownload }) => {
  // Function to get appropriate icon based on file type
  const getFileIcon = () => {
    const fileType = attachment.file_type?.toLowerCase() || '';
    
    if (fileType.includes('pdf')) {
      return <BsFileEarmarkPdf size={24} className="text-danger" />;
    } else if (fileType.includes('image')) {
      return <BsFileEarmarkImage size={24} className="text-success" />;
    } else {
      return <BsFileEarmark size={24} className="text-primary" />;
    }
  };

  // Function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleView = () => {
    if (onView) onView(attachment);
  };

  const handleDownload = () => {
    if (onDownload) onDownload(attachment);
  };

  return (
    <Card className="attachment-card mb-2">
      <Card.Body className="py-2 px-3">
        <div className="d-flex align-items-center">
          <div className="me-3">
            {getFileIcon()}
          </div>
          <div className="flex-grow-1">
            <div className="fw-bold text-truncate" style={{ maxWidth: '200px' }}>
              {attachment.file_name}
            </div>
            <div className="text-muted small">
              {formatFileSize(attachment.file_size)}
            </div>
          </div>
          <div>
            <Button 
              variant="outline-primary" 
              size="sm" 
              className="me-1" 
              onClick={handleView}
              title="View file"
            >
              <BsEye />
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={handleDownload}
              title="Download file"
            >
              <BsDownload />
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PostAttachment;
