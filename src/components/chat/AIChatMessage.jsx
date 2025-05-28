import React from 'react';
import { Card, Image, Spinner } from 'react-bootstrap';
import { FaRobot, FaUser } from 'react-icons/fa';
import userAvatar from '../../assets/avatar-1.png';

const AIChatMessage = ({ message = {}, isAI = false, isTyping = false }) => {
  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };  // Get avatar for AI or user
  const getAvatar = () => {
    if (isAI || isTyping) {
      return (
        <div 
          className="d-flex align-items-center justify-content-center"
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#007bff',
            borderRadius: '50%',
            color: 'white'
          }}
        >
          <FaRobot size={20} />
        </div>
      );
    } else {
      // For user messages, use provided avatar or default
      const avatarSrc = message?.user?.avatar || userAvatar;
      return (
        <Image 
          src={avatarSrc} 
          roundedCircle 
          width={40} 
          height={40} 
          className="align-self-end"
          style={{ objectFit: 'cover' }}
          onError={(e) => {
            // Fallback to default avatar if image fails to load
            e.target.src = userAvatar;
          }}
        />
      );
    }
  };
  // Get sender name
  const getSenderName = () => {
    if (isAI || isTyping) {
      return `Trợ Lý AI${message?.model ? ` (${message.model})` : ''}`;
    } else {
      return message?.user?.name || 'Bạn';
    }
  };

  // Render typing indicator
  if (isTyping) {
    return (
      <div className="d-flex mb-3 justify-content-start">
        {getAvatar()}
        <div style={{ maxWidth: '70%' }} className="ms-2">
          <div className="sender-name small text-muted mb-1">
            Trợ Lý AI đang trả lời...
          </div>
          <Card className="border-0 bg-light" style={{ borderRadius: '18px' }}>
            <Card.Body className="p-2 px-3">
              <div className="d-flex align-items-center">
                <Spinner animation="grow" size="sm" className="me-2" />
                <Spinner animation="grow" size="sm" className="me-2" style={{ animationDelay: '0.15s' }} />
                <Spinner animation="grow" size="sm" style={{ animationDelay: '0.3s' }} />
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    );
  }

  const isOwnMessage = !isAI;

  return (
    <div className={`d-flex mb-3 ${isOwnMessage ? 'justify-content-end' : 'justify-content-start'}`}>
      {!isOwnMessage && (
        <div className="me-2">
          {getAvatar()}
        </div>
      )}
      
      <div style={{ maxWidth: '70%' }}>
        {!isOwnMessage && (
          <div className="sender-name small text-muted mb-1">
            {getSenderName()}
          </div>
        )}
        
        <Card 
          className={`border-0 ${isOwnMessage ? 'bg-primary text-white' : 'bg-light'}`} 
          style={{ borderRadius: '18px' }}
        >          <Card.Body className="p-2 px-3">
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {message?.content || ''}
            </div>
            {(message?.created_at || message?.timestamp) && (
              <div className="message-time small text-end mt-1" style={{ opacity: 0.8 }}>
                {formatTimestamp(message.created_at || message.timestamp)}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
      
      {isOwnMessage && (
        <div className="ms-2">
          {getAvatar()}
        </div>
      )}
    </div>
  );
};

export default AIChatMessage;
