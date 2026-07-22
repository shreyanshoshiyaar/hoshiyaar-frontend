import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ParticleBackground from './ParticleBackground';

const ExamRevision = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const metaViewport = document.querySelector('meta[name=viewport]');
    if (isZoomed) {
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
      }
    } else {
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    };
  }, [isZoomed]);

  const { revisionCards, questions, subjectKnowledge, chapterTitle, chapterId } = location.state || {};

  if (!revisionCards || revisionCards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0F204C] to-[#1A3673] flex flex-col items-center justify-center text-white">
        <ParticleBackground />
        <h2 className="text-xl font-bold relative z-10">No revision available</h2>
        <button onClick={() => navigate('/exam')} className="mt-4 text-cyan-400 font-bold relative z-10">Go Back</button>
      </div>
    );
  }

  const isLast = currentIndex === revisionCards.length - 1;
  const progressPercentage = ((currentIndex + 1) / revisionCards.length) * 100;

  const handleSkipOrStart = () => {
    navigate('/exam/play', {
      state: {
        questions,
        subjectKnowledge,
        chapterTitle,
        chapterId
      },
      replace: true
    });
  };

  const handleNext = () => {
    if (isLast) {
      handleSkipOrStart();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0F204C] to-[#1A3673] font-sans relative">
      <ParticleBackground />

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-transparent relative z-10">
        {/* Back Button */}
        <button 
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex(prev => prev - 1);
            } else {
              setShowQuitConfirm(true);
            }
          }}
          className="text-white p-1 hover:text-cyan-300 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        {/* Progress Bar */}
        <div className="flex-1 px-4 flex flex-col items-center">
          <div className="text-[10px] sm:text-xs font-black text-cyan-300 uppercase tracking-widest mb-1.5 drop-shadow-sm">
            REVISION PROGRESS: {currentIndex + 1} / {revisionCards.length}
          </div>
          <div className="w-full max-w-[200px] h-2 bg-white/20 rounded-full overflow-hidden border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(52,211,100,0.5)]"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Empty div for flex spacing balance since Skip was removed */}
        <div className="w-8"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-start pt-4 px-4 pb-24 overflow-y-auto w-full max-w-2xl mx-auto relative z-10">
        
        {/* Comic Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/20 w-full animate-fade-in relative">
          <img 
            key={currentIndex}
            src={revisionCards[currentIndex]} 
            alt={`Revision Page ${currentIndex + 1}`} 
            className="w-full h-auto object-contain rounded-lg animate-fade-in shadow-lg"
          />
        </div>

        {/* Zoom Button */}
        <button 
          onClick={() => setIsZoomed(true)}
          className="mt-6 flex items-center gap-2 bg-white/10 text-cyan-300 px-5 py-2 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors border border-white/20 shadow-[0_0_15px_rgba(0,255,204,0.1)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          Zoom Image
        </button>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-[#0F204C] to-transparent p-4 pb-6 flex justify-center z-20">
        <button
          onClick={handleNext}
          className={`w-full max-w-2xl text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(0,255,204,0.3)] transition-all transform active:scale-95 ${
            isLast 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-[0_0_30px_rgba(52,211,100,0.5)] border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1' 
              : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:shadow-[0_0_30px_rgba(112,0,255,0.5)] border-b-4 border-purple-800 active:border-b-0 active:translate-y-1'
          }`}
        >
          {isLast ? 'Start Exam' : 'Continue'}
        </button>
      </div>

      {/* Quit Confirmation Modal */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1A2C5B] rounded-2xl p-6 md:p-8 max-w-sm w-full border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] transform scale-100 transition-all text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-600"></div>
            
            <h3 className="text-2xl font-black text-white mb-2">Quit Revision?</h3>
            <p className="text-gray-300 text-sm md:text-base mb-8">
              Are you sure you want to stop revising and go back? Your progress will be lost.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/exam')}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-red-500/30 transition-all active:scale-95"
              >
                YES, QUIT
              </button>
              
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold py-3 px-4 rounded-xl transition-all active:scale-95"
              >
                NO, STAY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-sm animate-fade-in cursor-zoom-out overflow-auto touch-pan-x touch-pan-y"
          onClick={() => setIsZoomed(false)}
        >
          {/* Close Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(false);
            }}
            className="fixed top-4 right-4 z-[70] bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-colors border border-white/20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <img 
            src={revisionCards[currentIndex]} 
            alt={`Zoomed Page ${currentIndex + 1}`} 
            className="max-w-none w-auto h-auto min-w-full min-h-full object-contain cursor-default select-none shadow-2xl m-auto"
            onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing if they meant to click something else, though clicking outside will close
          />
        </div>
      )}
    </div>
  );
};

export default ExamRevision;
