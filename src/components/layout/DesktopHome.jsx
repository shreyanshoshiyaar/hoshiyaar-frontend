// src/components/layout/DesktopHome.jsx
import React, { useEffect, useState } from 'react';
import './DesktopHome.css';

const DesktopHome = () => {
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [typedText, setTypedText] = useState("");

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

    const video = document.getElementById('heroVideo');
    if (video) video.play().catch(() => {});

    // Typewriter effect
    const lines = ["Why won't the ice warm up?", "The thermometer is lying.", "A spoon burned Babloo.", "Science is full of mysteries."];
    let li = 0, ci = 0, del = false, done = false;
    let typeTimeout;

    const type = () => {
      if (done) return;
      const line = lines[li];
      if (!del && ci === line.length) { 
        if (li === lines.length - 1) { done = true; return; } 
        typeTimeout = setTimeout(() => { del = true; type(); }, 1500); 
        return; 
      }
      if (del && ci === 0) { del = false; li++; type(); return; }
      
      setTypedText(del ? line.slice(0, ci - 1) : line.slice(0, ci + 1));
      ci += del ? -1 : 1;
      typeTimeout = setTimeout(type, del ? 22 : 42);
    };
    
    typeTimeout = setTimeout(type, 800);

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(typeTimeout);
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
        <section id="hoshi-hero">
          <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle,rgba(30,101,250,.06) 1px,transparent 1px)',backgroundSize:'28px 28px',pointerEvents:'none'}}></div>
          <div style={{position:'absolute',top:'10%',right:'-5%',width:'600px',height:'600px',background:'radial-gradient(circle,rgba(30,101,250,.1),transparent 65%)',borderRadius:'50%',filter:'blur(60px)',pointerEvents:'none'}}></div>
          <div style={{position:'absolute',bottom:0,left:'-8%',width:'700px',height:'500px',background:'radial-gradient(circle,rgba(79,94,199,.08),transparent 65%)',borderRadius:'50%',filter:'blur(80px)',pointerEvents:'none'}}></div>

          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-badge">
                <div className="hero-badge-dot"></div>
                <span className="hero-badge-text">CBSE · CLASSES 3–7 · SCIENCE</span>
              </div>

              <h1 className="hero-h1">Don't memorize</h1>
              <h1 className="hero-h1 shimmer">science.</h1>
              <h1 className="hero-h1" style={{marginBottom:'28px'}}>Solve it. Remember it.</h1>

              <div className="hero-typewriter">
                <span className="q">?</span>
                <span>{typedText}</span><span className="cursor"></span>
              </div>

              <p className="hero-desc">
                Hoshiyaar turns CBSE science into detective mysteries, sticky songs, and memory hooks — so students actually understand concepts and write great exam answers.
              </p>

              <div className="hero-actions">
                <a className="btn-primary btn-blue" href="#hoshi-cases" onClick={(e) => handleSmoothScroll(e, '#hoshi-cases')}>Explore Hoshiyaar ✦</a>
                <a className="btn-ghost" href="#hoshi-cases" onClick={(e) => handleSmoothScroll(e, '#hoshi-cases')}>▶ Watch the First Mystery</a>
              </div>

              <div className="hero-trust">
                <div className="hero-trust-item"><span>🔍</span> Mystery-first learning</div>
                <div className="hero-trust-item"><span>🎵</span> Songs &amp; hooks</div>
                <div className="hero-trust-item"><span>✏️</span> Exam-ready answers</div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="orbit-container">
                <div className="orbit-ring"></div>
                
                <div className="orbit-icon">
                  <img src="https://peru-dinosaur-951137.hostingersite.com/wp-content/uploads/2026/03/Pencil.png" alt="Pencil" />
                </div>
                <div className="orbit-icon">
                  <img src="https://peru-dinosaur-951137.hostingersite.com/wp-content/uploads/2026/03/Idea.png" alt="Idea" />
                </div>
                <div className="orbit-icon">
                  <img src="https://peru-dinosaur-951137.hostingersite.com/wp-content/uploads/2026/03/Tubes.png" alt="Tubes" />
                </div>
                <div className="orbit-icon">
                  <img src="https://peru-dinosaur-951137.hostingersite.com/wp-content/uploads/2026/03/Test-Tue.png" alt="Test Tube" />
                </div>
                <div className="orbit-icon">
                  <img src="https://peru-dinosaur-951137.hostingersite.com/wp-content/uploads/2026/03/Microscope.png" alt="Microscope" />
                </div>
                
                <div className="hero-video-wrapper">
                  <div className="hero-video-inner">
                    <iframe 
                      style={{width: '100%', height: '100%', transform: 'scale(1.8)', pointerEvents: 'none'}}
                      src="https://www.youtube.com/embed/NlXk4BVxScI?autoplay=1&mute=1&loop=1&playlist=NlXk4BVxScI&controls=0&showinfo=0&rel=0&modestbranding=1" 
                      title="Hoshiyaar Science" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{position:'absolute',bottom:'32px',left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:'8px',opacity:'.35'}}>
            <span className="mono" style={{fontSize:'.6rem',letterSpacing:'.12em',color:'var(--muted)'}}>SCROLL</span>
            <div style={{width:'1px',height:'36px',background:'linear-gradient(to bottom,var(--blue),transparent)',animation:'desktop-pulse 2s ease-in-out infinite'}}></div>
          </div>
        </section>

        <div id="hoshi-ticker">
          <div className="ticker-track">
            <div className="ticker-item">🔍 One mystery at a time</div>
            <div className="ticker-item">🎵 Songs that stick</div>
            <div className="ticker-item">🧪 Concepts that click</div>
            <div className="ticker-item">🏆 Exam-ready answers</div>
            <div className="ticker-item">📱 Practice app — coming soon</div>
            <div className="ticker-item">✦ CBSE Classes 3–7</div>
            <div className="ticker-item">🌟 Curiosity that grows</div>
            <div className="ticker-item">🔍 One mystery at a time</div>
            <div className="ticker-item">🎵 Songs that stick</div>
            <div className="ticker-item">🧪 Concepts that click</div>
            <div className="ticker-item">🏆 Exam-ready answers</div>
            <div className="ticker-item">📱 Practice app — coming soon</div>
            <div className="ticker-item">✦ CBSE Classes 3–7</div>
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
                  <img src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778578700/img-to-link/wunxaopn4qfirxnfdwa6.webp" alt="Hoshi" />
                </div>
                <div className="char-name">Hoshi</div>
                <div className="char-role">The Calm Thinker</div>
                <p className="char-bio">Notices strange clues and reveals the real science. Never rushes. Always right.</p>
              </div>

              <div className="hoshi-card char-card reveal-scale d2" style={{'--c-color':'var(--indigo)','--c-bg':'var(--indigo-lt)'}}>
                <div className="char-avatar">
                  <img src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778579285/img-to-link/eqdx0kyjrhkruh0ownxd.webp" alt="Myra" />
                </div>
                <div className="char-name">Myra</div>
                <div className="char-role">The Sharp Verifier</div>
                <p className="char-bio">Checks every piece of evidence. Keeps the logic clean. Doesn't accept guesses.</p>
              </div>

              <div className="hoshi-card char-card reveal-scale d3" style={{'--c-color':'var(--rose)','--c-bg':'var(--rose-lt)'}}>
                <div className="char-avatar">
                  <img src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778567487/img-to-link/zy3aaizcfjl5qwm9ewjx.webp" alt="Ruhaan" />
                </div>
                <div className="char-name">Ruhaan</div>
                <div className="char-role">The Live Reaction</div>
                <p className="char-bio">Says exactly what students are thinking when something surprising happens.</p>
              </div>

              <div className="hoshi-card char-card reveal-scale d4" style={{'--c-color':'var(--amber)','--c-bg':'var(--amber-lt)'}}>
                <div className="char-avatar">
                  <img src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778567489/img-to-link/n9fo2moxpmfwyp04ueob.webp" alt="Babloo" />
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

        <section id="hoshi-explore" className="hoshi-section">
          <div className="hoshi-container">
            <div className="reveal" style={{textAlign:'center',marginBottom:'44px'}}>
              <div className="section-label">Explore</div>
              <h2 className="fraunces" style={{fontSize:'clamp(1.8rem,3.5vw,2.5rem)',fontWeight:900,letterSpacing:'-.03em',color:'var(--ink)',marginBottom:'12px'}}>What students can <span style={{color:'var(--indigo)'}}>discover</span></h2>
              <p style={{color:'var(--ink3)',fontSize:'1rem'}}>CBSE-aligned mystery cases across all major science themes, Classes 3–7.</p>
            </div>
            <div className="explore-grid reveal">
              <div className="hoshi-card explore-card"><div className="explore-emoji">🌡️</div><div className="explore-label">Heat &amp; Temperature</div></div>
              <div className="hoshi-card explore-card"><div className="explore-emoji">💡</div><div className="explore-label">Light &amp; Optics</div></div>
              <div className="hoshi-card explore-card"><div className="explore-emoji">⚡</div><div className="explore-label">Electricity</div></div>
              <div className="hoshi-card explore-card"><div className="explore-emoji">🧲</div><div className="explore-label">Magnetism</div></div>
              <div className="hoshi-card explore-card"><div className="explore-emoji">🧪</div><div className="explore-label">Chemical Changes</div></div>
              <div className="hoshi-card explore-card"><div className="explore-emoji">🌱</div><div className="explore-label">Life Processes</div></div>
              <div className="hoshi-card explore-card"><div className="explore-emoji">🌍</div><div className="explore-label">Our Universe</div></div>
              <div className="hoshi-card explore-card"><div className="explore-emoji">⚗️</div><div className="explore-label">Acids &amp; Bases</div></div>
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
              <div className="hoshi-card audience-card reveal-scale d1"><div className="audience-emoji">🎒</div><div className="audience-title">Students in Classes 3–7</div><p className="audience-desc">CBSE science explained in ways that make sense — and stay with you through exams and beyond.</p></div>
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
            <p className="cta-note">Free to explore · CBSE Classes 3–7 · Coming soon</p>
          </div>
        </section>
      </main>

      <a href="#top" className="back-to-top" id="backToTop" onClick={(e) => handleSmoothScroll(e, '#hoshi-hero')}>↑</a>
      <div className={`toast ${showToast ? 'show' : ''}`} id="toast"><span>✓</span> <span id="toastMsg">{toastMsg}</span></div>
    </div>
  );
};

export default DesktopHome;
