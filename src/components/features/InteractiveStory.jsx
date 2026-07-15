import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import TypewriterText from '../ui/TypewriterText.jsx';
import interactiveStoryService from '../../services/interactiveStoryService.js';
import curriculumService from '../../services/curriculumService.js';

export default function InteractiveStory() {
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [hasStarted, setHasStarted] = useState(true);
  const [wrongGuesses, setWrongGuesses] = useState(new Set());
  
  const audioRef = useRef(null); // for custom voice
  const bgmRef = useRef(null);   // for BGM
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let boardId = user?.board;
    let classLevel = user?.classLevel;
    
    if (!boardId || !classLevel) {
      try {
        const u = JSON.parse(localStorage.getItem('user'));
        boardId = u?.board || boardId;
        classLevel = u?.classLevel || classLevel;
      } catch(e){}
    }

    if (!boardId || !classLevel) {
      // Missing info, go back to learn
      navigate('/learn', { replace: true });
      return;
    }

    interactiveStoryService.getStoryByBoardAndClass(boardId, classLevel)
      .then(res => {
        if (!res.data || !res.data.slides || res.data.slides.length === 0) {
          throw new Error("No slides");
        }
        setStory(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("No interactive story found, routing directly to lesson...", err);
        navigateToFirstLesson(boardId, classLevel);
      });
  }, [user, navigate]);

  const navigateToFirstLesson = async (boardId, classLevel) => {
    try {
      if (story?.targetChapterId) {
        const modulesRes = await curriculumService.listModules(story.targetChapterId);
        if (modulesRes.data && modulesRes.data.length > 0) {
          const firstModule = modulesRes.data[0];
          navigate(`/learn/module/${firstModule._id}/concept/0`, { replace: true });
          return;
        }
      }

      // Hardcode science subject for fallback if needed
      const opts = classLevel ? { params: { classTitle: classLevel } } : {};
      const subjectsRes = await curriculumService.listSubjects(boardId, opts);
      let subjectId = null;
      if (subjectsRes.data && subjectsRes.data.length > 0) {
        const science = subjectsRes.data.find(s => s.title?.toLowerCase().includes('science') || s.name?.toLowerCase().includes('science'));
        subjectId = science ? science.name : subjectsRes.data[0].name;
      }
      
      const chaptersRes = await curriculumService.listChapters(boardId, subjectId || 'Science', opts.params);
      if (chaptersRes.data && chaptersRes.data.length > 0) {
        const firstChapter = chaptersRes.data[0];
        const modulesRes = await curriculumService.listModules(firstChapter._id);
        if (modulesRes.data && modulesRes.data.length > 0) {
          const firstModule = modulesRes.data[0];
          navigate(`/learn/module/${firstModule._id}/concept/0`, { replace: true });
          return;
        }
      }
      navigate('/learn', { replace: true });
    } catch(e) {
      navigate('/learn', { replace: true });
    }
  }

  // Handle BGM
  useEffect(() => {
    if (hasStarted && story?.backgroundMusic) {
      bgmRef.current = new Audio(story.backgroundMusic);
      bgmRef.current.loop = true;
      bgmRef.current.volume = 0.3;
      bgmRef.current.play().catch(e => console.log("BGM play failed", e));
    }
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, [hasStarted, story]);

  // Handle Character Audio
  useEffect(() => {
    if (hasStarted && story?.slides?.[currentSlideIndex]) {
      const slide = story.slides[currentSlideIndex];
      if (slide.audioUrl) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(slide.audioUrl);
        audioRef.current.play().catch(e => console.log("Voice play failed", e));
      }
    }
    
    // Auto-show options if no text or if we want to immediately show them.
    // The TypewriterText onComplete will also trigger this.
    setShowOptions(false);
    setWrongGuesses(new Set());
  }, [currentSlideIndex, hasStarted, story]);

  const handleOptionClick = (opt, idx) => {
    if (opt && opt.isWrong) {
      setWrongGuesses(prev => new Set(prev).add(idx));
      return; // Do not advance
    }

    setShowOptions(false);
    if (audioRef.current) audioRef.current.pause();

    const nextIndex = opt ? opt.nextSlideIndex : -1;

    if (nextIndex === -1 || nextIndex >= story.slides.length) {
      navigateToFirstLesson(story.board, story.classLevel);
    } else {
      setCurrentSlideIndex(nextIndex);
    }
  };

  const handleTextComplete = () => {
    setShowOptions(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 font-bold text-slate-500">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  const currentSlide = story.slides[currentSlideIndex];

  const hasButtons = currentSlide.buttons && currentSlide.buttons.length > 0;

  return (
    <div 
      className="fixed inset-0 bg-slate-900 overflow-hidden flex flex-col justify-end z-40 bg-cover bg-center bg-no-repeat cursor-pointer"
      style={{ backgroundImage: story.backgroundImg ? `url(${story.backgroundImg})` : 'none' }}
      onClick={() => {
        if (showOptions && !hasButtons) {
          handleOptionClick({ nextSlideIndex: currentSlideIndex + 1 }, -1);
        }
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

      <div className="relative w-full max-w-6xl mx-auto flex-1 flex items-center justify-start md:justify-center px-4 sm:px-8 pb-32 md:pb-16 mt-16 md:mt-0">
        <div className="relative animate-in slide-in-from-left fade-in duration-500 ease-out flex flex-col items-start max-w-[85%] sm:max-w-lg md:max-w-2xl z-20 md:items-center w-full">
          
          <div className="bg-white/95 backdrop-blur rounded-3xl rounded-bl-none p-5 sm:p-6 shadow-2xl relative border border-white/50 w-fit">
            <p className="text-slate-800 font-bold text-xl sm:text-2xl leading-relaxed">
              <TypewriterText 
                text={currentSlide.dialogue} 
                onComplete={handleTextComplete} 
                shouldSpeak={!currentSlide.audioUrl} // Only use TTS if no custom audio provided
                typingSpeed={30}
              />
            </p>
            <div className="absolute top-full left-0 md:left-1/2 md:-ml-3 w-6 h-8 overflow-hidden">
              <div className="w-8 h-8 bg-white/95 border border-white/50 rounded-full transform -translate-y-1/2 -translate-x-1/2" />
            </div>
          </div>
          
          {currentSlide.characterImg && (
            <img 
              src={currentSlide.characterImg} 
              alt="Character" 
              className="w-48 sm:w-72 md:w-72 h-auto max-h-[40vh] md:max-h-[50vh] object-contain pointer-events-none drop-shadow-2xl mt-4"
            />
          )}
        </div>
      </div>

      {showOptions && hasButtons && (
        <div className="absolute bottom-12 left-0 right-0 px-4 flex flex-col items-center gap-3 z-50 transition-all duration-300 ease-in-out opacity-100 translate-y-0">
          {currentSlide.buttons.map((opt, idx) => {
            const isWrongClicked = wrongGuesses.has(idx);
            return (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOptionClick(opt, idx);
                }}
                className={`w-full max-w-sm py-5 px-6 font-extrabold text-lg rounded-2xl shadow-xl transition-all flex items-center justify-center
                  ${isWrongClicked 
                    ? 'bg-red-50 border-2 border-red-500 text-red-500 opacity-60 cursor-not-allowed transform translate-x-1'
                    : 'bg-blue-50/90 backdrop-blur-sm border-2 border-blue-500 hover:bg-blue-100 hover:border-blue-600 text-blue-700 shadow-blue-500/20 active:scale-95'
                  }`}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {showOptions && !hasButtons && (
        <div className="absolute bottom-12 left-0 right-0 px-4 flex justify-center z-30 animate-pulse">
          <p className="text-white/80 font-medium tracking-wide bg-black/40 px-6 py-2 rounded-full backdrop-blur-sm">
            Tap anywhere to continue...
          </p>
        </div>
      )}

      <button 
        onClick={(e) => {
          e.stopPropagation();
          handleOptionClick(null, -1);
        }}
        className="absolute top-6 right-6 px-4 py-2 bg-black/40 hover:bg-black/60 text-white border border-white/20 text-sm font-bold rounded-full shadow-lg backdrop-blur transition z-50 uppercase tracking-wider"
      >
        Skip Intro
      </button>
    </div>
  );
}
