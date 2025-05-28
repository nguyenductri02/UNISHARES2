import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { BsTrash, BsExclamationTriangle } from 'react-icons/bs';

/**
 * Modal component for post deletion confirmation
 */
const DeletePostModal = ({ show, onHide, onConfirm, isLoading }) => {
  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton className="bg-danger text-white">
        <Modal.Title>
          <BsExclamationTriangle className="me-2" />
          Xác nhận xóa bài viết
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-2">Bạn có chắc chắn muốn xóa bài viết này?</p>
        <div className="alert alert-warning">
          <small>
            Lưu ý: Hành động này không thể hoàn tác. Tất cả nội dung, bình luận và tệp đính kèm của bài viết sẽ bị xóa vĩnh viễn.
          </small>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
          Hủy
        </Button>
        <Button 
          variant="danger" 
          onClick={onConfirm} 
          disabled={isLoading}
          className="d-flex align-items-center"
        >
          {isLoading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Đang xóa...
            </>
          ) : (
            <>
              <BsTrash className="me-2" />
              Xóa bài viết
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeletePostModal;
