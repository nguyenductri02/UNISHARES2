import React, { useContext } from 'react';
import { Card, Row, Col, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ProfileContext } from '../../pages/ProfilePage';

const ProfileForm = () => {
  // Use the shared context instead of making separate API calls
  const { userData: user, loading, error, refreshUserData } = useContext(ProfileContext);

  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Đang tải thông tin...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="text-center text-danger">
            <p>{error}</p>
            <Button variant="outline-primary" onClick={() => refreshUserData(true)}>
              Thử lại
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0">Thông tin cá nhân</h5>
          <Link to="/profile/edit">
            <Button variant="outline-primary" size="sm">
              <i className="fas fa-edit me-1"></i> Chỉnh sửa
            </Button>
          </Link>
        </div>

        <Row className="mb-3">
          <Col sm={4} className="text-muted">Họ và tên:</Col>
          <Col sm={8}>{user?.name || 'Chưa cập nhật'}</Col>
        </Row>

        <Row className="mb-3">
          <Col sm={4} className="text-muted">Email:</Col>
          <Col sm={8}>{user?.email || 'Chưa cập nhật'}</Col>
        </Row>

        <Row className="mb-3">
          <Col sm={4} className="text-muted">Số điện thoại:</Col>
          <Col sm={8}>{user?.phone || 'Chưa cập nhật'}</Col>
        </Row>

        <Row className="mb-3">
          <Col sm={4} className="text-muted">Trường đại học:</Col>
          <Col sm={8}>{user?.university || 'Chưa cập nhật'}</Col>
        </Row>

        <Row className="mb-3">
          <Col sm={4} className="text-muted">Khoa/Ngành:</Col>
          <Col sm={8}>{user?.department || 'Chưa cập nhật'}</Col>
        </Row>

        <Row className="mb-3">
          <Col sm={4} className="text-muted">Mã sinh viên:</Col>
          <Col sm={8}>{user?.student_id || 'Chưa cập nhật'}</Col>
        </Row>

        <Row>
          <Col sm={4} className="text-muted">Giới thiệu:</Col>
          <Col sm={8}>{user?.bio || 'Chưa cập nhật'}</Col>
        </Row>

        {user?.activity && (
          <div className="mt-4 pt-3 border-top">
            <h5 className="mb-3">Thống kê hoạt động</h5>
            <Row className="g-3">
              <Col md={6}>
                <div className="p-3 bg-light rounded">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-file-alt text-primary me-3 fs-4"></i>
                    <div>
                      <div className="fw-bold">{user.activity.documents_count || 0}</div>
                      <div className="text-muted small">Tài liệu đã đăng</div>
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="p-3 bg-light rounded">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-users text-success me-3 fs-4"></i>
                    <div>
                      <div className="fw-bold">{user.activity.groups_count || 0}</div>
                      <div className="text-muted small">Nhóm đang tham gia</div>
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="p-3 bg-light rounded">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-comment-alt text-info me-3 fs-4"></i>
                    <div>
                      <div className="fw-bold">{user.activity.comments_count || 0}</div>
                      <div className="text-muted small">Bình luận</div>
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="p-3 bg-light rounded">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-clock text-warning me-3 fs-4"></i>
                    <div>
                      <div className="fw-bold">{user.activity.last_login_at}</div>
                      <div className="text-muted small">Đăng nhập gần nhất</div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ProfileForm;
