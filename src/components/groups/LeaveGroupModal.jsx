import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';

const LeaveGroupModal = ({ show, onHide, onConfirm, groupName, isLoading }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Xác nhận rời nhóm</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Bạn có chắc chắn muốn rời khỏi nhóm "{groupName}"?</p>
        <p className="text-muted small">
          Lưu ý: Sau khi rời nhóm, bạn sẽ không thể truy cập vào nội dung và tài liệu của nhóm nữa. 
          Nếu đây là nhóm kín, bạn có thể cần được duyệt lại nếu muốn tham gia lại sau này.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
          Hủy
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner as="span" animation="border" size="sm" /> Đang xử lý...
            </>
          ) : (
            'Rời nhóm'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LeaveGroupModal;
