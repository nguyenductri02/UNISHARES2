import React, { useState, useEffect, useRef } from 'react';
import { Table, Dropdown, Spinner, Alert, Pagination } from 'react-bootstrap';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { profileService } from '../../services';

const ParticipationHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isComponentMounted = useRef(true);
  const lastFetchTime = useRef(0);
  const isFetching = useRef(false);

  // Track component mount/unmount
  useEffect(() => {
    console.log('ParticipationHistory mounted');
    isComponentMounted.current = true;
    
    return () => {
      console.log('ParticipationHistory unmounted');
      isComponentMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isComponentMounted.current) {
      fetchHistory(currentPage);
    }
  }, [currentPage]);

  const fetchHistory = async (page) => {
    // Prevent concurrent fetches
    if (isFetching.current) {
      console.log('Already fetching history, skipping');
      return;
    }
    
    // Throttle API calls - only fetch if it's been at least 5 seconds since last fetch
    const now = Date.now();
    if (now - lastFetchTime.current < 5000) {
      console.log('Throttling history fetch - last fetch was too recent');
      return;
    }
    
    try {
      isFetching.current = true;
      lastFetchTime.current = now;
      
      if (isComponentMounted.current) {
        setLoading(true);
        setError('');
      }
      
      console.log('Fetching user history, page:', page);
      const response = await profileService.getUserHistory({ page, per_page: 10 });
      
      // Check if component is still mounted before updating state
      if (!isComponentMounted.current) {
        console.log('Component unmounted during fetch, aborting update');
        return;
      }
      
      if (response.success) {
        setHistory(response.data || []);
        setTotalPages(response.meta?.last_page || 1);
      } else {
        throw new Error(response.message || 'Không thể tải lịch sử hoạt động');
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      if (isComponentMounted.current) {
        setError('Không thể tải lịch sử hoạt động. Vui lòng thử lại sau.');
      }
    } finally {
      if (isComponentMounted.current) {
        setLoading(false);
      }
      isFetching.current = false;
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

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

  const formatActivityTime = (timeString) => {
    if (!timeString) return 'N/A';
    const date = new Date(timeString);
    return date.toLocaleString('vi-VN');
  };

  const getActivityTitle = (item) => {
    switch (item.type) {
      case 'document':
        return `Tải lên tài liệu: ${item.title}`;
      case 'comment':
        return `Bình luận: ${item.title.substring(0, 40)}${item.title.length > 40 ? '...' : ''}`;
      case 'group':
        return `Tham gia nhóm: ${item.title}`;
      case 'post':
        return `Đăng bài: ${item.title}`;
      default:
        return item.title || 'Hoạt động';
    }
  };
  
  if (loading && history.length === 0) {
    return <div className="text-center py-4"><Spinner animation="border" /></div>;
  }

  if (error && history.length === 0) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (history.length === 0 && !loading) {
    return (
      <Alert variant="info">
        Chưa có hoạt động nào được ghi nhận.
      </Alert>
    );
  }

  return (
    <div className="participation-history-container">
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      {loading && <div className="text-center py-2 mb-3"><Spinner animation="border" size="sm" /></div>}
      
      <Table hover responsive className="participation-history-table">
        <thead>
          <tr>
            <th style={{ width: '60%' }}>Hoạt động</th>
            <th style={{ width: '30%' }}>Thời gian</th>
            <th style={{ width: '10%' }}></th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={`${item.type}-${item.id}`}>
              <td>{getActivityTitle(item)}</td>
              <td>{formatActivityTime(item.created_at)}</td>
              <td className="text-end">
                <Dropdown align="end">
                  <Dropdown.Toggle as="a" bsPrefix="p-0" style={{ cursor: 'pointer' }}>
                    <BsThreeDotsVertical />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item href={`/unishare-files/view/${item.id}`}>Xem chi tiết</Dropdown.Item>
                    {item.type === 'document' && (
                      <Dropdown.Item href={`/unishare-files/download/${item.id}`}>Tải xuống</Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      {renderPagination()}
    </div>
  );
};

export default ParticipationHistory;
