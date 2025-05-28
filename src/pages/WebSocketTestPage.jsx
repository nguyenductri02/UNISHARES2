import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, ListGroup } from 'react-bootstrap';
import echo from '../services/echoService';

const WebSocketTestPage = () => {
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [logs, setLogs] = useState([]);
  const [testResults, setTestResults] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const addTestResult = (test, result, details = '') => {
    setTestResults(prev => [...prev, { test, result, details, timestamp: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    addLog('Initializing WebSocket connection test...', 'info');
    testConnection();
  }, []);

  const testConnection = () => {
    addLog('Testing Socket.IO connection via Laravel Echo...', 'info');
    
    try {
      // Test if echo service is available
      if (!echo) {
        addLog('❌ Echo service not available', 'error');
        addTestResult('Echo Service', 'FAIL', 'Echo service is null or undefined');
        return;
      }

      addLog('✅ Echo service loaded', 'success');
      addTestResult('Echo Service', 'PASS', 'Echo service is available');

      // Test connector
      if (!echo.connector) {
        addLog('❌ Echo connector not available', 'error');
        addTestResult('Echo Connector', 'FAIL', 'Connector is null or undefined');
        return;
      }

      addLog('✅ Echo connector available', 'success');
      addTestResult('Echo Connector', 'PASS', 'Connector is available');

      // Test socket connection
      if (echo.connector.socket) {
        addLog('✅ Socket instance found', 'success');
        addTestResult('Socket Instance', 'PASS', 'Socket instance is available');

        // Check if socket is connected
        if (echo.connector.socket.connected) {
          setConnectionStatus('Connected');
          addLog('✅ Socket is connected!', 'success');
          addTestResult('Connection Status', 'PASS', 'Socket is connected');
        } else {
          setConnectionStatus('Connecting...');
          addLog('⏳ Socket is connecting...', 'warning');
          addTestResult('Connection Status', 'PENDING', 'Socket is connecting');
        }

        // Add event listeners
        echo.connector.socket.on('connect', () => {
          setConnectionStatus('Connected');
          addLog('✅ Socket connected successfully!', 'success');
          addTestResult('Connection Event', 'PASS', 'Connect event fired');
        });

        echo.connector.socket.on('disconnect', (reason) => {
          setConnectionStatus('Disconnected');
          addLog(`❌ Socket disconnected: ${reason}`, 'error');
          addTestResult('Disconnection', 'INFO', `Reason: ${reason}`);
        });

        echo.connector.socket.on('connect_error', (error) => {
          setConnectionStatus('Error');
          addLog(`❌ Connection error: ${error.message}`, 'error');
          addTestResult('Connection Error', 'FAIL', error.message);
        });

      } else {
        addLog('❌ Socket instance not found', 'error');
        addTestResult('Socket Instance', 'FAIL', 'Socket is null or undefined');
      }

    } catch (error) {
      addLog(`❌ Error during connection test: ${error.message}`, 'error');
      addTestResult('Connection Test', 'FAIL', error.message);
    }
  };

  const testChannelSubscription = () => {
    addLog('Testing channel subscription...', 'info');
    
    try {
      const channel = echo.channel('test-channel');
      
      if (channel) {
        addLog('✅ Successfully subscribed to test-channel', 'success');
        addTestResult('Channel Subscription', 'PASS', 'test-channel subscribed');
        
        // Test listening for events
        channel.listen('TestEvent', (data) => {
          addLog(`✅ Received TestEvent: ${JSON.stringify(data)}`, 'success');
          addTestResult('Event Listening', 'PASS', 'TestEvent received');
        });
        
      } else {
        addLog('❌ Failed to subscribe to channel', 'error');
        addTestResult('Channel Subscription', 'FAIL', 'Channel subscription returned null');
      }
    } catch (error) {
      addLog(`❌ Channel subscription error: ${error.message}`, 'error');
      addTestResult('Channel Subscription', 'FAIL', error.message);
    }
  };

  const testPrivateChannel = () => {
    addLog('Testing private channel subscription...', 'info');
    
    try {
      const privateChannel = echo.private('test-private-channel');
      
      if (privateChannel) {
        addLog('✅ Successfully subscribed to private channel', 'success');
        addTestResult('Private Channel', 'PASS', 'Private channel subscribed');
      } else {
        addLog('❌ Failed to subscribe to private channel', 'error');
        addTestResult('Private Channel', 'FAIL', 'Private channel subscription failed');
      }
    } catch (error) {
      addLog(`❌ Private channel error: ${error.message}`, 'error');
      addTestResult('Private Channel', 'FAIL', error.message);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResults([]);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'Connected': return 'success';
      case 'Connecting...': return 'warning';
      case 'Error': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <Container className="mt-4">
      <h2>WebSocket Connection Test</h2>
      
      <Card className="mb-4">
        <Card.Header>
          <h5>Connection Status</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant={getStatusColor()}>
            <strong>Status:</strong> {connectionStatus}
          </Alert>
          
          <div className="d-flex gap-2 flex-wrap">
            <Button variant="primary" onClick={testConnection}>
              Test Connection
            </Button>
            <Button variant="info" onClick={testChannelSubscription}>
              Test Channel Subscription
            </Button>
            <Button variant="warning" onClick={testPrivateChannel}>
              Test Private Channel
            </Button>
            <Button variant="secondary" onClick={clearLogs}>
              Clear Logs
            </Button>
          </div>
        </Card.Body>
      </Card>

      <div className="row">
        <div className="col-md-6">
          <Card>
            <Card.Header>
              <h6>Test Results</h6>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {testResults.length === 0 ? (
                <p className="text-muted">No test results yet</p>
              ) : (
                <ListGroup variant="flush">
                  {testResults.map((result, index) => (
                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-start">
                      <div>
                        <strong>{result.test}</strong>
                        <div className="text-muted small">{result.details}</div>
                      </div>
                      <span className={`badge bg-${
                        result.result === 'PASS' ? 'success' : 
                        result.result === 'FAIL' ? 'danger' : 
                        result.result === 'PENDING' ? 'warning' : 'info'
                      }`}>
                        {result.result}
                      </span>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </div>
        
        <div className="col-md-6">
          <Card>
            <Card.Header>
              <h6>Connection Logs</h6>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {logs.length === 0 ? (
                <p className="text-muted">No logs yet</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-2">
                    <small className="text-muted">{log.timestamp}</small>
                    <div className={`text-${
                      log.type === 'success' ? 'success' : 
                      log.type === 'error' ? 'danger' : 
                      log.type === 'warning' ? 'warning' : 'info'
                    }`}>
                      {log.message}
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
};

export default WebSocketTestPage;
