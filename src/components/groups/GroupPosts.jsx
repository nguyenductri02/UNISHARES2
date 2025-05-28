import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Spinner, Alert, Pagination, Form } from 'react-bootstrap';
import { postService } from '../../services';
import PostItem from '../posts/PostItem';
import CreatePostForm from '../posts/CreatePostForm';
import { BsArrowClockwise } from 'react-icons/bs';

const GroupPosts = ({ groupId, isMember, onPostCreated }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');

  const fetchPosts = useCallback(async (page, refreshMode = false) => {
    try {
      if (refreshMode) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      const response = await postService.getGroupPosts(groupId, { 
        page,
        per_page: 10,
        sort_by: sortBy
      });
      
      if (response.success) {
        setPosts(response.data || []);
        setTotalPages(response.meta?.last_page || 1);
      } else {
        throw new Error(response.message || 'Could not fetch group posts');
      }
    } catch (err) {
      console.error('Error fetching group posts:', err);
      setError('Không thể tải bài viết. Vui lòng thử lại sau.');
      if (posts.length === 0) {
        setPosts([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId, sortBy]);

  useEffect(() => {
    if (groupId) {
      fetchPosts(currentPage);
    }
  }, [groupId, currentPage, fetchPosts]);

  const handleRefresh = () => {
    fetchPosts(currentPage, true);
  };

  const handleCreatePost = async (postData) => {
    try {
      setError('');
      console.log("Creating post with data:", postData);
      
      const response = await postService.createGroupPost(groupId, postData);
      
      console.log("Post creation response:", response);
      
      if (response.success) {
        // Refresh posts after creation
        fetchPosts(1);
        setShowCreateForm(false);
        setCurrentPage(1); // Return to first page
        if (onPostCreated) onPostCreated();
        
        // Return the successful response to the form
        return response;
      } else {
        // If API returns custom error, use it, otherwise create a generic one
        throw new Error(response.message || 'Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
      
      // Return the error response to the form
      return {
        success: false,
        message: err.message || 'Failed to create post'
      };
    }
  };

  const handlePostLiked = (postId, isLiked) => {
    // Update the post in the current list to reflect like status
    setPosts(currentPosts => 
      currentPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: isLiked,
            likes_count: isLiked ? post.likes_count + 1 : post.likes_count - 1
          };
        }
        return post;
      })
    );
  };

  const handlePostDeleted = (postId) => {
    // Remove the deleted post from the list
    setPosts(currentPosts => currentPosts.filter(post => post.id !== postId));
  };

  // Pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    let items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // First page and ellipsis
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis-start" />);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item 
          key={i} 
          active={i === currentPage}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis-end" />);
      }
      items.push(
        <Pagination.Item key={totalPages} onClick={() => setCurrentPage(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="justify-content-center mt-4">
        <Pagination.Prev 
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        />
        {items}
        <Pagination.Next 
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        />
      </Pagination>
    );
  };

  if (loading && posts.length === 0) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }

  return (
    <div className="group-posts-container">
      {/* Create post button and form */}
      {isMember && (
        <Card className="mb-4">
          <Card.Body>
            {showCreateForm ? (
              <CreatePostForm 
                groupId={groupId} 
                onSubmit={handleCreatePost}
                onCancel={() => setShowCreateForm(false)}
              />
            ) : (
              <div className="d-flex justify-content-between align-items-center">
                <div className="post-prompt">Chia sẻ điều gì đó với nhóm...</div>
                <Button variant="primary" onClick={() => setShowCreateForm(true)}>
                  Tạo bài viết
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Error message with retry option */}
      {error && (
        <Alert variant="danger" className="mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <span>{error}</span>
            <Button 
              variant="outline-danger" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>Thử lại</>
              )}
            </Button>
          </div>
        </Alert>
      )}
      
      {/* Posts controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <Form.Select
            size="sm"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1); // Reset to first page when changing sort
            }}
            style={{ width: 'auto' }}
          >
            <option value="created_at">Mới nhất trước</option>
            <option value="like_count">Phổ biến nhất</option>
            <option value="comment_count">Nhiều bình luận nhất</option>
          </Form.Select>
        </div>
        <Button 
          variant="outline-secondary" 
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <><BsArrowClockwise /> Làm mới</>
          )}
        </Button>
      </div>
      
      {/* Loading indicator */}
      {loading && posts.length > 0 && (
        <div className="text-center mb-3">
          <Spinner animation="border" size="sm" />
        </div>
      )}
      
      {/* Posts list */}
      {posts.length === 0 && !loading ? (
        <Card className="text-center p-4">
          <Card.Body>
            <h5>Chưa có bài đăng nào</h5>
            <p className="text-muted">Hãy là người đầu tiên chia sẻ với nhóm!</p>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {posts.map(post => (
            <Col xs={12} key={post.id} className="mb-3">
              <PostItem 
                post={post} 
                groupContext={true} 
                onLike={handlePostLiked}
                onDelete={handlePostDeleted}
              />
            </Col>
          ))}
        </Row>
      )}
      
      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default GroupPosts;
