/**
 * Database schema compatibility helper functions
 * 
 * These functions help handle database schema mismatches between
 * frontend expectations and backend structure
 */

// Known schema mappings for compatibility
const COLUMN_MAPPINGS = {
  // Old column name => New column name
  'is_private': 'requires_approval',
};

/**
 * Convert an object's properties to use the current database schema
 * @param {Object} data - The data object to convert
 * @returns {Object} - The converted object
 */
export const convertToCurrentSchema = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const result = { ...data };
  
  // Apply known mappings
  Object.entries(COLUMN_MAPPINGS).forEach(([oldColumn, newColumn]) => {
    if (result[oldColumn] !== undefined) {
      result[newColumn] = result[oldColumn];
      delete result[oldColumn];
    }
  });
  
  return result;
};

/**
 * Convert an API parameters object to use the current database schema
 * @param {Object} params - The API parameters to convert
 * @returns {Object} - The converted parameters
 */
export const convertParamsToCurrentSchema = (params) => {
  return convertToCurrentSchema(params);
};

/**
 * Convert an array of objects to use the current database schema
 * @param {Array} items - The array of objects to convert
 * @returns {Array} - The converted array
 */
export const convertArrayToCurrentSchema = (items) => {
  if (!Array.isArray(items)) {
    return items;
  }
  
  return items.map(item => convertToCurrentSchema(item));
};

/**
 * Handle database exceptions and provide alternative actions
 * @param {Error} error - The error object
 * @param {Function} retryCallback - Callback to retry with adjusted parameters
 * @returns {Promise} - Result of the retry or the original error
 */
export const handleDatabaseException = async (error, retryCallback) => {
  // Check if it's a column not found error
  if (error.response?.data?.message?.includes('Column not found')) {
    const columnMatch = error.response.data.message.match(/Unknown column '([^']+)'/);
    const missingColumn = columnMatch ? columnMatch[1] : null;
    
    if (missingColumn && COLUMN_MAPPINGS[missingColumn]) {
      console.log(`Handling schema mismatch for column: ${missingColumn}`);
      
      if (typeof retryCallback === 'function') {
        return await retryCallback(missingColumn, COLUMN_MAPPINGS[missingColumn]);
      }
    }
  }
  
  // If we can't handle it, rethrow the original error
  throw error;
};

export default {
  convertToCurrentSchema,
  convertParamsToCurrentSchema,
  convertArrayToCurrentSchema,
  handleDatabaseException,
};
