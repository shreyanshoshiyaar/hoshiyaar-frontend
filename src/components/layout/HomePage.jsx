// src/components/layout/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import DesktopHome from './DesktopHome';
import curriculumService from '../../services/curriculumService';
import './MobileHome.css';

const MOBILE_IMAGES = [
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778578700/img-to-link/wunxaopn4qfirxnfdwa6.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778567489/img-to-link/n9fo2moxpmfwyp04ueob.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778567487/img-to-link/zy3aaizcfjl5qwm9ewjx.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778579285/img-to-link/eqdx0kyjrhkruh0ownxd.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778578699/img-to-link/tynaqnlzmbvoaafwu3do.webp"
];

const MobileHomeCarousel = () => {
  const [mobileImages, setMobileImages] = useState([
    "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778578700/img-to-link/wunxaopn4qfirxnfdwa6.webp",
    "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778567489/img-to-link/n9fo2moxpmfwyp04ueob.webp",
    "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778567487/img-to-link/zy3aaizcfjl5qwm9ewjx.webp",
    "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778579285/img-to-link/eqdx0kyjrhkruh0ownxd.webp",
    "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778578699/img-to-link/tynaqnlzmbvoaafwu3do.webp"
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  // Fetch dynamic slides
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await curriculumService.getSetting('homepage_slides');
        if (res.data && Array.isArray(res.data.value) && res.data.value.length > 0) {
          setMobileImages(res.data.value);
        }
      } catch (err) {
        console.error('Failed to fetch homepage slides', err);
      }
    };
    fetchSlides();
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const nextIndex = (activeIndex + 1) % mobileImages.length;
        const width = scrollRef.current.offsetWidth;
        scrollRef.current.scrollTo({
          left: nextIndex * width,
          behavior: 'smooth'
        });
        setActiveIndex(nextIndex);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex, mobileImages.length]);

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
        {mobileImages.map((src, index) => (
          <div key={index} className="mobile-carousel-item relative">
            <img src={src} alt={`Slide ${index + 1}`} loading="lazy" />
            
            {/* YouTube Video in Phone Frame on 4th Slide */}
            {index === 3 && (
              <div className="absolute top-[10%] left-0 right-0 flex justify-center animate-fade-in pointer-events-none">
                <div className="relative w-[145px] max-w-[45vw] aspect-[9/19] bg-black rounded-[2.2rem] border-[4px] border-gray-900 shadow-[0_12px_30px_rgba(0,0,0,0.4)] overflow-hidden ring-1 ring-white/10 pointer-events-auto">
                  {/* Phone Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-gray-900 rounded-b-xl z-10"></div>
                  
                  <iframe 
                    className="w-full h-full scale-[1.02]"
                    src="https://www.youtube.com/embed/NlXk4BVxScI?autoplay=1&mute=1&loop=1&playlist=NlXk4BVxScI&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3" 
                    title="Hoshiyaar Social" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            {/* Get Started Button on 1st, 2nd, and 3rd images */}
            {(index === 0 || index === 1 || index === 2) && (
              <div className={`absolute ${index === 0 ? 'bottom-8' : 'bottom-14'} left-0 right-0 flex justify-center px-6`}>
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
              <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 px-6">
                <div className="flex flex-row gap-3 w-full justify-center">
                  <a 
                    href="https://www.instagram.com/hoshiyaar_club/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 max-w-[150px] py-3 bg-white rounded-2xl flex items-center justify-center gap-2 text-gray-700 font-bold uppercase tracking-wider text-[11px] shadow-xl transition-all active:scale-95 active:translate-y-1"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                      <defs>
                        <linearGradient id="ig-grad-mobile" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f09433" />
                          <stop offset="25%" stopColor="#e6683c" />
                          <stop offset="50%" stopColor="#dc2743" />
                          <stop offset="75%" stopColor="#cc2366" />
                          <stop offset="100%" stopColor="#bc1888" />
                        </linearGradient>
                      </defs>
                      <rect x="2" y="2" width="20" height="20" rx="5.5" ry="5.5" fill="url(#ig-grad-mobile)" />
                      <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="2" />
                      <circle cx="17" cy="7" r="1.2" fill="white" />
                      <rect x="2" y="2" width="20" height="20" rx="5.5" ry="5.5" fill="none" stroke="white" strokeWidth="1.2" />
                    </svg>
                    Instagram
                  </a>
                  <a 
                    href="https://www.youtube.com/@Hoshi-yaar" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 max-w-[150px] py-3 rounded-2xl flex items-center justify-center gap-2 text-white font-bold uppercase tracking-wider text-[11px] shadow-xl bg-[#FF0000] border-b-4 border-[#CC0000] transition-all active:scale-95 active:translate-y-1"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
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
        {mobileImages.map((_, index) => (
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
      <div className="hidden md:block w-full">
        <DesktopHome />
      </div>
    </>
  );
};

export default HomePage;