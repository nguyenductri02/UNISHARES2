/**
 * Simple in-memory cache service with localStorage persistence
 */
const cacheService = {
  cache: {},
  
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or null if not found or expired
   */
  get: (key) => {
    // Try to get from memory cache first
    const item = cacheService.cache[key];
    
    if (item && item.expiry > Date.now()) {
      return item.value;
    }
    
    // If not in memory or expired, try localStorage
    try {
      const storedItem = localStorage.getItem(`cache_${key}`);
      
      if (storedItem) {
        const parsedItem = JSON.parse(storedItem);
        
        if (parsedItem.expiry > Date.now()) {
          // Update memory cache
          cacheService.cache[key] = parsedItem;
          return parsedItem.value;
        } else {
          // Remove expired item
          localStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (error) {
      console.error('Error retrieving from cache:', error);
    }
    
    return null;
  },
  
  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set: (key, value, ttl = 5 * 60 * 1000) => {
    const item = {
      value,
      expiry: Date.now() + ttl
    };
    
    // Set in memory cache
    cacheService.cache[key] = item;
    
    // Also persist to localStorage if possible
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Error setting cache in localStorage:', error);
    }
  },
  
  /**
   * Remove a value from cache
   * @param {string} key - Cache key
   */
  remove: (key) => {
    // Remove from memory cache
    delete cacheService.cache[key];
    
    // Also remove from localStorage
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.error('Error removing from cache:', error);
    }
  },
    /**
   * Remove all values from cache that match a pattern
   * @param {string} pattern - Pattern to match against cache keys
   */
  removeByPattern: (pattern) => {
    // Remove from memory cache
    Object.keys(cacheService.cache).forEach(key => {
      if (key.includes(pattern)) {
        delete cacheService.cache[key];
      }
    });
    
    // Also remove from localStorage
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_') && key.includes(pattern)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error removing pattern from cache:', error);
    }
  },

  /**
   * Alias for removeByPattern for backward compatibility
   * @param {string} pattern - Pattern to match against cache keys
   */
  clearByPattern: (pattern) => {
    return cacheService.removeByPattern(pattern);
  },
  
  /**
   * Clear all cache
   */
  clear: () => {
    // Clear memory cache
    cacheService.cache = {};
    
    // Also clear localStorage cache items
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },
  
  /**
   * Memoize a function call with caching
   * @param {string} key - Cache key
   * @param {Function} fn - Function to memoize
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<any>} Result of the function call
   */
  memoize: async (key, fn, ttl = 5 * 60 * 1000) => {
    const cachedResult = cacheService.get(key);
    
    if (cachedResult !== null) {
      return cachedResult;
    }
    
    const result = await fn();
    cacheService.set(key, result, ttl);
    return result;
  }
};

export default cacheService;