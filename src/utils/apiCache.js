import cacheService from '../services/cacheService';

/**
 * Simple cache utility for API responses
 */

const apiCache = {
  // Cache storage
  cache: new Map(),
  
  // Default cache duration (5 minutes)
  defaultTTL: 5 * 60 * 1000,
  
  // Set cache entry
  set(key, data, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: Date.now()
    });
  },
  
  // Get cache entry
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  },
  
  // Check if key exists and is not expired
  has(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  },
  
  // Delete cache entry
  delete(key) {
    return this.cache.delete(key);
  },
  
  // Clear all cache
  clear() {
    this.cache.clear();
  },
  
  // Get cache size
  size() {
    return this.cache.size;
  },
  
  // Clean expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  },
  
  // Get cache stats
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }
    
    return {
      total: this.cache.size,
      valid,
      expired
    };
  }
};

/**
 * Get data from cache or fetch it and store in cache
 * 
 * @param {string} key - Unique cache key
 * @param {Function} fetchFn - Function that returns a Promise to fetch data
 * @param {Object} options - Cache options
 * @param {number} options.ttl - Time to live in milliseconds
 * @param {boolean} options.refreshIfExpired - Auto refresh if expired instead of returning null
 * @returns {Promise<any>} - Cached data or freshly fetched data
 */
export const getCachedData = async (key, fetchFn, options = {}) => {
  const { ttl = apiCache.defaultTTL, refreshIfExpired = true } = options;
  const now = Date.now();
  
  // Check if we have a valid cache entry
  if (apiCache.has(key)) {
    const { data, expiry } = apiCache.get(key);
    
    // Return cached data if not expired
    if (expiry > now) {
      console.log(`Using cached data for: ${key}`);
      return data;
    }
    
    // Cache expired
    if (!refreshIfExpired) {
      apiCache.delete(key);
      return null;
    }
  }
  
  try {
    // Fetch fresh data
    console.log(`Fetching fresh data for: ${key}`);
    const data = await fetchFn();
    
    // Store in cache
    apiCache.set(key, {
      data,
      expiry: now + ttl
    });
    
    return data;
  } catch (error) {
    console.error(`Error fetching data for ${key}:`, error);
    throw error;
  }
};

/**
 * Invalidate a specific cache entry
 * 
 * @param {string} key - Cache key to invalidate
 */
export const invalidateCache = (key) => {
  apiCache.delete(key);
};

/**
 * Clear all cache entries
 */
export const clearCache = () => {
  apiCache.clear();
};

/**
 * Creates a consistent cache key from request parameters
 * @param {string} baseKey - Base key for the request type
 * @param {Object} params - Request parameters 
 * @returns {string} Consistent cache key
 */
export const createCacheKey = (baseKey, params = {}) => {
  // If params is empty, return just the base key
  if (!params || Object.keys(params).length === 0) {
    return baseKey;
  }
  
  // Sort the params to ensure consistent key generation
  const sortedParams = {};
  Object.keys(params).sort().forEach(key => {
    sortedParams[key] = params[key];
  });
  
  // Create a deterministic string from the sorted params
  return `${baseKey}_${JSON.stringify(sortedParams)}`;
};

/**
 * Execute an API request with caching
 * @param {Function} apiCall - Function that executes the API call
 * @param {Object} options - Cache options
 * @returns {Promise<any>} API response
 */
export const cachedApiRequest = async (apiCall, options = {}) => {
  const {
    cacheKey,
    useCache = true,
    ttl = 5 * 60 * 1000, // 5 minutes default
    forceRefresh = false
  } = options;
  
  // Skip cache if not enabled or no cache key provided
  if (!useCache || !cacheKey) {
    return apiCall();
  }
  
  // Force refresh if requested
  if (forceRefresh) {
    return cacheService.refresh(cacheKey, apiCall, ttl);
  }
  
  // Use memoized function to prevent duplicate requests
  return cacheService.memoize(cacheKey, apiCall, ttl);
};

/**
 * Create an abortion controller for cancellable requests
 * @returns {Object} Controller object with signal and abort method
 */
export const createCancellableRequest = () => {
  // Check if AbortController is supported
  if (typeof AbortController === 'undefined') {
    // Fallback for browsers without AbortController
    return { 
      signal: null,
      abort: () => console.log('AbortController not supported in this environment')
    };
  }
  
  return new AbortController();
};

/**
 * Check if an error is due to request cancellation
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is from a cancelled request
 */
export const isRequestCancelled = (error) => {
  return error && error.name === 'AbortError';
};

export default apiCache;
