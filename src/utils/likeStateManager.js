/**
 * A utility for managing like state to prevent state inconsistencies
 */
const likeStateManager = {
  /**
   * Store the like state for a specific content item
   * @param {string} type - The content type (e.g., 'post', 'comment')
   * @param {number} id - The content ID
   * @param {boolean} isLiked - Whether the item is liked
   */
  setLikeState: (type, id, isLiked) => {
    try {
      // Get existing like state from localStorage
      const likeStateJSON = localStorage.getItem('likeState');
      const likeState = likeStateJSON ? JSON.parse(likeStateJSON) : {};
      
      // Update like state for this specific item
      if (!likeState[type]) {
        likeState[type] = {};
      }
      
      likeState[type][id] = isLiked;
      
      // Save back to localStorage
      localStorage.setItem('likeState', JSON.stringify(likeState));
    } catch (error) {
      console.error('Error saving like state:', error);
    }
  },
  
  /**
   * Get the stored like state for a specific content item
   * @param {string} type - The content type (e.g., 'post', 'comment')
   * @param {number} id - The content ID
   * @returns {boolean|null} The like state, or null if not stored
   */
  getLikeState: (type, id) => {
    try {
      const likeStateJSON = localStorage.getItem('likeState');
      if (!likeStateJSON) return null;
      
      const likeState = JSON.parse(likeStateJSON);
      
      if (!likeState[type] || likeState[type][id] === undefined) {
        return null;
      }
      
      return likeState[type][id];
    } catch (error) {
      console.error('Error getting like state:', error);
      return null;
    }
  },
  
  /**
   * Clear the like state for a specific content item
   * @param {string} type - The content type (e.g., 'post', 'comment')
   * @param {number} id - The content ID
   */
  clearLikeState: (type, id) => {
    try {
      const likeStateJSON = localStorage.getItem('likeState');
      if (!likeStateJSON) return;
      
      const likeState = JSON.parse(likeStateJSON);
      
      if (likeState[type] && likeState[type][id] !== undefined) {
        delete likeState[type][id];
        localStorage.setItem('likeState', JSON.stringify(likeState));
      }
    } catch (error) {
      console.error('Error clearing like state:', error);
    }
  }
};

export default likeStateManager;
