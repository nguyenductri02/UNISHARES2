import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BsHouseDoor, BsCloudUpload, BsFileEarmark, BsClockHistory, BsPeople, BsTrash } from 'react-icons/bs';

const UnishareSidebar = ({ activeSection }) => {
  const navigate = useNavigate();

  // Determine which sidebar item is active
  const isActive = (sectionName) => {
    return activeSection === sectionName ? 'text-primary fw-bold' : 'text-dark';
  };

  // Handle navigation within the UniShareUpload component
  const handleSectionClick = (sectionName) => {
    // Updated to use unishare-files instead of unishare
    navigate(`/unishare-files/${sectionName}`);
  };

  return (
    <div 
      className="bg-white rounded p-3 shadow-sm mb-4" 
      style={{ border: '1px solid #e3f1fb', borderRadius: '0.75rem' }}
    >
      <div className="sidebar-menu">
        <ul className="list-unstyled mb-0">
          <li className="mb-3">
            <div 
              onClick={() => handleSectionClick('home')}
              className={`d-flex align-items-center text-decoration-none ${isActive('home')}`}
              style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px' }}
            >
              <BsHouseDoor className="me-2" />
              <span>Trang chủ</span>
            </div>
          </li>
          <li className="mb-3">
            <div 
              onClick={() => handleSectionClick('upload')}
              className={`d-flex align-items-center text-decoration-none ${isActive('upload')}`}
              style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px', 
                backgroundColor: activeSection === 'upload' ? '#e3f1fb' : 'transparent' }}
            >
              <BsCloudUpload className="me-2" />
              <span>Upload tài liệu</span>
            </div>
          </li>
          <li className="mb-3">
            <div 
              onClick={() => handleSectionClick('my-files')}
              className={`d-flex align-items-center text-decoration-none ${isActive('my-files')}`}
              style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px', 
                backgroundColor: activeSection === 'my-files' ? '#e3f1fb' : 'transparent' }}
            >
              <BsFileEarmark className="me-2" />
              <span>File của tôi</span>
            </div>
          </li>
          <li className="mb-3">
            <div 
              onClick={() => handleSectionClick('history')}
              className={`d-flex align-items-center text-decoration-none ${isActive('history')}`}
              style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px',
                backgroundColor: activeSection === 'history' ? '#e3f1fb' : 'transparent' }}
            >
              <BsClockHistory className="me-2" />
              <span>Lịch sử upload</span>
            </div>
          </li>
          <li className="mb-3">
            <div 
              onClick={() => handleSectionClick('shared')}
              className={`d-flex align-items-center text-decoration-none ${isActive('shared')}`}
              style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px',
                backgroundColor: activeSection === 'shared' ? '#e3f1fb' : 'transparent' }}
            >
              <BsPeople className="me-2" />
              <span>Được chia sẻ</span>
            </div>
          </li>
          <li>
            <div 
              onClick={() => handleSectionClick('trash')}
              className={`d-flex align-items-center text-decoration-none ${isActive('trash')}`}
              style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px',
                backgroundColor: activeSection === 'trash' ? '#e3f1fb' : 'transparent' }}
            >
              <BsTrash className="me-2" />
              <span>Thùng rác</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UnishareSidebar;
