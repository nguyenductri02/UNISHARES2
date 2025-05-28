import React from 'react';
import { Card, Button, Row, Col, Image, Spinner, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import userAvatar from '../../assets/avatar-1.png';

const UnishareGroupCard = ({ group, isLeaving = false, onLeave, showLeaveButton = true }) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Get group image URL or fallback
  const getGroupImage = () => {
    if (group?.cover_image && group.cover_image.startsWith('http')) {
      return group.cover_image;
    }
    return require('../../assets/course-react.png');
  };
  
  // Safely get group type label
  const getGroupTypeLabel = () => {
    if (!group?.type) return 'group';
    
    switch (group.type) {
      case 'course': return 'Khóa học';
      case 'university': return 'Trường ĐH';
      case 'interest': return 'Sở thích';
      default: return group.type;
    }
  };

  // Get creator information from the correct fields
  const getCreatorInfo = () => {
    // Check if creator object exists in the group data
    if (group?.creator) {
      return {
        name: group.creator.name || 'Unknown',
        avatar: group.creator.avatar || userAvatar
      };
    }
    
    // Fallback for different API response structures
    return {
      name: group?.created_by_user?.name || 'Unknown',
      avatar: group?.created_by_user?.avatar_url || userAvatar
    };
  };

  const creator = getCreatorInfo();

  return (
    <Card className="mb-3 border-0 shadow-sm" style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e3f1fb' }}>
      <Row className="g-0">
        <Col xs={3} md={2} className="bg-primary d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(180deg, #1976d2 0%, #2196f3 100%)', minHeight: '100%' }}>
          <div className="text-center p-2">
            <img 
              src={getGroupImage()}
              alt={group?.name || 'Group'}
              style={{ width: '60px', height: '60px', objectFit: 'cover' }}
            />
          </div>
        </Col>
        <Col xs={9} md={7}>
          <Card.Body className="py-3 px-4">
            <div className="d-flex align-items-center mb-1">
              <h6 className="fw-bold text-primary mb-0">{group?.name || 'Unnamed Group'}</h6>
              <span className="ms-2 badge bg-info" style={{ fontSize: '0.7rem', padding: '0.3em 0.6em' }}>
                {getGroupTypeLabel()}
              </span>
            </div>
            <p className="text-muted small mb-2" style={{ fontSize: '0.85rem' }}>
              {group?.description || 'No description available'}
            </p>
            <div className="d-flex align-items-center">
              <Image 
                src={creator.avatar} 
                roundedCircle 
                width={28} 
                height={28} 
                className="me-2" 
                style={{ border: '1.5px solid #b3d8f6' }}
              />
              <small className="text-muted" style={{ fontSize: '0.85rem' }}>
                Người tạo: <span className="fw-semibold">{creator.name}</span>
              </small>
            </div>
          </Card.Body>
        </Col>
        <Col xs={12} md={3} className="d-flex flex-column justify-content-center py-3 px-4" style={{ backgroundColor: '#f9fcff' }}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <small className="text-muted">Số lượng:</small>
            <small className="fw-bold text-dark">{group?.member_count || 0} thành viên</small>
          </div>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <small className="text-muted">Ngày tạo:</small>
            <small className="fw-bold text-dark">{formatDate(group?.created_at)}</small>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <Button 
              as={Link}
              to={`/unishare/groups/${group.id}`}
              variant="primary" 
              size="sm" 
              className="w-100 me-2"
              style={{ 
                background: 'linear-gradient(90deg, #0370b7 60%, #4fc3f7 100%)',
                fontSize: '0.85rem',
                borderRadius: '0.5rem',
                border: 'none'
              }}
            >
              Xem thêm
            </Button>
            {showLeaveButton && (
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="w-100 ms-1"
                style={{ 
                  fontSize: '0.85rem',
                  borderRadius: '0.5rem',
                  borderColor: '#dee2e6',
                }}
                onClick={onLeave}
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Đang xử lý...</span>
                  </>
                ) : (
                  'Thoát nhóm'
                )}
              </Button>
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default UnishareGroupCard;
