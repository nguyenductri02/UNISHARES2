import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert, ListGroup, Image } from 'react-bootstrap';
import { postService, authService } from '../../services';
import defaultAvatar from '../../assets/avatar-1.png';
import { BsTrash } from 'react-icons/bs';

const PostCommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const currentUser = authService.getUser();

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await postService.getPostComments(postId);
      
      if (response?.success) {
        setComments(response.data || []);
      } else {
        throw new Error(response?.message || 'Could not load comments');
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Could not load comments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const response = await postService.addComment(postId, { content: newComment });
      
      if (response?.success) {
        setNewComment('');
        // Add the new comment to the list or refresh comments
        fetchComments();
      } else {
        throw new Error(response?.message || 'Failed to add comment');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add your comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) {
      return;
    }
    
    try {
      const response = await postService.deletePostComment(postId, commentId);
      
      if (response.success) {
        // Update UI to remove the deleted comment
        setComments(comments.filter(c => c.id !== commentId));
      } else {
        throw new Error(response.message || 'Failed to delete comment');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Không thể xóa bình luận. Vui lòng thử lại.');
    }
  };

  const canDeleteComment = (comment) => {
    if (!currentUser) return false;
    
    // User can delete their own comments
    if (comment.user_id === currentUser.id) return true;
    
    // Admins and moderators can delete any comment
    if (currentUser.roles?.includes('admin') || currentUser.roles?.includes('moderator')) return true;
    
    return false;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="post-comments mt-3">
      <hr />
      
      {error && <Alert variant="danger" className="py-2">{error}</Alert>}
      
      {/* Comment form */}
      {currentUser && (
        <Form onSubmit={handleSubmitComment} className="mb-3">
          <div className="d-flex">
            <Image 
              src={currentUser.avatar || defaultAvatar} 
              roundedCircle 
              width={32} 
              height={32} 
              className="me-2" 
              style={{ objectFit: 'cover' }}
            />
            <Form.Group className="flex-grow-1">
              <Form.Control
                as="textarea"
                rows={1}
                placeholder="Viết bình luận..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={submitting}
              />
            </Form.Group>
            <Button 
              variant="primary" 
              type="submit" 
              className="ms-2" 
              disabled={!newComment.trim() || submitting}
            >
              {submitting ? <Spinner animation="border" size="sm" /> : 'Gửi'}
            </Button>
          </div>
        </Form>
      )}
      
      {/* Comments list */}
      {loading ? (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" />
        </div>
      ) : comments.length > 0 ? (
        <ListGroup variant="flush">
          {comments.map(comment => (
            <ListGroup.Item key={comment.id} className="px-0">
              <div className="d-flex">
                <Image 
                  src={comment.author?.avatar || defaultAvatar} 
                  roundedCircle 
                  width={32} 
                  height={32} 
                  className="me-2" 
                  style={{ objectFit: 'cover' }}
                />
                <div className="flex-grow-1">
                  <div className="comment-bubble p-2 rounded bg-light">
                    <div className="d-flex justify-content-between">
                      <div className="fw-bold small">{comment.author?.name || 'Unknown user'}</div>
                      {canDeleteComment(comment) && (
                        <Button 
                          variant="link" 
                          className="p-0 text-danger" 
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <BsTrash size={12} />
                        </Button>
                      )}
                    </div>
                    <div className="small">{comment.content}</div>
                  </div>
                  <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                    {formatDate(comment.created_at)}
                  </div>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <div className="text-center text-muted py-3">
          <small>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</small>
        </div>
      )}
    </div>
  );
};

export default PostCommentSection;
