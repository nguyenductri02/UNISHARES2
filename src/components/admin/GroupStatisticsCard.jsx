import React from 'react';
import { Card, Spinner, Table } from 'react-bootstrap';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const GroupStatisticsCard = ({ stats }) => {
  // Process group data from the API response
  const processGroupData = () => {
    // First check if the data is in the expected format
    if (stats && stats.data && stats.data.course_groups !== undefined) {
      return {
        course: stats.data.course_groups || 0,
        public: stats.data.public_groups || 0,
        private: stats.data.private_groups || 0,
        total: stats.data.total || 0,
        largest_groups: stats.data.largest_groups || []
      };
    }

    // If not in the expected format, try to process the API response
    if (stats && Array.isArray(stats.data)) {
      // Count the number of each type of group
      const courseGroups = stats.data.filter(g => g.type === 'course').length;
      const publicGroups = stats.data.filter(g => g.type === 'public').length;
      const privateGroups = stats.data.filter(g => g.is_private === true).length;
      
      // Sort groups by member count to get largest groups
      const sortedGroups = [...stats.data].sort((a, b) => 
        (b.member_count || 0) - (a.member_count || 0)
      );
      
      return {
        course: courseGroups,
        public: publicGroups,
        private: privateGroups,
        total: stats.data.length,
        largest_groups: sortedGroups.slice(0, 3).map(group => ({
          name: group.name,
          member_count: group.member_count || 0
        }))
      };
    }
    
    // Fallback to default mock data if no valid data is available
    return { 
      course: 20, 
      public: 15, 
      private: 10,
      total: 45,
      largest_groups: []
    };
  };
  
  const groupData = processGroupData();
  
  const chartData = {
    labels: ['Nhóm môn học', 'Nhóm công khai', 'Nhóm riêng tư'],
    datasets: [
      {
        data: [groupData.course, groupData.public, groupData.private],
        backgroundColor: ['#FF9F40', '#4BC0C0', '#9966FF'],
        borderWidth: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
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
        <h5 className="card-title mb-4">Thống kê nhóm</h5>
        
        {!stats ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            <div className="text-center mb-3">
              <div className="h3 mb-0">{groupData.total}</div>
              <div className="text-muted">Tổng số nhóm</div>
            </div>
            
            <div style={{ height: '150px' }} className="mb-3">
              <Doughnut data={chartData} options={options} />
            </div>
            
            {groupData.largest_groups.length > 0 && (
              <div className="mt-4">
                <h6 className="mb-2">Nhóm lớn nhất</h6>
                <div className="small-table">
                  <Table size="sm" className="table-borderless mt-1">
                    <thead>
                      <tr className="text-muted">
                        <th>Tên nhóm</th>
                        <th className="text-end">Thành viên</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupData.largest_groups.slice(0, 3).map((group, index) => (
                        <tr key={index}>
                          <td className="text-truncate" style={{maxWidth: '140px'}}>{group.name}</td>
                          <td className="text-end">{group.member_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default GroupStatisticsCard;
