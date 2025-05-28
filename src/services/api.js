import axios from 'axios';

// Set the base URL for API requests
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true
});

// Store the baseURL for reference in other functions
const baseURL = api.defaults.baseURL;

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Ensure content type is set for all requests except FormData
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // Add debugging header to track requests
    const userData = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    
    // Improved role detection that handles different role formats
    let isLecturer = false;
    let userRole = 'unknown';
    
    if (userData && userData.roles) {
      const roles = Array.isArray(userData.roles) ? userData.roles : [userData.roles];
      
      // Find the first role for debugging header
      if (roles.length > 0) {
        const firstRole = roles[0];
        userRole = typeof firstRole === 'string' ? firstRole : (firstRole.name || 'unknown');
      }
      
      // Check if any role is a lecturer
      isLecturer = roles.some(role => {
        const roleName = typeof role === 'string' ? role : (role.name || '');
        return roleName.toLowerCase() === 'lecturer';
      });
    }
    
    config.headers['X-Debug-User-Role'] = userRole;
    
    // Add special header for lecturers to help the server recognize them
    if (isLecturer) {
      config.headers['X-Override-Role'] = 'lecturer';
      console.log('Lecturer role detected, adding X-Override-Role header');
    }
      
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response [${response.config.method?.toUpperCase()} ${response.config.url}]:`, {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error responses for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error(`API Error [${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}]:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const authService = require('./authService').default;
        await authService.refreshToken();
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear stored auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Get CSRF token for Laravel Sanctum
 */
export const getCsrfToken = async () => {
  try {
    // Extract base URL without trailing slash and /api prefix
    let serverUrl = baseURL;
    
    // Remove /api/ from the URL if present
    if (serverUrl.includes('/api/')) {
      serverUrl = serverUrl.substring(0, serverUrl.indexOf('/api/'));
    }
    
    // Remove trailing slash if present
    if (serverUrl.endsWith('/')) {
      serverUrl = serverUrl.slice(0, -1);
    }
    
    // Full URL for CSRF cookie endpoint
    const csrfUrl = `${serverUrl}/sanctum/csrf-cookie`;
    
    console.log('Getting CSRF token from:', csrfUrl);
    
    // Use axios directly instead of api instance to avoid adding /api/ prefix
    const response = await axios.get(csrfUrl, { 
      withCredentials: true,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 15000 // 15 second timeout
    });
    
    console.log('CSRF token response:', response.status);
    return true;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    console.error('Error details:', error.response?.data || error.message);
    
    // Try alternative URL with /api/ prefix
    try {
      console.log('Trying alternative CSRF token URL');
      const altCsrfUrl = `${baseURL}sanctum/csrf-cookie`;
      
      const response = await axios.get(altCsrfUrl, { 
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 10000
      });
      
      console.log('Alternative CSRF token response:', response.status);
      return true;
    } catch (altError) {
      console.error('Failed to get CSRF token from alternative URL:', altError);
      
      // In development, we might want to continue without the CSRF token
      if (process.env.NODE_ENV === 'development') {
        console.warn('Continuing without CSRF token in development mode');
        return false;
      } else {
        throw error;
      }
    }
  }
};

// Detect if the API is available and retry with backoff
export const checkApiAvailability = async (retries = 3, delay = 1000) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(`${baseURL}health-check`, { 
        timeout: 2000,
        withCredentials: true
      });
      
      if (response.status === 200) {
        console.log('API is available:', response.data);
        return true;
      }
    } catch (error) {
      console.warn(`API check attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < retries - 1) {
        const backoffDelay = delay * Math.pow(2, attempt);
        console.log(`Retrying in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  console.error(`API unavailable after ${retries} attempts`);
  return false;
};

// Helper function to handle file downloads
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });
    
    // Create a blob URL for the file
    const blob = new Blob([response.data]);
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    
    return true;
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

/**
 * Make API requests with automatic retry functionality
 * @param {string} method - HTTP method (get, post, put, delete)
 * @param {string} url - API endpoint URL
 * @param {object} data - Request data (optional)
 * @param {object} options - Additional axios options (optional)
 * @param {number} retries - Number of retry attempts (default: 3)
 * @param {number} delay - Initial delay between retries in ms (default: 1000)
 * @returns {Promise<any>} API response
 */
export const apiRequestWithRetry = async (method, url, data = null, options = {}, retries = 3, delay = 1000) => {
  let lastError;
  
  // Ensure the options object has headers
  if (!options.headers) {
    options.headers = {};
  }
  
  // Add auth token to headers if available
  const token = localStorage.getItem('token');
  if (token && !options.headers['Authorization']) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Set content type for JSON data (if not already set and not FormData)
  if (data && !(data instanceof FormData) && !options.headers['Content-Type']) {
    options.headers['Content-Type'] = 'application/json';
  }
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      let response;
      const config = { ...options };
      
      // Make the appropriate API call based on method
      switch (method.toLowerCase()) {
        case 'get':
          response = await api.get(url, config);
          break;
        case 'post':
          response = await api.post(url, data, config);
          break;
        case 'put':
          response = await api.put(url, data, config);
          break;
        case 'delete':
          response = await api.delete(url, { ...config, data });
          break;
        case 'patch':
          response = await api.patch(url, data, config);
          break;
        default:
          throw new Error(`Invalid method: ${method}`);
      }
      
      return response;
    } catch (error) {
      console.warn(`Request attempt ${attempt + 1} failed for ${url}:`, error.message);
      lastError = error;
      
      // Don't retry if it's a client error (4xx) except for 429 (too many requests)
      if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt < retries - 1) {
        const backoffDelay = delay * Math.pow(2, attempt);
        console.log(`Retrying in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  // If we get here, all retry attempts have failed
  console.error(`Request failed after ${retries} attempts:`, url);
  throw lastError;
};

export default api;
