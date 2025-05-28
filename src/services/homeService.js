import api from './api';

const homeService = {
  // Get popular courses for the homepage
  getPopularCourses: async () => {
    try {
      const response = await api.get('/home/popular-courses');
      // Process the image paths to ensure they're absolute URLs
      const courses = response.data.data.map(course => ({
        ...course,
        thumbnail: course.thumbnail || '/images/course-placeholder.jpg'
      }));
      return courses;
    } catch (error) {
      console.error('Error fetching popular courses:', error);
      throw error;
    }
  },

  // Get free documents for the homepage
  getFreeDocuments: async () => {
    try {
      const response = await api.get('/home/free-documents');
      // Process the image paths to ensure they're absolute URLs
      const documents = response.data.data.map(doc => ({
        ...doc,
        thumbnail: doc.thumbnail || '/images/document-placeholder.jpg'
      }));
      return documents;
    } catch (error) {
      console.error('Error fetching free documents:', error);
      throw error;
    }
  },

  // Get recent blog posts for the homepage
  getRecentBlogPosts: async () => {
    try {
      const response = await api.get('/home/recent-posts');
      // Process the image paths to ensure they're absolute URLs
      const posts = response.data.data.map(post => ({
        ...post,
        thumbnail: post.thumbnail || '/images/blog-placeholder.jpg'
      }));
      return posts;
    } catch (error) {
      console.error('Error fetching recent blog posts:', error);
      throw error;
    }
  },

  // Get platform statistics for the homepage
  getPlatformStats: async () => {
    try {
      const response = await api.get('/home/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      // Return default values if API fails
      return {
        users: 5000,
        courses: 120,
        documents: 3500,
        completions: 12500
      };
    }
  },

  // Get study groups for the homepage
  getStudyGroups: async () => {
    try {
      const response = await api.get('/home/study-groups');
      // Process the image paths to ensure they're absolute URLs
      const groups = response.data.data.map(group => ({
        ...group,
        thumbnail: group.thumbnail || '/images/group-placeholder.jpg'
      }));
      return groups;
    } catch (error) {
      console.error('Error fetching study groups:', error);
      throw error;
    }
  },

  // Search for content across the platform
  searchContent: async (query, options = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      if (options.category) {
        params.append('category', options.category);
      }
      
      if (options.sort) {
        params.append('sort', options.sort);
      }
      
      if (options.type) {
        params.append('type', options.type);
      }
      
      const response = await api.get(`/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching content:', error);
      throw error;
    }
  }
};

export default homeService;
