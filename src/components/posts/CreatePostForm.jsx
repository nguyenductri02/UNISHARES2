import React, { useState } from 'react';
import { Form, Button, Spinner, Alert, Card } from 'react-bootstrap';
import { BsPaperclip, BsX, BsFileEarmark, BsImage, BsLink, BsTypeUnderline, BsTypeBold, BsTypeItalic } from 'react-icons/bs';

const CreatePostForm = ({ groupId, onSubmit, onCancel }) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showFormatting, setShowFormatting] = useState(false);
  const [showTitleField, setShowTitleField] = useState(true);

  const handleAttachmentChange = (e) => {
    // Convert FileList to Array and add to current attachments
    const files = Array.from(e.target.files);
    console.log("Selected files:", files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    setAttachments(prev => [...prev, ...files]);
    
    // Clear the input to allow selecting the same file again if needed
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && attachments.length === 0) {
      setError('Vui lòng nhập nội dung hoặc thêm tệp đính kèm');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Prepare post data with files as actual File objects
      const postData = {
        content: content.trim(),
        attachments
      };
      
      // Only include title if it has content
      if (title.trim()) {
        postData.title = title.trim();
      }
      
      console.log("Creating post with data:", postData);
      
      const result = await onSubmit(postData);
      
      if (result && result.success) {
        // Clear form after successful submission
        setContent('');
        setTitle('');
        setAttachments([]);
      } else {
        throw new Error(result?.message || 'Failed to create post');
      }
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi tạo bài viết');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to format file size
  const formatFileSize = (size) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Formatting functions
  const insertFormatting = (format) => {
    const textarea = document.getElementById('post-content');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    let cursorPosition = start;
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorPosition = start + 2;
        break;
      case 'italic':
        formattedText = `_${selectedText}_`;
        cursorPosition = start + 1;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        cursorPosition = start + 2;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        cursorPosition = end + 3;
        break;
      default:
        return;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start, start + formattedText.length);
      } else {
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  return (
    <Card className="create-post-form">
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {/* Title field */}
          {showTitleField && (
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Tiêu đề bài viết (tùy chọn)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
              />
            </Form.Group>
          )}
          
          {showFormatting && (
            <div className="formatting-toolbar mb-2 p-1 border rounded bg-light">
              <Button 
                variant="link" 
                className="btn-sm text-dark" 
                onClick={() => insertFormatting('bold')}
                title="Đậm"
              >
                <BsTypeBold />
              </Button>
              <Button 
                variant="link" 
                className="btn-sm text-dark" 
                onClick={() => insertFormatting('italic')}
                title="Nghiêng"
              >
                <BsTypeItalic />
              </Button>
              <Button 
                variant="link" 
                className="btn-sm text-dark" 
                onClick={() => insertFormatting('underline')}
                title="Gạch chân"
              >
                <BsTypeUnderline />
              </Button>
              <Button 
                variant="link" 
                className="btn-sm text-dark" 
                onClick={() => insertFormatting('link')}
                title="Liên kết"
              >
                <BsLink />
              </Button>
            </div>
          )}
          
          <Form.Group className="mb-3">
            <Form.Control
              id="post-content"
              as="textarea"
              rows={4}
              placeholder="Chia sẻ điều gì đó với nhóm..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={submitting}
            />
          </Form.Group>
          
          {/* Display selected attachments */}
          {attachments.length > 0 && (
            <div className="mb-3">
              <p className="mb-2">Tệp đính kèm ({attachments.length}):</p>
              <div className="attachment-list">
                {attachments.map((file, index) => (
                  <div key={index} className="attachment-item d-flex align-items-center p-2 border rounded mb-2">
                    {file.type.startsWith('image/') ? (
                      <BsImage className="me-2 text-success" />
                    ) : (
                      <BsFileEarmark className="me-2 text-primary" />
                    )}
                    <div className="flex-grow-1">
                      <div className="text-truncate">{file.name}</div>
                      <small className="text-muted">{formatFileSize(file.size)}</small>
                    </div>
                    <Button 
                      variant="link" 
                      className="text-danger p-0" 
                      onClick={() => removeAttachment(index)}
                      disabled={submitting}
                    >
                      <BsX size={20} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Form.Group>
                <Form.Label htmlFor="post-attachments" className="mb-0">
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    as="span" 
                    className="me-2"
                    disabled={submitting}
                  >
                    <BsPaperclip /> Thêm tệp
                  </Button>
                </Form.Label>
                <Form.Control
                  type="file"
                  id="post-attachments"
                  onChange={handleAttachmentChange}
                  style={{ display: 'none' }}
                  multiple
                  disabled={submitting}
                />
              </Form.Group>
            </div>
            
            <div>
              <Button 
                variant="secondary" 
                className="me-2" 
                onClick={onCancel}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={submitting || (!content.trim() && attachments.length === 0)}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Đang đăng...
                  </>
                ) : 'Đăng bài'}
              </Button>
            </div>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CreatePostForm;
