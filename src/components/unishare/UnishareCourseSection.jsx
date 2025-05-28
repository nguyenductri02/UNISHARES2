import React from 'react';
import { Row, Col, Dropdown } from 'react-bootstrap';
import UnishareCourseCard from './UnishareCourseCard';
import { BsChevronDown } from 'react-icons/bs';

const UnishareCourseSection = ({ title, courses }) => {
  return (
    <>
      {title && (
        <div
          className="course-section-header d-flex align-items-center mb-3"
          style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}
        >
          <h5
            className="mb-0 fw-bold"
            style={{ color: '#222', fontSize: '1.1rem', letterSpacing: 0.1 }}
          >
            {title}
          </h5>
          <Dropdown className="ms-2">
            <Dropdown.Toggle
              variant="link"
              id="dropdown-basic"
              className="p-0 text-decoration-none text-dark"
              style={{ fontSize: 20, marginLeft: 4 }}
            >
              <BsChevronDown size={20} />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item href="#/action-1">Sắp xếp A-Z</Dropdown.Item>
              <Dropdown.Item href="#/action-2">Mới nhất</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      )}
      <Row className="g-4">
        {courses.map((course, index) => (
          <Col key={course.id || index} xs={12} sm={6} md={4} lg={4} xl={4} xxl={4}>
            <UnishareCourseCard course={course} />
          </Col>
        ))}
      </Row>
    </>
  );
};

export default UnishareCourseSection;
