import React, { useState } from 'react';
import { Container, Alert, Spinner } from 'react-bootstrap';
import UnishareGroupCard from './UnishareGroupCard';
import { groupService } from '../../services';

const UnishareMyGroups = ({ groups = [], onGroupLeft }) => {
  const [leavingGroupId, setLeavingGroupId] = useState(null);
  const [error, setError] = useState(null);

  const handleLeaveGroup = async (groupId) => {
    try {
      setLeavingGroupId(groupId);
      setError(null);
      
      const response = await groupService.leaveGroup(groupId);
      
      if (response.success) {
        // Update the parent component's group list
        if (onGroupLeft) onGroupLeft();
      } else {
        setError(response.message || 'Không thể rời nhóm. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Error leaving group:', err);
      setError('Đã xảy ra lỗi khi rời nhóm. Vui lòng thử lại sau.');
    } finally {
      setLeavingGroupId(null);
    }
  };

  return (
    <div className="my-groups">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold" style={{ color: '#0370b7' }}>Nhóm của tôi</h4>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Container className="p-0">
        {groups.length === 0 ? (
          <Alert variant="info">
            Bạn chưa tham gia nhóm nào. Hãy khám phá các nhóm trên trang chủ.
          </Alert>
        ) : (
          groups.map((group) => (
            <UnishareGroupCard 
              key={group.id} 
              group={group} 
              isLeaving={leavingGroupId === group.id}
              onLeave={() => handleLeaveGroup(group.id)}
              showLeaveButton={group.role !== 'admin'} // Hide leave button if user's role is admin
            />
          ))
        )}
      </Container>
    </div>
  );
};

export default UnishareMyGroups;
