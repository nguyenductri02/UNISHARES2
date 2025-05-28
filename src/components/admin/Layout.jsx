import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout d-flex">
      <Sidebar />
      <div className="admin-content flex-grow-1 bg-light">
        <Header />
        <div className="content-wrapper p-4" style={{ paddingLeft: "30px", paddingRight: "30px" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
