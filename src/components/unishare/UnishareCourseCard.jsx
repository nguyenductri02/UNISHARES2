import React from 'react';
import { Card, Image } from 'react-bootstrap';
import { BsPeopleFill, BsClockHistory } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import userAvatar from '../../assets/avatar-1.png';

const UnishareCourseCard = ({ course }) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Get creator information safely with better fallbacks
  const getCreatorInfo = () => {
    // Debug the course object to see what fields are available
    console.log('Course data for creator:', course?.id, {
      creator: course?.creator,
      creator_id: course?.creator_id,
      created_by: course?.created_by,
      created_by_user: course?.created_by_user
    });

    // Check for creator object first
    if (course?.creator && course.creator.name) {
      return {
        name: course.creator.name,
        avatar: course.creator.avatar_url || userAvatar
      };
    }
    
    // Check for created_by_user next
    if (course?.created_by_user && course.created_by_user.name) {
      return {
        name: course.created_by_user.name,
        avatar: course.created_by_user.avatar_url || userAvatar
      };
    }
    
    // If we have a department or university, use that instead of "Unknown"
    if (course?.department) {
      return {
        name: `${course.department}`,
        avatar: userAvatar
      };
    }
    
    if (course?.university) {
      return {
        name: `${course.university}`,
        avatar: userAvatar
      };
    }
    
    // Default fallback
    return {
      name: "Giáo viên",
      avatar: userAvatar
    };
  };

  const creator = getCreatorInfo();

  // Get cover image with fallback
  const getCoverImage = () => {
    if (course?.cover_image && typeof course.cover_image === 'string') {
      if (course.cover_image.startsWith('http')) {
        return course.cover_image;
      }
      return `${process.env.REACT_APP_API_URL || ''}/${course.cover_image}`;
    }
    return require('../../assets/course-react.png');
  };

  return (
    <Card
      as={Link}
      to={`/unishare/groups/${course?.id}`}
      className="h-100 border-0 text-decoration-none"
      style={{
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 4px 24px 0 rgba(3,112,183,0.10)',
        background: 'transparent',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 8px 28px 0 rgba(3,112,183,0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 24px 0 rgba(3,112,183,0.10)';
      }}
    >
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{
          background: 'linear-gradient(180deg, #1976d2 0%, #2196f3 100%)',
          minHeight: 110,
          padding: '1.25rem 1rem 0.5rem 1rem',
          borderTopLeftRadius: '1rem',
          borderTopRightRadius: '1rem',
        }}
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <img 
            src={getCoverImage()} 
            alt={course?.name || 'Course'} 
            style={{ width: '100%', height: 70, objectFit: 'cover', borderRadius: 12 }} 
          />
        </div>
        <h6
          className="mb-0 fw-bold text-center"
          style={{ fontSize: '1.1rem', color: '#fff', letterSpacing: 0.2 }}
        >
          {course?.name || course?.title || 'Nhóm học'}
        </h6>
      </div>
      <Card.Body
        className="p-0"
        style={{
          background: '#f6f6f6',
          borderBottomLeftRadius: '1rem',
          borderBottomRightRadius: '1rem',
          padding: 0,
        }}
      >
        <div className="px-3 pt-3 pb-2">
          <p
            className="mb-2 text-primary fw-semibold"
            style={{ fontSize: '0.95rem', color: '#1976d2' }}
          >
            {course?.description?.substring(0, 60) || course?.name || 'Không có mô tả'}
            {course?.description?.length > 60 ? '...' : ''}
          </p>
          <div className="d-flex align-items-center mb-2">
            <Image
              src={creator.avatar}
              roundedCircle
              width={24}
              height={24}
              className="me-2"
            />
            <small className="text-muted" style={{ fontSize: '0.92rem' }}>
              {course?.course_code ? (
                <>Mã khóa học: <span className="fw-semibold" style={{ color: '#222' }}>{course.course_code}</span></>
              ) : (
                <>Người tạo: <span className="fw-semibold" style={{ color: '#222' }}>{creator.name}</span></>
              )}
            </small>
          </div>
        </div>
        <div
          className="d-flex justify-content-between align-items-center px-3 pb-3"
          style={{ fontSize: '0.98rem' }}
        >
          <span className="text-muted d-flex align-items-center">
            <BsPeopleFill className="me-1" />
            <span style={{ fontWeight: 500 }}>{course?.member_count || 0}</span>
          </span>
          <span className="text-muted d-flex align-items-center">
            <BsClockHistory className="me-1" />
            <span style={{ fontWeight: 500 }}>{formatDate(course?.created_at)}</span>
          </span>
        </div>
      </Card.Body>
    </Card>
  );
};

export default UnishareCourseCard;
