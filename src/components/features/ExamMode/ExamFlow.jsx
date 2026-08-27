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
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initDots(); };
    const handleMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const getDistance = (x1, x2, y1, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    class Dot {
      constructor() { this.init(); }
      init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
      }
      draw() {
        const cx = mouse.x || canvas.width / 2;
        const cy = mouse.y || canvas.height / 2;
        ctx.strokeStyle = "rgba(59, 130, 246, 0.08)";
        ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(cx, cy); ctx.stroke();
        let connectDistance = Math.min(canvas.width, canvas.height) / 5;
        for (let i = 0; i < dots.length; i++) {
          let d = dots[i];
          let dist = getDistance(this.x, d.x, this.y, d.y);
          if (dist < connectDistance) {
            ctx.globalCompositeOperation = "lighter";
            let alpha = 1 - (dist / connectDistance);
            ctx.strokeStyle = `rgba(147, 197, 253, ${alpha * 0.3})`;
            ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(d.x, d.y); ctx.stroke();
          }
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath(); ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2); ctx.fill();
        this.update();
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x >= canvas.width || this.x <= 0) this.vx *= -1;
        if (this.y >= canvas.height || this.y <= 0) this.vy *= -1;
      }
    }
    const initDots = () => { dots = []; for (let i = 0; i < max; i++) dots.push(new Dot()); };
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(dot => dot.draw());
      animationFrameId = requestAnimationFrame(render);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    handleResize();
    render();
    return () => { window.removeEventListener('resize', handleResize); window.removeEventListener('mousemove', handleMouseMove); cancelAnimationFrame(animationFrameId); };
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
    const handleResize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; resetLines(); };
    window.addEventListener('resize', handleResize);
    const add = (v1, v2) => ({ x: v1.x + v2.x, y: v1.y + v2.y });
    const sub = (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y });
    const mult = (v, n) => ({ x: v.x * n, y: v.y * n });
    const dist = (v1, v2) => Math.hypot(v1.x - v2.x, v1.y - v2.y);
    const normalize = (v) => { const d = Math.hypot(v.x, v.y); return d === 0 ? { x: 0, y: 0 } : { x: v.x / d, y: v.y / d }; };
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
        this.pos = { ...pos }; this.vel = mult(vel, speedFactor); this.hue = hue; this.age = 0;
        this.lifespan = Math.random() * 70 + 90; this.size = Math.random() * 2 + 2.5; this.trail = [];
      }
      update() {
        this.age++; this.vel.y += GRAVITY * 0.98; this.vel.x *= 0.995; this.vel.y *= 0.995;
        this.pos.x += this.vel.x; this.pos.y += this.vel.y;
        this.trail.push({ ...this.pos }); if (this.trail.length > 6) this.trail.shift();
      }
      draw(ctx) {
        for (let i = 0; i < this.trail.length; i++) {
          const t = i / this.trail.length;
          const alpha = (0.05 + t * 0.4) * (1 - this.age / this.lifespan);
          ctx.beginPath(); ctx.fillStyle = `hsla(${this.hue}, 90%, 60%, ${alpha})`;
          ctx.arc(this.trail[i].x, this.trail[i].y, this.size * (0.6 + t), 0, Math.PI * 2); ctx.fill();
        }
        ctx.beginPath(); ctx.fillStyle = `hsla(${this.hue}, 95%, 70%, ${Math.max(0, 1 - this.age / this.lifespan)})`;
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2); ctx.fill();
      }
      isDead() { return this.age > this.lifespan; }
    }
    class Firework {
      constructor(origin, delayFrames = 0) {
        this.origin = { ...origin }; this.particles = []; this.age = 0; this.delay = Math.max(0, delayFrames); this.launched = false;
        const hues = [Math.random()*30+10, Math.random()*60+200, Math.random()*50+90, Math.random()*40+280];
        this.hue = hues[Math.floor(Math.random() * hues.length)];
      }
      launch() {
        for (let i = 0; i < PARTICLES_PER_FIREWORK; i++) {
          const angle = Math.random() * Math.PI * 2; const spread = Math.random() * 0.85 + 0.15; const speed = Math.random() * 5 + 2;
          const vx = Math.cos(angle) * speed * spread; const vy = Math.sin(angle) * speed * spread;
          this.particles.push(new Particle(this.origin, { x: vx, y: vy }, this.hue + (Math.random() * 36 - 18), 1 + (Math.random() * 0.42 - 0.12)));
        }
        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 3 + 1;
          const p = new Particle(this.origin, { x: Math.cos(angle)*speed, y: Math.sin(angle)*speed }, this.hue, Math.random() * 0.8 + 1.6);
          p.size = Math.random() * 3 + 3.5; p.lifespan *= 0.7; this.particles.push(p);
        }
        this.launched = true;
      }
      update() {
        this.age++;
        if (!this.launched) { if (this.age >= this.delay) this.launch(); return; }
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i]; p.update();
          if (p.isDead()) this.particles.splice(i, 1);
        }
      }
      draw(ctx) {
        if (!this.launched) {
          ctx.beginPath();
          const alpha = 0.06 + ((Math.sin(this.age * 0.2) + 1) / 2) * 0.19;
          ctx.fillStyle = `hsla(${this.hue}, 95%, 60%, ${alpha})`;
          ctx.arc(this.origin.x, this.origin.y, 8 + Math.sin(this.age * 0.3) * 4, 0, Math.PI * 2); ctx.fill();
          return;
        }
        for (const p of this.particles) p.draw(ctx);
      }
      isDead() { return this.launched && this.particles.length === 0; }
    }
    const explode = (pos) => { for (let b = 0; b < 3; b++) fireworks.push(new Firework(pos, b * 6)); };
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
      ctx.lineCap = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.beginPath(); ctx.moveTo(leftAnchor.x, leftAnchor.y); ctx.lineTo(leftTip.x, leftTip.y);
      ctx.moveTo(rightAnchor.x, rightAnchor.y); ctx.lineTo(rightTip.x, rightTip.y); ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = "hsl(25, 90%, 60%)";
      ctx.beginPath(); ctx.moveTo(leftAnchor.x, leftAnchor.y); ctx.lineTo(leftTip.x, leftTip.y); ctx.stroke();
      ctx.strokeStyle = "hsl(210, 90%, 60%)";
      ctx.beginPath(); ctx.moveTo(rightAnchor.x, rightAnchor.y); ctx.lineTo(rightTip.x, rightTip.y); ctx.stroke();
      ctx.fillStyle = "hsl(25, 90%, 60%)"; ctx.beginPath(); ctx.arc(leftTip.x, leftTip.y, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "hsl(210, 90%, 60%)"; ctx.beginPath(); ctx.arc(rightTip.x, rightTip.y, 4, 0, Math.PI*2); ctx.fill();
    };
    resetLines();
    const handlePointerDown = (e) => {
      leftAnchor = { x: 0, y: Math.min(Math.max(e.clientY + (Math.random() * 120 - 60), 20), height - 20) };
      rightAnchor = { x: width, y: Math.min(Math.max(e.clientY + (Math.random() * 120 - 60), 20), height - 20) };
      leftTip = { ...leftAnchor }; rightTip = { ...rightAnchor }; exploded = false; fireworks = [];
    };
    window.addEventListener('pointerdown', handlePointerDown);
    const render = () => {
      frameCount++;
      ctx.fillStyle = 'rgba(15, 32, 76, 0.15)'; ctx.fillRect(0, 0, width, height);
      if (!exploded) {
        moveTips(); drawLines();
        if (dist(leftTip, rightTip) <= COLLIDE_DIST) {
          collisionPoint = mult(add(leftTip, rightTip), 0.5); explode(collisionPoint); exploded = true;
        }
      }
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i]; fw.update(); fw.draw(ctx);
        if (fw.isDead()) fireworks.splice(i, 1);
      }
      if (exploded && fireworks.length === 0) { if (frameCount % 120 === 0) resetLines(); }
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => { window.removeEventListener('resize', handleResize); window.removeEventListener('pointerdown', handlePointerDown); cancelAnimationFrame(animationFrameId); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
};

