// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Pusher Configuration
export const PUSHER_CONFIG = {
  KEY: process.env.REACT_APP_PUSHER_KEY,
  CLUSTER: process.env.REACT_APP_PUSHER_CLUSTER || 'ap1',
  ENCRYPTED: true,
  FORCE_TLS: true,
  ACTIVITY_TIMEOUT: 120000,
  PONG_TIMEOUT: 60000,
  UNAVAILABLE_TIMEOUT: 10000
};

// Chat Configuration
export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 1000,
  MAX_ATTACHMENTS: 5,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif'
  ],
  POLLING_INTERVAL: 60000, // 60 seconds
  MESSAGE_CACHE_TIME: 5 * 60 * 1000 // 5 minutes
};

export default {
  API_CONFIG,
  PUSHER_CONFIG,
  CHAT_CONFIG
};
