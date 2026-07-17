import React, { useState, useEffect, useRef } from 'react';
import api from '../../../services/apiClient';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const MAX_ATTEMPTS = 3;
const TIME_LIMIT = 300;

const ElectricCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let dots = [];
    const max = 70;
    let mouse = { x: null, y: null };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initDots();
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const getDistance = (x1, x2, y1, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

    class Dot {
      constructor() {
        this.init();
      }
      init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
      }
      draw() {
        const cx = mouse.x || canvas.width / 2;
        const cy = mouse.y || canvas.height / 2;

        // Draw faint energy line to center/mouse
        ctx.strokeStyle = "rgba(59, 130, 246, 0.08)";
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(cx, cy);
        ctx.stroke();

        let connectDistance = Math.min(canvas.width, canvas.height) / 5;

        for (let i = 0; i < dots.length; i++) {
          let d = dots[i];
          let dist = getDistance(this.x, d.x, this.y, d.y);
          if (dist < connectDistance) {
            ctx.globalCompositeOperation = "lighter";
            let alpha = 1 - (dist / connectDistance);
            ctx.strokeStyle = `rgba(147, 197, 253, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(d.x, d.y);
            ctx.stroke();
          }
        }
        ctx.globalCompositeOperation = "source-over";
        
        // Draw the dot itself
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        this.update();
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x >= canvas.width || this.x <= 0) this.vx *= -1;
        if (this.y >= canvas.height || this.y <= 0) this.vy *= -1;
      }
    }

    const initDots = () => {
      dots = [];
      for (let i = 0; i < max; i++) {
        dots.push(new Dot());
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(dot => dot.draw());
      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    handleResize();
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
};

const FireworksCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let animationFrameId;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      resetLines();
    };
    window.addEventListener('resize', handleResize);

    const add = (v1, v2) => ({ x: v1.x + v2.x, y: v1.y + v2.y });
    const sub = (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y });
    const mult = (v, n) => ({ x: v.x * n, y: v.y * n });
    const dist = (v1, v2) => Math.hypot(v1.x - v2.x, v1.y - v2.y);
    const normalize = (v) => {
      const d = Math.hypot(v.x, v.y);
      return d === 0 ? { x: 0, y: 0 } : { x: v.x / d, y: v.y / d };
    };

    let leftTip, rightTip, leftAnchor, rightAnchor;
    let collisionPoint = null;
    let exploded = false;
    let fireworks = [];
    let frameCount = 0;

    const LINE_SPEED = 3;
    const COLLIDE_DIST = 8;
    const PARTICLES_PER_FIREWORK = 120;
    const GRAVITY = 0.12;

    const resetLines = () => {
      leftAnchor = { x: 0, y: height * 0.35 + (Math.random() * 80 - 40) };
      rightAnchor = { x: width, y: height * 0.65 + (Math.random() * 80 - 40) };
      leftTip = { ...leftAnchor };
      rightTip = { ...rightAnchor };
      exploded = false;
      collisionPoint = null;
      fireworks = [];
      ctx.clearRect(0, 0, width, height);
    };

    class Particle {
      constructor(pos, vel, hue, speedFactor = 1) {
        this.pos = { ...pos };
        this.vel = mult(vel, speedFactor);
        this.hue = hue;
        this.age = 0;
        this.lifespan = Math.random() * 70 + 90;
        this.size = Math.random() * 2 + 2.5;
        this.trail = [];
      }
      update() {
        this.age++;
        this.vel.y += GRAVITY * 0.98;
        this.vel.x *= 0.995;
        this.vel.y *= 0.995;
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.trail.push({ ...this.pos });
        if (this.trail.length > 6) this.trail.shift();
      }
      draw(ctx) {
        for (let i = 0; i < this.trail.length; i++) {
          const t = i / this.trail.length;
          const alpha = (0.05 + t * 0.4) * (1 - this.age / this.lifespan);
          ctx.beginPath();
          ctx.fillStyle = `hsla(${this.hue}, 90%, 60%, ${alpha})`;
          const p = this.trail[i];
          ctx.arc(p.x, p.y, this.size * (0.6 + t), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.fillStyle = `hsla(${this.hue}, 95%, 70%, ${Math.max(0, 1 - this.age / this.lifespan)})`;
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
      isDead() { return this.age > this.lifespan; }
    }

    class Firework {
      constructor(origin, delayFrames = 0) {
        this.origin = { ...origin };
        this.particles = [];
        this.age = 0;
        this.delay = Math.max(0, delayFrames);
        this.launched = false;
        const hues = [Math.random()*30+10, Math.random()*60+200, Math.random()*50+90, Math.random()*40+280];
        this.hue = hues[Math.floor(Math.random() * hues.length)];
      }
      launch() {
        for (let i = 0; i < PARTICLES_PER_FIREWORK; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spread = Math.random() * 0.85 + 0.15;
          const speed = Math.random() * 5 + 2;
          const vx = Math.cos(angle) * speed * spread;
          const vy = Math.sin(angle) * speed * spread;
          const hueVar = this.hue + (Math.random() * 36 - 18);
          this.particles.push(new Particle(this.origin, { x: vx, y: vy }, hueVar, 1 + (Math.random() * 0.42 - 0.12)));
        }
        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3 + 1;
          const p = new Particle(this.origin, { x: Math.cos(angle)*speed, y: Math.sin(angle)*speed }, this.hue, Math.random() * 0.8 + 1.6);
          p.size = Math.random() * 3 + 3.5;
          p.lifespan *= 0.7;
          this.particles.push(p);
        }
        this.launched = true;
      }
      update() {
        this.age++;
        if (!this.launched) {
          if (this.age >= this.delay) this.launch();
          return;
        }
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.update();
          if (p.isDead()) this.particles.splice(i, 1);
        }
      }
      draw(ctx) {
        if (!this.launched) {
          ctx.beginPath();
          const alpha = 0.06 + ((Math.sin(this.age * 0.2) + 1) / 2) * 0.19;
          ctx.fillStyle = `hsla(${this.hue}, 95%, 60%, ${alpha})`;
          ctx.arc(this.origin.x, this.origin.y, 8 + Math.sin(this.age * 0.3) * 4, 0, Math.PI * 2);
          ctx.fill();
          return;
        }
        for (const p of this.particles) p.draw(ctx);
      }
      isDead() { return this.launched && this.particles.length === 0; }
    }

    const explode = (pos) => {
      for (let b = 0; b < 3; b++) {
        fireworks.push(new Firework(pos, b * 6));
      }
    };

    const moveTips = () => {
      let targetL = { x: width * 0.5, y: height * 0.5 + Math.sin(frameCount * 0.02) * 25 };
      let dirL = mult(normalize(sub(targetL, leftTip)), LINE_SPEED);
      leftTip = add(leftTip, dirL);

      let targetR = { x: width * 0.5, y: height * 0.5 + Math.cos(frameCount * 0.02) * 25 };
      let dirR = mult(normalize(sub(targetR, rightTip)), LINE_SPEED);
      rightTip = add(rightTip, dirR);

      leftTip.y += Math.sin(frameCount * 0.03 + 1) * 0.6;
      rightTip.y += Math.cos(frameCount * 0.03 + 2) * 0.6;
    };

    const drawLines = () => {
      ctx.lineCap = 'round';
      ctx.lineWidth = 10;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.beginPath();
      ctx.moveTo(leftAnchor.x, leftAnchor.y); ctx.lineTo(leftTip.x, leftTip.y);
      ctx.moveTo(rightAnchor.x, rightAnchor.y); ctx.lineTo(rightTip.x, rightTip.y);
      ctx.stroke();

      ctx.lineWidth = 3;
      ctx.strokeStyle = "hsl(25, 90%, 60%)";
      ctx.beginPath(); ctx.moveTo(leftAnchor.x, leftAnchor.y); ctx.lineTo(leftTip.x, leftTip.y); ctx.stroke();
      ctx.strokeStyle = "hsl(210, 90%, 60%)";
      ctx.beginPath(); ctx.moveTo(rightAnchor.x, rightAnchor.y); ctx.lineTo(rightTip.x, rightTip.y); ctx.stroke();

      ctx.fillStyle = "hsl(25, 90%, 60%)";
      ctx.beginPath(); ctx.arc(leftTip.x, leftTip.y, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "hsl(210, 90%, 60%)";
      ctx.beginPath(); ctx.arc(rightTip.x, rightTip.y, 4, 0, Math.PI*2); ctx.fill();
    };

    resetLines();

    const handlePointerDown = (e) => {
      leftAnchor = { x: 0, y: Math.min(Math.max(e.clientY + (Math.random() * 120 - 60), 20), height - 20) };
      rightAnchor = { x: width, y: Math.min(Math.max(e.clientY + (Math.random() * 120 - 60), 20), height - 20) };
      leftTip = { ...leftAnchor };
      rightTip = { ...rightAnchor };
      exploded = false;
      fireworks = [];
    };

    window.addEventListener('pointerdown', handlePointerDown);

    const render = () => {
      frameCount++;
      ctx.fillStyle = 'rgba(15, 32, 76, 0.15)'; // Fade out effect over the dark blue CSS bg
      ctx.fillRect(0, 0, width, height);

      if (!exploded) {
        moveTips();
        drawLines();
        if (dist(leftTip, rightTip) <= COLLIDE_DIST) {
          collisionPoint = mult(add(leftTip, rightTip), 0.5);
          explode(collisionPoint);
          exploded = true;
        }
      }

      for (let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i];
        fw.update();
        fw.draw(ctx);
        if (fw.isDead()) fireworks.splice(i, 1);
      }

      if (exploded && fireworks.length === 0) {
        if (frameCount % 120 === 0) resetLines();
      }

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
};

const ExamPlay = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if no state passed
  if (!location.state || !location.state.questions || location.state.questions.length === 0) {
    return <Navigate to="/exam" replace />;
  }

  const examQuestions = location.state.questions;
  const subjectKnowledge = location.state.subjectKnowledge || '';
  const chapterTitle = location.state.chapterTitle || 'Exam';

  const [screen, setScreen] = useState('CHALLENGE');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [showTimesUp, setShowTimesUp] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showScreenshotWarning, setShowScreenshotWarning] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  
  const [mode, setMode] = useState('QUIZ');
  const [currentIdx, setCurrentIdx] = useState(0);
  
  const [answers, setAnswers] = useState(Array(examQuestions.length).fill(''));
  const [attempts, setAttempts] = useState(Array(examQuestions.length).fill(1));
  const [feedbacks, setFeedbacks] = useState(Array(examQuestions.length).fill(null));
  
  const [timeTaken, setTimeTaken] = useState(Array(examQuestions.length).fill(0));
  
  const handleRestartExam = () => {
    setCurrentIdx(0);
    setAnswers(Array(examQuestions.length).fill(''));
    setAttempts(Array(examQuestions.length).fill(1));
    setFeedbacks(Array(examQuestions.length).fill(null));
    setTimeTaken(Array(examQuestions.length).fill(0));
    setTimeLeft(TIME_LIMIT);
    setShowTimesUp(false);
    setShowAnalysis(false);
    setScreen('CHALLENGE');
    setMode('QUIZ');
  };

  const audioRef = useRef(null);

  const question = examQuestions[currentIdx];
  const currentFeedback = feedbacks[currentIdx];
  const currentAnswer = answers[currentIdx];

  useEffect(() => {
    audioRef.current = new Audio('https://res.cloudinary.com/dcxlzfyfp/video/upload/v1784124225/SoundHelix-Song-1_disokr.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  useEffect(() => {
    let timer;
    if (screen === 'CHALLENGE' && mode !== 'REVIEW' && timeLeft > 0 && !showTimesUp) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(e => console.log('Auto-play blocked pending interaction.'));
      }
    } else if (timeLeft === 0 && screen === 'CHALLENGE' && mode !== 'REVIEW' && !showTimesUp) {
       setShowTimesUp(true);
       setTimeout(() => {
         setShowTimesUp(false);
         if (mode === 'QUIZ') handleNextInQuiz();
         else handleRetrySubmit();
       }, 2000);
    }
    return () => clearInterval(timer);
  }, [screen, timeLeft, mode, showTimesUp]);

  const interactAudio = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(e => console.log('Play blocked'));
    }
  };

  const updateCurrentAnswer = (val) => {
    const newAnswers = [...answers];
    newAnswers[currentIdx] = val;
    setAnswers(newAnswers);
  };

  const handleNextInQuiz = () => {
    const newTimeTaken = [...timeTaken];
    newTimeTaken[currentIdx] += (TIME_LIMIT - timeLeft);
    setTimeTaken(newTimeTaken);

    if (currentIdx < examQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setTimeLeft(TIME_LIMIT);
    } else {
      submitBatchQuiz();
    }
  };

  const submitBatchQuiz = async () => {
    setScreen('LOADING');
    try {
      const itemsToEvaluate = [];
      const localFeedbacks = [...feedbacks];

      examQuestions.forEach((q, i) => {
        if (!answers[i].trim()) {
          localFeedbacks[i] = { id: q.id || i, score: 0, isCorrect: false, missing: "You skipped this question.", wrong: "No answer provided.", grammar: null };
        } else {
          itemsToEvaluate.push({ id: q.id || i, index: i, question: q.text, expectedAnswer: q.expected || '', userAnswer: answers[i] });
        }
      });

      if (itemsToEvaluate.length > 0) {
        const res = await api.post('/api/ai/evaluate-batch', { items: itemsToEvaluate, subjectKnowledge });
        const results = res.data;
        if (Array.isArray(results)) {
          results.forEach(result => {
            const originalItem = itemsToEvaluate.find(item => item.id == result.id);
            if (originalItem) localFeedbacks[originalItem.index] = result;
          });
        } else {
           throw new Error("Batch evaluation did not return an array.");
        }
      }
      setFeedbacks(localFeedbacks);
      setMode('REVIEW');
      setCurrentIdx(0);
      setShowAnalysis(true);
      setScreen('CHALLENGE');
    } catch (error) {
      alert("Failed to evaluate answers. Returning to challenge.");
      setScreen('CHALLENGE');
    }
  };

  const handleRetrySubmit = async () => {
    const trimmedAnswer = currentAnswer.trim();
    if (!trimmedAnswer) return;

    // --- CLIENT SIDE COST-SAVING CHECKS ---
    // 1. Prevent evaluating if they didn't actually change the answer from the previous attempt
    if (trimmedAnswer === answers[currentIdx].trim()) {
       alert("Your answer is identical to your previous attempt. Please modify it to try again!");
       return;
    }
    // 2. Prevent evaluating very short answers (less than 3 words or 15 characters)
    if (trimmedAnswer.length < 15 || trimmedAnswer.split(/\s+/).length < 3) {
       alert("Your answer is too short to evaluate. Please provide more detail.");
       return;
    }

    const newTimeTaken = [...timeTaken];
    newTimeTaken[currentIdx] += (TIME_LIMIT - timeLeft);
    setTimeTaken(newTimeTaken);

    // Also update the tracked answer so future retries have the latest text to compare against
    const newAnswers = [...answers];
    newAnswers[currentIdx] = currentAnswer;
    setAnswers(newAnswers);

    setScreen('LOADING');
    try {
      const response = await api.post('/api/ai/evaluate', {
        question: question.text,
        userAnswer: currentAnswer,
        expectedAnswer: question.expected || '',
        subjectKnowledge
      });
      const newFeedbacks = [...feedbacks];
      newFeedbacks[currentIdx] = response.data;
      setFeedbacks(newFeedbacks);
      setScreen('REVIEW');
    } catch (error) {
      alert("Failed to evaluate. Try again.");
      setScreen('CHALLENGE');
    }
  };

  const handleTryAgainClick = () => {
    if (attempts[currentIdx] < MAX_ATTEMPTS) {
      const newAttempts = [...attempts];
      newAttempts[currentIdx] += 1;
      setAttempts(newAttempts);
      setMode('RETRY');
      setTimeLeft(TIME_LIMIT);
      setScreen('CHALLENGE');
    }
  };

  const openQuestionReview = (index) => {
    setCurrentIdx(index);
    setMode('REVIEW');
    setShowAnalysis(true);
    setScreen('CHALLENGE');
  };

  const TopBar = ({ title, onBack }) => (
    <div className="flex items-center justify-center p-4 sm:px-6 text-white shrink-0 max-w-3xl mx-auto w-full relative h-20">
      <button onClick={onBack} className="absolute left-4 sm:left-6 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition z-20">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <h1 className="text-xl sm:text-xl font-black tracking-widest uppercase flex items-center gap-2 z-10 text-center px-12 truncate max-w-full">
        <span>⚡</span> <span className="truncate">{title}</span> <span>⚡</span>
      </h1>
      {screen === 'CHALLENGE' && mode !== 'REVIEW' && (
        <div className="absolute right-4 sm:right-6">
          <div className="relative overflow-hidden rounded-full shadow-[0_0_15px_rgba(68,0,153,0.5)] flex items-center justify-center p-[3px] min-w-[80px]">
            <div className="absolute inset-[-150%] bg-[conic-gradient(#fff_0%,#000_3%,#c084fc_60%,#fff_100%)] animate-[spin_2s_linear_infinite]"></div>
            <div className={`relative z-10 w-full h-full rounded-full flex items-center justify-center px-4 py-1 font-black text-sm sm:text-base transition-colors duration-500 ${timeLeft <= 15 ? 'bg-red-600 text-white shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]' : 'bg-[#0F204C] text-white shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      )}
      {screen === 'CHALLENGE' && mode === 'REVIEW' && currentFeedback && (
        <div className="absolute right-4 sm:right-6 flex flex-col items-end">
          <span className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider opacity-90">Score: {currentFeedback.score}/100</span>
        </div>
      )}
    </div>
  );

  const ProgressBar = () => (
    <div className="px-4 py-2 sm:px-6 flex items-center gap-2 shrink-0 max-w-3xl mx-auto w-full mt-2">
      <div className="flex-1 flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/20 rounded-full"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-yellow-400 rounded-full transition-all duration-500"
          style={{ width: `${(currentIdx / (examQuestions.length - 1)) * 100}%` }}
        ></div>
        {examQuestions.map((_, i) => (
          <div key={i} className="relative z-10 flex items-center justify-center bg-[#0F204C] rounded-full px-1">
            {i <= currentIdx ? (
               <span className={`text-xl sm:text-2xl transition-all duration-300 ${i === currentIdx ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] scale-125' : ''}`}>⭐</span>
            ) : (
               <span className="text-xl sm:text-2xl opacity-20 grayscale">⭐</span>
            )}
          </div>
        ))}
      </div>
      <span className="text-white font-bold ml-6 sm:text-base">{currentIdx + 1}/{examQuestions.length}</span>
    </div>
  );

  const ScoreGauge = ({ score }) => {
    return (
      <div className="bg-[#1C2C4E] rounded-[2rem] p-6 flex flex-col items-center justify-center shadow-2xl border border-white/5 relative shrink-0 w-52 h-52 sm:w-56 sm:h-56 lg:w-64 lg:h-64 mb-6 md:mb-8">
        <div className="absolute inset-4 rounded-full border-[10px] md:border-[12px] border-[#2A3C6A]"></div>
        <div className="absolute inset-8 rounded-full border border-white/5"></div>
        <div className="absolute top-4 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-[#FF6B6B] z-10 shadow-[0_0_10px_#FF6B6B]"></div>
        <div className="flex flex-col items-center z-10 mt-2">
          <span className="text-6xl sm:text-7xl font-black text-[#FF6B6B]">{score || 0}</span>
          <span className="text-[10px] md:text-xs font-bold text-white/50 tracking-[0.2em] mt-1">SCORE</span>
        </div>
      </div>
    );
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const calculateStats = () => {
    let correct = 0; let incorrect = 0; let skipped = 0;
    feedbacks.forEach((fb, i) => {
       if (!answers[i].trim() && attempts[i] === 1) skipped++;
       else if (fb?.score >= 80) correct++;
       else incorrect++;
    });
    const avgScore = feedbacks.length ? Math.round(feedbacks.reduce((a, b) => a + (b?.score || 0), 0) / feedbacks.length) : 0;
    const totalTime = timeTaken.reduce((a, b) => a + b, 0);
    return { correct, incorrect, skipped, avgScore, totalTime };
  };

  useEffect(() => {
    if (mode === 'QUIZ' && !isAdmin) {
      const handleKeyDown = (e) => {
        if (e.key === 'PrintScreen') {
          e.preventDefault();
          setShowScreenshotWarning(true);
          setTimeout(() => setShowScreenshotWarning(false), 3000);
        }
      };

      const preventContextMenu = (e) => e.preventDefault();
      
      const handleBlur = () => {
         setIsBlurred(true);
      };
      
      const handleFocus = () => {
         setIsBlurred(false);
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('contextmenu', preventContextMenu);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('contextmenu', preventContextMenu);
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
      };
    } else {
      setIsBlurred(false);
      setShowScreenshotWarning(false);
    }
  }, [mode]);

  const stats = calculateStats();

  return (
    <div 
      className="w-full h-[100dvh] font-sans overflow-hidden flex flex-col relative z-0 bg-gradient-to-b from-[#0F204C] to-[#1A3673] select-none" 
      onPointerDown={interactAudio}
      onCopy={(e) => { if (!isAdmin) e.preventDefault(); }}
      onCut={(e) => { if (!isAdmin) e.preventDefault(); }}
      onPaste={(e) => { if (!isAdmin) e.preventDefault(); }}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none z-0"></div>
      {screen === 'REPORT' && <FireworksCanvas />}
      <ElectricCanvas />

      {/* --- ANTI-CHEAT OVERLAYS --- */}
      {mode === 'QUIZ' && isBlurred && (
        <div className="absolute inset-0 z-[100] bg-[#0F204C]/95 backdrop-blur-xl flex flex-col items-center justify-center text-white p-6">
          <div className="text-6xl sm:text-7xl mb-4 animate-bounce">🛡️</div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-center text-red-400">Exam Privacy Protected</h2>
          <p className="text-slate-300 mt-3 text-base sm:text-lg text-center max-w-md font-medium">Screen recording and clipping tools are not allowed. Please click anywhere in this window to resume your exam.</p>
        </div>
      )}

      {showScreenshotWarning && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[110] bg-red-600 text-white px-5 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_10px_40px_rgba(220,38,38,0.6)] flex items-center gap-3 animate-fade-in border-2 border-red-400">
           <div className="text-xl sm:text-2xl">📸</div>
           <div className="font-bold text-xs sm:text-sm tracking-wide">Screenshots are disabled during the exam!</div>
        </div>
      )}

      {/* --- CHALLENGE SCREEN --- */}
      {screen === 'CHALLENGE' && (
        <div className="flex flex-col h-full relative z-10 animate-fade-in min-h-0 w-full">
          {showTimesUp && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0F204C]/80 backdrop-blur-sm animate-fade-in">
               <div className="bg-red-600 text-white px-10 py-8 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.5)] flex flex-col items-center gap-4 transform scale-110 animate-pulse border-4 border-red-400">
                  <div className="text-6xl">⏰</div>
                  <h2 className="text-3xl font-black uppercase tracking-widest text-center">Time's Up!</h2>
               </div>
             </div>
          )}
          <TopBar title={mode === 'REVIEW' ? "Exam Analysis" : (mode === 'QUIZ' ? "Exam Mode" : "Retry Question")} onBack={() => mode === 'REVIEW' ? setScreen('REPORT') : (mode === 'QUIZ' ? navigate(-1) : setScreen('REPORT'))} />
          {(mode === 'QUIZ' || mode === 'REVIEW') && <ProgressBar />}
          
          <div className="flex-1 p-2 sm:px-4 sm:py-3 flex flex-col gap-3 overflow-y-auto min-h-0 max-w-5xl mx-auto w-full">
            {mode !== 'REVIEW' && (
              <div className="flex items-center justify-center shrink-0">
                <div className="flex items-center gap-2 text-yellow-400 font-bold bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm text-sm border border-white/10 shadow-lg">
                  <span>⚡</span> {attempts[currentIdx]}/{MAX_ATTEMPTS} attempts
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xl relative shrink-0 flex items-center justify-center">
              <h2 className="text-sm sm:text-base font-medium text-slate-800 leading-snug text-center">
                {question.text}
              </h2>
            </div>

            <div className={`bg-[#EAF3FF] rounded-3xl p-3 sm:p-4 shrink-0 flex flex-col shadow-lg relative overflow-hidden ${mode === 'REVIEW' ? 'h-24 min-h-[96px]' : 'h-48 sm:h-auto sm:flex-1 min-h-[150px]'}`}>
              <textarea 
                value={currentAnswer}
                onChange={(e) => updateCurrentAnswer(e.target.value)}
                onCopy={(e) => { if (mode === 'QUIZ' && !isAdmin) e.preventDefault(); }}
                onPaste={(e) => { if (mode === 'QUIZ' && !isAdmin) e.preventDefault(); }}
                onCut={(e) => { if (mode === 'QUIZ' && !isAdmin) e.preventDefault(); }}
                disabled={mode === 'REVIEW'}
                placeholder="Type your answer here..."
                className="w-full h-full bg-transparent resize-none focus:outline-none text-[#5A7A9C] font-medium text-sm sm:text-base placeholder-blue-300"
              />
            </div>
            {mode === 'REVIEW' && currentFeedback && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full shrink-0">
                  <section className="bg-[#1A2C5B] rounded-2xl p-4 shadow-lg border border-white/5 flex flex-col w-full text-left">
                    <h3 className="font-bold text-blue-400 uppercase tracking-wider text-xs flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow text-[10px]">?</div> 
                      Missing
                    </h3>
                    <div className="text-white/80 text-xs sm:text-sm font-normal leading-relaxed">
                      {currentFeedback.missing || "You answered everything clearly. Keep up the good work!"}
                    </div>
                  </section>
                  <section className="bg-[#1A2C5B] rounded-2xl p-4 shadow-lg border border-white/5 flex flex-col w-full text-left">
                    <h3 className="font-bold text-red-400 uppercase tracking-wider text-xs flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow text-[10px]">X</div> 
                      Incorrect
                    </h3>
                    <div className="text-white/80 text-xs sm:text-sm font-normal leading-relaxed">
                      {currentFeedback.wrong || "No incorrect statements. You're doing a great job!"}
                    </div>
                  </section>
                  <section className="bg-[#1A2C5B] rounded-2xl p-4 shadow-lg border border-white/5 flex flex-col w-full text-left">
                    <h3 className="font-bold text-yellow-400 uppercase tracking-wider text-xs flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-yellow-500 text-white flex items-center justify-center shadow text-[10px]">!</div> 
                      Grammar
                    </h3>
                    <div className="text-white/80 text-xs sm:text-sm font-normal leading-relaxed">
                      {currentFeedback.grammar || "Great grammar! Your sentence is well-structured."}
                    </div>
                  </section>
                </div>
                
                <div className="flex-1 min-h-[16px]"></div>

                <div className="flex flex-col sm:flex-row gap-3 mt-auto shrink-0 w-full">
                  <button 
                    onClick={async () => {
                      if (currentIdx < examQuestions.length - 1) {
                        setCurrentIdx(currentIdx + 1);
                      } else {
                        const finalStats = calculateStats();
                        try {
                           // Save locally for instant UI update
                           if (chapterId) {
                              localStorage.setItem(`hoshiyaar_exam_score_${chapterId}`, finalStats.avgScore);
                           }
                           // Save to backend
                           const userObj = JSON.parse(localStorage.getItem('hoshiyaar_user'));
                           if (userObj && userObj._id && chapterId) {
                              await api.put('/api/auth/progress', {
                                 userId: userObj._id,
                                 chapter: chapterId,
                                 subject: subjectKnowledge || 'Unknown',
                                 lessonTitle: `ExamMode_${chapterId}`,
                                 isCorrect: true, 
                                 deltaScore: finalStats.avgScore,
                                 resetLesson: true 
                              });
                           }
                        } catch (e) {
                           console.error("Failed to save exam score", e);
                        }
                        setScreen('REPORT');
                      }
                    }}
                    className="w-full py-4 shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-base uppercase tracking-wider shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {currentIdx < examQuestions.length - 1 ? "NEXT QUESTION ➔" : "FINISH REVIEW ➔"}
                  </button>
                </div>
              </>
            )}

            {mode !== 'REVIEW' && (
               <button 
                 onClick={mode === 'QUIZ' ? handleNextInQuiz : handleRetrySubmit}
                 disabled={!currentAnswer.trim() && mode === 'RETRY'}
                 className="w-full py-4 sm:py-5 mt-auto shrink-0 bg-blue-600 text-white rounded-2xl font-black text-lg sm:text-xl uppercase tracking-wider shadow-[0_6px_0_#1E3A8A] active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:shadow-[0_6px_0_#1E3A8A] disabled:active:translate-y-0"
               >
                 {mode === 'QUIZ' ? (currentIdx < examQuestions.length - 1 ? 'Next Question' : 'Submit Quiz') : 'Submit Retry'}
               </button>
            )}
          </div>
        </div>
      )}

      {/* --- LOADING SCREEN --- */}
      {screen === 'LOADING' && (
        <div className="flex flex-col h-full items-center justify-center relative z-10 animate-pulse text-white w-full">
          <div className="text-6xl sm:text-7xl mb-6 sm:mb-8 animate-spin drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">⚡</div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-widest drop-shadow-md">Analyzing...</h2>
          <p className="text-blue-200 mt-3 sm:mt-4 font-medium text-lg sm:text-xl">Our AI is reading your answers</p>
        </div>
      )}

      {/* --- MISSION REPORT SCREEN --- */}
      {screen === 'REPORT' && (
        <div className="flex flex-col h-full relative z-10 animate-fade-in min-h-0 w-full">
            <TopBar title="Report Card" onBack={() => navigate('/')} />
            
            <div className="flex-1 px-4 py-4 md:py-2 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-stretch justify-start md:justify-center min-h-0 max-w-5xl mx-auto w-full overflow-y-auto pb-12 md:pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Left Column: Score and Stats */}
              <div className="flex-1 w-full flex flex-col items-center justify-center shrink-0 md:scale-95">
                <div className="bg-[#1C2C4E] text-white font-bold px-5 py-2 md:px-6 md:py-2.5 rounded-full uppercase tracking-[0.15em] shadow-lg border border-white/10 mb-6 md:mb-8 shrink-0 text-xs md:text-sm">
                  EXAM COMPLETE!
                </div>

                <ScoreGauge score={stats.avgScore} />

                <div className="bg-[#F8FAFC] rounded-2xl w-full max-w-sm p-3 md:p-4 shadow-2xl shrink-0">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col items-center">
                      <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</div>
                      <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">{formatTime(stats.totalTime)}</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correct</div>
                      <div className="text-xl sm:text-2xl font-black text-green-500 mt-1">{stats.correct}</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incorrect</div>
                      <div className="text-xl sm:text-2xl font-black text-red-500 mt-1">{stats.incorrect}</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Skipped</div>
                      <div className="text-xl sm:text-2xl font-black text-yellow-500 mt-1">{stats.skipped}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Question Analysis */}
              <div className="flex-1 w-full flex flex-col bg-[#1A2C5B] rounded-3xl p-4 md:p-5 shadow-2xl self-stretch border border-white/5 md:scale-95">
                <h3 className="text-white font-bold tracking-[0.15em] uppercase mb-3 text-center text-xs md:text-sm shrink-0">Question Analysis</h3>
                <div className="flex flex-col gap-2 flex-1 justify-center">
                  {examQuestions.map((q, idx) => {
                    const fb = feedbacks[idx];
                    const isCorrect = fb?.score >= 80;
                    return (
                      <div key={q.id || idx} className="bg-[#263B69] border border-white/5 p-2.5 md:p-3 rounded-xl flex items-center justify-between text-left shrink-0 shadow-sm hover:bg-[#2C447A] transition-colors">
                        <div className="flex-1 pr-3">
                            <div className="text-[9px] font-bold text-blue-300 mb-0.5 uppercase tracking-widest">Question {idx + 1}</div>
                            <div className="text-white/90 font-medium text-xs md:text-sm line-clamp-1">{q.text}</div>
                        </div>
                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-xs shadow-md shrink-0 ${isCorrect ? 'bg-[#10B981] text-white' : 'bg-[#EF4444] text-white'}`}>
                            {fb?.score || 0}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button
                  onClick={() => openQuestionReview(0)}
                  className="w-full mt-4 py-3 md:py-3.5 bg-[#A855F7] hover:bg-[#9333EA] text-white rounded-xl font-black text-xs md:text-sm uppercase tracking-wider shadow-lg transition-colors flex items-center justify-center shrink-0"
                >
                  Exam Analysis
                </button>
                <button
                  onClick={handleRestartExam}
                  className="w-full mt-3 py-3 md:py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs md:text-sm uppercase tracking-wider shadow-lg transition-colors flex items-center justify-center shrink-0"
                >
                  <span className="text-xl mr-2">↺</span> Try Again Entire Set
                </button>
              </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ExamPlay;
