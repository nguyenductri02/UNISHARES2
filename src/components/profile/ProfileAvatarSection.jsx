import React, { useState, useRef, useContext } from 'react';
import { Card, Image, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { profileService, authService } from '../../services';
import userDefaultAvatar from '../../assets/avatar-1.png';
import { ProfileContext } from '../../pages/ProfilePage';

const ProfileAvatarSection = () => {
  // Use the shared context instead of making separate API calls
  const { userData: user, refreshUserData, loading } = useContext(ProfileContext);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setError('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)');
      return;
    }

    if (file.size > maxSize) {
      setError('Kích thước file không được vượt quá 5MB');
      return;
    }

    try {
      setUploadLoading(true);
      setError('');
      setSuccess('');

      const response = await profileService.uploadAvatar(file);
      
      // Invalidate the cache to force a refresh
      authService.invalidateCache();
      
      // Refresh user data in the context
      await refreshUserData(true);
      
      setSuccess('Cập nhật ảnh đại diện thành công');
      
      // Dispatch event to update header and other components
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Không thể tải lên ảnh đại diện');
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4"><Spinner animation="border" /></div>;
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body className="text-center">
        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        {success && <Alert variant="success" className="mb-3">{success}</Alert>}
        
        <div className="position-relative d-inline-block mb-3">
          {uploadLoading && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
                 style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '50%', zIndex: 1 }}>
              <Spinner animation="border" variant="primary" />
            </div>
          )}
          <Image 
            src={user?.avatar || userDefaultAvatar} 
            alt="User Avatar" 
            roundedCircle 
            className="mb-3"
            style={{ width: '150px', height: '150px', objectFit: 'cover', cursor: 'pointer' }}
            onClick={handleAvatarClick}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = userDefaultAvatar;
            }}
          />
        </div>
        
        <h5 className="mb-1">{user?.name || 'Người dùng'}</h5>
        <p className="text-muted mb-3">{user?.email}</p>
        
        <div className="d-grid">
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={handleAvatarClick}
            disabled={uploadLoading}
          >
            Thay đổi ảnh đại diện
          </Button>
          <Form.Control
            type="file"
            ref={fileInputRef}
            className="d-none"
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProfileAvatarSection;
