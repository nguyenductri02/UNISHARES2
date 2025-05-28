/**
 * Utility functions for checking user roles
 */

/**
 * Check if a user has a specific role
 * @param {Object} user - The user object
 * @param {String} roleName - The role name to check (case insensitive)
 * @returns {Boolean} - True if the user has the role
 */
export const hasRole = (user, roleName) => {
  if (!user || !user.roles) {
    return false;
  }
  
  // Handle both array and single role objects
  const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
  
  return roles.some(role => {
    // Role can be a string or an object with a name property
    const roleValue = typeof role === 'string' ? role : (role.name || '');
    return roleValue.toLowerCase() === roleName.toLowerCase();
  });
};

/**
 * Check if user has admin role
 * @param {Object} user - The user object with roles array
 * @returns {Boolean} true if user has admin role
 */
export const isAdmin = (user) => {
  return hasRole(user, 'admin');
};

/**
 * Check if user has moderator role
 * @param {Object} user - The user object with roles array
 * @returns {Boolean} true if user has moderator role
 */
export const isModerator = (user) => {
  return hasRole(user, 'moderator');
};

/**
 * Check if the user is a lecturer
 * @param {Object} user - The user object
 * @returns {Boolean} - True if the user is a lecturer
 */
export const isLecturer = (user) => {
  return hasRole(user, 'lecturer');
};

/**
 * Check if the user is a student
 * @param {Object} user - The user object
 * @returns {Boolean} - True if the user is a student
 */
export const isStudent = (user) => {
  return hasRole(user, 'student');
};

/**
 * Check if user has any of the specified roles
 * @param {Object} user - The user object
 * @param {Array} roles - Array of role names to check
 * @returns {Boolean} - True if user has any of the roles
 */
export const hasAnyRole = (user, roles) => {
  if (!user || !user.roles || !Array.isArray(roles)) {
    return false;
  }
  
  return roles.some(role => hasRole(user, role));
};

/**
 * Check if user has permission to create groups
 * @param {Object} user - The user object
 * @returns {Boolean} - True if user can create groups
 */
export const canCreateGroups = (user) => {
  // These roles always have permission to create groups
  if (isAdmin(user) || isModerator(user) || isLecturer(user)) {
    return true;
  }
  
  // Check explicit permissions
  if (user && user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes('create group');
  }
  
  return false;
};

/**
 * Determine redirect path based on user role
 * @param {Object} user - The user object with roles
 * @returns {String} The path to redirect to
 */
export const getRedirectPathForUser = (user) => {
  if (!user) {
    return '/login';
  }
  
  // First, check for admin role - only admins go to admin dashboard
  if (isAdmin(user)) {
    return '/admin/dashboard';
  }
  
  // Second, check for moderator role - only moderators go to moderator dashboard
  if (isModerator(user)) {
    return '/moderator/dashboard';
  }
  
  // For lecturers and students, redirect to home page
  // (Previously lecturers were redirected to /teacher/dashboard)
  return '/';
};
