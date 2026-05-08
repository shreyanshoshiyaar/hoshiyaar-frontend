import React from 'react';
import loadingVideo from '../../assets/videos/Animated_Loading_Instead_of_Circle.mp4';
import heroChar from '../../assets/images/heroChar.png';

const LoadingPage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Branded Background Image */}
      <img 
        src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778249705/img-to-link/jcwmajaolrm6corrduii.webp" 
        alt="Loading Background" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Loading Text at Bottom */}
      <div className="absolute bottom-12 left-0 right-0 z-10 flex flex-col items-center justify-center">
        <div className="bg-white/40 backdrop-blur-md px-8 py-3 rounded-full border border-white/20 shadow-lg">
          <p className="text-xl font-bold text-gray-800 tracking-wider">Loading...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
