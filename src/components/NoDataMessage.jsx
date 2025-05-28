import React from 'react';
import { Card } from 'react-bootstrap';
import { FaInfoCircle } from 'react-icons/fa';

const NoDataMessage = ({ message, icon: Icon = FaInfoCircle }) => {
  return (
    <Card className="text-center p-4 border-light">
      <Card.Body>
        <Icon size={40} className="text-muted mb-3" />
        <p className="text-muted">{message}</p>
      </Card.Body>
    </Card>
  );
};

export default NoDataMessage;
