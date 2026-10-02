// src/components/layout/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import curriculumService from '../../services/curriculumService';
import DesktopHome from './DesktopHome';

const HoshiyaarLogo = "https://res.cloudinary.com/w7rytq0k/image/upload/v1785322514/img-to-link/bihseec7aigbmau4amnd.png";

const MobileWelcomeScreen = () => {
  const navigate = useNavigate();
  const [onboardingVideoUrl, setOnboardingVideoUrl] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    const fetchOnboardingVideo = async () => {
      try {
        const res = await curriculumService.getSetting('onboarding_video_url');
        if (res?.data?.value && typeof res.data.value === 'string') {
          setOnboardingVideoUrl(res.data.value.trim());
        }
      } catch (err) {
        console.error('Error fetching onboarding video URL:', err);
      }
    };
    fetchOnboardingVideo();
  }, []);

  const normalizeYoutubeEmbed = (url) => {
    if (!url) return '';
    let normalized = url.trim();
    let embedUrl = normalized;
    if (normalized.includes('/shorts/')) {
      const videoId = normalized.split('/shorts/')[1].split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (normalized.includes('watch?v=')) {
      const videoId = normalized.split('watch?v=')[1].split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (normalized.includes('youtu.be/')) {
      const videoId = normalized.split('youtu.be/')[1].split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    return embedUrl.includes('?') ? `${embedUrl}&autoplay=1` : `${embedUrl}?autoplay=1`;
  };

  const handleWhatsAppClick = (e) => {
    if (e) e.preventDefault();
    if (onboardingVideoUrl && onboardingVideoUrl.trim() !== '') {
      setShowVideoModal(true);
    } else {
      window.open('https://wa.me/918310532323?text=Hi!%20I%20have%20a%20question%20about%20Hoshiyaar', '_blank');
    }
  };

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] bg-gradient-to-b from-[#CBE3FB] via-[#DFEFFF] to-[#EEF7FE] overflow-hidden select-none touch-none overscroll-none flex flex-col justify-center items-center px-4 py-2 xs:py-3">
      
      {/* Decorative Science Atom Doodle (Top-right) */}
      <svg 
        className="absolute top-3 right-3 w-12 h-12 text-sky-400/40 pointer-events-none transform rotate-12" 
        viewBox="0 0 100 100" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5"
      >
        <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(30 50 50)" />
        <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(-30 50 50)" />
        <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(90 50 50)" />
        <circle cx="50" cy="50" r="4.5" fill="currentColor" />
      </svg>

      {/* Floating 3D/Cute Star accents */}
      <span className="absolute top-10 left-4 text-amber-400 text-lg pointer-events-none drop-shadow-xs animate-pulse select-none">⭐</span>
      <span className="absolute top-16 right-5 text-amber-300 text-sm pointer-events-none select-none">✨</span>

      {/* STRICTLY VERTICALLY CENTERED MAIN CONTENT CONTAINER */}
      <div className="w-full max-w-[375px] mx-auto flex flex-col items-center justify-center my-auto z-10 gap-2.5 xs:gap-3">
        
        {/* Brand Logo */}
        <img 
          src={HoshiyaarLogo} 
          alt="HoshiYaar Logo" 
          className="h-12 xs:h-13 sm:h-14 w-auto object-contain drop-shadow-xs" 
        />

        {/* Headline with Sunburst Rays */}
        <div className="relative text-center">
          <span className="absolute -left-3 top-1 text-amber-400 text-xs font-bold">˗ˏˋ</span>
          <span className="absolute -right-3 top-5 text-amber-400 text-xs font-bold">ˎˊ˗</span>
          
          <h1 className="text-[34px] xs:text-[38px] sm:text-[42px] font-black tracking-tight leading-[1.06] text-center font-sans">
            <span className="text-[#102A43] block">Learn daily,</span>
            <span className="text-[#7C3AED] block mt-0.5">Shine brightly!</span>
          </h1>
        </div>

        {/* Hero Row: Left 4 Badges + Right Mascot */}
        <div className="w-full flex items-end justify-between gap-1 -mb-2.5 z-20">
          {/* 4 Circular Badges with Larger Labels */}
          <div className="flex flex-col gap-2.5 pb-2.5 flex-1 max-w-[215px]">
            {/* Badge 1: For CBSE Class 6-8 */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-300/80 flex items-center justify-center shrink-0 shadow-xs">
                <span className="text-base">🎓</span>
              </div>
              <span className="text-[15px] xs:text-[16px] font-black text-[#102A43] leading-snug">
                For CBSE Class 6–8
              </span>
            </div>

            {/* Badge 2: Learn. Play. Explore. */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300/80 flex items-center justify-center shrink-0 shadow-xs">
                <span className="text-base">📖</span>
              </div>
              <span className="text-[15px] xs:text-[16px] font-black text-[#102A43] leading-snug">
                Learn. Play. Explore.
              </span>
            </div>

            {/* Badge 3: Stories, Videos & Quizzes */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-pink-100 border border-pink-300/80 flex items-center justify-center shrink-0 shadow-xs">
                <span className="text-base">🎬</span>
              </div>
              <span className="text-[15px] xs:text-[16px] font-black text-[#102A43] leading-snug">
                Stories, Videos &amp; Quizzes
              </span>
            </div>

            {/* Badge 4: Practice, Progress & Earn XP */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300/80 flex items-center justify-center shrink-0 shadow-xs">
                <span className="text-base">🏆</span>
              </div>
              <span className="text-[15px] xs:text-[16px] font-black text-[#102A43] leading-snug">
                Practice, Progress &amp; Earn XP
              </span>
            </div>
          </div>

          {/* Mascot — bigger */}
          <div className="relative shrink-0 flex items-end justify-center pr-1 -mr-2">
            <img 
              src="https://res.cloudinary.com/fhscvc7p/image/upload/v1790922377/img-to-link/yiua95vucvhqg1zlfb5d.webp" 
              alt="Hoshi Mascot" 
              className="w-[148px] xs:w-[162px] sm:w-[175px] h-[175px] xs:h-[192px] sm:h-[208px] object-contain drop-shadow-[0_12px_24px_rgba(30,58,138,0.18)] pointer-events-none" 
            />
          </div>
        </div>

        {/* Primary CTA: Log in / Sign up */}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full h-12 xs:h-13 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] active:scale-[0.98] text-white font-bold text-[17px] xs:text-[18px] shadow-[0_8px_20px_rgba(37,99,235,0.32)] transition-all flex items-center justify-center gap-3 border-b-2 border-blue-900 cursor-pointer z-10"
        >
          <svg className="w-5 h-5 stroke-white fill-none stroke-2 shrink-0" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="h-4.5 w-px bg-white/35" />
          <span className="tracking-wide">Log in / Sign up</span>
          <span className="text-lg leading-none">→</span>
        </button>

        {/* Footer Accent Tagline with Small Stars */}
        <div className="w-full flex items-center justify-between px-2 pt-0.5">
          <span className="text-amber-400 text-xs">⭐</span>
          <div className="relative inline-block text-center">
            <span className="absolute -left-3 -top-0.5 text-sky-500 font-bold text-[10px] select-none">˗ˏˋ</span>
            <p className="text-[14px] xs:text-[15px] font-black text-[#1E3A8A] leading-tight tracking-tight">
              No ratta. Pure curiosity.
            </p>
            <svg className="w-20 xs:w-22 h-1.5 mx-auto text-sky-400 mt-0.5" viewBox="0 0 100 12" fill="none">
              <path d="M6 4 Q 50 14 94 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-amber-400 text-xs">⭐</span>
        </div>

      </div>

      {/* WhatsApp Support Button — fixed at the very bottom */}
      <div className="absolute bottom-4 left-0 right-0 px-5 z-20">
        <button
          type="button"
          onClick={handleWhatsAppClick}
          className="w-full h-12 xs:h-13 px-4 rounded-2xl bg-white hover:bg-slate-50/90 active:scale-[0.98] border border-blue-200/90 text-slate-800 shadow-[0_4px_20px_rgba(37,99,235,0.12)] transition-all flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0 shadow-xs">
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
            <span className="h-5 w-px bg-slate-200" />
            <div className="flex flex-col text-left">
              <span className="text-[14px] xs:text-[15px] font-bold text-slate-800 leading-tight">
                Chat with us on WhatsApp
              </span>
              <span className="text-[11px] xs:text-[11.5px] font-semibold text-slate-400 leading-tight">
                (Any questions or issues?)
              </span>
            </div>
          </div>
          <span className="text-slate-400 text-base font-bold pr-1">→</span>
        </button>
      </div>

      {/* Onboarding Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-[360px] rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-center relative border border-slate-100">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowVideoModal(false)}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-base transition-colors cursor-pointer"
            >
              ✕
            </button>

            {/* Header */}
            <div className="pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                <span>🎬</span>
                <span>Quick Introduction</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                Welcome to Hoshiyaar!
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Watch this quick intro to see how learning works
              </p>
            </div>

            {/* Video Container (16:9) */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner border border-slate-200">
              <iframe
                className="w-full h-full"
                src={normalizeYoutubeEmbed(onboardingVideoUrl)}
                title="Hoshiyaar Onboarding"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Actions */}
            <div className="pt-1 flex flex-col gap-2.5">
              <p className="text-xs font-semibold text-slate-600">
                Still have questions or facing issues?
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowVideoModal(false);
                  window.open('https://wa.me/918310532323?text=Hi!%20I%20watched%20the%20onboarding%20video%20and%20have%20a%20question%20about%20Hoshiyaar', '_blank');
                }}
                className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span>Chat on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
      )}
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

  // Lock mobile body completely to prevent any page drag or bouncing
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
      {/* Mobile View: Fixed, zero-scroll container */}
      <div className="block md:hidden overflow-hidden h-[100dvh] max-h-[100dvh] fixed inset-0 z-0">
        <MobileWelcomeScreen />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block w-full">
        <DesktopHome />
      </div>
    </>
  );
};

export default HomePage;