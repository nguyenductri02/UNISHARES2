import React from 'react';
// Make sure these imports are correct and components exist
import Header from '../components/Header';
import Footer from '../components/Footer';

// Import the homepage components
import HeroSection from '../components/homepage/HeroSection';
import TestimonialsSection from '../components/homepage/TestimonialsSection';
import DocumentsSection from '../components/homepage/DocumentsSection';
import CoursesSection from '../components/homepage/CoursesSection';
import BlogSection from '../components/homepage/BlogSection';
import FeaturesSection from '../components/homepage/FeaturesSection';

const HomePage = () => {
  return (
    <div className="homepage">
      <Header />
      
      <HeroSection />
      
      <FeaturesSection />
      
      <CoursesSection contentType="popular" />
      
      <DocumentsSection contentType="free" />
      
      <TestimonialsSection contentType="featured" />
      
      <BlogSection contentType="recent" />
      
      <Footer />
    </div>
  );
};

export default HomePage;
