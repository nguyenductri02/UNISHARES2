import React from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DocumentStatisticsCard = ({ stats }) => {
  if (!stats) {
    return (
      <Card className="border-0 shadow-sm h-100">
        <Card.Body>
          <h5 className="card-title mb-4">Thống kê tài liệu</h5>
          <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
            <Spinner animation="border" variant="primary" />
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Get the actual statistics from the data
  const documentStats = stats.data || stats;
  
  // Get top 5 subjects
  const topSubjects = documentStats.top_subjects || [];
  
  const chartData = {
    labels: topSubjects.map(subject => subject.subject || 'Không xác định'),
    datasets: [
      {
        label: 'Số lượng tài liệu',
        data: topSubjects.map(subject => subject.count || 0),
        backgroundColor: '#36A2EB',
        borderRadius: 4
      }
    ]
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Số lượng: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          precision: 0
        }
      }
    }
  };

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body>
        <h5 className="card-title mb-4">Thống kê tài liệu</h5>
        
        <div className="d-flex justify-content-between mb-3">
          <div className="text-center">
            <div className="h3 mb-0">{documentStats.total || 0}</div>
            <div className="text-muted">Tổng số</div>
          </div>
          <div className="text-center">
            <div className="h3 mb-0 text-success">{documentStats.approved || 0}</div>
            <div className="text-muted">Đã duyệt</div>
          </div>
          <div className="text-center">
            <div className="h3 mb-0 text-warning">{documentStats.pending || 0}</div>
            <div className="text-muted">Chờ duyệt</div>
          </div>
        </div>
        
        <div className="mt-4">
          <h6 className="mb-3">Môn học phổ biến</h6>
          <div style={{ height: '180px' }}>
            {topSubjects.length > 0 ? (
              <Bar data={chartData} options={options} />
            ) : (
              <div className="text-center text-muted">
                Không có dữ liệu về môn học
              </div>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default DocumentStatisticsCard;
