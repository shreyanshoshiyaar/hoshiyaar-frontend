// src/components/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
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
  const navigate = useNavigate();

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
          <div key={index} className="mobile-carousel-item relative">
            <img src={src} alt={`Slide ${index + 1}`} loading="lazy" />
            
            {/* Get Started Button only on first image */}
            {index === 0 && (
              <div className="absolute bottom-14 left-0 right-0 flex justify-center px-6">
                <button 
                  onClick={() => navigate('/signup')}
                  className="w-full max-w-sm bg-duo-blue text-white font-bold uppercase tracking-wider py-4 rounded-2xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition-all text-base shadow-xl"
                >
                  Get Started
                </button>
              </div>
            )}
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

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect logged in users to dashboard
  useEffect(() => {
    if (user) {
      navigate('/learn');
    }
  }, [user, navigate]);

  // Force no vertical scroll on mobile home
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.height = '100dvh';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      document.body.style.height = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    };
  }, []);

  return (
    <>
      {/* Mobile View */}
      <div className="block md:hidden overflow-hidden h-screen bg-black fixed inset-0 z-0">
        <MobileHomeCarousel />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <Hero />
        <FinalCTA />
      </div>
    </>
  );
};

export default HomePage;