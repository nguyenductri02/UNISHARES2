import React, { useState, useRef, useEffect } from 'react';
import { Card, Form, Button, Image, Spinner, Modal, Alert } from 'react-bootstrap';
import { IoMdSend } from 'react-icons/io';
import { BsPaperclip, BsEmojiSmile, BsDownload, BsX, BsFileEarmark } from 'react-icons/bs';
import userAvatar from '../../assets/avatar-1.png';
import { authService, chatService } from '../../services';
import EmojiPicker from 'emoji-picker-react';

const UnishareMessageDetail = ({ chat, messages = [], loading = false, onSendMessage, onMessagesRead }) => {
  const [messageInput, setMessageInput] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [userScrolled, setUserScrolled] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousMessagesLengthRef = useRef(0);
  
  // New state for file attachments and emoji picker
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  // File input ref
  const fileInputRef = useRef(null);

  // Ensure messages is always an array
  const messagesList = Array.isArray(messages) ? messages : 
                      (messages && messages.data && Array.isArray(messages.data)) ? messages.data : [];

  // Get current user when component mounts
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userData = authService.getUser();
        setCurrentUser(userData);
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Smart scrolling: Only auto-scroll when new messages arrive or when explicitly set
  useEffect(() => {
    // Check if new messages were added
    const newMessagesAdded = messagesList.length > previousMessagesLengthRef.current;
    const isNewChat = previousMessagesLengthRef.current === 0 && messagesList.length > 0;
    previousMessagesLengthRef.current = messagesList.length;
    
    // Only scroll if:
    // 1. This is the first load of a new chat 
    // 2. New messages were added AND either:
    //    a. User hasn't scrolled up manually or
    //    b. User was already at the bottom
    if (isNewChat || (newMessagesAdded && (shouldScrollToBottom || !userScrolled))) {
      // Use setTimeout to ensure scrolling happens after render is complete
      setTimeout(() => {
        scrollToBottom('smooth');
      }, 100);
    }
  }, [messagesList, shouldScrollToBottom, userScrolled]);

  // When chat changes, reset scroll state and force scroll to bottom
  useEffect(() => {
    setUserScrolled(false);
    setShouldScrollToBottom(true);
    // Reset the container scroll first
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
    // Then scroll to bottom with a delay to ensure rendering is complete
    setTimeout(() => {
      scrollToBottom('auto');
    }, 100);
    
    // Reset the messages length reference when chat changes
    previousMessagesLengthRef.current = 0;
    
    // Clear any selected files
    setSelectedFiles([]);
    setPreviewUrls([]);
  }, [chat?.id]);

  // Mark messages as read when chat changes or messages are loaded
  useEffect(() => {
    if (chat?.id && messages.length > 0 && !loading) {
      // Call the markAsRead function after a short delay to ensure messages are rendered
      const timer = setTimeout(() => {
        handleMarkAsRead();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [chat?.id, messages.length, loading]);

  // Clean up object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Helper to check if scrolled to bottom
  const isScrolledToBottom = () => {
    if (!messagesContainerRef.current) return true;
    
    const container = messagesContainerRef.current;
    const threshold = 100; // pixels from bottom to consider "at bottom"
    
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Scroll to bottom function with behavior option
  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      // Use scrollIntoView on the end reference
      messagesEndRef.current.scrollIntoView({ 
        behavior: behavior, 
        block: 'end',
        inline: 'nearest'
      });
      
      // Prevent page scrolling by focusing on the container
      // This keeps scrolling contained within the messages area
      messagesContainerRef.current.focus();
    }
  };

  // Track scroll position to determine if auto-scroll should happen
  const handleScroll = (e) => {
    // Determine if we're at the bottom
    const isAtBottom = isScrolledToBottom();
    
    // Only set userScrolled to true if we're not at the bottom
    // This helps distinguish between user scrolling up vs down
    if (!isAtBottom && !userScrolled) {
      setUserScrolled(true);
    } else if (isAtBottom && userScrolled) {
      // If user has scrolled back to bottom, reset the userScrolled flag
      setUserScrolled(false);
    }
    
    // Update shouldScrollToBottom based on whether we're at the bottom
    setShouldScrollToBottom(isAtBottom);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Don't allow empty messages without attachments
    if (!messageInput.trim() && selectedFiles.length === 0) return;
    
    console.log('Sending message:', messageInput);
    console.log('With attachments:', selectedFiles);
    
    // Ensure we scroll to bottom after sending a new message
    setShouldScrollToBottom(true);
    setUserScrolled(false);
    
    try {
      setIsUploading(true);
      setUploadError(null);
      
      // Ensure we always pass a string for content, not null or undefined
      // This helps avoid database constraint violations
      const messageContent = messageInput || '';
      
      console.log('Calling onSendMessage with content:', messageContent);
      
      // Call parent's onSendMessage with both content and files
      const response = await onSendMessage(messageContent, selectedFiles);
      
      console.log('Response from onSendMessage:', response);
      
      if (response && (response.success === true || response.success !== false)) {
        console.log('Message sent successfully, clearing form');
        // Clear the input and files after successful send
        setMessageInput('');
        setSelectedFiles([]);
        setPreviewUrls([]);
        
        // Force scroll to bottom after sending
        setTimeout(() => {
          scrollToBottom('smooth');
        }, 100);
      } else {
        console.error('Message send failed:', response);
        const errorMessage = (response && response.message) || 'Failed to send message. Please try again.';
        setUploadError(errorMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setUploadError('An error occurred while sending your message. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Limit the number of files (e.g., max 5)
    if (selectedFiles.length + files.length > 5) {
      alert('You can only attach up to 5 files per message.');
      return;
    }
    
    // Check file sizes
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      alert(`Some files are too large. Maximum size is 10MB per file.`);
      return;
    }
    
    // Validate file types - only allow PDF and DOCX
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      alert(`Only PDF and DOCX files are allowed.`);
      return;
    }
    
    // Create preview URLs for images (won't be used for PDF/DOCX but keeping structure)
    const newPreviewUrls = files.map(() => null);
    
    setSelectedFiles(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };
  
  // Remove a selected file
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    
    // Also revoke the URL to prevent memory leaks
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle emoji selection
  const onEmojiClick = (emojiData) => {
    setMessageInput(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Format timestamp for display
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };
  
  // Handle downloading an attachment
  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      const response = await chatService.downloadAttachment(attachmentId);
      
      if (response.success) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = response.url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(response.url);
      } else {
        alert('Failed to download file: ' + response.message);
      }
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert('An error occurred while downloading the file.');
    }
  };

  // Helper to check if a file is an image by MIME type
  const isImageFile = (fileType) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    return imageTypes.includes(fileType);
  };
  
  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to mark messages as read
  const handleMarkAsRead = async () => {
    if (!chat?.id) return;
    
    try {
      const response = await chatService.markChatAsRead(chat.id);
      
      // Notify parent component that messages have been read
      if (response && onMessagesRead) {
        onMessagesRead(chat.id);
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  return (
    <Card className="border-0 shadow-sm" style={{ borderRadius: '10px', height: '100%' }}>
      {/* Header */}
      <Card.Header
        className="bg-white d-flex align-items-center p-3"
        style={{ borderBottom: '1px solid #e9f2f9' }}
      >
        <Image
          src={chat?.avatar_url || userAvatar}
          roundedCircle
          width={40}
          height={40}
          className="me-2"
          style={{ border: '2px solid #b3d8f6' }}
        />
        <div>
          <h6 className="mb-0 fw-bold" style={{ color: '#0370b7' }}>
            {chat?.name || 'Cuộc trò chuyện'}
          </h6>
          <small className="text-muted">
            {chat?.participants?.length || 0} thành viên
          </small>
        </div>
      </Card.Header>

      {/* Message Body */}
      <div
        ref={messagesContainerRef}
        className="p-3 message-container"
        style={{
          height: '350px',
          overflowY: 'auto',
          backgroundColor: '#f8fbff',
          outline: 'none'
        }}
        onScroll={handleScroll}
        tabIndex="-1"
      >
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" size="sm" />
            <p className="mt-2 small">Đang tải tin nhắn...</p>
          </div>
        ) : messagesList.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          messagesList.map((message) => {
            const isCurrentUser = currentUser && message.user_id === currentUser.id;
            
            return (
              <div
                key={message.id || `msg-${Math.random()}`}
                className={`d-flex ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'} mb-3`}
              >
                {!isCurrentUser && (
                  <Image
                    src={message.user?.avatar_url || userAvatar}
                    roundedCircle
                    width={32}
                    height={32}
                    className="me-2 mt-1"
                    style={{ border: '1.5px solid #b3d8f6' }}
                  />
                )}
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '0.75rem 1rem',
                    borderRadius: '1rem',
                    backgroundColor: isCurrentUser ? '#0370b7' : 'white',
                    color: isCurrentUser ? 'white' : '#333',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  {/* Message text content */}
                  {message.content && <div>{message.content}</div>}
                  
                  {/* Message attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="message-attachments mt-2">
                      {message.attachments.map(attachment => (
                        <div 
                          key={attachment.id} 
                          className="attachment mb-2 p-2" 
                          style={{ 
                            backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            borderRadius: '8px',
                          }}
                        >
                          {/* Image attachment preview */}
                          {isImageFile(attachment.file_type) && (
                            <div className="mb-1">
                              <img 
                                src={`/api/message-attachments/${attachment.id}/download`} 
                                alt={attachment.file_name}
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '150px', 
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(`/api/message-attachments/${attachment.id}/download`, '_blank')}
                              />
                            </div>
                          )}
                          
                          {/* File attachment info */}
                          <div className="d-flex align-items-center">
                            <BsFileEarmark className="me-2" />
                            <small 
                              className="text-truncate" 
                              style={{ 
                                maxWidth: '150px',
                                color: isCurrentUser ? 'rgba(255,255,255,0.9)' : 'inherit' 
                              }}
                            >
                              {attachment.file_name}
                            </small>
                            <small className="mx-2" style={{ color: isCurrentUser ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}>
                              {formatFileSize(attachment.file_size)}
                            </small>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0" 
                              style={{ color: isCurrentUser ? 'white' : '#0370b7' }}
                              onClick={() => handleDownloadAttachment(attachment.id, attachment.file_name)}
                            >
                              <BsDownload />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-end mt-1">
                    <small style={{ opacity: 0.7, fontSize: '0.75rem' }}>
                      {formatMessageTime(message.created_at)}
                    </small>
                  </div>
                </div>
                {isCurrentUser && (
                  <Image
                    src={currentUser?.avatar_url || userAvatar}
                    roundedCircle
                    width={32}
                    height={32}
                    className="ms-2 mt-1"
                    style={{ border: '1.5px solid #b3d8f6' }}
                  />
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="px-3 pt-2">
          <div className="d-flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div 
                key={index} 
                className="position-relative" 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                {/* File preview */}
                {file.type.startsWith('image/') ? (
                  <img 
                    src={previewUrls[index]} 
                    alt={file.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="d-flex align-items-center justify-content-center"
                    style={{ width: '100%', height: '100%', backgroundColor: '#f8f9fa' }}
                  >
                    <BsFileEarmark size={24} />
                  </div>
                )}
                
                {/* Remove button */}
                <button
                  className="position-absolute top-0 end-0 p-0 bg-dark bg-opacity-50 border-0 rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  onClick={() => removeFile(index)}
                >
                  <BsX color="white" size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="px-3">
          <Alert variant="danger" className="py-2 mt-2 mb-0">
            {uploadError}
          </Alert>
        </div>
      )}

      {/* Input Area */}
      <Card.Footer className="bg-white p-3">
        <Form className="d-flex align-items-center" onSubmit={handleSendMessage}>
          {/* File attachment button */}
          <Button
            variant="light"
            className="me-2"
            style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <BsPaperclip />
          </Button>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
          
          {/* Message input */}
          <Form.Control
            type="text"
            placeholder="Nhập tin nhắn..."
            style={{ borderRadius: '20px' }}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
          />
          
          {/* Emoji button */}
          <div className="position-relative mx-2">
            <Button
              variant="light"
              style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <BsEmojiSmile />
            </Button>
            
            {/* Emoji picker */}
            {showEmojiPicker && (
              <div 
                className="position-absolute end-0 bottom-100 mb-2"
                style={{ zIndex: 1000 }}
              >
                <EmojiPicker 
                  onEmojiClick={onEmojiClick}
                  width={320}
                  height={400}
                />
              </div>
            )}
          </div>
          
          {/* Send button */}
          <Button
            variant="primary"
            style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}
            type="submit"
            disabled={(!messageInput.trim() && selectedFiles.length === 0) || isUploading}
          >
            {isUploading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <IoMdSend />
            )}
          </Button>
        </Form>
      </Card.Footer>
    </Card>
  );
};

export default UnishareMessageDetail;
