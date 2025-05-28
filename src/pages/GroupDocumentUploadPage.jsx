import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Breadcrumb, Alert, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UploadGroupDocument from '../components/groups/UploadGroupDocument';
import { profileService } from '../services';

const GroupDocumentUploadPage = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);
  
  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      
      const response = await profileService.getGroupDetails(groupId);
      
      if (response.success) {
        setGroup(response.data);
      } else {
        throw new Error(response.message || 'Could not load group details');
      }
    } catch (err) {
      console.error('Error fetching group details:', err);
      setError('Could not load group details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Header />
      <Container className="py-4">
        <Row>
          <Col>
            <Breadcrumb>
              <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/groups' }}>
                Nhóm
              </Breadcrumb.Item>
              {group && (
                <Breadcrumb.Item 
                  linkAs={Link} 
                  linkProps={{ to: `/unishare/groups/${groupId}` }}
                >
                  {group.name}
                </Breadcrumb.Item>
              )}
              <Breadcrumb.Item active>Tải lên tài liệu</Breadcrumb.Item>
            </Breadcrumb>
            
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-3">Đang tải thông tin nhóm...</p>
              </div>
            ) : error ? (
              <Alert variant="danger">{error}</Alert>
            ) : (
              <UploadGroupDocument groupId={groupId} />
            )}
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
};

export default GroupDocumentUploadPage;
