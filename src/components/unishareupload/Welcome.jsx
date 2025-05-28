import React from 'react';
import { InputGroup, Form, Button } from 'react-bootstrap';
import { BsSearch } from 'react-icons/bs';

const Welcome = () => {
  return (
    <>
      {/* Search bar */}
      <InputGroup className="mb-4">
        <InputGroup.Text className="bg-light border-end-0">
          <BsSearch />
        </InputGroup.Text>
        <Form.Control
          placeholder="Tìm kiếm"
          className="bg-light border-start-0"
        />
      </InputGroup>

      {/* Welcome message - styled to match the image */}
      <div className="text-center">
        <h3 className="text-primary fw-bold mb-4">
          Chào mừng bạn đến với UNISHARE !
          <span role="img" aria-label="party" className="ms-2">🎉</span>
        </h3>
        
        <div className="mt-4 text-start" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div className="mb-2 d-flex align-items-center">
            <span className="me-2 text-primary">▶</span>
            <span>Thư mục đề xuất</span>
          </div>
          <div className="mb-0 d-flex align-items-center">
            <span className="me-2 text-primary">▶</span>
            <span>Tập đề xuất</span>
          </div>
        </div>

        {/* Feature buttons */}
        <div className="mt-5 d-flex flex-wrap justify-content-center gap-3">
          <Button 
            variant="outline-primary" 
            className="px-4 py-2"
            style={{ borderRadius: '8px', minWidth: '180px' }}
            onClick={() => window.location.href = '/unishare/upload'}
          >
            Upload tài liệu
          </Button>
          <Button 
            variant="outline-primary" 
            className="px-4 py-2"
            style={{ borderRadius: '8px', minWidth: '180px' }}
            onClick={() => window.location.href = '/unishare/my-files'}
          >
            Xem tài liệu của tôi
          </Button>
        </div>
      </div>
    </>
  );
};

export default Welcome;
