import React, { useState, useEffect } from 'react';
import { Form, Button, Spinner, Alert, ListGroup, Image, Toast } from 'react-bootstrap';
import { BsReply, BsTrash, BsPencil, BsCheckCircle, BsXCircle, BsFlag } from 'react-icons/bs';
import { postService, authService, reportService } from '../../services';
import defaultAvatar from '../../assets/avatar-1.png';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReportModal from '../common/ReportModal';

const PostComments = ({ postId, onCommentAdded, onCommentDeleted }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [replyToComment, setReplyToComment] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const currentUser = authService.getUser();
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [showReportModal, setShowReportModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportingComment, setReportingComment] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({
      show: true,
      message,
      type
    });
    
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await postService.getPostComments(postId);
      
      if (response.success) {
        setComments(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to load comments');
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Could not load comments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const commentData = {
        content: comment.trim(),
        parent_id: replyToComment?.id || null
      };
      
      const response = await postService.createPostComment(postId, commentData);
      
      if (response.success) {
        setComment('');
        
        if (replyToComment) {
          fetchReplies(replyToComment.id);
          setReplyToComment(null);
        } else {
          fetchComments();
        }
        
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        throw new Error(response.message || 'Failed to add comment');
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) {
      return;
    }
    
    try {
      setError('');
      
      const response = await postService.deletePostComment(postId, commentId);
      
      if (response.success) {
        setComments(prevComments => {
          const isTopLevelComment = prevComments.some(c => c.id === commentId);
          
          if (isTopLevelComment) {
            return prevComments.filter(comment => comment.id !== commentId);
          } else {
            return prevComments.map(comment => {
              if (comment.replies) {
                return {
                  ...comment,
                  replies: comment.replies.filter(reply => reply.id !== commentId),
                  replies_count: comment.replies_count - 1
                };
              }
              return comment;
            });
          }
        });
        
        if (onCommentDeleted) {
          onCommentDeleted();
        }
        
        showToast('Xóa bình luận thành công', 'success');
      } else {
        throw new Error(response.message || 'Failed to delete comment');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Không thể xóa bình luận. Vui lòng thử lại.');
    }
  };

  const toggleReplies = async (commentId) => {
    setShowReplies(prev => {
      const newState = { ...prev };
      newState[commentId] = !newState[commentId];
      return newState;
    });
    
    if (!showReplies[commentId]) {
      fetchReplies(commentId);
    }
  };

  const fetchReplies = async (commentId) => {
    try {
      setError('');
      
      const response = await postService.getCommentReplies(postId, commentId);
      
      if (response.success) {
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment.id === commentId) {
              return { ...comment, replies: response.data || [] };
            }
            return comment;
          })
        );
      } else {
        throw new Error(response.message || 'Failed to load replies');
      }
    } catch (err) {
      console.error('Error fetching replies:', err);
      setError('Could not load replies. Please try again later.');
    }
  };

  const handleSetReply = (comment) => {
    setReplyToComment(comment);
    setComment('');
  };

  const cancelReply = () => {
    setReplyToComment(null);
  };

  const canDeleteComment = (comment) => {
    return currentUser && (
      comment.user_id === currentUser.id || 
      currentUser.roles?.includes('admin') || 
      currentUser.roles?.includes('moderator')
    );
  };

  const renderDeleteButton = (comment) => {
    if (canDeleteComment(comment)) {
      return (
        <Button 
          variant="link" 
          className="p-0 text-danger" 
          onClick={() => handleDeleteComment(comment.id)}
          title="Xóa bình luận"
        >
          <BsTrash size={16} />
        </Button>
      );
    }
    return null;
  };

  const handleOpenReportModal = (comment) => {
    setReportingComment(comment);
    setShowReportModal(true);
  };

  const handleReportComment = async (reportData) => {
    if (!reportingComment) return { success: false, message: 'No comment selected for reporting' };
    
    try {
      setIsReporting(true);
      const response = await reportService.reportComment(postId, reportingComment.id, reportData);
      
      if (response.success) {
        setShowReportModal(false);
        setReportingComment(null);
        return { success: true, message: 'Báo cáo đã được gửi thành công' };
      } else {
        throw new Error(response.message || 'Không thể báo cáo bình luận');
      }
    } catch (error) {
      console.error('Error reporting comment:', error);
      return { 
        success: false, 
        message: error.message || 'Đã xảy ra lỗi khi gửi báo cáo'
      };
    } finally {
      setIsReporting(false);
    }
  };

  if (loading && comments.length === 0) {
    return <div className="text-center p-3"><Spinner animation="border" size="sm" /></div>;
  }

  return (
    <div className="post-comments">
      <Toast 
        show={toast.show} 
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
        style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px',
          zIndex: 1000
        }}
        bg={toast.type === 'success' ? 'success' : 'danger'}
        className="text-white"
      >
        <Toast.Header closeButton>
          <strong className="me-auto">
            {toast.type === 'success' ? (
              <><BsCheckCircle className="me-1" /> Success</>
            ) : (
              <><BsXCircle className="me-1" /> Error</>
            )}
          </strong>
        </Toast.Header>
        <Toast.Body>{toast.message}</Toast.Body>
      </Toast>

      {error && <Alert variant="danger" className="mt-3 mb-3">{error}</Alert>}
      
      <Form onSubmit={handleSubmit} className="mb-3">
        {replyToComment && (
          <div className="reply-indicator mb-2 p-2 bg-light rounded">
            <div className="d-flex justify-content-between align-items-center">
              <span>
                Replying to <strong>{replyToComment.user.name}</strong>
              </span>
              <Button variant="link" className="p-0 text-muted" onClick={cancelReply}>
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        <Form.Group>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Write a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={submitting}
          />
        </Form.Group>
        <div className="d-flex justify-content-end mt-2">
          <Button 
            variant="primary" 
            type="submit" 
            size="sm"
            disabled={!comment.trim() || submitting}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Posting...
              </>
            ) : replyToComment ? 'Reply' : 'Post'}
          </Button>
        </div>
      </Form>
      
      {comments.length === 0 ? (
        <div className="text-center text-muted py-3">No comments yet</div>
      ) : (
        <ListGroup variant="flush">
          {comments.map(comment => (
            <ListGroup.Item key={comment.id} className="px-0 py-3 border-bottom">
              <div className="d-flex">
                <Image 
                  src={comment.user?.avatar || defaultAvatar} 
                  roundedCircle 
                  width={40} 
                  height={40} 
                  className="me-2" 
                  style={{ objectFit: 'cover' }}
                />
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{comment.user?.name || 'Unknown User'}</div>
                      <div className="text-muted small">
                        {comment.created_at && formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: vi })}
                      </div>
                    </div>
                    
                    <div className="d-flex">
                      {renderDeleteButton(comment)}
                      
                      {currentUser && comment.user_id !== currentUser.id && (
                        <Button 
                          variant="link" 
                          className="p-0 text-warning ms-2" 
                          onClick={() => handleOpenReportModal(comment)}
                          title="Báo cáo bình luận"
                        >
                          <BsFlag size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2">{comment.content}</div>
                  
                  <div className="mt-2 d-flex gap-3">
                    <Button 
                      variant="link" 
                      className="p-0 text-muted" 
                      onClick={() => handleSetReply(comment)}
                    >
                      <BsReply className="me-1" /> Reply
                    </Button>
                    
                    {comment.replies_count > 0 && (
                      <Button 
                        variant="link" 
                        className="p-0 text-muted" 
                        onClick={() => toggleReplies(comment.id)}
                      >
                        {showReplies[comment.id] ? 'Hide replies' : `Show replies (${comment.replies_count})`}
                      </Button>
                    )}
                  </div>
                  
                  {showReplies[comment.id] && comment.replies && (
                    <div className="mt-3 ps-3 border-start">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="mb-3">
                          <div className="d-flex">
                            <Image 
                              src={reply.user?.avatar || defaultAvatar} 
                              roundedCircle 
                              width={32} 
                              height={32} 
                              className="me-2" 
                              style={{ objectFit: 'cover' }}
                            />
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <div className="fw-bold">{reply.user?.name || 'Unknown User'}</div>
                                  <div className="text-muted small">
                                    {reply.created_at && formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: vi })}
                                  </div>
                                </div>
                                
                                <div className="d-flex">
                                  {renderDeleteButton(reply)}
                                  
                                  {currentUser && reply.user_id !== currentUser.id && (
                                    <Button 
                                      variant="link" 
                                      className="p-0 text-warning ms-2" 
                                      onClick={() => handleOpenReportModal(reply)}
                                      title="Báo cáo bình luận"
                                    >
                                      <BsFlag size={16} />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              <div className="mt-1">{reply.content}</div>
                              
                              <div className="mt-1">
                                <Button 
                                  variant="link" 
                                  className="p-0 text-muted small" 
                                  onClick={() => handleSetReply(comment)}
                                >
                                  <BsReply className="me-1" /> Reply
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
      
      <ReportModal
        show={showReportModal}
        onHide={() => {
          setShowReportModal(false);
          setReportingComment(null);
        }}
        onSubmit={handleReportComment}
        isLoading={isReporting}
        title="Report Comment"
        contentType="comment"
      />
    </div>
  );
};

export default PostComments;
