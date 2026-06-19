// src/components/layout/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import DesktopHome from './DesktopHome';
import curriculumService from '../../services/curriculumService';
import './MobileHome.css';

const MOBILE_IMAGES = [
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1781776052/img-to-link/jzjm9p3tfjfaca4sqgey.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778567489/img-to-link/n9fo2moxpmfwyp04ueob.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778567487/img-to-link/zy3aaizcfjl5qwm9ewjx.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778579285/img-to-link/eqdx0kyjrhkruh0ownxd.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778578699/img-to-link/tynaqnlzmbvoaafwu3do.webp",
  "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778578699/img-to-link/tynaqnlzmbvoaafwu3do.webp"
];

const MobileHomeCarousel = () => {
  const [mobileImages, setMobileImages] = useState([
    "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1781776052/img-to-link/jzjm9p3tfjfaca4sqgey.webp",
    "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778567489/img-to-link/n9fo2moxpmfwyp04ueob.webp",
    "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778567487/img-to-link/zy3aaizcfjl5qwm9ewjx.webp",
    "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778579285/img-to-link/eqdx0kyjrhkruh0ownxd.webp",
    "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778578699/img-to-link/tynaqnlzmbvoaafwu3do.webp",
    "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778578699/img-to-link/tynaqnlzmbvoaafwu3do.webp"
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  // Custom Video Controls
  const mobileVideoIframeRef = useRef(null);
  const [isMobileVideoMuted, setIsMobileVideoMuted] = useState(true);
  const [isMobileVideoPlaying, setIsMobileVideoPlaying] = useState(true);

  const toggleMobileVideoMute = (e) => {
    e.stopPropagation();
    const newMuted = !isMobileVideoMuted;
    setIsMobileVideoMuted(newMuted);
    if (mobileVideoIframeRef.current) {
      mobileVideoIframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: newMuted ? "mute" : "unMute", args: [] }),
        "*"
      );
    }
  };

  const toggleMobileVideoPlay = (e) => {
    e.stopPropagation();
    const newPlaying = !isMobileVideoPlaying;
    setIsMobileVideoPlaying(newPlaying);
    if (mobileVideoIframeRef.current) {
      mobileVideoIframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: newPlaying ? "playVideo" : "pauseVideo", args: [] }),
        "*"
      );
    }
  };

  // Fetch dynamic slides
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await curriculumService.getSetting('homepage_slides');
        if (res.data && Array.isArray(res.data.value) && res.data.value.length > 0) {
          let slides = [...res.data.value];
          while (slides.length < 6) slides.push(slides[slides.length - 1] || '');
          setMobileImages(slides);
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
                    ref={mobileVideoIframeRef}
                    className="w-full h-full scale-[1.02] z-0 pointer-events-none"
                    src="https://www.youtube.com/embed/NlXk4BVxScI?autoplay=1&mute=1&loop=1&playlist=NlXk4BVxScI&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1" 
                    title="Hoshiyaar Social" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>

                  {/* Custom Controls Overlay */}
                  <div className="absolute inset-0 z-10 flex flex-col justify-end p-2 pointer-events-none">
                     <div className="flex justify-between items-center bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 pointer-events-auto shadow-md border border-white/10">
                        <button 
                          onClick={toggleMobileVideoPlay} 
                          className="text-white text-lg hover:scale-110 transition-transform flex items-center justify-center w-6 h-6"
                        >
                           {isMobileVideoPlaying ? '⏸' : '▶'}
                        </button>
                        <button 
                          onClick={toggleMobileVideoMute} 
                          className="text-white text-lg hover:scale-110 transition-transform flex items-center justify-center w-6 h-6"
                        >
                           {isMobileVideoMuted ? '🔇' : '🔊'}
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Get Started UI for 1st slide */}
            {index === 0 && (
              <div className="absolute bottom-[8%] left-0 right-0 flex flex-col items-center justify-center px-4 z-10 w-full">
                {/* Huge Button */}
                <button 
                  onClick={() => navigate('/signup')}
                  className="relative w-full max-w-sm rounded-full bg-white p-[4px] shadow-[0_0_30px_rgba(255,255,255,0.6)] active:scale-95 transition-transform"
                >
                  <div className="bg-gradient-to-b from-[#FFDF00] via-[#FFB300] to-[#FF8C00] rounded-full py-3 px-2 flex items-center justify-center gap-2 border-b-[5px] border-[#E65100]">
                    <span className="text-4xl drop-shadow-md transform -rotate-12">🚀</span>
                    <span 
                      className="text-[32px] font-black text-white tracking-widest uppercase leading-none mt-1"
                      style={{
                        WebkitTextStroke: '2px #3B0764',
                        textShadow: '0px 4px 0px #3B0764',
                        fontFamily: "'Poppins', sans-serif"
                      }}
                    >
                      GET STARTED
                    </span>
                  </div>
                </button>

                {/* Pill Container */}
                <div className="flex items-center justify-between w-full max-w-sm bg-white rounded-full py-2 px-4 shadow-lg mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center text-[16px] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]">🧠</div>
                    <div className="flex flex-col leading-[1.1]">
                      <span className="text-[#3B82F6] font-black text-[11px]">Super</span>
                      <span className="text-[#3B82F6] font-black text-[11px]">Simple</span>
                    </div>
                  </div>
                  
                  <div className="w-px h-6 bg-gray-200"></div>
                  
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-[#EC4899] flex items-center justify-center text-[16px] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]">⭐</div>
                    <div className="flex flex-col leading-[1.1]">
                      <span className="text-[#EC4899] font-black text-[11px]">Super</span>
                      <span className="text-[#EC4899] font-black text-[11px]">Fun</span>
                    </div>
                  </div>
                  
                  <div className="w-px h-6 bg-gray-200"></div>
                  
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center text-[16px] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]">🏆</div>
                    <div className="flex flex-col leading-[1.1]">
                      <span className="text-[#8B5CF6] font-black text-[11px]">Super</span>
                      <span className="text-[#8B5CF6] font-black text-[11px]">Memorable</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Normal Get Started Button on 2nd and 3rd slides */}
            {(index === 1 || index === 2) && (
              <div className="absolute bottom-14 left-0 right-0 flex justify-center px-6 z-10">
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
              <div className="absolute bottom-[calc(1.5rem+3vh)] left-0 right-0 flex flex-col items-center gap-2 px-6">
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

            {/* Contact Us on 6th slide */}
            {index === 5 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10 w-full pt-10 pb-16 bg-[#FDF4FF] overflow-hidden">
                
                {/* Decorative background stars */}
                <div className="absolute top-10 left-10 text-yellow-300 text-3xl animate-pulse">✨</div>
                <div className="absolute bottom-40 right-10 text-pink-300 text-4xl animate-bounce" style={{animationDuration: '3s'}}>⭐</div>
                <div className="absolute top-40 right-8 text-blue-300 text-2xl animate-pulse" style={{animationDuration: '2.5s'}}>✨</div>

                <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-sm animate-fade-in-up relative z-20">
                  
                  {/* Hoshi Character */}
                  <div className="w-[200px] -mt-8 mb-[-15px] mx-auto drop-shadow-2xl z-30 relative">
                    <img 
                      src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1781765430/img-to-link/bl4qst643oasldck6fqw.webp" 
                      alt="Hoshi" 
                      className="w-full h-auto object-contain"
                    />
                  </div>

                  {/* Huge Colorful Text */}
                  <div className="flex flex-col items-center justify-center w-full mb-8 font-['Fredoka']">
                    <span 
                      className="text-[48px] font-black uppercase text-[#5B21B6] leading-none transform -rotate-2"
                      style={{
                        WebkitTextStroke: '8px white', 
                        paintOrder: 'stroke fill',
                        textShadow: '0 8px 15px rgba(0,0,0,0.1)'
                      }}
                    >
                      FACING ANY
                    </span>
                    <span 
                      className="text-[64px] font-black uppercase text-[#EC4899] leading-none transform rotate-2 z-10 mt-1"
                      style={{
                        WebkitTextStroke: '10px white', 
                        paintOrder: 'stroke fill',
                        textShadow: '0 8px 15px rgba(0,0,0,0.1)'
                      }}
                    >
                      ISSUES?
                    </span>
                    <span 
                      className="text-[32px] font-black uppercase text-[#3B82F6] leading-none mt-2 transform -rotate-1"
                      style={{
                        WebkitTextStroke: '6px white', 
                        paintOrder: 'stroke fill',
                        textShadow: '0 8px 15px rgba(0,0,0,0.1)'
                      }}
                    >
                      WE'RE HERE!
                    </span>
                  </div>
                  
                  <p className="text-[16px] font-bold text-[#4B5563] leading-relaxed mb-10 font-['Nunito'] px-2">
                    Don't worry! We are here to make everything <span className="text-[#5B21B6]">super smooth</span> and <span className="text-[#EC4899]">super easy</span> for you!
                  </p>
                  
                  <button 
                    onClick={() => navigate('/contact')}
                    className="w-[85%] bg-[#1e65fa] text-white rounded-full py-4 px-6 flex items-center justify-center font-black text-[24px] uppercase tracking-widest shadow-2xl active:scale-95 border-b-[5px] border-[#0d47b5] hover:bg-blue-500 transition-all font-['Poppins']"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 mr-3 shrink-0">
                      <path d="M12 2.5c-5.5 0-10 3.8-10 8.5 0 2.8 1.6 5.3 4 6.9-.2.8-.7 2.2-1.6 3.4-.1.2-.1.4 0 .6.1.2.3.3.5.3 2.4 0 4.6-1 6-2.4.7.1 1.4.2 2.1.2 5.5 0 10-3.8 10-8.5S17.5 2.5 12 2.5zm3 9.5H9c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5h6c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5z"/>
                    </svg>
                    CONTACT US
                  </button>
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