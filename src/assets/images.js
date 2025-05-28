// This file will serve as a central location for all image imports
// Replace with actual image imports when you add the images

// Common images
export const logo = require('./unishare-logo.png');
export const userAvatar = require('./avatar-1.png');

// Placeholder for images you'll add later
export const unishareBackgroundImage = '/images/unishare-bg.png'; // Will be replaced with actual import

// Course thumbnails (to be added)
export const courseThumbnails = {
  react: '/images/course-react.png',
  javascript: '/images/course-javascript.png',
  webdev: '/images/course-webdev.png',
  // Add more as needed
};

// Teacher avatars (to be added)
export const teacherAvatars = {
  phamHong: '/images/teacher-pham-hong.png',
  // Add more as needed
};

// Helper function to get an image or fallback to placeholder
export const getImageOrPlaceholder = (imagePath, fallback) => {
  try {
    return require(imagePath);
  } catch (e) {
    return fallback || require('./placeholder.js').placeholderImage;
  }
};
