import React, { useState, useRef } from 'react';
import { Form, Button, Alert, ProgressBar } from 'react-bootstrap';
import { BsCloudUpload, BsFileEarmark, BsX } from 'react-icons/bs';
import { profileService } from '../../services';
import { useNavigate } from 'react-router-dom';

const UploadForm = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    course_code: '',
    visibility: 'private'
  });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Kích thước file vượt quá 10MB');
      return;
    }

    // Check file type
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Định dạng file không được hỗ trợ');
      return;
    }

    setSelectedFile(file);
    setUploadError('');
    
    // Auto-populate title with file name (minus extension)
    const fileName = file.name.split('.').slice(0, -1).join('.');
    setFormData({
      ...formData,
      title: fileName
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Simulate upload progress
  const simulateProgress = () => {
    const interval = setInterval(() => {
      setUploadProgress(prevProgress => {
        if (prevProgress >= 95) {
          clearInterval(interval);
          return prevProgress;
        }
        return prevProgress + 5;
      });
    }, 300);
    
    return interval;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tên tài liệu';
    }
    
    if (!selectedFile) {
      newErrors.file = 'Vui lòng chọn file để tải lên';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Clear previous errors
    setErrors({});
    setUploadError('');
    
    // Start upload
    setUploading(true);
    setUploadProgress(0);
    
    // Simulate progress updates
    const progressInterval = simulateProgress();
    
    try {
      // Create form data for upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('subject', formData.subject);
      uploadFormData.append('course_code', formData.course_code);
      
      // Call upload API
      const response = await profileService.uploadDocument(uploadFormData);
      
      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Handle duplicate file scenario
      if (response.isDuplicate) {
        // Show a success message but with info about the duplicate
        setUploadSuccess(true);
        // Show a specific message about duplicate detection
        setUploadError(response.message || 'Tài liệu này đã tồn tại trong hệ thống.');
        
        setTimeout(() => {
          // If we have the duplicated document ID, navigate to it
          if (response.documentId) {
            navigate(`/unishare-files/view/${response.documentId}`);
          } else {
            // Otherwise just go to the documents list
            navigate('/profile/documents');
          }
        }, 2000);
        return;
      }
      
      // Show success and reset form after a delay
      setUploadSuccess(true);
      
      setTimeout(() => {
        // Navigate to documents list
        navigate('/profile/documents');
      }, 2000);
      
    } catch (error) {
      clearInterval(progressInterval);
      setUploading(false);
      
      if (error.errors) {
        // Format validation errors from backend
        const backendErrors = {};
        Object.keys(error.errors).forEach(key => {
          backendErrors[key] = error.errors[key][0];
        });
        setErrors(backendErrors);
      } else {
        // General error message
        setUploadError(error.message || 'Không thể tải lên tài liệu. Vui lòng thử lại sau.');
      }
    }
  };

  // Reset file selection
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    navigate('/profile/documents');
  };

  return (
    <>
      <h4 className="mb-4">Tải lên tài liệu</h4>
      
      {uploadSuccess && (
        <Alert variant="success" className="mb-4">
          Tài liệu đã được tải lên thành công! Đang chuyển hướng...
        </Alert>
      )}
      
      {uploadError && (
        <Alert variant="danger" className="mb-4">
          {uploadError}
        </Alert>
      )}
      
      <Form onSubmit={handleSubmit}>
        {/* Upload area */}
        {!selectedFile ? (
          <div 
            className={`upload-area text-center border rounded p-5 mb-4 ${isDragging ? 'bg-light border-primary' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="mb-3">
              <BsCloudUpload size={40} className="text-primary" />
            </div>
            <div className="mb-3">
              <p>{isDragging ? 'Thả file để tải lên' : 'Kéo và thả file tại đây hoặc'}</p>
            </div>
            <Button 
              variant="outline-primary"
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
            >
              Chọn file từ thiết bị
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files[0])}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            />
            <div className="mt-2 text-muted small">
              <div>Định dạng: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX</div>
              <div>Dung lượng tối đa: 10MB</div>
            </div>
            {errors.file && <div className="text-danger mt-2">{errors.file}</div>}
          </div>
        ) : (
          <div className="selected-file-container border rounded p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <BsFileEarmark size={30} className="text-primary" />
                </div>
                <div>
                  <div className="fw-bold">{selectedFile.name}</div>
                  <div className="text-muted small">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <Button 
                variant="link" 
                className="text-danger p-0" 
                onClick={handleRemoveFile}
                disabled={uploading}
              >
                <BsX size={24} />
              </Button>
            </div>
            
            {uploading && (
              <div className="mt-3">
                <ProgressBar 
                  now={uploadProgress} 
                  label={`${uploadProgress}%`} 
                  variant="primary" 
                  animated={uploadProgress < 100}
                />
              </div>
            )}
          </div>
        )}

        {/* File details form */}
        <div className="mt-4">
          <Form.Group className="mb-3" controlId="documentTitle">
            <Form.Label>Tên tài liệu <span className="text-danger">*</span></Form.Label>
            <Form.Control 
              type="text" 
              placeholder="Nhập tên tài liệu" 
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              isInvalid={!!errors.title}
              disabled={uploading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.title}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="documentSubject">
            <Form.Label>Môn học</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="Nhập tên môn học" 
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              disabled={uploading}
            />
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="documentCourseCode">
            <Form.Label>Mã môn học</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="Nhập mã môn học (ví dụ: CS101)" 
              name="course_code"
              value={formData.course_code}
              onChange={handleInputChange}
              disabled={uploading}
            />
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="documentVisibility">
            <Form.Label>Quyền truy cập</Form.Label>
            <Form.Select 
              name="visibility"
              value={formData.visibility}
              onChange={handleInputChange}
              disabled={uploading}
            >
              <option value="private">Chỉ có bạn</option>
              <option value="public">Tất cả mọi người</option>
              <option value="groupOnly">Chỉ nhóm tham gia</option>
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-4" controlId="documentDescription">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              placeholder="Nhập mô tả tài liệu (không bắt buộc)" 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={uploading}
            />
          </Form.Group>
          
          <div className="text-end">
            <Button 
              variant="secondary" 
              className="me-2"
              onClick={handleCancel}
              disabled={uploading}
            >
              Hủy
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={uploading}
            >
              {uploading ? 'Đang tải lên...' : 'Tải lên'}
            </Button>
          </div>
        </div>
      </Form>
    </>
  );
};

export default UploadForm;