const ExamFlow = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const location = useLocation();

  if (!location.state) {
    return <Navigate to="/exam" replace />;
  }

  const { flowItems: passedFlowItems = [], revisionCards = [], questions = [], mcqs = [], subjectKnowledge = '', chapterTitle = 'Exam', chapterId } = location.state;
  
  const [flowItems, setFlowItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [screen, setScreen] = useState('FLOW'); // FLOW, LOADING, REPORT
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [showTimesUp, setShowTimesUp] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  
  // Track data
  const [answers, setAnswers] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [attempts, setAttempts] = useState({});
  
  useEffect(() => {
      let items = [];
      
      if (passedFlowItems && passedFlowItems.length > 0) {
          items = passedFlowItems.map((item, i) => {
              // Ensure consistent shape: 'content' holds the payload
              let contentPayload = item;
              if (item.type === 'descriptive_question' || item.type === 'mcq') {
                  contentPayload = { text: item.text, expected: item.expected, options: item.options };
              } else if (item.type === 'revision_card') {
                  contentPayload = item.content;
              }
              return {
                  type: item.type,
                  index: i,
                  content: contentPayload,
                  id: `item_${i}`
              };
          });
      } else {
          // Fallback logic for old configs
          const maxLength = Math.max(revisionCards.length, questions.length, mcqs.length);
          for(let i=0; i<maxLength; i++) {
             if (revisionCards[i]) items.push({ type: 'revision_card', index: items.length, content: revisionCards[i], id: `card_${i}` });
             if (questions[i]) items.push({ type: 'descriptive_question', index: items.length, content: questions[i], id: `desc_${i}` });
             if (mcqs[i]) items.push({ type: 'mcq', index: items.length, content: mcqs[i], id: `mcq_${i}` });
          }
      }
      
      setFlowItems(items);
      
      const initialAnswers = {};
      const initialAttempts = {};
      items.forEach(item => {
          if (item.type === 'descriptive_question' || item.type === 'mcq') {
              initialAnswers[item.id] = '';
              initialAttempts[item.id] = 1;
          }
      });
      setAnswers(initialAnswers);
      setAttempts(initialAttempts);
  }, [passedFlowItems, revisionCards, questions, mcqs]);
  
  const currentItem = flowItems[currentIndex];
  
  const audioRef = useRef(null);
  useEffect(() => {
    audioRef.current = new Audio('https://res.cloudinary.com/w7rytq0k/video/upload/v1785322512/SoundHelix-Song-1_disokr.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  useEffect(() => {
    let timer;
    if (screen === 'FLOW' && currentItem?.type !== 'revision_card' && timeLeft > 0 && !showTimesUp) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(e => console.log('Auto-play blocked pending interaction.'));
      }
    } else if (timeLeft === 0 && screen === 'FLOW' && currentItem?.type !== 'revision_card' && !showTimesUp) {
       setShowTimesUp(true);
       setTimeout(() => {
         setShowTimesUp(false);
         handleNext();
       }, 2000);
    }
    return () => clearInterval(timer);
  }, [screen, timeLeft, currentItem, showTimesUp]);

  const interactAudio = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(e => console.log('Play blocked'));
    }
  };

  const handleNext = async () => {
      goNextStep();
  };
  
  const submitBatchDescriptive = async () => {
      const itemsToEvaluate = [];
      flowItems.forEach(item => {
          if (item.type === 'descriptive_question') {
              const ans = answers[item.id] || '';
              if (ans.trim()) {
                  itemsToEvaluate.push({
                      id: item.id,
                      index: item.index,
                      question: item.content.text,
                      expectedAnswer: item.content.expected || '',
                      userAnswer: ans
                  });
              }
          }
      });
      
      if (itemsToEvaluate.length === 0) {
          await finalizeExam(feedbacks);
          return;
      }
      
      setScreen('LOADING');
      try {
          const response = await api.post('/api/ai/evaluate-batch', {
            items: itemsToEvaluate,
            subjectKnowledge
          });
          
          const newFeedbacks = { ...feedbacks };
          if (Array.isArray(response.data)) {
              response.data.forEach(fb => {
                  newFeedbacks[fb.id] = fb;
              });
          }
          setFeedbacks(newFeedbacks);
          await finalizeExam(newFeedbacks);
      } catch (error) {
          console.error("Batch evaluation failed", error);
          alert("Failed to evaluate some answers.");
          await finalizeExam(feedbacks);
      }
  };

  const goNextStep = async () => {
      setTotalTimeSpent(prev => prev + (TIME_LIMIT - timeLeft));
      setScreen('FLOW');
      if (currentIndex < flowItems.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setTimeLeft(TIME_LIMIT);
      } else {
          await submitBatchDescriptive();
      }
  };
  
  const finalizeExam = async (fbState) => {
      const finalScore = calculateScore(fbState);
      try {
         if (chapterId) {
            localStorage.setItem(`hoshiyaar_exam_score_${chapterId}`, finalScore);
         }
         const userObj = JSON.parse(localStorage.getItem('hoshiyaar_user'));
         if (userObj && userObj._id && chapterId) {
            await api.put('/api/auth/progress', {
               userId: userObj._id,
               chapter: chapterId,
               subject: subjectKnowledge || 'Unknown',
               lessonTitle: `ExamMode_${chapterId}`,
               isCorrect: true, 
               deltaScore: finalScore,
               resetLesson: true 
            });
         }
      } catch (e) {
         console.error("Failed to save exam score", e);
      }
      setScreen('REPORT');
  };
  
  const calculateScore = (fbState = feedbacks) => {
      let totalItems = 0;
      let scoreSum = 0;
      flowItems.forEach(item => {
         if (item.type === 'descriptive_question') {
             totalItems++;
             const fb = fbState[item.id];
             if (fb && fb.score) scoreSum += fb.score;
         }
         if (item.type === 'mcq') {
             totalItems++;
             const ans = answers[item.id];
             if (ans && ans === item.content.expected) scoreSum += 100;
         }
      });
      return totalItems > 0 ? Math.round(scoreSum / totalItems) : 0;
  };
  
  const calculateStats = (fbState = feedbacks) => {
      let correct = 0;
      let incorrect = 0;
      let skipped = 0;
      
      flowItems.forEach(item => {
          if (item.type === 'revision_card') return;
          
          const ans = answers[item.id] || '';
          if (!ans.trim()) {
              skipped++;
              return;
          }
          
          if (item.type === 'descriptive_question') {
              const fb = fbState[item.id];
              if (fb && fb.score >= 80) correct++;
              else incorrect++;
          } else if (item.type === 'mcq') {
              if (ans === item.content.expected) correct++;
              else incorrect++;
          }
      });
      return { correct, incorrect, skipped };
  };

  const TopBar = ({ title, onBack }) => (
    <div className="flex items-center justify-center p-4 sm:px-6 text-white shrink-0 max-w-3xl mx-auto w-full relative h-20">
      <button onClick={onBack} className="absolute left-4 sm:left-6 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition z-20">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <h1 className="text-xl sm:text-xl font-black tracking-widest uppercase flex items-center gap-2 z-10 text-center px-12 truncate max-w-full">
        <span>⚡</span> <span className="truncate">{title}</span> <span>⚡</span>
      </h1>
      {screen === 'FLOW' && currentItem?.type !== 'revision_card' && (
        <div className="absolute right-4 sm:right-6">
          <div className="relative overflow-hidden rounded-full shadow-[0_0_15px_rgba(68,0,153,0.5)] flex items-center justify-center p-[3px] min-w-[80px]">
            <div className="absolute inset-[-150%] bg-[conic-gradient(#fff_0%,#000_3%,#c084fc_60%,#fff_100%)] animate-[spin_2s_linear_infinite]"></div>
            <div className={`relative z-10 w-full h-full rounded-full flex items-center justify-center px-4 py-1 font-black text-sm sm:text-base transition-colors duration-500 ${timeLeft <= 15 ? 'bg-red-600 text-white shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]' : 'bg-[#0F204C] text-white shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const ProgressBar = () => {
    const questionIndices = [];
    flowItems.forEach((item, idx) => {
        if (item.type !== 'revision_card') questionIndices.push(idx);
    });
    const totalQuestions = questionIndices.length;
    const currentQuestionNumber = flowItems.slice(0, currentIndex + 1).filter(i => i.type !== 'revision_card').length;
    
    let progressPercentage = 0;
    if (totalQuestions > 1) {
        progressPercentage = (Math.max(0, currentQuestionNumber - 1) / (totalQuestions - 1)) * 100;
    }

    if (totalQuestions === 0) return null;

    return (
      <div className="px-4 py-2 sm:px-6 flex items-center gap-2 shrink-0 max-w-3xl mx-auto w-full mt-2">
        <div className="flex-1 flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/20 rounded-full"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-yellow-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
          {questionIndices.map((qIdx, displayIndex) => {
            const isAchieved = currentIndex >= qIdx;
            const isCurrent = currentIndex === qIdx;
            return (
              <div key={displayIndex} className="relative z-10 flex items-center justify-center bg-[#0F204C] rounded-full px-1">
                {isAchieved ? (
                   <span className={`text-xl sm:text-2xl transition-all duration-300 ${isCurrent ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] scale-125' : ''}`}>⭐</span>
                ) : (
                   <span className="text-xl sm:text-2xl opacity-20 grayscale">⭐</span>
                )}
              </div>
            );
          })}
        </div>
        <span className="text-white font-bold ml-6 sm:text-base">
           {Math.max(1, currentQuestionNumber)}/{totalQuestions}
        </span>
      </div>
    );
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const ScoreGauge = ({ score }) => {
     const strokeWidth = 8;
     const radius = 60;
     const circumference = 2 * Math.PI * radius;
     const offset = circumference - (score / 100) * circumference;
     return (
       <div className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56">
         <svg className="w-full h-full transform -rotate-90" viewBox="0 0 150 150">
           <circle cx="75" cy="75" r={radius} fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
           <circle 
             cx="75" cy="75" r={radius} 
             fill="transparent" 
             stroke="#10B981" 
             strokeWidth={strokeWidth} 
             strokeDasharray={circumference} 
             strokeDashoffset={offset} 
             strokeLinecap="round" 
             className="transition-all duration-1000 ease-out"
           />
         </svg>
         <div className="absolute flex flex-col items-center justify-center">
           <span className="text-6xl sm:text-7xl font-black text-[#10B981] drop-shadow-md">{score || 0}</span>
           <span className="text-xs font-bold text-white/50 tracking-[0.2em] mt-1">SCORE</span>
         </div>
       </div>
     );
  };

  return (
    <div 
      className="w-full h-[100dvh] font-sans overflow-hidden flex flex-col relative z-0 bg-gradient-to-b from-[#0F204C] to-[#1A3673] select-none" 
      onPointerDown={interactAudio}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none z-0"></div>
      {screen === 'REPORT' && <FireworksCanvas />}
      <ElectricCanvas />

      {/* --- FLOW SCREEN --- */}
      {screen === 'FLOW' && currentItem && (
        <div className="flex flex-col h-full relative z-10 animate-fade-in min-h-0 w-full">
           <TopBar title={chapterTitle} onBack={() => navigate(-1)} />
           <ProgressBar />
           
           <div className="flex-1 p-2 sm:px-4 sm:py-3 flex flex-col gap-3 overflow-y-auto min-h-0 max-w-5xl mx-auto w-full">
              {currentItem.type === 'revision_card' && (
                 <div className="flex-1 min-h-0 flex flex-col items-center justify-center animate-fade-in">
                    <img src={currentItem.content} alt="Revision" className="w-full h-full object-contain rounded-lg" />
                 </div>
              )}
              
              {currentItem.type === 'descriptive_question' && (
                 <>
                    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xl relative shrink-0 flex items-center justify-center">
                      <h2 className="text-sm sm:text-base font-medium text-slate-800 leading-snug text-center">
                        {currentItem.content.text}
                      </h2>
                    </div>
                    <div className="bg-[#EAF3FF] rounded-3xl p-3 sm:p-4 shrink-0 flex flex-col shadow-lg relative overflow-hidden flex-1">
                      <textarea 
                        value={answers[currentItem.id]}
                        onChange={(e) => setAnswers(prev => ({...prev, [currentItem.id]: e.target.value}))}
                        placeholder="Type your answer here..."
                        className="w-full h-full bg-transparent resize-none focus:outline-none text-[#5A7A9C] font-medium text-sm sm:text-base placeholder-blue-300"
                      />
                    </div>
                 </>
              )}
              
              {currentItem.type === 'mcq' && (
                 <>
                    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xl relative shrink-0 flex items-center justify-center mb-4">
                      <h2 className="text-sm sm:text-base font-medium text-slate-800 leading-snug text-center">
                        {currentItem.content.text}
                      </h2>
                    </div>
                    <div className="flex flex-col gap-3">
                       {currentItem.content.options?.map((opt, idx) => (
                           <button 
                             key={idx}
                             onClick={() => setAnswers(prev => ({...prev, [currentItem.id]: opt}))}
                             className={`p-4 rounded-xl text-left font-semibold transition-all ${answers[currentItem.id] === opt ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
                           >
                             {opt}
                           </button>
                       ))}
                    </div>
                 </>
              )}
              
              <button 
                 onClick={handleNext}
                 className="w-full py-4 sm:py-5 mt-auto shrink-0 bg-blue-600 text-white rounded-2xl font-black text-lg sm:text-xl uppercase tracking-wider shadow-[0_6px_0_#1E3A8A] active:translate-y-1.5 active:shadow-none transition-all"
              >
                 {currentIndex < flowItems.length - 1 ? 'Next' : 'Finish Exam'}
              </button>
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

      {/* --- REPORT SCREEN --- */}
      {screen === 'REPORT' && (
        <div className="flex flex-col h-full relative z-10 animate-fade-in min-h-0 w-full">
            <TopBar title="Mission Report" onBack={() => navigate('/')} />
            <div className="flex-1 px-4 py-4 md:py-8 flex flex-col md:flex-row gap-6 md:gap-12 items-center md:items-stretch justify-center max-w-6xl mx-auto w-full min-h-0">
                {/* Left Column */}
                <div className="flex flex-col items-center gap-6 w-full md:w-[400px] shrink-0">
                    <div className="bg-[#1A2C5B]/80 backdrop-blur-md rounded-full px-8 py-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10 uppercase font-black tracking-widest text-white text-lg">
                        Mission Complete!
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 flex flex-col items-center justify-center shadow-2xl border border-white/10 w-full relative">
                        <ScoreGauge score={calculateScore()} />
                    </div>
                    <div className="bg-white rounded-2xl p-4 sm:p-6 w-full flex items-center justify-between shadow-xl">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider">TIME</span>
                            <span className="text-xl font-black text-blue-600">{formatTime(totalTimeSpent)}</span>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider">CORRECT</span>
                            <span className="text-xl font-black text-green-500">{calculateStats().correct}</span>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider">INCORRECT</span>
                            <span className="text-xl font-black text-red-500">{calculateStats().incorrect}</span>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider">SKIPPED</span>
                            <span className="text-xl font-black text-yellow-500">{calculateStats().skipped}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col shadow-2xl min-h-0 w-full relative">
                    <h3 className="text-white font-bold text-center uppercase tracking-widest mb-6">Question Analysis</h3>
                    <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-0 pb-20 pr-2">
                       {flowItems.map((item, idx) => {
                          if (item.type === 'revision_card') return null;
                          let score = 0;
                          if (item.type === 'descriptive_question') {
                              score = feedbacks[item.id]?.score || 0;
                          } else if (item.type === 'mcq') {
                              score = answers[item.id] === item.content.expected ? 100 : 0;
                          }
                          const isCorrect = score >= 80;
                          const displayIndex = flowItems.slice(0, idx + 1).filter(i => i.type !== 'revision_card').length;
                          
                          return (
                             <div key={idx} className="bg-white/10 border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4 transition hover:bg-white/20">
                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                   <span className="text-blue-300 text-[10px] font-bold tracking-widest uppercase">Question {displayIndex}</span>
                                   <div className="text-white text-sm font-medium truncate">{item.content.text}</div>
                                </div>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-md shrink-0 ${isCorrect ? 'bg-[#10B981]' : 'bg-[#EF4444]'} text-white`}>
                                    {score}
                                </div>
                             </div>
                          );
                       })}
                    </div>
                    
                    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#1A3673]/90 via-[#1A3673]/80 to-transparent pt-12 rounded-b-3xl">
                        <button
                          onClick={() => {
                              setCurrentReviewIndex(0);
                              setScreen('ANALYSIS');
                          }}
                          className="w-full py-4 sm:py-5 bg-[#A855F7] hover:bg-[#9333EA] text-white rounded-2xl font-black text-lg uppercase tracking-wider shadow-[0_6px_0_#7E22CE] active:translate-y-1.5 active:shadow-none transition-all"
                        >
                          Review Analysis
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {/* --- ANALYSIS SCREEN --- */}
      {screen === 'ANALYSIS' && (() => {
        const questionIndices = [];
        flowItems.forEach((item, idx) => {
           if (item.type !== 'revision_card') questionIndices.push(idx);
        });
        const currentItemIdx = questionIndices[currentReviewIndex];
        const item = flowItems[currentItemIdx];
        if (!item) return null;
        
        let score = 0;
        let isCorrect = false;
        let missing = null;
        let incorrect = null;
        let grammar = null;
        
        const parseFeedback = (val) => {
            if (!val) return null;
            if (typeof val === 'string') {
                const clean = val.toLowerCase().trim();
                if (['null', 'none', 'n/a', 'nothing', 'no'].includes(clean)) return null;
            }
            return val;
        };
        
        if (item.type === 'descriptive_question') {
            const fb = feedbacks[item.id];
            score = fb?.score || 0;
            isCorrect = score >= 80;
            missing = parseFeedback(fb?.missing);
            incorrect = parseFeedback(fb?.wrong);
            grammar = parseFeedback(fb?.grammar);
        } else if (item.type === 'mcq') {
            score = answers[item.id] === item.content.expected ? 100 : 0;
            isCorrect = score === 100;
            incorrect = isCorrect ? null : `The correct answer was: ${item.content.expected}`;
        }
        
        return (
        <div className="flex flex-col h-full relative z-10 animate-fade-in min-h-0 w-full">
            <div className="flex items-center justify-between p-4 sm:px-6 text-white shrink-0 max-w-5xl mx-auto w-full gap-2 min-h-[80px]">
              <button onClick={() => setScreen('REPORT')} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h1 className="text-base sm:text-xl font-black tracking-widest uppercase text-center flex-1 leading-tight">
                ⚡ REVIEW ANALYSIS ⚡
              </h1>
              <div className="font-bold tracking-widest text-xs sm:text-sm text-right shrink-0 bg-white/10 px-3 py-1.5 rounded-full">
                SCORE: {score}/100
              </div>
            </div>
            
            <div className="px-4 py-2 sm:px-6 flex items-center gap-2 shrink-0 max-w-4xl mx-auto w-full mt-2">
              <div className="flex-1 flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/20 rounded-full"></div>
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#10B981] rounded-full transition-all duration-500"
                  style={{ width: `${questionIndices.length > 1 ? (currentReviewIndex / (questionIndices.length - 1)) * 100 : 0}%` }}
                ></div>
                {questionIndices.map((_, idx) => (
                  <div key={idx} className="relative z-10 flex items-center justify-center bg-[#0F204C] rounded-full px-1 cursor-pointer" onClick={() => setCurrentReviewIndex(idx)}>
                    <span className={`text-xl sm:text-2xl transition-all duration-300 ${idx <= currentReviewIndex ? (idx === currentReviewIndex ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] scale-125' : '') : 'opacity-20 grayscale'}`}>⭐</span>
                  </div>
                ))}
              </div>
              <span className="text-white font-bold ml-6 sm:text-base">{currentReviewIndex + 1}/{questionIndices.length}</span>
            </div>

            <div className="flex-1 px-4 py-6 flex flex-col items-center justify-start min-h-0 max-w-5xl mx-auto w-full overflow-y-auto">
                <div className="w-full bg-white rounded-2xl p-5 sm:p-6 shadow-xl mb-4 text-slate-800 font-medium text-center">
                    {item.content.text}
                </div>
                
                <div className="w-full bg-[#EAF3FF] rounded-3xl p-5 sm:p-6 shadow-xl mb-6 text-[#5A7A9C] font-medium min-h-[100px]">
                    {answers[item.id] || <span className="italic opacity-50">Not answered</span>}
                </div>
                
                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 pb-12">
                   {item.type === 'descriptive_question' && (
                     <div className="bg-[#1A2C5B] rounded-2xl p-5 shadow-lg border border-white/5 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-blue-400 font-black text-xs tracking-widest uppercase">
                           <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">?</div>
                           Missing
                        </div>
                        <p className="text-white text-sm mt-2">{missing || "You answered everything clearly. Keep up the good work!"}</p>
                     </div>
                   )}
                   
                   <div className={`bg-[#2D1B2E] rounded-2xl p-5 shadow-lg border border-white/5 flex flex-col gap-2 ${item.type === 'mcq' ? 'md:col-span-3 items-center text-center' : ''}`}>
                      <div className="flex items-center gap-2 text-red-400 font-black text-xs tracking-widest uppercase">
                         <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">X</div>
                         {item.type === 'mcq' ? (isCorrect ? 'Correct' : 'Incorrect') : 'Incorrect'}
                      </div>
                      <p className="text-white text-sm mt-2">{incorrect || (isCorrect && item.type === 'mcq' ? "Great job! You selected the right answer." : "No incorrect statements. You're doing a great job!")}</p>
                   </div>
                   
                   {item.type === 'descriptive_question' && (
                     <div className="bg-[#2D2A1B] rounded-2xl p-5 shadow-lg border border-white/5 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-yellow-400 font-black text-xs tracking-widest uppercase">
                           <div className="w-5 h-5 rounded-full bg-yellow-500 text-white flex items-center justify-center text-[10px]">!</div>
                           Grammar
                        </div>
                        <p className="text-white text-sm mt-2">{grammar || "Great grammar! Your sentence is well-structured."}</p>
                     </div>
                   )}
                </div>
            </div>
        </div>
        );
      })()}
    </div>
  );
};

export default ExamFlow;
