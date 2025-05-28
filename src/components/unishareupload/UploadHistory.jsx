import React, { useState, useEffect } from 'react';
import { InputGroup, Form, Table, Badge, Spinner, Alert, Button, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { BsSearch, BsFileEarmark, BsThreeDotsVertical, BsEye, BsDownload, BsTrash } from 'react-icons/bs';
import { profileService } from '../../services';

const UploadHistory = () => {
  const [uploadHistory, setUploadHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  
  // Fetch upload history on component mount and when page changes
  useEffect(() => {
    fetchUploadHistory();
  }, [currentPage]);

  // Filter history items when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredHistory(uploadHistory);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredHistory(
        uploadHistory.filter(item => 
          item.fileName?.toLowerCase().includes(term) || 
          item.title?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, uploadHistory]);

  const fetchUploadHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First try with user history API
      try {
        // Get user history with a filter for document uploads
        const response = await profileService.getUserHistory({
          page: currentPage,
          per_page: 10,
          type: 'document',
          action: 'upload'
        });
        
        if (response && response.data) {
          setUploadHistory(response.data);
          setFilteredHistory(response.data);
          setTotalPages(response.meta?.last_page || 1);
          return;
        }
      } catch (historyError) {
        console.warn('Could not fetch from user history endpoint, trying documents endpoint:', historyError);
      }
      
      // Fallback to documents API if history API fails
      const fallbackResponse = await profileService.getUserDocuments({
        page: currentPage,
        per_page: 10,
        sort: 'latest'
      });
      
      if (fallbackResponse && fallbackResponse.data) {
        // Convert to format expected by the component
        const formattedHistory = fallbackResponse.data.map(doc => ({
          ...doc,
          type: 'document',
          action: 'upload',
          status: doc.is_approved ? 'completed' : 'pending'
        }));
        
        setUploadHistory(formattedHistory);
        setFilteredHistory(formattedHistory);
        setTotalPages(fallbackResponse.meta?.last_page || 1);
      } else {
        throw new Error('Không thể tải lịch sử tải lên');
      }
    } catch (err) {
      console.error("Error fetching upload history:", err);
      setError('Không thể tải lịch sử tải lên. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleViewDocument = (id) => {
    navigate(`/unishare-files/view/${id}`);
  };

  const handleDownloadDocument = async (id) => {
    try {
      await profileService.downloadDocument(id);
    } catch (error) {
      console.error("Download error:", error);
      alert(error.message || 'Không thể tải xuống tài liệu');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <Badge bg="success">Thành công</Badge>;
      case 'pending':
        return <Badge bg="warning" text="dark">Đang xử lý</Badge>;
      case 'failed':
        return <Badge bg="danger">Thất bại</Badge>;
      default:
        return <Badge bg="secondary">Không xác định</Badge>;
    }
  };
  
  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const items = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>1</Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" />);
      }
    }
    
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item 
          key={page} 
          active={page === currentPage}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Pagination.Item>
      );
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />);
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

  return (
    <>
      {/* Search bar */}
      <InputGroup className="mb-4">
        <InputGroup.Text className="bg-light border-end-0">
          <BsSearch />
        </InputGroup.Text>
        <Form.Control
          placeholder="Tìm kiếm"
          className="bg-light border-start-0"
          value={searchTerm}
          onChange={handleSearch}
        />
      </InputGroup>

      <h4 className="mb-4">Lịch sử upload</h4>
      
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-3">
            <BsFileEarmark size={50} className="text-muted" />
          </div>
          <h5 className="text-muted">
            {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có lịch sử tải lên'}
          </h5>
          {!searchTerm && (
            <Button 
              onClick={() => navigate('/unishare-files/upload')}
              variant="primary"
              className="mt-3"
            >
              Tải lên tài liệu mới
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Upload history table */}
          <Table hover responsive className="upload-history-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Tên tập tin</th>
                <th style={{ width: '25%' }}>Ngày upload</th>
                <th style={{ width: '15%' }}>Trạng thái</th>
                <th style={{ width: '20%' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id}>
                  <td className="align-middle">
                    <div className="d-flex align-items-center">
                      <BsFileEarmark className="me-2 text-primary" />
                      <span className="text-truncate">{item.title || item.file_name}</span>
                    </div>
                  </td>
                  <td className="align-middle">{formatDate(item.created_at)}</td>
                  <td className="align-middle">
                    {getStatusLabel(item.status)}
                  </td>
                  <td className="align-middle">
                    <Button
                      variant="light"
                      size="sm"
                      className="me-1"
                      onClick={() => handleViewDocument(item.id)}
                      title="Xem chi tiết"
                    >
                      <BsEye />
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      className="me-1"
                      onClick={() => handleDownloadDocument(item.id)}
                      title="Tải xuống"
                    >
                      <BsDownload />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {/* Pagination */}
          {renderPagination()}
        </>
      )}
    </>
  );
};

export default UploadHistory;
