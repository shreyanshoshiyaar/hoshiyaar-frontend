import React from 'react';
import loadingVideo from '../../assets/videos/Animated_Loading_Instead_of_Circle.mp4';
import heroChar from '../../assets/images/heroChar.png';

const LoadingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
      <div className="text-center">
        <img src={heroChar} alt="Mascot" className="w-28 h-28 md:w-36 md:h-36 object-contain mx-auto mb-3" />
        <div className="flex items-center justify-center gap-3">
          <p className="text-white text-lg font-semibold">Loading...</p>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-8 h-8 md:w-10 md:h-10 object-contain"
          >
            <source src={loadingVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
