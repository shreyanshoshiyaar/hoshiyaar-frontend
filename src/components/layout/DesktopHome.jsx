// src/components/layout/DesktopHome.jsx
import React, { useEffect, useState } from 'react';
import './DesktopHome.css';

const DesktopHome = () => {
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

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
              <div className="inline-block bg-[#EBF4FF] text-[#1D4ED8] font-bold px-4 py-1.5 rounded-full text-[13px] tracking-wide mb-6 border border-[#BFDBFE]">
                FOR CLASS 6–8
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
                  Start Learning 🚀
                </a>
                <a href="#hoshi-cases" onClick={(e) => handleSmoothScroll(e, '#hoshi-cases')} className="bg-white hover:bg-slate-50 text-[#1E3A8A] font-bold text-[16px] px-8 py-4 rounded-xl transition-all border border-[#CBD5E1] shadow-sm hover:border-[#94A3B8]">
                  Explore the Universe
                </a>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <img className="w-[42px] h-[42px] rounded-full border-2 border-white object-cover shadow-sm bg-blue-100" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4" alt="Student" />
                  <img className="w-[42px] h-[42px] rounded-full border-2 border-white object-cover shadow-sm bg-purple-100" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede" alt="Student" />
                  <img className="w-[42px] h-[42px] rounded-full border-2 border-white object-cover shadow-sm bg-orange-100" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn&backgroundColor=ffdfbf" alt="Student" />
                  <img className="w-[42px] h-[42px] rounded-full border-2 border-white object-cover shadow-sm bg-green-100" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Liam&backgroundColor=d1d4f9" alt="Student" />
                </div>
                <p className="text-[13px] text-slate-500 font-medium max-w-[200px] leading-snug">
                  <span className="text-[#1E3A8A] font-bold">50,000+</span> students learning<br/>and growing every day!
                </p>
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

        <div id="hoshi-ticker">
          <div className="ticker-track">
            <div className="ticker-item">🔍 One mystery at a time</div>
            <div className="ticker-item">🎵 Songs that stick</div>
            <div className="ticker-item">🧪 Concepts that click</div>
            <div className="ticker-item">🏆 Exam-ready answers</div>
            <div className="ticker-item">📱 Practice app — coming soon</div>
            <div className="ticker-item" style={{fontSize: '1.2rem', fontWeight: 'bold'}}>✦ CBSE Classes 6–8</div>
            <div className="ticker-item">🌟 Curiosity that grows</div>
            <div className="ticker-item">🔍 One mystery at a time</div>
            <div className="ticker-item">🎵 Songs that stick</div>
            <div className="ticker-item">🧪 Concepts that click</div>
            <div className="ticker-item">🏆 Exam-ready answers</div>
            <div className="ticker-item">📱 Practice app — coming soon</div>
            <div className="ticker-item" style={{fontSize: '1.2rem', fontWeight: 'bold'}}>✦ CBSE Classes 6–8</div>
            <div className="ticker-item">🌟 Curiosity that grows</div>
          </div>
        </div>

        <section id="hoshi-forget" className="hoshi-section">
          <div className="hoshi-container">
            <div className="reveal" style={{textAlign:'center',marginBottom:'clamp(36px,5vw,64px)'}}>
              <div className="section-label">The Problem</div>
              <h2 className="fraunces" style={{fontSize:'clamp(2rem,4vw,3rem)',fontWeight:900,letterSpacing:'-.03em',color:'var(--ink)',marginBottom:'14px'}}>
                Why students forget science<br/><em style={{color:'var(--blue)', fontStyle: 'italic'}}>the moment exams begin</em>
              </h2>
              <p style={{color:'var(--ink3)',fontSize:'1.05rem',maxWidth:'480px',margin:'0 auto'}}>It's not ability. It's how science is usually taught.</p>
            </div>
            <div className="forget-grid">
              <div className="hoshi-card forget-card reveal d1">
                <div className="forget-icon">📖</div>
                <div><div className="forget-title">They read, not understand</div><div className="forget-desc">Textbooks give definitions. Hoshiyaar gives the 'why' behind them — understanding first, always.</div></div>
              </div>
              <div className="hoshi-card forget-card reveal d2">
                <div className="forget-icon">🔄</div>
                <div><div className="forget-title">They memorize, not connect</div><div className="forget-desc">Facts without stories vanish overnight. Stories build lasting, retrievable memory.</div></div>
              </div>
              <div className="hoshi-card forget-card reveal d3">
                <div className="forget-icon">😴</div>
                <div><div className="forget-title">The explanation bores them</div><div className="forget-desc">Science chapters feel like walls of text. A mystery pulls students in before they know they're learning.</div></div>
              </div>
              <div className="hoshi-card forget-card reveal d4">
                <div className="forget-icon">✏️</div>
                <div><div className="forget-title">Nobody shows how to write answers</div><div className="forget-desc">Knowing a concept and writing it clearly in an exam are two completely different skills. Hoshiyaar bridges both.</div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="hoshi-meet" className="hoshi-section">
          <div className="hoshi-container" style={{maxWidth:'900px'}}>
            <div className="reveal" style={{textAlign:'center',marginBottom:'52px'}}>
              <div className="section-label">What is Hoshiyaar</div>
              <h2 className="fraunces" style={{fontSize:'clamp(2rem,4vw,3rem)',fontWeight:900,letterSpacing:'-.03em',color:'var(--ink)',marginBottom:'18px'}}>
                Not a course. Not a chapter.<br/><span className="shimmer">A way of thinking about science.</span>
              </h2>
              <p style={{color:'var(--ink3)',fontSize:'1.1rem',lineHeight:1.8,maxWidth:'580px',margin:'0 auto'}}>
                Hoshiyaar is built around one insight: <strong style={{color:'var(--ink)'}}>students remember what surprises them.</strong> So every concept starts as a mystery — and solves itself through curiosity.
              </p>
            </div>
            <div className="pillars">
              <div className="hoshi-card pillar reveal d1"><div className="pillar-num">01</div><div className="pillar-text">One mystery at a time</div></div>
              <div className="hoshi-card pillar reveal d2"><div className="pillar-num" style={{color:'var(--indigo)'}}>02</div><div className="pillar-text">One scoring concept at a time</div></div>
              <div className="hoshi-card pillar reveal d3"><div className="pillar-num" style={{color:'var(--amber)'}}>03</div><div className="pillar-text">One answer you can write in an exam</div></div>
            </div>
            <div className="quote-block reveal">
              <blockquote>
                <p className="quote-text">"Science should feel like discovery — not rote learning. Hoshiyaar starts with a mystery, builds curiosity, and lands at the concept. By the time the science is explained, you already want to know it."</p>
                <cite className="quote-cite">THE HOSHIYAAR PHILOSOPHY</cite>
              </blockquote>
            </div>
          </div>
        </section>

        <section id="hoshi-characters" className="hoshi-section">
          <div className="hoshi-container">
            <div className="reveal" style={{textAlign:'center',marginBottom:'52px'}}>
              <div className="section-label">The Cast</div>
              <h2 className="fraunces" style={{fontSize:'clamp(2rem,4vw,3rem)',fontWeight:900,letterSpacing:'-.03em',color:'var(--ink)',marginBottom:'14px'}}>Meet the <span style={{color:'var(--blue)'}}>characters</span></h2>
              <p style={{color:'var(--ink3)',fontSize:'1.05rem',maxWidth:'420px',margin:'0 auto'}}>Four voices that make science feel like a conversation — not a chapter.</p>
            </div>
            <div className="char-grid">
              <div className="hoshi-card char-card reveal-scale d1" style={{'--c-color':'var(--blue)','--c-bg':'var(--blue-lt)'}}>
                <div className="char-avatar">
                  <img src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1779100397/img-to-link/rtyoddo8fjqspbtngsri.webp" alt="Hoshi" />
                </div>
                <div className="char-name">Hoshi</div>
                <div className="char-role">The Calm Thinker</div>
                <p className="char-bio">Notices strange clues and reveals the real science. Never rushes. Always right.</p>
              </div>

              <div className="hoshi-card char-card reveal-scale d2" style={{'--c-color':'var(--indigo)','--c-bg':'var(--indigo-lt)'}}>
                <div className="char-avatar">
                  <img src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1779100398/img-to-link/ayqvapvovlppgkniud7k.webp" alt="Myra" />
                </div>
                <div className="char-name">Myra</div>
                <div className="char-role">The Sharp Verifier</div>
                <p className="char-bio">Checks every piece of evidence. Keeps the logic clean. Doesn't accept guesses.</p>
              </div>

              <div className="hoshi-card char-card reveal-scale d3" style={{'--c-color':'var(--rose)','--c-bg':'var(--rose-lt)'}}>
                <div className="char-avatar">
                  <img src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1779100399/img-to-link/cgel5nvus6jbhxlbghhu.webp" alt="Ruhaan" />
                </div>
                <div className="char-name">Ruhaan</div>
                <div className="char-role">The Live Reaction</div>
                <p className="char-bio">Says exactly what students are thinking when something surprising happens.</p>
              </div>

              <div className="hoshi-card char-card reveal-scale d4" style={{'--c-color':'var(--amber)','--c-bg':'var(--amber-lt)'}}>
                <div className="char-avatar">
                  <img src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1779100396/img-to-link/rqwxrpdymyzbhqd74eiy.webp" alt="Babloo" />
                </div>
                <div className="char-name">Babloo</div>
                <div className="char-role">The Funny Wrong Guess</div>
                <p className="char-bio">Voices the common misconception — so students recognize it and never forget it.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="hoshi-features" className="hoshi-section">
          <div className="hoshi-container">
            <div className="reveal" style={{textAlign:'center',marginBottom:'52px'}}>
              <div className="section-label">How It's Built</div>
              <h2 className="fraunces" style={{fontSize:'clamp(2rem,4vw,3rem)',fontWeight:900,letterSpacing:'-.03em',color:'var(--ink)',marginBottom:'14px'}}>More than just <span style={{color:'var(--amber)'}}>explanation</span></h2>
              <p style={{color:'var(--ink3)',fontSize:'1.05rem',maxWidth:'460px',margin:'0 auto'}}>Every Hoshiyaar mystery is built to do four things — in the right order.</p>
            </div>
            <div className="feat-grid">
              <div className="hoshi-card feat-card reveal d1"><div className="feat-icon" style={{background:'var(--blue-lt)',border:'1px solid rgba(30,101,250,.2)'}}>🔍</div><div className="feat-title">Detective Mysteries</div><p className="feat-desc">Every concept hides inside a genuine puzzle. You want to solve it before the science reveals itself.</p></div>
              <div className="hoshi-card feat-card reveal d2"><div className="feat-icon" style={{background:'var(--amber-lt)',border:'1px solid rgba(224,123,42,.2)'}}>🎵</div><div className="feat-title">Songs That Stick</div><p className="feat-desc">Catchy, rhythmic mnemonics built around scoring concepts. You'll hum them during the exam.</p></div>
              <div className="hoshi-card feat-card reveal d3"><div className="feat-icon" style={{background:'var(--indigo-lt)',border:'1px solid rgba(79,94,199,.2)'}}>🧠</div><div className="feat-title">Memory Hooks</div><p className="feat-desc">Vivid, specific associations that build retrieval — not just vague recognition.</p></div>
              <div className="hoshi-card feat-card reveal d4"><div className="feat-icon" style={{background:'var(--rose-lt)',border:'1px solid rgba(201,79,58,.2)'}}>✏️</div><div className="feat-title">Exam-Ready Answers</div><p className="feat-desc">Structured natural-language answers students can actually write in their answer sheets.</p></div>
              <div className="hoshi-card feat-card reveal d5"><div className="feat-icon" style={{background:'var(--amber-lt)',border:'1px solid rgba(224,123,42,.2)'}}>⚡</div><div className="feat-title">Curiosity First</div><p className="feat-desc">The "why does this happen?" comes before the definition. Always. Without exception.</p></div>
              <div className="hoshi-card feat-card reveal d6"><div className="feat-icon" style={{background:'var(--blue-lt)',border:'1px solid rgba(30,101,250,.2)'}}>📱</div><div className="feat-title">Practice App — Soon</div><p className="feat-desc">Adaptive practice per concept. Track recall, revisit mysteries, and prep for exams systematically.</p></div>
            </div>
          </div>
        </section>

        <section id="hoshi-steps" className="hoshi-section">
          <div className="hoshi-container">
            <div className="reveal" style={{textAlign:'center',marginBottom:'52px'}}>
              <div className="section-label">The Process</div>
              <h2 className="fraunces" style={{fontSize:'clamp(2rem,4vw,3rem)',fontWeight:900,letterSpacing:'-.03em',color:'var(--ink)'}}>How <span style={{color:'var(--blue)'}}>Hoshiyaar</span> works</h2>
            </div>
            <div className="step-grid">
              <div className="hoshi-card step-card reveal d1" style={{'--c-color':'var(--blue)'}}><div className="step-num">01</div><div className="step-title">A Mystery Drops</div><p className="step-desc">Something strange happens. Ice refuses to warm. A thermometer lies. Students want to know why.</p></div>
              <div className="hoshi-card step-card reveal d2" style={{'--c-color':'var(--indigo)'}}><div className="step-num">02</div><div className="step-title">Characters React</div><p className="step-desc">Ruhaan panics. Babloo guesses wrong. Myra investigates. Hoshi quietly connects the clues.</p></div>
              <div className="hoshi-card step-card reveal d3" style={{'--c-color':'var(--amber)'}}><div className="step-num">03</div><div className="step-title">Science Reveals Itself</div><p className="step-desc">The concept unfolds naturally — no definitions first, no walls of text. Just understanding.</p></div>
              <div className="hoshi-card step-card reveal d4" style={{'--c-color':'var(--rose)'}}><div className="step-num">04</div><div className="step-title">It Stays</div><p className="step-desc">A memory hook. A song. A crisp exam answer. The learning sticks — because it was never forced.</p></div>
            </div>
          </div>
        </section>

        <section id="hoshi-cases" className="hoshi-section">
          <div className="hoshi-container" style={{maxWidth:'1200px'}}>
            <div className="reveal" style={{textAlign:'center',marginBottom:'52px'}}>
              <div className="section-label">Open a Case</div>
              <h2 className="fraunces" style={{fontSize:'clamp(2rem,4vw,3rem)',fontWeight:900,letterSpacing:'-.03em',color:'var(--ink)',marginBottom:'14px'}}>First <span style={{color:'var(--rose)'}}>mysteries</span></h2>
              <p style={{color:'var(--ink3)',fontSize:'1.05rem',maxWidth:'460px',margin:'0 auto'}}>Real CBSE concepts hiding inside genuine science puzzles. Our first mystery cases are on their way.</p>
            </div>
            
            <div className="cases-grid">
              <div className="case-video-card reveal-scale d1" style={{'--c-color':'var(--blue)'}}>
                <div className="case-video-thumb">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/c84VSEESrxs?rel=0" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
                  ></iframe>
                </div>
                <div className="case-video-body">
                  <div className="case-video-tag">Heat &amp; Latent Heat <span>· Class 7</span></div>
                  <h3 className="case-video-title">The Ice That Refused to Warm</h3>
                  <p className="case-video-desc">Why does ice water stay cold for so long, even in a 35°C room? Babloo is confused. Hoshi has the answer.</p>
                </div>
              </div>
              
              <div className="case-video-card reveal-scale d2" style={{'--c-color':'var(--indigo)'}}>
                <div className="case-video-thumb">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/k1gqmgQTo4o?rel=0" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
                  ></iframe>
                </div>
                <div className="case-video-body">
                  <div className="case-video-tag">Measurement &amp; Error <span>· Class 6</span></div>
                  <h3 className="case-video-title">The Lying Thermometer</h3>
                  <p className="case-video-desc">Two thermometers. Same room. Different readings. Myra opens an investigation to find the truth.</p>
                </div>
              </div>
              
              <div className="case-video-card reveal-scale d3" style={{'--c-color':'var(--amber)'}}>
                <div className="case-video-thumb">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/ifzB21ipoPw?rel=0" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
                  ></iframe>
                </div>
                <div className="case-video-body">
                  <div className="case-video-tag">Conduction &amp; Materials <span>· Class 5</span></div>
                  <h3 className="case-video-title">The Spoon That Burned Babloo</h3>
                  <p className="case-video-desc">Same boiling water. Metal spoon vs wooden stick. Babloo grabbed the wrong one. Ouch!</p>
                </div>
              </div>
            </div>
          </div>
        </section>



        <section id="hoshi-audience" className="hoshi-section">
          <div className="hoshi-container" style={{maxWidth:'960px'}}>
            <div className="reveal" style={{textAlign:'center',marginBottom:'52px'}}>
              <div className="section-label">Audience</div>
              <h2 className="fraunces" style={{fontSize:'clamp(2rem,4vw,3rem)',fontWeight:900,letterSpacing:'-.03em',color:'var(--ink)'}}>Who it's <span style={{color:'var(--blue)'}}>built for</span></h2>
            </div>
            <div className="audience-grid">
              <div className="hoshi-card audience-card reveal-scale d1"><div className="audience-emoji">🎒</div><div className="audience-title" style={{fontSize: '1.4rem'}}>Students in Classes 6–8</div><p className="audience-desc">CBSE science explained in ways that make sense — and stay with you through exams and beyond.</p></div>
              <div className="hoshi-card audience-card reveal-scale d2"><div className="audience-emoji">👨👩👧</div><div className="audience-title">Parents who want more than marks</div><p className="audience-desc">Hoshiyaar builds curiosity alongside scores. Students who understand don't just pass — they remember.</p></div>
              <div className="hoshi-card audience-card reveal-scale d3"><div className="audience-emoji">👩🏫</div><div className="audience-title">Teachers who love science</div><p className="audience-desc">A supplementary resource that adds the 'why' behind every chapter — through story, song, and mystery.</p></div>
            </div>
          </div>
        </section>

        <section id="hoshi-app">
          <div className="app-glow-1"></div>
          <div className="app-glow-2"></div>
          <div className="app-content">
            <div className="app-layout">
              <div className="reveal-left">
                <div className="app-badge-wrapper"><div className="app-badge"><div className="app-badge-dot"></div><span className="app-badge-text">COMING SOON</span></div></div>
                <h2 className="app-title">Practice. Anywhere.<br/><span>The Hoshiyaar App.</span></h2>
                <p className="app-desc">Adaptive practice linked to every mystery. Track recall. Revisit cases that tripped you up. Strengthen your memory before exam season — not during it.</p>
                <div className="app-features">
                  <div className="app-feature"><div className="app-check">✓</div> Practice questions per concept</div>
                  <div className="app-feature"><div className="app-check">✓</div> Track your recall over time</div>
                  <div className="app-feature"><div className="app-check">✓</div> Revisit mysteries you found hard</div>
                  <div className="app-feature"><div className="app-check">✓</div> Exam-mode timed sessions</div>
                </div>
                <form className="app-notify-form" id="notifyForm" onSubmit={handleNotify}>
                  <input type="email" className="app-notify-input" placeholder="Enter your email for early access..." required />
                  <button type="submit" className="btn-notify">🔔 Notify Me</button>
                </form>
                <p className="app-note">🔒 No spam. Just one email when we launch.</p>
                <div className="app-platforms">
                  <div className="platform-badge"><span className="platform-badge-icon">📱</span> iOS — Coming Soon</div>
                  <div className="platform-badge"><span className="platform-badge-icon">🤖</span> Android — Coming Soon</div>
                </div>
              </div>
              <div className="phone-wrap reveal-right">
                <div className="phone">
                  <div className="phone-notch"></div>
                  <div className="phone-inner">
                    <div className="phone-app-icon">⭐</div>
                    <div className="phone-app-name">Hoshiyaar</div>
                    <div className="phone-divider"></div>
                    <div className="phone-row phone-row-active">Today's Case <span>🔍</span></div>
                    <div className="phone-row phone-row-dim">My Progress <span>📈</span></div>
                    <div className="phone-row phone-row-dim">Saved Cases <span>📁</span></div>
                    <div className="phone-row phone-row-dim">Start Practice <span>⚡</span></div>
                    <div className="phone-cta">🚀 Coming Soon ✦</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="hoshi-cta">
          <div className="cta-grid-overlay"></div>
          <div className="cta-glow"></div>
          <div className="cta-inner reveal">
            <span className="cta-emoji">🔭</span>
            <h2 className="cta-h2">Start with one mystery.<br/><span className="shimmer">Change how you learn science.</span></h2>
            <p className="cta-desc">The first case is waiting. Ice that refuses to warm. A thermometer that lies. A spoon that burned Babloo. Pick your mystery — and let the science reveal itself.</p>
            <div className="cta-actions">
              <a className="btn-white" href="#hoshi-app" onClick={(e) => handleSmoothScroll(e, '#hoshi-app')}>Get Notified ✦</a>
              <a className="btn-white-ghost" href="#hoshi-cases" onClick={(e) => handleSmoothScroll(e, '#hoshi-cases')}>View Cases</a>
            </div>
            <p className="cta-note" style={{fontSize: '1.1rem'}}>Free to explore · CBSE Classes 6–8 · Coming soon</p>
          </div>
        </section>
      </main>

      <a href="#top" className="back-to-top" id="backToTop" onClick={(e) => handleSmoothScroll(e, '#hoshi-hero')}>↑</a>
      <div className={`toast ${showToast ? 'show' : ''}`} id="toast"><span>✓</span> <span id="toastMsg">{toastMsg}</span></div>
    </div>
  );
};

export default DesktopHome;
