// src/components/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Hero from '../features/Hero';
import FinalCTA from '../features/FinalCTA';
import './MobileHome.css';

const MOBILE_IMAGES = [
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778578700/img-to-link/wunxaopn4qfirxnfdwa6.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778567489/img-to-link/n9fo2moxpmfwyp04ueob.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778567487/img-to-link/zy3aaizcfjl5qwm9ewjx.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778567485/img-to-link/iogmnil6kadduvgx62tn.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778578699/img-to-link/tynaqnlzmbvoaafwu3do.webp"
];

const MobileHomeCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const nextIndex = (activeIndex + 1) % MOBILE_IMAGES.length;
        const width = scrollRef.current.offsetWidth;
        scrollRef.current.scrollTo({
          left: nextIndex * width,
          behavior: 'smooth'
        });
        setActiveIndex(nextIndex);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollPosition = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      const index = Math.round(scrollPosition / width);
      setActiveIndex(index);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="mobile-carousel-container no-scrollbar"
      >
        {MOBILE_IMAGES.map((src, index) => (
          <div key={index} className="mobile-carousel-item relative">
            <img src={src} alt={`Slide ${index + 1}`} loading="lazy" />
            
            {/* Get Started Button on 1st, 2nd, and 3rd images */}
            {(index === 0 || index === 1 || index === 2) && (
              <div className="absolute bottom-14 left-0 right-0 flex justify-center px-6">
                <button 
                  onClick={() => navigate('/signup')}
                  className="w-full max-w-sm bg-duo-blue text-white font-bold uppercase tracking-wider py-4 rounded-2xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition-all text-base shadow-xl"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Social Buttons on 4th and 5th images */}
            {(index === 3 || index === 4) && (
              <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-3 px-6">
                <div className="flex flex-row gap-3 w-full justify-center">
                  <a 
                    href="https://www.instagram.com/hoshiyaar_club/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 max-w-[150px] py-3 rounded-2xl flex items-center justify-center gap-2 text-white font-bold uppercase tracking-wider text-[10px] shadow-xl transition-all active:scale-95 active:translate-y-1"
                    style={{ background: 'linear-gradient(45deg, #f09433 0%, #dc2743 50%, #bc1888 100%)' }}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.333 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.169a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" /></svg>
                    Instagram
                  </a>
                  <a 
                    href="https://www.youtube.com/@Hoshi-yaar" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 max-w-[150px] py-3 rounded-2xl flex items-center justify-center gap-2 text-white font-bold uppercase tracking-wider text-[10px] shadow-xl bg-[#FF0000] border-b-4 border-[#CC0000] transition-all active:scale-95 active:translate-y-1"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                    YouTube
                  </a>
                </div>
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