// src/components/layout/DesktopHome.jsx
import React, { useEffect, useState } from 'react';
import { testimonials } from '../../constants/reviews.js';
import './DesktopHome.css';

const DesktopHome = () => {
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [expandedReviews, setExpandedReviews] = useState({});

  const toggleReview = (idx) => {
    setExpandedReviews(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    // Add Google Fonts for Fraunces and Instrument Sans if not already in document
    if (!document.getElementById('desktop-home-fonts')) {
      const link = document.createElement('link');
      link.id = 'desktop-home-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,700&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap';
      document.head.appendChild(link);
    }

    const revealEls = document.querySelectorAll('.desktop-home-wrapper .reveal, .desktop-home-wrapper .reveal-left, .desktop-home-wrapper .reveal-right, .desktop-home-wrapper .reveal-scale');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { 
        if (e.isIntersecting) { 
          e.target.classList.add('visible'); 
          io.unobserve(e.target); 
        } 
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    
    revealEls.forEach(el => io.observe(el));

    const progress = document.getElementById('scrollProgress');
    const backToTop = document.getElementById('backToTop');

    const onScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      if (progress) progress.style.width = scrollPercent + '%';
      if (backToTop) backToTop.classList.toggle('show', window.scrollY > 600);
    };

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => { onScroll(); ticking = false; });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll);



    return () => {
      io.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleNotify = (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    if (input.value) { 
      setToastMsg("You're on the early access list! 🎉");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      input.value = ''; 
    }
  };

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  };

  return (
    <div className="desktop-home-wrapper">
      <div className="scroll-progress" id="scrollProgress"></div>

      <main>
        <section id="hoshi-hero" className="new-hero-section relative bg-white overflow-hidden pt-8 pb-16">
          {/* Decorative Elements */}
          <div className="absolute top-[15%] left-[3%] text-blue-400 text-3xl animate-bounce" style={{animationDuration: '3s'}}>✨</div>
          <div className="absolute top-[25%] right-[8%] text-pink-400 text-2xl animate-pulse">❤️</div>
          <div className="absolute bottom-[35%] left-[2%] text-purple-400 text-4xl animate-pulse">⭐</div>
          <div className="absolute top-[5%] left-[30%] opacity-50 text-indigo-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          </div>
          <div className="absolute top-[10%] right-[30%] opacity-40">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>

          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Content */}
            <div className="flex-1 text-left max-w-2xl mt-4 lg:mt-0">
              <div className="inline-block bg-[#EBF4FF] text-[#1D4ED8] font-bold px-5 py-2 rounded-full text-[16px] tracking-wide mb-6 border border-[#BFDBFE]">
                FOR CBSE CLASS 6–8
              </div>
              
              <h1 className="text-5xl lg:text-[72px] font-extrabold text-[#1E3A8A] leading-[1.05] mb-6 font-['Fraunces'] tracking-tight">
                Enter the <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] to-[#FBBF24]">HoshiYaar</span> <br/>
                Universe.
              </h1>
              
              <p className="text-[17px] text-slate-700 mb-2 font-semibold max-w-[500px] leading-relaxed">
                Science should not feel like pressure.<br/> It should feel like a journey that pulls children in.
              </p>
              
              <p className="text-[15px] text-slate-600 mb-10 max-w-[500px] leading-relaxed">
                At HoshiYaar, Class 6–8 students learn Science through comics, videos, practice missions, quizzes, revision tools, and exam-ready answers.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <a href="/signup" className="bg-[#FFC107] hover:bg-[#FFB300] text-[#4527A0] font-extrabold text-[16px] px-8 py-4 rounded-xl transition-transform hover:scale-105 shadow-md flex items-center gap-2">
                  Let's Play
                </a>
                <a href="https://play.google.com/store/apps/details?id=com.hoshiyaarlearning.app" target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-slate-50 text-[#1E3A8A] font-bold text-[16px] px-8 py-4 rounded-xl transition-all border border-[#CBD5E1] shadow-sm hover:border-[#94A3B8]">
                  Download our App
                </a>
              </div>
              

            </div>
            
            {/* Right Visual */}
            <div className="flex-1 relative w-full lg:min-w-[650px] max-w-[850px] mt-8 lg:mt-0 lg:ml-[-40px]">
              <img 
                src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1781793363/img-to-link/pgmviebjucysv1rcmtda.webp" 
                alt="Hoshiyaar Universe" 
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
          
          {/* Bottom Features Bar */}
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 mt-6 relative z-20">
            <div className="bg-white rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.06)] border border-slate-100 py-6 px-4 xl:px-8 flex flex-nowrap justify-between items-center gap-2 xl:gap-6 overflow-x-auto no-scrollbar">
              
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center shrink-0">
                  <span className="text-[44px]">📖</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-[14px]">Comics</h4>
                  <p className="text-[12px] text-slate-500 leading-snug font-medium mt-0.5">Stories that make<br/>science exciting</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center shrink-0">
                  <span className="text-[44px]">▶️</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-[14px]">Videos</h4>
                  <p className="text-[12px] text-slate-500 leading-snug font-medium mt-0.5">Visual lessons<br/>that make it click</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center shrink-0">
                  <span className="text-[44px]">🎯</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-[14px]">Practice Missions</h4>
                  <p className="text-[12px] text-slate-500 leading-snug font-medium mt-0.5">Solve, practice<br/>and level up</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center shrink-0">
                  <span className="text-[44px]">🛡️</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-[14px]">Exam Answers</h4>
                  <p className="text-[12px] text-slate-500 leading-snug font-medium mt-0.5">Exam-ready answers<br/>you can trust</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center shrink-0">
                  <span className="text-[44px]">🧠</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-[14px]">Revision Tools</h4>
                  <p className="text-[12px] text-slate-500 leading-snug font-medium mt-0.5">Remember more<br/>with smart revision</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center shrink-0">
                  <span className="text-[44px]">📊</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-[14px]">Progress Tracking</h4>
                  <p className="text-[12px] text-slate-500 leading-snug font-medium mt-0.5">Track progress.<br/>See growth.<br/>Stay motivated.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section id="hoshi-overview">
          <div className="hoshi-container" style={{maxWidth: '1350px'}}>
            
            {/* Download App Promo Image */}
            <div className="flex justify-center w-full mb-12 -mt-4 sm:-mt-8">
              <a 
                href="https://play.google.com/store/apps/details?id=com.hoshiyaarlearning.app" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block max-w-6xl w-full mx-auto px-4 hover:scale-[1.02] transition-transform duration-300"
              >
                <img 
                  src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1782994536/img-to-link/xdp3hhmspqxhkx6584oo.webp" 
                  alt="Download HoshiYaar App" 
                  className="w-full h-auto rounded-3xl shadow-2xl"
                />
              </a>
            </div>

            <div className="section-label-center">
              <span style={{color: '#ea580c', fontSize: '16px'}}>🎉</span> HOW HOSHIYAAR WORKS <span style={{color: '#ea580c', fontSize: '16px'}}>🎉</span>
            </div>

            <div className="overview-timeline">
              <div className="timeline-step t1">
                <div className="timeline-header">
                  <div className="timeline-badge">1</div>
                  <div className="timeline-title">Spark Curiosity</div>
                </div>
                <div className="timeline-icon">🪐</div>
                <p className="timeline-desc">Every concept begins with a story, comic, video or question.</p>
              </div>
              <div className="timeline-arrow">→</div>
              <div className="timeline-step t2">
                <div className="timeline-header">
                  <div className="timeline-badge">2</div>
                  <div className="timeline-title">Explain Simply</div>
                </div>
                <div className="timeline-icon">💻</div>
                <p className="timeline-desc">Concepts are explained in short, clear steps with visuals &amp; examples.</p>
              </div>
              <div className="timeline-arrow">→</div>
              <div className="timeline-step t3">
                <div className="timeline-header">
                  <div className="timeline-badge">3</div>
                  <div className="timeline-title">Practice<br/>Immediately</div>
                </div>
                <div className="timeline-icon">🎯</div>
                <p className="timeline-desc">Students solve questions right after learning.</p>
              </div>
              <div className="timeline-arrow">→</div>
              <div className="timeline-step t4">
                <div className="timeline-header">
                  <div className="timeline-badge">4</div>
                  <div className="timeline-title">Fix the Gaps</div>
                </div>
                <div className="timeline-icon">🧩</div>
                <p className="timeline-desc">Mistakes are identified and concepts are strengthened.</p>
              </div>
              <div className="timeline-arrow">→</div>
              <div className="timeline-step t5">
                <div className="timeline-header">
                  <div className="timeline-badge">5</div>
                  <div className="timeline-title">Revise Smartly</div>
                </div>
                <div className="timeline-icon">🧠</div>
                <p className="timeline-desc">Daily recall, notes, memory tools and revision cycles help you remember.</p>
              </div>
              <div className="timeline-arrow">→</div>
              <div className="timeline-step t6">
                <div className="timeline-header">
                  <div className="timeline-badge">6</div>
                  <div className="timeline-title">Become<br/>Exam-Ready</div>
                </div>
                <div className="timeline-icon">📝</div>
                <p className="timeline-desc">Clear, writeable answers for every scoring question.</p>
              </div>
            </div>

            <div className="overview-bottom-grid">
              {/* Left Side: Squad */}
              <div className="overview-squad">
                <div className="section-label-center" style={{marginBottom: '24px'}}>
                  <span style={{color: '#facc15', fontSize: '16px'}}>✨</span> MEET THE HOSHIYAAR SQUAD <span style={{color: '#facc15', fontSize: '16px'}}>✨</span>
                </div>
                <div className="squad-grid">
                  <div className="squad-card" style={{backgroundColor: '#fffbeb'}}>
                    <div className="squad-avatar"><img src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1779100397/img-to-link/rtyoddo8fjqspbtngsri.webp" alt="Hoshi" /></div>
                    <div className="squad-name">Hoshi</div>
                    <div className="squad-role" style={{color: '#2563eb', backgroundColor: '#dbeafe'}}>The Calm Thinker</div>
                    <p className="squad-desc">Notices strange clues and reveals the real science. Never rushes. Always right.</p>
                  </div>
                  <div className="squad-card" style={{backgroundColor: '#faf5ff'}}>
                    <div className="squad-avatar"><img src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1779100398/img-to-link/ayqvapvovlppgkniud7k.webp" alt="Myra" /></div>
                    <div className="squad-name">Myra</div>
                    <div className="squad-role" style={{color: '#7c3aed', backgroundColor: '#ede9fe'}}>The Sharp Verifier</div>
                    <p className="squad-desc">Checks every piece of evidence. Keeps the logic clean. Doesn't accept guesses.</p>
                  </div>
                  <div className="squad-card" style={{backgroundColor: '#eff6ff'}}>
                    <div className="squad-avatar"><img src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1779100399/img-to-link/cgel5nvus6jbhxlbghhu.webp" alt="Ruhaan" /></div>
                    <div className="squad-name">Ruhaan</div>
                    <div className="squad-role" style={{color: '#4f46e5', backgroundColor: '#e0e7ff'}}>The Live Reaction</div>
                    <p className="squad-desc">Says exactly what students are thinking when something surprising happens.</p>
                  </div>
                  <div className="squad-card" style={{backgroundColor: '#f0fdf4'}}>
                    <div className="squad-avatar"><img src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1779100396/img-to-link/rqwxrpdymyzbhqd74eiy.webp" alt="Babloo" /></div>
                    <div className="squad-name">Babloo</div>
                    <div className="squad-role" style={{color: '#ea580c', backgroundColor: '#ffedd5'}}>The Funny Wrong Guess</div>
                    <p className="squad-desc">Voices the common misconception — so students recognize it and never forget it.</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Features */}
              <div className="overview-features">
                <div className="section-label-center" style={{marginBottom: '24px'}}>
                  <span style={{color: '#38bdf8', fontSize: '16px'}}>✨</span> WHY HOSHIYAAR IS DIFFERENT <span style={{color: '#38bdf8', fontSize: '16px'}}>✨</span>
                </div>
                <div className="why-card">
                  <ul className="why-list">
                    <li><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#ea580c"/><path d="M8 12.5l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> We turn textbook science into exciting stories.</li>
                    <li><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#ea580c"/><path d="M8 12.5l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> We explain concepts in the simplest way.</li>
                    <li><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#3b82f6"/><path d="M8 12.5l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> We make practice fun, quick and effective.</li>
                    <li><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#a855f7"/><path d="M8 12.5l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> We help you remember more with smart revision.</li>
                    <li><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#6366f1"/><path d="M8 12.5l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> We prepare you to write better answers in exams.</li>
                    <li><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#ef4444"/><path d="M8 12.5l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> We build confidence, not pressure.</li>
                  </ul>
                  <div className="why-highlight">
                    <div className="why-highlight-text">
                      <p>Stories make them curious.</p>
                      <p>Videos make it clear.</p>
                      <p>Practice makes it stick.</p>
                      <p>Revision makes it strong.</p>
                      <p>Answers make it exam-ready.</p>
                    </div>
                    <div className="why-highlight-icon">🎯</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="explore-universe-class" className="bg-white">
          <div className="explore-section">
            
            {/* Left Panel: Explore the Universe */}
            <div className="explore-universe">
              <div className="explore-header">
                <span>✨</span> EXPLORE THE HOSHIYAAR UNIVERSE <span>✨</span>
              </div>
              
              <div className="universe-cards no-scrollbar">
                {/* Card 1 */}
                <div className="universe-card cursor-pointer" onClick={() => window.open('https://www.youtube.com/watch?v=c84VSEESrxs', '_blank')}>
                  <div className="universe-card-thumb">
                    <div className="universe-badge badge-new">NEW</div>
                    <iframe 
                      src="https://www.youtube.com/embed/c84VSEESrxs?rel=0&controls=0&showinfo=0" 
                      title="The Ice That Refused to Warm" 
                    ></iframe>
                  </div>
                  <h3 className="universe-card-title">The Ice That Refused to Warm</h3>
                  <div className="universe-card-meta">
                    <span>Class 7 • Physics</span>
                    <span>5 min</span>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="universe-card cursor-pointer" onClick={() => window.open('https://www.youtube.com/watch?v=k1gqmgQTo4o', '_blank')}>
                  <div className="universe-card-thumb">
                    <div className="universe-badge badge-popular">POPULAR</div>
                    <iframe 
                      src="https://www.youtube.com/embed/k1gqmgQTo4o?rel=0&controls=0&showinfo=0" 
                      title="The Lying Thermometer" 
                    ></iframe>
                  </div>
                  <h3 className="universe-card-title">The Lying Thermometer</h3>
                  <div className="universe-card-meta">
                    <span>Class 6 • Physics</span>
                    <span>4 min</span>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="universe-card cursor-pointer" onClick={() => window.open('https://www.youtube.com/watch?v=ifzB21ipoPw', '_blank')}>
                  <div className="universe-card-thumb">
                    <div className="universe-badge badge-booster">EXAM BOOSTER</div>
                    <iframe 
                      src="https://www.youtube.com/embed/ifzB21ipoPw?rel=0&controls=0&showinfo=0" 
                      title="The Spoon That Burned Babloo" 
                    ></iframe>
                  </div>
                  <h3 className="universe-card-title">The Spoon That Burned Babloo</h3>
                  <div className="universe-card-meta">
                    <span>Class 5 • Science</span>
                    <span>6 min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Explore by Class */}
            <div className="explore-class">
              <div className="explore-header" style={{color: '#334155'}}>
                <span style={{color: '#94a3b8'}}>✨</span> EXPLORE BY CLASS <span style={{color: '#94a3b8'}}>✨</span>
              </div>
              
              <div className="class-cards">
                {/* Class 6 */}
                <div className="class-card class-card-6" onClick={() => window.location.href = '/signup'}>
                  <div className="class-card-title">Class 6</div>
                  <div className="class-card-icon">🪐</div>
                  <p className="class-card-desc">Build strong foundations</p>
                  <div className="class-card-link">Explore <span>→</span></div>
                </div>

                {/* Class 7 */}
                <div className="class-card class-card-7" onClick={() => window.location.href = '/signup'}>
                  <div className="class-card-title">Class 7</div>
                  <div className="class-card-icon">🪐</div>
                  <p className="class-card-desc">Understand deeper concepts</p>
                  <div className="class-card-link">Explore <span>→</span></div>
                </div>

                {/* Class 8 */}
                <div className="class-card class-card-8" onClick={() => window.location.href = '/signup'}>
                  <div className="class-card-title">Class 8</div>
                  <div className="class-card-icon">🪐</div>
                  <p className="class-card-desc">Master topics with confidence</p>
                  <div className="class-card-link">Explore <span>→</span></div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* MISSION & TESTIMONIALS SECTION */}
        <section id="mission-testimonials" className="bg-white">
          <div className="explore-section" style={{ paddingTop: '0' }}>
            {/* Full Width Panel: Testimonials */}
            <div className="testimonials-panel" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', background: 'white' }}>
              <div className="explore-header" style={{ color: '#1e293b', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div><span style={{color: '#ef4444'}}>✨</span> WHAT OUR LEARNERS SAY <span style={{color: '#ef4444'}}>✨</span></div>
                <a href="https://play.google.com/store/apps/details?id=com.hoshiyaarlearning.app" target="_blank" rel="noreferrer" className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold px-6 py-2 rounded-lg shadow-sm transition-transform hover:-translate-y-1" style={{ fontSize: '14px', textDecoration: 'none' }}>
                  Download Our App ➔
                </a>
              </div>
              <div 
                className="no-scrollbar" 
                style={{ display: 'flex', gap: '16px', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: '8px' }}
                onScroll={(e) => {
                  const container = e.target;
                  const scrollPos = container.scrollLeft;
                  const cardWidth = container.offsetWidth / 4; // Since 4 cards are visible
                  const newIndex = Math.round(scrollPos / cardWidth);
                  setActiveReviewIdx(newIndex);
                }}
              >
                {testimonials.map((t, idx) => {
                  // Assign a consistent pastel background based on index
                  const bgColors = ['ffdfbf', 'c0aede', 'b6e3f4', 'ffd1d1', 'c1f0c1', 'f3d0f5'];
                  const bgColor = bgColors[idx % bgColors.length];
                  
                  const isExpanded = expandedReviews[idx];
                  
                  return (
                    <div key={idx} style={{ flex: '0 0 auto', minWidth: 'calc(25% - 12px)', maxWidth: 'calc(25% - 12px)', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '13px', color: '#475569', scrollSnapAlign: 'start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.name}&backgroundColor=${bgColor}`} style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt={t.name} />
                        <div>
                          <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '14px' }}>{t.role}</div>
                          <div style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{t.name}, {t.subtext}</div>
                        </div>
                      </div>
                      <p style={{ fontWeight: 500, lineHeight: 1.5, marginBottom: '16px' }}>
                        {t.review.length > 200 && !isExpanded ? (
                          <>
                            {t.review.substring(0, 200)}...{' '}
                            <span onClick={() => toggleReview(idx)} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 800 }}>more</span>
                          </>
                        ) : (
                          <>
                            "{t.review}"
                            {t.review.length > 200 && isExpanded && (
                              <span onClick={() => toggleReview(idx)} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 800 }}>{' '}less</span>
                            )}
                          </>
                        )}
                      </p>
                      <div style={{ color: '#facc15', fontSize: '16px' }}>★★★★★</div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px', flexWrap: 'wrap', padding: '0 16px' }}>
                {testimonials.map((_, idx) => (
                  // Only show dots up to the point where the last card is fully visible
                  idx < testimonials.length - 1 && (
                    <div 
                      key={idx} 
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: idx === activeReviewIdx ? '#2563eb' : '#e2e8f0',
                        transition: 'background-color 0.3s ease'
                      }} 
                    />
                  )
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA BANNER SECTION */}
        <section id="cta-banner" className="bg-white" style={{ paddingBottom: '80px' }}>
          <div style={{ maxWidth: '1350px', margin: '0 auto', padding: '0 clamp(16px, 5vw, 64px)' }}>
            <div style={{ background: '#f8f5ff', borderRadius: '24px', padding: '32px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e9d5ff', position: 'relative', overflow: 'hidden' }}>
              
              {/* Decorative bg items */}
              <div style={{ position: 'absolute', top: '15%', left: '5%', fontSize: '32px', opacity: 0.4, filter: 'grayscale(1)' }}>🧪</div>
              <div style={{ position: 'absolute', bottom: '15%', right: '8%', fontSize: '36px', opacity: 0.3, color: '#a855f7' }}>✨</div>
              <div style={{ position: 'absolute', top: '25%', right: '18%', fontSize: '28px', opacity: 0.6, color: '#eab308' }}>⭐</div>
              <div style={{ position: 'absolute', bottom: '25%', left: '18%', fontSize: '40px', opacity: 0.1 }}>⚛️</div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '32px', zIndex: 2 }}>
                <img src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1779100399/img-to-link/cgel5nvus6jbhxlbghhu.webp" alt="Ruhaan" style={{ width: '110px', height: '110px', objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))' }} />
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#1e3a8a', marginBottom: '8px', fontFamily: 'Instrument Sans' }}>Ready to level up your science game?</h2>
                  <p style={{ fontSize: '18px', color: '#475569', fontWeight: 600 }}>One topic. One mission. One exam-ready answer.</p>
                </div>
              </div>

              <div style={{ zIndex: 2, marginLeft: 'auto' }}>
                <button onClick={() => window.location.href = '/signup'} className="bg-[#facc15] hover:bg-[#eab308] text-[#4527A0] font-extrabold px-8 py-4 rounded-xl shadow-md transition-transform hover:scale-105 text-[18px] flex items-center gap-2">
                  Start Learning Now 🚀
                </button>
              </div>

            </div>
          </div>
        </section>


      </main>

      <a href="#top" className="back-to-top" id="backToTop" onClick={(e) => handleSmoothScroll(e, '#hoshi-hero')}>↑</a>
      <div className={`toast ${showToast ? 'show' : ''}`} id="toast"><span>✓</span> <span id="toastMsg">{toastMsg}</span></div>
    </div>
  );
};

export default DesktopHome;
