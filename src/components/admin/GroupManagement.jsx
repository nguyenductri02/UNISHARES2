import React, { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Card, Spinner, Badge, Alert, Modal, Pagination } from 'react-bootstrap';
import { FaSearch, FaEye, FaEdit, FaTrash, FaUsers, FaLock, FaLockOpen, FaUserPlus } from 'react-icons/fa';
import { adminService } from '../../services';

const GroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDesc, setSortDesc] = useState(true);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [currentPage, typeFilter, sortBy, sortDesc]);

  const fetchGroups = async (search = '') => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        page: currentPage,
        per_page: 10,
        sort_by: sortBy,
        sort_desc: sortDesc,
        search: search || searchTerm
      };
      
      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }
      
      const response = await adminService.getGroups(params);
      
      setGroups(response.data || []);
      setTotalPages(response.meta?.last_page || 1);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setError('Không thể tải danh sách nhóm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchGroups(searchTerm);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(true);
    }
  };

  // Action handlers
  const handleView = (group) => {
    setSelectedGroup(group);
    setShowViewModal(true);
  };

  const handleMembers = async (group) => {
    setSelectedGroup(group);
    setMembersLoading(true);
    setGroupMembers([]);
    
    try {
      const response = await adminService.getGroupMembers(group.id);
      setGroupMembers(response.data || []);
      setShowMembersModal(true);
    } catch (err) {
      console.error("Error fetching group members:", err);
      setError('Không thể tải danh sách thành viên nhóm. Vui lòng thử lại sau.');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleDelete = (group) => {
    setSelectedGroup(group);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedGroup) return;
    
    setDeleteLoading(true);
    
    try {
      await adminService.deleteGroup(selectedGroup.id);
      
      // Remove group from the local state
      setGroups(prevGroups => 
        prevGroups.filter(group => group.id !== selectedGroup.id)
      );
      
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Error deleting group:", err);
      setError('Không thể xóa nhóm. Vui lòng thử lại sau.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedGroup) return;
    
    try {
      await adminService.removeGroupMember(selectedGroup.id, memberId);
      
      // Remove member from the local state
      setGroupMembers(prevMembers => 
        prevMembers.filter(member => member.user_id !== memberId)
      );
    } catch (err) {
      console.error("Error removing group member:", err);
      setError('Không thể xóa thành viên nhóm. Vui lòng thử lại sau.');
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const items = [];
    const maxVisible = 5; // Maximum number of page links to show
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    // Adjust start page if end page is at maximum
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // Add first page if not visible
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

    // Add visible page links
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

    // Add last page if not visible
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

  return (
    <div className="group-management-container">
      <h4 className="mb-4">Quản Lý Nhóm</h4>
      
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
            {/* Search bar */}
            <Form className="d-flex mb-2 mb-md-0" onSubmit={handleSearch} style={{ maxWidth: '400px' }}>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm nhóm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="primary" type="submit">
                  <FaSearch />
                </Button>
              </InputGroup>
            </Form>
            
            {/* Filters */}
            <div className="d-flex">
              <Form.Select 
                className="me-2" 
                style={{ width: 'auto' }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Tất cả loại nhóm</option>
                <option value="course">Nhóm môn học</option>
                <option value="public">Nhóm công khai</option>
              </Form.Select>
              
              <Form.Select 
                style={{ width: 'auto' }}
                value={`${sortBy}-${sortDesc ? 'desc' : 'asc'}`}
                onChange={(e) => {
                  const [newSortBy, direction] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortDesc(direction === 'desc');
                }}
              >
                <option value="created_at-desc">Mới nhất</option>
                <option value="created_at-asc">Cũ nhất</option>
                <option value="name-asc">Tên (A-Z)</option>
                <option value="name-desc">Tên (Z-A)</option>
                <option value="member_count-desc">Thành viên (nhiều-ít)</option>
              </Form.Select>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : groups.length > 0 ? (
        <>
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead>
                <tr>
                  <th>Tên nhóm</th>
                  <th>Loại</th>
                  <th>Mã môn học</th>
                  <th>Số thành viên</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(group => (
                  <tr key={group.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="group-icon me-2">
                          {group.is_private ? <FaLock className="text-muted" /> : <FaLockOpen className="text-success" />}
                        </div>
                        <div>
                          <div className="fw-medium">{group.name}</div>
                          <div className="text-muted small">{group.creator?.name || 'Không xác định'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {group.type === 'course' ? 'Môn học' : 
                       group.type === 'public' ? 'Công khai' : 'Khác'}
                    </td>
                    <td>{group.course_code || 'N/A'}</td>
                    <td>{group.member_count || 0}</td>
                    <td>
                      {group.is_private ? (
                        <Badge bg="warning" text="dark">Riêng tư</Badge>
                      ) : (
                        <Badge bg="success">Công khai</Badge>
                      )}
                    </td>
                    <td>{new Date(group.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="d-flex justify-content-center">
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="me-1" 
                          title="Xem"
                          onClick={() => handleView(group)}
                        >
                          <FaEye />
                        </Button>
                        
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="me-1" 
                          title="Thành viên"
                          onClick={() => handleMembers(group)}
                        >
                          <FaUsers />
                        </Button>
                        
                        <Button 
                          variant="danger" 
                          size="sm" 
                          title="Xóa"
                          onClick={() => handleDelete(group)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          
          {renderPagination()}
        </>
      ) : (
        <Alert variant="info">
          Không tìm thấy nhóm nào phù hợp với bộ lọc.
        </Alert>
      )}
      
      {/* View Group Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết nhóm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGroup && (
            <div>
              <h5>{selectedGroup.name}</h5>
              <p className="text-muted">{selectedGroup.description || 'Không có mô tả'}</p>
              
              <hr />
              
              <dl className="row">
                <dt className="col-sm-3">Người tạo</dt>
                <dd className="col-sm-9">{selectedGroup.creator?.name || 'Không xác định'}</dd>
                
                <dt className="col-sm-3">Loại nhóm</dt>
                <dd className="col-sm-9">
                  {selectedGroup.type === 'course' ? 'Nhóm môn học' : 
                   selectedGroup.type === 'public' ? 'Nhóm công khai' : 'Loại khác'}
                </dd>
                
                <dt className="col-sm-3">Mã môn học</dt>
                <dd className="col-sm-9">{selectedGroup.course_code || 'N/A'}</dd>
                
                <dt className="col-sm-3">Số thành viên</dt>
                <dd className="col-sm-9">{selectedGroup.member_count || 0}</dd>
                
                <dt className="col-sm-3">Trạng thái</dt>
                <dd className="col-sm-9">
                  {selectedGroup.is_private ? (
                    <Badge bg="warning" text="dark">Riêng tư</Badge>
                  ) : (
                    <Badge bg="success">Công khai</Badge>
                  )}
                </dd>
                
                <dt className="col-sm-3">Ngày tạo</dt>
                <dd className="col-sm-9">{new Date(selectedGroup.created_at).toLocaleString()}</dd>
              </dl>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Group Members Modal */}
      <Modal show={showMembersModal} onHide={() => setShowMembersModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Thành viên nhóm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {membersLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
              <p>Đang tải danh sách thành viên...</p>
            </div>
          ) : groupMembers.length > 0 ? (
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Thành viên</th>
                  <th>Vai trò</th>
                  <th>Ngày tham gia</th>
                  <th className="text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {groupMembers.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="member-avatar me-2">
                          {member.user?.avatar ? (
                            <img 
                              src={member.user.avatar} 
                              alt={member.user.name} 
                              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                            />
                          ) : (
                            <div 
                              className="bg-secondary text-white d-flex align-items-center justify-content-center"
                              style={{ width: '32px', height: '32px', borderRadius: '50%', fontSize: '14px' }}
                            >
                              {member.user?.name.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div>{member.user?.name || 'Không xác định'}</div>
                          <div className="text-muted small">{member.user?.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg={
                        member.role === 'admin' ? 'primary' : 
                        member.role === 'moderator' ? 'info' : 'secondary'
                      }>
                        {member.role === 'admin' ? 'Quản trị viên' : 
                         member.role === 'moderator' ? 'Điều hành viên' : 'Thành viên'}
                      </Badge>
                    </td>
                    <td>{member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'N/A'}</td>
                    <td className="text-center">
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleRemoveMember(member.user_id)}
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-center">Không có thành viên trong nhóm này.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMembersModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Delete Group Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xóa nhóm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xóa nhóm "{selectedGroup?.name}"?</p>
          <div className="text-danger mb-3">
            <small>Lưu ý: Hành động này không thể hoàn tác.</small>
          </div>
          <p className="mb-0">
            <strong>Việc xóa nhóm sẽ:</strong>
          </p>
          <ul>
            <li>Xóa tất cả thành viên khỏi nhóm</li>
            <li>Xóa tất cả bài đăng trong nhóm</li>
            <li>Xóa tất cả tệp đính kèm của nhóm</li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleteLoading}>
            {deleteLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Xóa'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GroupManagement;
