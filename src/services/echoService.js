import Echo from 'laravel-echo';
import io from 'socket.io-client';

// Configure Socket.IO
window.io = io;

console.log('Initializing Echo with Socket.IO...');

// Get token if available
const token = localStorage.getItem('access_token');
console.log('Auth token available:', !!token);

// Create Echo instance with Socket.IO
const echo = new Echo({
  broadcaster: 'socket.io',
  host: 'http://localhost:6001',
  authEndpoint: 'http://127.0.0.1:8000/api/broadcasting/auth',
  auth: {
    headers: {
      Authorization: () => {
        const currentToken = localStorage.getItem('access_token');
        console.log('Getting auth header, token available:', !!currentToken);
        return currentToken ? `Bearer ${currentToken}` : '';
      },
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  },
  // Add Socket.IO specific options
  transports: ['websocket', 'polling'],
});

console.log('Echo instance created:', echo);

// Add connection event listeners for debugging
if (echo.connector && echo.connector.socket) {
  echo.connector.socket.on('connect', () => {
    console.log('Socket.IO connected successfully');
  });

  echo.connector.socket.on('disconnect', (reason) => {
    console.log('Socket.IO disconnected:', reason);
  });

  echo.connector.socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });
}

export default echo;
