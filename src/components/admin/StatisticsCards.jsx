import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import { FaUsers, FaBook, FaFileAlt, FaShoppingCart, FaFlag } from 'react-icons/fa';

const StatisticsCards = ({ stats, documentStats }) => {
  const [statisticsData, setStatisticsData] = useState([
    { title: 'Tổng người dùng', value: '0', icon: FaUsers, color: '#0370B7', bgColor: '#E6F3FB' },
    { title: 'Tài liệu đã duyệt', value: '0', icon: FaBook, color: '#28A745', bgColor: '#E8F9EF' },
    { title: 'Chờ duyệt', value: '0', icon: FaFileAlt, color: '#FFC107', bgColor: '#FFF8E6' },
    { title: 'Báo cáo', value: '0', icon: FaFlag, color: '#6F42C1', bgColor: '#F0E7FA' }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stats || documentStats) {
      updateStatsCards();
      setLoading(false);
    }
  }, [stats, documentStats]);

  const updateStatsCards = () => {
    // Create a copy of the initial statistics data
    const updatedStats = [...statisticsData];
    
    // Update user count if available
    if (stats?.users?.total !== undefined) {
      updatedStats[0].value = stats.users.total.toLocaleString();
    }
    
    // Update approved documents count if available
    if (documentStats?.approved !== undefined) {
      updatedStats[1].value = documentStats.approved.toLocaleString();
    } else if (stats?.content?.documents?.approved !== undefined) {
      updatedStats[1].value = stats.content.documents.approved.toLocaleString();
    }
    
    // Update pending documents count if available
    if (documentStats?.pending !== undefined) {
      updatedStats[2].value = documentStats.pending.toLocaleString();
    } else if (stats?.content?.documents?.pending !== undefined) {
      updatedStats[2].value = stats.content.documents.pending.toLocaleString();
    }
    
    // Update reports count if available
    if (stats?.reports?.pending !== undefined) {
      updatedStats[3].value = stats.reports.pending.toLocaleString();
    } else if (stats?.reports?.total !== undefined) {
      updatedStats[3].value = stats.reports.total.toLocaleString();
    }
    
    setStatisticsData(updatedStats);
  };

  if (loading && (!stats && !documentStats)) {
    return (
      <Row className="mb-4">
        {statisticsData.map((stat, index) => (
          <Col md={3} sm={6} className="mb-3" key={index}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center justify-content-center">
                <Spinner animation="border" size="sm" />
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row className="mb-4">
      {statisticsData.map((stat, index) => {
        const IconComponent = stat.icon;
        
        return (
          <Col md={3} sm={6} className="mb-3" key={index}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div
                  style={{
                    backgroundColor: stat.bgColor,
                    color: stat.color,
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px'
                  }}
                >
                  <IconComponent size={24} />
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '14px' }}>
                    {stat.title}
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '600' }}>
                    {stat.value}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default StatisticsCards;
