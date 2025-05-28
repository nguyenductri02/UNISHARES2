import React from 'react';

// Dropdown component for the three dots menu
const UnishareDropdown = ({ children }) => {
  return (
    <div className="dropdown">
      {children}
    </div>
  );
};

UnishareDropdown.Toggle = ({ children, as, className }) => {
  return (
    <button className={className} type="button" data-bs-toggle="dropdown" aria-expanded="false">
      {children}
    </button>
  );
};

UnishareDropdown.Menu = ({ children, align }) => {
  const alignClass = align === 'end' ? 'dropdown-menu-end' : '';
  return (
    <ul className={`dropdown-menu ${alignClass}`}>
      {children}
    </ul>
  );
};

UnishareDropdown.Item = ({ children, className }) => {
  return (
    <li><a className={`dropdown-item ${className || ''}`} href="#">{children}</a></li>
  );
};

export default UnishareDropdown;
