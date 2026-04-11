import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import hoshiStudyGif from '../../assets/images/Hoshi Study.gif';
import hoshiTrophyGif from '../../assets/images/Hoshi Trophy.gif';
import hoshiWithCapGif from '../../assets/images/Hoshi With Cap.gif';
import hoshiExpressGif from '../../assets/images/Adobe Express - Hoshi 03_Gif.gif';

// ============================================
// SCROLL PROGRESS HOOK
// ============================================
const useScrollProgress = (ref, offset = { start: 1, end: 0.6 }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const startPoint = windowHeight * offset.start;
      const endPoint = windowHeight * offset.end;
      
      const elementTop = rect.top;
      const totalDistance = startPoint - endPoint;
      const currentDistance = startPoint - elementTop;
      
      const newProgress = Math.min(Math.max(currentDistance / totalDistance, 0), 1);
      setProgress(newProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [ref, offset.start, offset.end]);

  return progress;
};

// ============================================
// WORD REVEAL COMPONENT (Plain Text)
// ============================================
const ScrollRevealText = ({ 
  children, 
  className = '',
  as: Component = 'p',
  offset = { start: 1, end: 0.65 },
}) => {
  const containerRef = useRef(null);
  const progress = useScrollProgress(containerRef, offset);

  const text = typeof children === 'string' ? children : '';
  const words = text.split(' ');
  const totalWords = words.length;

  return (
    <Component ref={containerRef} className={className}>
      {words.map((word, index) => {
        const staggerFraction = 0.6;
        const wordStart = (index / totalWords) * staggerFraction;
        const wordDuration = 1 - staggerFraction;
        
        const wordProgress = Math.min(
          Math.max((progress - wordStart) / wordDuration, 0),
          1
        );

        return (
          <span
            key={index}
            className="inline-block mr-[0.25em]"
            style={{
              opacity: wordProgress,
              transform: `translateY(${(1 - wordProgress) * 15}px)`,
              filter: `blur(${(1 - wordProgress) * 3}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </Component>
  );
};

// ============================================
// WORD REVEAL WITH WHOLE-LINE HIGHLIGHTS
// ============================================
const ScrollRevealTextWithHighlights = ({ 
  segments,
  className = '',
  as: Component = 'p',
  offset = { start: 1, end: 0.65 },
  highlightStyle = {},
}) => {
  const containerRef = useRef(null);
  const progress = useScrollProgress(containerRef, offset);

  // Count total words for progress calculation
  let totalWords = 0;
  segments.forEach(segment => {
    const words = segment.text.split(' ').filter(w => w);
    totalWords += words.length;
  });

  let wordIndex = 0;

  return (
    <Component ref={containerRef} className={className}>
      {segments.map((segment, segmentIndex) => {
        const words = segment.text.split(' ').filter(w => w);
        
        const wordElements = words.map((word, idx) => {
          const currentWordIndex = wordIndex++;
          const staggerFraction = 0.6;
          const wordStart = (currentWordIndex / totalWords) * staggerFraction;
          const wordDuration = 1 - staggerFraction;
          
          const wordProgress = Math.min(
            Math.max((progress - wordStart) / wordDuration, 0),
            1
          );

          return (
            <span
              key={idx}
              className="inline-block mr-[0.25em]"
              style={{
                opacity: wordProgress,
                transform: `translateY(${(1 - wordProgress) * 15}px)`,
                filter: `blur(${(1 - wordProgress) * 3}px)`,
              }}
            >
              {word}
            </span>
          );
        });

        // If highlighted, wrap entire phrase in highlight span
        if (segment.highlight) {
          return (
            <span 
              key={segmentIndex} 
              className="highlight-brush"
              style={{
                ...highlightStyle,
                display: 'inline',
              }}
            >
              {wordElements}
            </span>
          );
        }

        return <span key={segmentIndex}>{wordElements}</span>;
      })}
    </Component>
  );
};

// ============================================
// HEADING REVEAL (Letter by Letter)
// ============================================
const ScrollRevealHeading = ({ 
  children, 
  className = '',
  as: Component = 'h2',
  offset = { start: 1, end: 0.7 },
}) => {
  const containerRef = useRef(null);
  const progress = useScrollProgress(containerRef, offset);
  
  const text = typeof children === 'string' ? children : '';
  const letters = text.split('');
  const totalLetters = letters.length;

  return (
    <Component 
      ref={containerRef} 
      className={className}
      style={{ overflow: 'hidden' }}
    >
      <span style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
        {letters.map((letter, index) => {
          const staggerFraction = 0.7;
          const letterStart = (index / totalLetters) * staggerFraction;
          const letterDuration = 1 - staggerFraction;
          
          const letterProgress = Math.min(
            Math.max((progress - letterStart) / letterDuration, 0),
            1
          );

          return (
            <span
              key={index}
              className="inline-block"
              style={{
                opacity: letterProgress,
                transform: `translateY(${(1 - letterProgress) * 20}px)`,
              }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          );
        })}
      </span>
    </Component>
  );
};

// ============================================
// IMAGE REVEAL
// ============================================
const ScrollRevealImage = ({ 
  src, 
  alt, 
  className = '',
  direction = 'left',
  offset = { start: 1, end: 0.65 },
}) => {
  const containerRef = useRef(null);
  const progress = useScrollProgress(containerRef, offset);

  const translateX = direction === 'left' 
    ? (1 - progress) * -80 
    : (1 - progress) * 80;

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{
        opacity: progress,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <img src={src} alt={alt} className="w-full h-auto block" loading="lazy" />
    </div>
  );
};

// ============================================
// LIST REVEAL
// ============================================
const ScrollRevealList = ({ 
  items, 
  className = '',
  offset = { start: 1, end: 0.4 },
  renderItem,
}) => {
  const containerRef = useRef(null);
  const progress = useScrollProgress(containerRef, offset);
  const totalItems = items.length;

  return (
    <ul ref={containerRef} className={className}>
      {items.map((item, index) => {
        const staggerFraction = 0.5;
        const itemStart = (index / totalItems) * staggerFraction;
        const itemDuration = 1 - staggerFraction;
        
        const itemProgress = Math.min(
          Math.max((progress - itemStart) / itemDuration, 0),
          1
        );

        return (
          <li
            key={index}
            className="flex items-start gap-3"
            style={{
              opacity: itemProgress,
              transform: `translateX(${(1 - itemProgress) * -40}px)`,
            }}
          >
            {renderItem(item, itemProgress)}
          </li>
        );
      })}
    </ul>
  );
};

// ============================================
// BUTTON REVEAL
// ============================================
const ScrollRevealButton = ({ 
  children, 
  className = '',
  offset = { start: 1, end: 0.75 },
  ...props
}) => {
  const containerRef = useRef(null);
  const progress = useScrollProgress(containerRef, offset);

  return (
    <div
      ref={containerRef}
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * 25}px) scale(${0.9 + progress * 0.1})`,
      }}
    >
      <button className={className} {...props}>
        {children}
      </button>
    </div>
  );
};

// ============================================
// MAIN HERO COMPONENT
// ============================================
const Hero = () => {
  const { user } = useAuth() || {};
  const isLoggedIn = Boolean(user);

  const sectionMedia = {
    section1: hoshiWithCapGif,
    section2: hoshiStudyGif,
    section3: hoshiTrophyGif,
    section4: hoshiExpressGif,
    section5: hoshiWithCapGif,
    section6: hoshiStudyGif,
    section7: hoshiTrophyGif,
  };

  // Updated highlight style with brush stroke effect
  const highlightStyle = {
    position: 'relative',
    padding: '0 8px',
    fontWeight: 'bold',
    background: 'linear-gradient(105deg, transparent 5%, #ffcc00 5%, #ffcc00 95%, transparent 95%)',
    boxDecorationBreak: 'clone',
    WebkitBoxDecorationBreak: 'clone',
    borderRadius: '3px',
    transform: 'skew(-8deg)',
    display: 'inline-block',
  };

  const highlightStyleAlt = {
    position: 'relative',
    fontWeight: 'bold',
    backgroundImage: 'linear-gradient(120deg, rgba(255, 204, 0, 0) 0%, rgba(255, 204, 0, 0.8) 10%, rgba(255, 204, 0, 0.8) 90%, rgba(255, 204, 0, 0) 100%)',
    backgroundSize: '100% 45%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '0 85%',
    padding: '0 4px',
  };

  const sectionBgStyle = {
    backgroundColor: '#fcfcfc',
  };

  // Add custom CSS for brush stroke effect
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .highlight-brush {
        position: relative;
        font-weight: bold;
        z-index: 1;
      }
      .highlight-brush::before {
        content: '';
        position: absolute;
        left: -3px;
        right: -3px;
        top: 50%;
        height: 0.9em;
        background: #ffcc00;
        transform: translateY(-50%) rotate(-1deg);
        z-index: -1;
        opacity: 0.7;
        border-radius: 3px 15px 10px 15px;
        filter: url('#brush');
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <>
      {/* SVG Filter for brush effect */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="brush">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" seed="1" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
        </defs>
      </svg>

      {/* ==================== SECTION 1: What is this? ==================== */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-28" style={sectionBgStyle}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
          
          <ScrollRevealImage
            src={sectionMedia.section1}
            alt="Hoshiyaar Animation"
            direction="left"
            className="w-full max-w-[383px] sm:max-w-[450px] md:max-w-[473px] lg:max-w-[563px] xl:max-w-[675px] lg:flex-1"
          />

          <div className="flex-1 text-center lg:text-left">
            <ScrollRevealHeading
              as="h1"
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-duo-text mb-4 sm:mb-6 leading-tight"
            >
              What is this?
            </ScrollRevealHeading>
            
            <ScrollRevealTextWithHighlights
              className="text-sm sm:text-base md:text-lg lg:text-xl text-duo-text mb-4 leading-relaxed"
              highlightStyle={highlightStyleAlt}
              segments={[
                { text: "Hoshiyaar is a" },
                { text: "story-based learning universe", highlight: true },
                { text: "for Grade 3 to Grade 7 CBSE students, where chapters turn into adventures." },
              ]}
            />

            <ScrollRevealTextWithHighlights
              className="text-sm sm:text-base md:text-lg lg:text-xl text-duo-text mb-6 sm:mb-8 leading-relaxed"
              highlightStyle={highlightStyleAlt}
              segments={[
                { text: "Instead of memorising lessons, students explore science through" },
                { text: "stories, worlds, and characters", highlight: true },
                { text: "— and then practice what they learn on the Hoshiyaar app." },
              ]}
            />

            <ScrollRevealButton
              className="bg-duo-blue text-white font-bold uppercase tracking-wider py-2 px-6 sm:py-3 sm:px-8 md:px-10 rounded-lg border-b-4 border-duo-blue-dark hover:bg-blue-500 hover:scale-105 transition-all duration-300 text-sm sm:text-base"
              onClick={() => window.location.href = '/learn'}
            >
              Start Learning
            </ScrollRevealButton>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 2: Is this for someone like me? ==================== */}
      <section className="py-12 sm:py-16 lg:py-20" style={sectionBgStyle}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row-reverse items-center justify-center gap-8 lg:gap-16">
          
          <ScrollRevealImage
            src={sectionMedia.section2}
            alt="Hoshiyaar Animation"
            direction="right"
            className="w-full max-w-[383px] sm:max-w-[450px] md:max-w-[473px] lg:max-w-[563px] xl:max-w-[675px] lg:flex-1"
          />

          <div className="flex-1 text-center lg:text-left">
            <ScrollRevealHeading
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-duo-text mb-6"
            >
              Is this for someone like me?
            </ScrollRevealHeading>

            <ScrollRevealText className="text-base sm:text-lg md:text-xl text-duo-text mb-6">
              Hoshiyaar is for you if:
            </ScrollRevealText>

            <ScrollRevealList
              className="space-y-4 text-sm sm:text-base md:text-lg text-duo-text mb-8"
              items={[
                { text: "You're in", highlight: "Grade 3–7" },
                { text: "You study", highlight: "CBSE" },
                { text: "You enjoy", highlight: "stories, visuals, and curiosity" },
                { text: "You want to", highlight: "understand concepts", suffix: ", not just remember answers" },
              ]}
              renderItem={(item, progress) => (
                <>
                  <span 
                    className="text-duo-blue font-bold text-xl flex-shrink-0"
                    style={{ 
                      transform: `scale(${progress})`, 
                      display: 'inline-block',
                      opacity: progress,
                    }}
                  >
                    ✓
                  </span>
                  <span>
                    {item.text} <span className="highlight-brush">{item.highlight}</span>{item.suffix || ''}
                  </span>
                </>
              )}
            />

            <ScrollRevealText className="text-base sm:text-lg md:text-xl text-duo-text mb-2">
              You don't need to be perfect.
            </ScrollRevealText>
            
            <ScrollRevealText className="text-base sm:text-lg md:text-xl text-duo-text font-semibold">
              You just need to be curious.
            </ScrollRevealText>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 3: What problem does this solve? ==================== */}
      <section className="py-12 sm:py-16 lg:py-20" style={sectionBgStyle}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
          
          <ScrollRevealImage
            src={sectionMedia.section3}
            alt="Hoshiyaar Animation"
            direction="left"
            className="w-full max-w-[383px] sm:max-w-[450px] md:max-w-[473px] lg:max-w-[563px] xl:max-w-[675px] lg:flex-1"
          />

          <div className="flex-1 text-center lg:text-left">
            <ScrollRevealHeading
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-duo-text mb-6"
            >
              What problem does this solve?
            </ScrollRevealHeading>

            <ScrollRevealText className="text-base sm:text-lg md:text-xl text-duo-text mb-6">
              Most students struggle because:
            </ScrollRevealText>

            <ScrollRevealList
              className="space-y-4 text-sm sm:text-base md:text-lg text-duo-text mb-8"
              items={[
                { text: "Chapters feel", highlight: "boring or confusing" },
                { text: "Videos are watched but", highlight: "quickly forgotten" },
                { text: "There's learning, but very little", highlight: "meaningful practice", suffix: " or play-along learning" },
              ]}
              renderItem={(item, progress) => (
                <>
                  <span 
                    className="text-red-500 font-bold text-xl flex-shrink-0"
                    style={{ 
                      transform: `scale(${progress})`, 
                      display: 'inline-block',
                      opacity: progress,
                    }}
                  >
                    ✗
                  </span>
                  <span>
                    {item.text} <span className="highlight-brush">{item.highlight}</span>{item.suffix || ''}
                  </span>
                </>
              )}
            />

            <ScrollRevealText className="text-base sm:text-lg md:text-xl text-duo-text font-semibold">
              Hoshiyaar connects learning with experience and practice — so concepts actually stay with you.
            </ScrollRevealText>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 4: How do we solve this differently? ==================== */}
      <section className="py-12 sm:py-16 lg:py-20" style={sectionBgStyle}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row-reverse items-center justify-center gap-8 lg:gap-16">
          
          <ScrollRevealImage
            src={sectionMedia.section4}
            alt="Hoshiyaar Animation"
            direction="right"
            className="w-full max-w-[383px] sm:max-w-[450px] md:max-w-[473px] lg:max-w-[563px] xl:max-w-[675px] lg:flex-1"
          />

          <div className="flex-1 text-center lg:text-left">
            <ScrollRevealHeading
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold text-duo-text mb-6"
            >
              How do we solve this differently?
            </ScrollRevealHeading>

            <ScrollRevealText className="text-base sm:text-lg md:text-xl text-duo-text mb-6">
              At Hoshiyaar:
            </ScrollRevealText>

            <ScrollRevealList
              className="space-y-4 text-sm sm:text-base md:text-lg text-duo-text mb-8"
              items={[
                { text: "Every chapter becomes a", highlight: "story" },
                { text: "Every concept lives inside an", highlight: "adventure" },
                { text: "Learning happens through", highlight: "situations, not lectures" },
              ]}
              renderItem={(item, progress) => (
                <>
                  <span 
                    className="text-duo-blue font-bold text-xl flex-shrink-0"
                    style={{ 
                      transform: `scale(${progress}) rotate(${progress * 360}deg)`, 
                      display: 'inline-block',
                      opacity: progress,
                    }}
                  >
                    ★
                  </span>
                  <span>
                    {item.text} <span className="highlight-brush">{item.highlight}</span>
                  </span>
                </>
              )}
            />

            <ScrollRevealText className="text-base sm:text-lg md:text-xl text-duo-text mb-2">
              You don't just read about concepts —
            </ScrollRevealText>
            
            <ScrollRevealText className="text-base sm:text-lg md:text-xl text-duo-text font-semibold">
              you experience them, and then practice them on the app.
            </ScrollRevealText>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 5: What exactly can I study here? ==================== */}
      <section className="py-12 sm:py-16 lg:py-20" style={sectionBgStyle}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
          
          <ScrollRevealImage
            src={sectionMedia.section5}
            alt="Hoshiyaar Animation"
            direction="left"
            className="w-full max-w-[383px] sm:max-w-[450px] md:max-w-[473px] lg:max-w-[563px] xl:max-w-[675px] lg:flex-1"
          />

          <div className="flex-1 text-center lg:text-left">
            <ScrollRevealHeading
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold text-duo-text mb-6"
            >
              What exactly can I study here?
            </ScrollRevealHeading>

            <ScrollRevealTextWithHighlights
              className="text-base sm:text-lg md:text-xl text-duo-text mb-6"
              highlightStyle={highlightStyleAlt}
              segments={[
                { text: "You can study" },
                { text: "CBSE Science for Grade 3 to Grade 7,", highlight: true },
                { text: "including:" },
              ]}
            />

            <ScrollRevealList
              className="space-y-4 text-sm sm:text-base md:text-lg text-duo-text mb-8"
              items={[
                { icon: '📚', text: "Temperature, heat, and weather" },
                { icon: '📚', text: "Matter, forces, and energy" },
                { icon: '📚', text: "Everyday science explained simply" },
              ]}
              renderItem={(item, progress) => (
                <>
                  <span 
                    className="text-xl flex-shrink-0"
                    style={{ 
                      transform: `scale(${0.5 + progress * 0.5})`, 
                      display: 'inline-block',
                      opacity: progress,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.text}</span>
                </>
              )}
            />

            <ScrollRevealText className="text-base sm:text-lg md:text-xl text-duo-text font-semibold mb-4">
              Each chapter includes:
            </ScrollRevealText>

            <ScrollRevealList
              className="space-y-4 text-sm sm:text-base md:text-lg text-duo-text"
              items={[
                { icon: '🎬', text: "A", highlight: "long-format story video" },
                { icon: '📱', text: "", highlight: "Practice questions and activities", suffix: " on the Hoshiyaar app" },
              ]}
              renderItem={(item, progress) => (
                <>
                  <span 
                    className="text-xl flex-shrink-0"
                    style={{ 
                      transform: `scale(${0.5 + progress * 0.5})`, 
                      display: 'inline-block',
                      opacity: progress,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span>
                    {item.text} <span className="highlight-brush">{item.highlight}</span>{item.suffix || ''}
                  </span>
                </>
              )}
            />
          </div>
        </div>
      </section>

      {/* ==================== SECTION 6: What will change for you? ==================== */}
      <section className="py-12 sm:py-16 lg:py-20" style={sectionBgStyle}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row-reverse items-center justify-center gap-8 lg:gap-16">
          
          <ScrollRevealImage
            src={sectionMedia.section6}
            alt="Hoshiyaar Animation"
            direction="right"
            className="w-full max-w-[383px] sm:max-w-[450px] md:max-w-[473px] lg:max-w-[563px] xl:max-w-[675px] lg:flex-1"
          />

          <div className="flex-1 text-center lg:text-left">
            <ScrollRevealHeading
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-duo-text mb-6"
            >
              What will change for you?
            </ScrollRevealHeading>

            <ScrollRevealText className="text-base sm:text-lg md:text-xl text-duo-text mb-6">
              With Hoshiyaar:
            </ScrollRevealText>

            <ScrollRevealList
              className="space-y-4 text-sm sm:text-base md:text-lg text-duo-text mb-8"
              items={[
                { text: "You'll", highlight: "understand concepts clearly" },
                { text: "You'll", highlight: "remember them longer" },
                { text: "You'll feel more", highlight: "confident in class and exams" },
                { text: "Learning will feel", highlight: "enjoyable, not stressful" },
              ]}
              renderItem={(item, progress) => (
                <>
                  <span 
                    className="text-green-500 font-bold text-xl flex-shrink-0"
                    style={{ 
                      transform: `scale(${progress})`, 
                      display: 'inline-block',
                      opacity: progress,
                    }}
                  >
                    ✓
                  </span>
                  <span>
                    {item.text} <span className="highlight-brush">{item.highlight}</span>
                  </span>
                </>
              )}
            />

            <ScrollRevealText className="text-base sm:text-lg md:text-xl text-duo-text mb-2">
              Science will stop feeling difficult —
            </ScrollRevealText>
            
            <ScrollRevealText className="text-base sm:text-lg md:text-xl text-duo-text font-semibold">
              and start making sense.
            </ScrollRevealText>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 7: YouTube Videos ==================== */}
      <section className="py-12 sm:py-16 lg:py-20" style={sectionBgStyle}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
          
          <ScrollRevealImage
            src={sectionMedia.section7}
            alt="Hoshiyaar Animation"
            direction="left"
            className="w-full max-w-[383px] sm:max-w-[450px] md:max-w-[473px] lg:max-w-[563px] xl:max-w-[675px] lg:flex-1"
          />

          <div className="flex-1 text-center lg:text-left">
            <ScrollRevealHeading
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-duo-text mb-4"
            >
              YouTube Videos
            </ScrollRevealHeading>

            <ScrollRevealText className="text-base sm:text-lg md:text-xl text-duo-text mb-4">
              Start learning for free.
            </ScrollRevealText>

            <ScrollRevealTextWithHighlights
              className="text-sm sm:text-base md:text-lg text-duo-text mb-8"
              highlightStyle={highlightStyleAlt}
              segments={[
                { text: "Watch Hoshiyaar's" },
                { text: "story-based chapter videos", highlight: true },
                { text: "on YouTube, then continue learning with practice on the app." },
              ]}
            />

            <ScrollRevealButton
              className="bg-red-600 text-white font-bold uppercase tracking-wider py-3 px-8 md:px-10 rounded-lg border-b-4 border-red-700 hover:bg-red-500 hover:scale-105 transition-all duration-300 text-sm sm:text-base inline-flex items-center gap-2"
              onClick={() => window.open('https://www.youtube.com/@Hoshiyaar', '_blank')}
            >
              <span>▶️</span> Watch on YouTube
            </ScrollRevealButton>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;