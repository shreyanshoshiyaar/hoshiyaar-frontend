// src/components/layout/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import curriculumService from '../../services/curriculumService';
import DesktopHome from './DesktopHome';

// Welcome artwork from the client (841 × 1870, 9:20). Everything in it sits in the top 71%;
// the rest is plain sky and mountains, where the app draws its buttons.
const WELCOME_ART = "https://res.cloudinary.com/fpifkjbq/image/upload/v1795157801/img-to-link/znqa0g5xchzxhmtba7ar.webp";
const WELCOME_ART_RATIO = 841 / 1870; // width / height
const WELCOME_ART_CONTENT = 0.71; // the cards end here, as a share of the height

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
    <div
      className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden select-none overscroll-none bg-gradient-to-b from-[#1F3352] via-[#7FB4DD] to-[#D5E6F7]"
      style={{
        '--welcome-buttons': 'calc(224px + env(safe-area-inset-bottom, 0px))',
        // Artwork height: fills the screen, but never so tall that the cards would run under the buttons
        '--welcome-art-h': `min(calc((100dvh - var(--welcome-buttons)) / ${WELCOME_ART_CONTENT}), max(100dvh, calc(100vw / ${WELCOME_ART_RATIO})))`
      }}
    >
      {/* Side fill for phones shorter than the artwork: a soft, blurred copy of the same picture */}
      <img
        src={WELCOME_ART}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-80 pointer-events-none"
      />

      {/* The artwork (logo, headline, Hoshi, the 3 cards; its bottom 30% is plain sky for the buttons).
          Fills the screen, but never so tall that the cards would run under the buttons: on short phones
          it gets a little smaller and the blurred copy shows at the sides. */}
      <img
        src={WELCOME_ART}
        alt="HoshiYaar: Your next science mission starts here. Read the comic, learn on the blackboard, beat the quiz."
        fetchpriority="high"
        draggable="false"
        className="absolute top-0 left-1/2 -translate-x-1/2 max-w-none w-auto pointer-events-none"
        style={{
          height: 'var(--welcome-art-h)',
          // Soft left and right edges, so on short phones the artwork melts into the blurred fill
          WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 5%, #000 95%, transparent 100%)',
          maskImage: 'linear-gradient(to right, transparent 0, #000 5%, #000 95%, transparent 100%)'
        }}
      />

      {/* Buttons, over the plain bottom of the artwork */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 px-5 flex flex-col items-center"
        style={{
          top: `calc(var(--welcome-art-h) * ${WELCOME_ART_CONTENT})`,
          paddingTop: '6px',
          paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        <div className="w-full max-w-[380px] h-full max-h-[300px] flex flex-col items-center justify-evenly">
          {/* Start my adventure (guest start; verify later) */}
          <button
            type="button"
            onClick={() => navigate('/start')}
            className="w-full h-[58px] shrink-0 rounded-full bg-gradient-to-b from-[#2F6BFF] to-[#1743D8] text-white font-dialogue font-bold text-[23px] tracking-tight shadow-[0_6px_0_0_#0F2E9E,0_14px_28px_rgba(23,67,216,0.35)] active:translate-y-[3px] active:shadow-[0_3px_0_0_#0F2E9E,0_8px_18px_rgba(23,67,216,0.3)] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Start my adventure</span>
            <span className="text-[22px] leading-none" aria-hidden="true">→</span>
          </button>

          {/* Log in */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="shrink-0 font-dialogue text-[16.5px] font-medium text-slate-700 cursor-pointer"
          >
            Already learning with us? <span className="text-[#1743D8] font-bold">Log in</span>
          </button>

          {/* WhatsApp help (plays the intro video first when one is set in Admin) */}
          <button
            type="button"
            onClick={handleWhatsAppClick}
            className="w-full h-[54px] shrink-0 pl-2 pr-3.5 rounded-full bg-white/95 border border-white shadow-[0_6px_18px_rgba(30,58,138,0.14)] active:scale-[0.98] transition-all flex items-center gap-3 cursor-pointer"
          >
            <span className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0 -mr-0.5">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </span>
            <span className="h-6 w-px bg-slate-200" aria-hidden="true" />
            <span className="flex-1 text-left whitespace-nowrap font-dialogue text-[15.5px] min-[385px]:text-[16.5px] font-semibold text-slate-800">Need help? Chat on WhatsApp</span>
            <span className="text-slate-500 text-lg font-bold" aria-hidden="true">→</span>
          </button>

          {/* Tagline */}
          <div className="shrink-0 flex items-center justify-center gap-2.5">
            <span className="text-[#F5B700] text-sm font-black -rotate-12" aria-hidden="true">⟋</span>
            <div className="text-center">
              <p className="text-[18px] font-black italic text-[#1E2A8A] leading-tight tracking-tight">No ratta. Pure curiosity.</p>
              <svg className="w-24 h-2 mx-auto text-[#2F6BFF]" viewBox="0 0 100 12" fill="none" aria-hidden="true">
                <path d="M6 4 Q 50 13 94 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[#F5B700] text-sm font-black rotate-12" aria-hidden="true">⟍</span>
          </div>
        </div>
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

  // Logged in users land on the home screen
  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true });
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