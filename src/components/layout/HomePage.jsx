// src/components/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import Hero from '../features/Hero';
import FinalCTA from '../features/FinalCTA';
import './MobileHome.css';

const MOBILE_IMAGES = [
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778501894/img-to-link/jxgsfgijtnqpchzmhwks.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778501893/img-to-link/a8501on6wrk1m2sny84l.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778501890/img-to-link/cy8osmbtw0d51cbfndq7.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778501892/img-to-link/i15bjyct55swzjqsfnjt.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778501892/img-to-link/yrrt0hswxjdol62umifx.webp"
];

const MobileHomeCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollPosition = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      const index = Math.round(scrollPosition / width);
      setActiveIndex(index);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="mobile-carousel-container no-scrollbar"
      >
        {MOBILE_IMAGES.map((src, index) => (
          <div key={index} className="mobile-carousel-item">
            <img src={src} alt={`Slide ${index + 1}`} loading="lazy" />
          </div>
        ))}
      </div>
      
      {/* Dot Navigation */}
      <div className="dot-navigation">
        {MOBILE_IMAGES.map((_, index) => (
          <div 
            key={index} 
            className={`dot ${activeIndex === index ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

const HomePage = () => (
  <>
    {/* Mobile View */}
    <div className="block md:hidden">
      <MobileHomeCarousel />
    </div>

    {/* Desktop View */}
    <div className="hidden md:block">
      <Hero />
      <FinalCTA />
    </div>
  </>
);

export default HomePage;