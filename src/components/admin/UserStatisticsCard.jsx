import React from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const UserStatisticsCard = ({ stats }) => {
  // Default values if stats is null
  const roleData = stats ? (
    stats.usersByRole || { 
      student: 75, 
      lecturer: 15, 
      moderator: 5, 
      admin: 5 
    }
  ) : { 
    student: 75, 
    lecturer: 15, 
    moderator: 5, 
    admin: 5 
  };
  
  const chartData = {
    labels: ['Sinh viên', 'Giảng viên', 'Người kiểm duyệt', 'Quản trị viên'],
    datasets: [
      {
        data: [
          roleData.student || 0, 
          roleData.lecturer || 0, 
          roleData.moderator || 0, 
          roleData.admin || 0
        ],
        backgroundColor: ['#4BC0C0', '#36A2EB', '#FFCD56', '#FF6384'],
        borderWidth: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          boxWidth: 12
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = Math.round((context.raw / total) * 100);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body>
        <h5 className="card-title mb-4">Thống kê người dùng</h5>
        
        {!stats ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            <div className="text-center mb-3">
              <div className="h3 mb-0">{stats.total || 0}</div>
              <div className="text-muted">Tổng số người dùng</div>
            </div>
            
            <div style={{ height: '200px' }}>
              <Pie data={chartData} options={options} />
            </div>
            
            <div className="mt-3">
              <div className="d-flex justify-content-between mb-2">
                <span>Người dùng mới (30 ngày qua)</span>
                <span className="fw-bold">{stats.newUsers || 0}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Người dùng hoạt động</span>
                <span className="fw-bold">{stats.active || 0}</span>
              </div>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default UserStatisticsCard;
