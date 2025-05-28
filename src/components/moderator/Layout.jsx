import React from 'react';
import ModeratorSidebar from './Sidebar';
import ModeratorHeader from './Header';

const ModeratorLayout = ({ children }) => {
  return (
    <div className="moderator-layout d-flex">
      <ModeratorSidebar />
      <div className="moderator-content flex-grow-1 bg-light">
        <ModeratorHeader />
        <div className="content-wrapper p-4" style={{ paddingLeft: "30px", paddingRight: "30px" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModeratorLayout;
