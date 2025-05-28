import React, { useState } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';

const ReportModal = ({ 
  show, 
  onHide, 
  onSubmit, 
  title = "Báo cáo vi phạm", 
  entityName,
  entityType = "nội dung" 
}) => {
  const [formData, setFormData] = useState({
    reason: '',
    details: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const reasonOptions = [
    'Nội dung không phù hợp',
    'Vi phạm điều khoản dịch vụ',
    'Quấy rối/Xúc phạm',
    'Nội dung sai sự thật',
    'Nội dung vi phạm bản quyền',
    'Spam',
    'Khác'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.reason) {
      newErrors.reason = 'Vui lòng chọn lý do báo cáo';
    }
    
    if (formData.reason === 'Khác' && !formData.details?.trim()) {
      newErrors.details = 'Vui lòng cung cấp thêm thông tin chi tiết';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setSubmitError('');
    setSubmitSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await onSubmit(formData);
      
      if (response.success) {
        setSubmitSuccess('Báo cáo đã được gửi thành công. Chúng tôi sẽ xem xét báo cáo này sớm nhất có thể.');
        
        // Reset form after success
        setFormData({
          reason: '',
          details: ''
        });
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onHide();
          setSubmitSuccess('');
        }, 2000);
      } else {
        setSubmitError(response.message || 'Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitError('Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {submitSuccess ? (
          <Alert variant="success">{submitSuccess}</Alert>
        ) : (
          <Form onSubmit={handleSubmit}>
            {entityName && (
              <div className="mb-3">
                <p>
                  Bạn đang báo cáo {entityType}: <strong>{entityName}</strong>
                </p>
                <p className="text-muted small">
                  Báo cáo của bạn sẽ được gửi đến đội ngũ quản trị viên để xem xét.
                </p>
              </div>
            )}
            
            {submitError && (
              <Alert variant="danger" className="mb-3">
                {submitError}
              </Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Lý do báo cáo <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                isInvalid={!!errors.reason}
              >
                <option value="">-- Chọn lý do --</option>
                {reasonOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.reason}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>
                Chi tiết báo cáo 
                {formData.reason === 'Khác' && <span className="text-danger">*</span>}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="details"
                value={formData.details}
                onChange={handleChange}
                placeholder="Cung cấp thêm thông tin chi tiết về báo cáo này..."
                isInvalid={!!errors.details}
              />
              <Form.Control.Feedback type="invalid">
                {errors.details}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Thông tin chi tiết sẽ giúp đội ngũ quản trị viên xử lý báo cáo hiệu quả hơn.
              </Form.Text>
            </Form.Group>
          </Form>
        )}
      </Modal.Body>
      {!submitSuccess && (
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button 
            variant="danger" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" /> Đang gửi...
              </>
            ) : (
              'Gửi báo cáo'
            )}
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default ReportModal;
