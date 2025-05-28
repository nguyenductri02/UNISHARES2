import React from 'react';
import { Card, Image } from 'react-bootstrap';
import userAvatar from '../../assets/avatar-1.png';
import { FaFile, FaFileAlt, FaFileWord, FaFilePdf, FaFileExcel, FaFileImage, FaFileVideo, FaFileAudio, FaFileCode, FaFileArchive } from 'react-icons/fa';

const ChatMessage = ({ message, isOwnMessage }) => {
  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Function to get appropriate icon based on file type
  const getFileIcon = (fileType, filePath) => {
    if (!fileType && !filePath) return <FaFile />;
    
    // Check for images
    if (fileType?.startsWith('image/') || filePath?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      return <FaFileImage />;
    }
    
    // Check for documents
    if (fileType?.includes('pdf') || filePath?.match(/\.pdf$/i)) {
      return <FaFilePdf color="#e74c3c" />;
    }
    
    if (fileType?.includes('word') || fileType?.includes('document') || filePath?.match(/\.(doc|docx)$/i)) {
      return <FaFileWord color="#2b579a" />;
    }
    
    if (fileType?.includes('excel') || fileType?.includes('spreadsheet') || filePath?.match(/\.(xls|xlsx|csv)$/i)) {
      return <FaFileExcel color="#217346" />;
    }
    
    // Check for media
    if (fileType?.startsWith('video/') || filePath?.match(/\.(mp4|avi|mov|wmv|flv|mkv)$/i)) {
      return <FaFileVideo color="#9b59b6" />;
    }
    
    if (fileType?.startsWith('audio/') || filePath?.match(/\.(mp3|wav|ogg|flac)$/i)) {
      return <FaFileAudio color="#f39c12" />;
    }
    
    // Check for code/text
    if (fileType?.includes('text') || filePath?.match(/\.(txt|rtf|md)$/i)) {
      return <FaFileAlt />;
    }
    
    if (fileType?.includes('code') || filePath?.match(/\.(html|css|js|json|xml|py|java|php|cpp|c|rb|go|ts)$/i)) {
      return <FaFileCode color="#3498db" />;
    }
    
    // Check for archives
    if (fileType?.includes('zip') || fileType?.includes('rar') || filePath?.match(/\.(zip|rar|tar|gz|7z)$/i)) {
      return <FaFileArchive color="#f1c40f" />;
    }
    
    // Default file icon
    return <FaFile />;
  };

  // Function to render file attachments
  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="message-attachments mt-2">
        {attachments.map((attachment, index) => {
          // Check if it's an image
          const isImage = attachment.file_type?.startsWith('image/') || 
                          attachment.file_path?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
          
          if (isImage) {
            return (
              <div key={index} className="mb-2">
                <a href={attachment.file_path} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={attachment.file_path} 
                    alt={attachment.file_name || 'Image attachment'} 
                    className="img-fluid rounded" 
                    style={{ maxWidth: '200px', maxHeight: '200px' }}
                  />
                </a>
              </div>
            );
          } else {
            return (
              <div key={index} className="mb-2">
                <a 
                  href={attachment.file_path} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="attachment-link d-flex align-items-center p-2 border rounded"
                  style={{ backgroundColor: 'rgba(0,0,0,0.05)', transition: 'all 0.2s ease' }}
                >
                  <div className="attachment-icon me-2 fs-4">
                    {getFileIcon(attachment.file_type, attachment.file_path)}
                  </div>
                  <div className="flex-grow-1">
                    <div className="attachment-name text-truncate" style={{ maxWidth: '150px' }}>
                      {attachment.file_name || 'File attachment'}
                    </div>
                    <small className="text-muted d-block">
                      {formatFileSize(attachment.file_size)}
                    </small>
                  </div>
                </a>
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className={`d-flex mb-3 ${isOwnMessage ? 'justify-content-end' : 'justify-content-start'}`}>
      {!isOwnMessage && (
        <Image 
          src={message.user?.avatar || userAvatar} 
          roundedCircle 
          width={40} 
          height={40} 
          className="me-2 align-self-end"
          style={{ objectFit: 'cover' }}
        />
      )}
      
      <div style={{ maxWidth: '70%' }}>
        {!isOwnMessage && (
          <div className="sender-name small text-muted mb-1">
            {message.user?.name || 'Người dùng'}
          </div>
        )}
        
        <Card 
          className={`border-0 ${isOwnMessage ? 'bg-primary text-white' : 'bg-light'}`} 
          style={{ borderRadius: '18px' }}
        >
          <Card.Body className="p-2 px-3">
            <div>{message.content}</div>
            {renderAttachments(message.attachments)}
            <div className="message-time small text-end mt-1" style={{ opacity: 0.8 }}>
              {formatTimestamp(message.created_at)}
            </div>
          </Card.Body>
        </Card>
      </div>
      
      {isOwnMessage && (
        <Image 
          src={message.user?.avatar || userAvatar} 
          roundedCircle 
          width={40} 
          height={40} 
          className="ms-2 align-self-end"
          style={{ objectFit: 'cover' }}
        />
      )}
    </div>
  );
};

export default ChatMessage;
