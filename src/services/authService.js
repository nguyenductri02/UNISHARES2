import api, { getCsrfToken, API_BASE_URL } from './api';
import passwordService from './passwordService';

// Cache mechanism for user data
let userDataCache = {
  data: null,
  timestamp: 0,
  loading: false,
  pendingPromise: null
};

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

class AuthService {  // Register a new user
  async register(userData) {
    try {
      // Get CSRF token before making the request
      await getCsrfToken();
      
      const response = await api.post('/auth/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Update cache
        userDataCache.data = response.data.user;
        userDataCache.timestamp = Date.now();
      }
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        // Handle validation errors (422)
        if (status === 422 && data.errors) {
          throw {
            message: data.message || 'Validation failed',
            errors: data.errors
          };
        }
        
        // Handle other server errors
        if (data.message) {
          throw { message: data.message };
        }
        
        // Generic server error
        throw { message: 'Đăng ký không thành công. Vui lòng thử lại.' };
      }
      
      // Network or other errors
      throw { message: 'Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.' };
    }
  }

  // Login user
  async login(credentials) {
    try {
      // Get CSRF token before making the request
      await getCsrfToken();
      
      console.log('Attempting login with credentials:', {
        email: credentials.email,
        password: credentials.password ? '[REDACTED]' : 'missing'
      });
      
      // Add explicit headers for the login request and ensure correct format
      const loginData = {
        email: credentials.email.trim(),
        password: credentials.password,
      };
      
      const response = await api.post('/auth/login', loginData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true
      });
      
      console.log('Login response status:', response.status);
      console.log('Login response data type:', typeof response.data);
      console.log('Login token received:', response.data && response.data.token ? 'yes' : 'no');
      
      if (response.data && response.data.token) {
        // Make sure we're storing the complete user object with roles
        const user = response.data.user;
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update cache
        userDataCache.data = user;
        userDataCache.timestamp = Date.now();
        
        // Set authorization header for subsequent requests
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        return response.data;
      } else {
        console.error('Login response missing token:', response.data);
        throw new Error('Invalid login response - missing token');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        
        // Return a user-friendly error message
        if (error.response.status === 401) {
          throw { message: 'Email hoặc mật khẩu không chính xác' };
        } else if (error.response.status === 422) {
          throw { message: 'Vui lòng nhập đúng định dạng email và mật khẩu' };
        } else if (error.response.status === 429) {
          throw { message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau ít phút.' };
        }
      }
      
      throw error.response?.data || { message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.' };
    }
  }

  // Logout user
  async logout() {
    try {
      // Get CSRF token before making the request
      await getCsrfToken();
      
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear cache
      userDataCache = {
        data: null,
        timestamp: 0,
        loading: false,
        pendingPromise: null
      };
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove local storage items even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear cache
      userDataCache = {
        data: null,
        timestamp: 0,
        loading: false,
        pendingPromise: null
      };
    }
  }
  
  // Get current user info with additional activity data
  async getCurrentUser(forceRefresh = false) {
    // If we already have a request in progress, return that promise
    if (userDataCache.loading && userDataCache.pendingPromise) {
      console.log('getCurrentUser: Returning pending promise for in-progress request');
      return userDataCache.pendingPromise;
    }
    
    // Check if we have cached data that's still valid
    const now = Date.now();
    if (!forceRefresh && 
        userDataCache.data && 
        (now - userDataCache.timestamp < CACHE_EXPIRATION)) {
      console.log('getCurrentUser: Using cached user data');
      return userDataCache.data;
    }
    
    // If we need to fetch fresh data
    try {
      console.log('getCurrentUser: Fetching fresh user data from API');
      userDataCache.loading = true;
      
      // Create a new promise for this request
      userDataCache.pendingPromise = (async () => {
        try {
          // First, try to get CSRF token to ensure cookies are set
          try {
            await getCsrfToken();
          } catch (csrfError) {
            console.warn('CSRF token fetch failed, continuing anyway:', csrfError);
          }
          
          // Add retry logic for better reliability
          let retries = 3;
          let lastError = null;
          
          for (let attempt = 0; attempt < retries; attempt++) {
            try {
              const response = await api.get('/auth/user', {
                headers: {
                  'Cache-Control': 'no-cache',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                }
              });
              
              // Update stored user data with fresh data
              if (response.data && response.data.user) {
                console.log('User data received successfully');
                
                // Ensure we have the avatar_url property in the stored user data
                const userData = {
                  ...response.data.user,
                  activity: response.data.activity || {}
                };
                
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Update cache
                userDataCache.data = userData;
                userDataCache.timestamp = Date.now();
                
                return userData;
              } else {
                console.warn('User data response format unexpected:', response.data);
                return response.data?.user || null;
              }
            } catch (err) {
              console.warn(`Attempt ${attempt + 1} failed:`, err);
              lastError = err;
              
              // Wait before retrying
              if (attempt < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
              }
            }
          }
          
          // If we've exhausted all retries, throw the last error
          console.error('All attempts to get user data failed');
          throw lastError;
        } catch (error) {
          console.error('Final getCurrentUser error:', error);
          
          // Return local data as fallback
          const localUserData = localStorage.getItem('user');
          if (localUserData) {
            try {
              const parsedUser = JSON.parse(localUserData);
              // Update cache with local data
              userDataCache.data = parsedUser;
              userDataCache.timestamp = Date.now();
              return parsedUser;
            } catch (e) {
              console.error('Error parsing local user data:', e);
            }
          }
          
          throw error.response ? error.response.data : error;
        } finally {
          userDataCache.loading = false;
          userDataCache.pendingPromise = null;
        }
      })();
      
      return await userDataCache.pendingPromise;
    } catch (error) {
      userDataCache.loading = false;
      userDataCache.pendingPromise = null;
      throw error;
    }
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!localStorage.getItem('token');
  }

  // Get user from local storage or cache
  getUser() {
    // First check cache
    if (userDataCache.data) {
      return userDataCache.data;
    }
    
    // Then check localStorage
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        // Update cache
        userDataCache.data = parsedUser;
        userDataCache.timestamp = Date.now();
        return parsedUser;
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
        return null;
      }
    }
    
    return null;
  }

  // Refresh the user's role information
  async refreshUserInfo() {
    if (!this.isLoggedIn()) {
      return null;
    }
    
    try {
      // Force refresh from API
      const userData = await this.getCurrentUser(true);
      return userData;
    } catch (error) {
      console.error('Failed to refresh user info:', error);
      return null;
    }
  }

  // Forgot password request
  async forgotPassword(email) {
    return passwordService.forgotPassword(email);
  }
  
  async resetPassword(data) {
    return passwordService.resetPassword(data);
  }
  
  // Invalidate cache (useful after profile updates)
  invalidateCache() {
    userDataCache = {
      data: null,
      timestamp: 0,
      loading: false,
      pendingPromise: null
    };
  }

  // Refresh token
  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      // Update stored tokens
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear invalid tokens
      this.logout();
      throw error;
    }
  }

  // Add method to get token for other services
  getToken() {
    return localStorage.getItem('token');
  }
}

const authService = new AuthService();

export default authService;
