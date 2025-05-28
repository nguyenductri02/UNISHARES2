import React, { useState } from 'react';
import { Card, Button, Dropdown, Badge, Modal, Form, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BsThreeDots, BsHeart, BsHeartFill, BsChat, BsPin, BsPinFill, BsPencil, BsTrash, BsFlag } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import PostComments from './PostComments';
import { postService, authService, reportService } from '../../services';
import defaultAvatar from '../../assets/avatar-1.png';
import PostAttachment from './PostAttachment';
import DeletePostModal from './DeletePostModal';
import ReportModal from '../common/ReportModal';

const PostItem = ({ post, groupContext, onLike, onDelete, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const currentUser = authService.getUser();
  const isPinned = post.is_pinned;
  
  // States for post deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // States for post editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editContent, setEditContent] = useState(post.content || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState('');

  // States for post reporting
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const handleToggleLike = async () => {
    try {
      const newLikeStatus = !isLiked;
      
      if (newLikeStatus) {
        await postService.likePost(post.id);
      } else {
        await postService.unlikePost(post.id);
      }
      
      setIsLiked(newLikeStatus);
      setLikesCount(prevCount => newLikeStatus ? prevCount + 1 : prevCount - 1);
      
      if (onLike) {
        onLike(post.id, newLikeStatus);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Function to handle post deletion
  const handleDeletePost = async () => {
    try {
      setIsDeleting(true);
      const response = await postService.deletePost(post.id);
      
      if (response.success) {
        setShowDeleteModal(false);
        if (onDelete) {
          onDelete(post.id);
        }
      } else {
        console.error('Failed to delete post:', response.message);
        alert('Failed to delete post: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('An error occurred while deleting the post');
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to handle post editing
  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) {
      setEditError('Content cannot be empty');
      return;
    }
    
    try {
      setIsEditing(true);
      setEditError('');
      
      const updateData = {
        title: editTitle.trim(),
        content: editContent.trim()
      };
      
      const response = await postService.updatePost(post.id, updateData);
      
      if (response.success) {
        setShowEditModal(false);
        if (onUpdate) {
          onUpdate(post.id, {
            ...post,
            title: updateData.title,
            content: updateData.content
          });
        }
      } else {
        setEditError(response.message || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      setEditError('An error occurred while updating the post');
    } finally {
      setIsEditing(false);
    }
  };

  const handleTogglePinned = async () => {
    try {
      // Implementation will depend on your API
      // await postService.togglePinPost(post.id);
    } catch (error) {
      console.error('Error toggling pin status:', error);
    }
  };

  const handleCommentAdded = () => {
    setCommentsCount(prevCount => prevCount + 1);
  };

  const handleCommentDeleted = () => {
    setCommentsCount(prevCount => Math.max(0, prevCount - 1));
  };

  const handleViewAttachment = (attachment) => {
    // Open attachment in a new tab if it has a URL
    if (attachment.file_url) {
      window.open(attachment.file_url, '_blank');
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      // Use your document service or a direct download method
      if (attachment.file_url) {
        // Create the download URL by replacing '/file/' with '/download/' in the URL
        let downloadUrl = attachment.file_url;
        
        // If we have a direct download URL from the API, use it
        if (attachment.download_url) {
          downloadUrl = attachment.download_url;
        } else {
          // Otherwise modify the existing URL to use the download endpoint
          downloadUrl = downloadUrl.replace('/storage/file/', '/storage/download/');
          downloadUrl = downloadUrl.replace('/api/storage/file/', '/api/storage/download/');
        }
        
        window.location.href = downloadUrl;
      }
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  // Function to handle post reporting
  const handleReportPost = async (reportData) => {
    try {
      setIsReporting(true);
      const response = await reportService.reportPost(post.id, reportData);
      
      if (response.success) {
        setShowReportModal(false);
        return { success: true, message: 'Báo cáo đã được gửi thành công' };
      } else {
        throw new Error(response.message || 'Không thể báo cáo bài viết');
      }
    } catch (error) {
      console.error('Error reporting post:', error);
      return { 
        success: false, 
        message: error.message || 'Đã xảy ra lỗi khi gửi báo cáo'
      };
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <>
      <Card className={`post-card mb-3 ${isPinned ? 'border-primary' : ''}`}>
        {isPinned && (
          <div className="pinned-badge">
            <Badge bg="primary" className="position-absolute top-0 end-0 m-2">
              <BsPinFill className="me-1" /> Pinned
            </Badge>
          </div>
        )}
        
        <Card.Body>
          <div className="d-flex mb-3">
            <img 
              src={post.author?.avatar || defaultAvatar} 
              alt="Avatar" 
              className="rounded-circle me-2" 
              width="40" 
              height="40"
              style={{ objectFit: 'cover' }}
            />
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="mb-0">
                    <Link to={`/profile/${post.author?.id}`} className="text-decoration-none">
                      {post.author?.name || 'Unknown User'}
                    </Link>
                  </h6>
                  <small className="text-muted">
                    {post.created_at ? 
                      formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi }) :
                      'Just now'
                    }
                    {groupContext && post.group && (
                      <> · in <Link to={`/unishare/groups/${post.group.id}`} className="text-decoration-none">{post.group.name}</Link></>
                    )}
                  </small>
                </div>
                
                <Dropdown align="end">
                  <Dropdown.Toggle variant="link" className="p-0 text-dark no-arrow" id={`post-options-${post.id}`}>
                    <BsThreeDots />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {post.can_edit && (
                      <Dropdown.Item onClick={() => setShowEditModal(true)}>
                        <BsPencil className="me-2" /> Edit Post
                      </Dropdown.Item>
                    )}
                    {post.can_delete && (
                      <Dropdown.Item onClick={() => setShowDeleteModal(true)} className="text-danger">
                        <BsTrash className="me-2" /> Delete Post
                      </Dropdown.Item>
                    )}
                    {(currentUser?.roles?.includes('admin') || currentUser?.roles?.includes('moderator')) && (
                      <Dropdown.Item onClick={handleTogglePinned}>
                        {isPinned ? 'Unpin Post' : 'Pin Post'}
                      </Dropdown.Item>
                    )}
                    {currentUser && currentUser.id !== post.user_id && (
                      <Dropdown.Item onClick={() => setShowReportModal(true)} className="text-warning">
                        <BsFlag className="me-2" /> Report Post
                      </Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </div>
          
          {post.title && <h5 className="card-title mb-2">{post.title}</h5>}
          
          <Card.Text className="mb-3" style={{ whiteSpace: 'pre-wrap' }}>
            {post.content}
          </Card.Text>
          
          {/* Display attachments if any */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="post-attachments mb-3">
              {post.attachments.map(attachment => (
                <PostAttachment 
                  key={attachment.id} 
                  attachment={attachment}
                  onView={handleViewAttachment}
                  onDownload={handleDownloadAttachment}
                />
              ))}
            </div>
          )}
          
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="d-flex gap-3">
              <Button 
                variant="link" 
                className={`p-0 text-decoration-none ${isLiked ? 'text-danger' : 'text-muted'}`}
                onClick={handleToggleLike}
              >
                {isLiked ? <BsHeartFill className="me-1" /> : <BsHeart className="me-1" />}
                {likesCount > 0 && likesCount}
              </Button>
              <Button 
                variant="link" 
                className="p-0 text-decoration-none text-muted"
                onClick={() => setShowComments(!showComments)}
              >
                <BsChat className="me-1" />
                {commentsCount > 0 && commentsCount}
              </Button>
            </div>
          </div>
        </Card.Body>
        
        {showComments && (
          <Card.Footer className="bg-white border-top-0 pt-0">
            <PostComments 
              postId={post.id} 
              onCommentAdded={handleCommentAdded}
              onCommentDeleted={handleCommentDeleted}
            />
          </Card.Footer>
        )}
      </Card>

      {/* Delete Post Modal */}
      <DeletePostModal 
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeletePost}
        isLoading={isDeleting}
      />

      {/* Edit Post Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdatePost}>
            {editError && <div className="alert alert-danger">{editError}</div>}
            <Form.Group className="mb-3">
              <Form.Label>Title (Optional)</Form.Label>
              <Form.Control 
                type="text" 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)} 
                placeholder="Post Title"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={5} 
                value={editContent} 
                onChange={(e) => setEditContent(e.target.value)} 
                placeholder="Post Content"
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={() => setShowEditModal(false)} className="me-2" disabled={isEditing}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isEditing}>
                {isEditing ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Report Post Modal */}
      <ReportModal
        show={showReportModal}
        onHide={() => setShowReportModal(false)}
        onSubmit={handleReportPost}
        isLoading={isReporting}
        title="Report Post"
        contentType="post"
      />
    </>
  );
};

export default PostItem;
