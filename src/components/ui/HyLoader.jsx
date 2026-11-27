import React, { useEffect, useState } from 'react';

// The app's one loading screen: a CSS-only rolling cube (no images), a progress bar that fills fast to 80% and
// then creeps, a few rotating lines, and, if loading takes long, a "Stuck?" panel with Go back and Contact us.
// It works outside the router too (it is the app-wide Suspense fallback), so it uses window.location / history.

const SUPPORT_WHATSAPP = '918310532323';
const LINES = ['Getting your lesson ready', 'Sharpening the chalk', 'Waking up Hoshi', 'Almost there'];
const HELP_AFTER_MS = 10000;

const CSS = `
.hyl,.hyl *{box-sizing:border-box}
.hyl{position:relative;width:100%;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;
  background:radial-gradient(70vw 70vw at 110% -10%,rgba(255,255,255,.7),transparent 58%),radial-gradient(55vw 55vw at -15% -20%,rgba(255,255,255,.6),transparent 56%),#EAF1FB;
  font-family:var(--f-display,'Fredoka',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif);overflow:hidden;user-select:none}
.hyl.hyl-inline{min-height:0;background:transparent;padding:72px 16px 160px}
.hyl-stage{position:relative;width:190px;height:170px;perspective:880px;isolation:isolate}
.hyl-track{position:absolute;inset:auto 8px 14px;height:2px;background:linear-gradient(90deg,transparent,rgba(37,99,235,.45),transparent);z-index:-2}
.hyl-cube{position:absolute;left:50%;bottom:24px;width:64px;height:64px;margin-left:-32px;transform-style:preserve-3d;
  transform:rotateX(-8deg) rotateY(8deg);animation:hyl-roll 1.4s infinite cubic-bezier(.58,.08,.45,.93);will-change:transform}
.hyl-face{position:absolute;inset:0;border:1px solid rgba(29,78,216,.25);border-radius:6px;backface-visibility:hidden;overflow:hidden}
.hyl-face::after{content:"";position:absolute;inset:0;background:linear-gradient(130deg,rgba(255,255,255,.35),transparent 45%)}
.hyl-front{transform:translateZ(32px);background:linear-gradient(145deg,#93C5FD 0%,#3B82F6 45%,#1D4ED8 100%);
  box-shadow:inset 0 10px 16px rgba(255,255,255,.3),inset 0 -10px 14px rgba(0,0,0,.18)}
.hyl-right{transform:rotateY(90deg) translateZ(32px);background:linear-gradient(160deg,#60A5FA,#1E40AF 74%)}
.hyl-top{transform:rotateX(90deg) translateZ(32px);background:linear-gradient(160deg,#BFDBFE,#3B82F6 68%)}
.hyl-shadow{position:absolute;left:50%;margin-left:-44px;bottom:9px;width:88px;height:12px;border-radius:50%;
  background:radial-gradient(ellipse at center,rgba(30,58,138,.35),rgba(30,58,138,0) 72%);animation:hyl-shadow 1.4s infinite cubic-bezier(.58,.08,.45,.93);z-index:-1}
.hyl-title{margin-top:18px;font-size:20px;font-weight:700;color:#0F1F3D;text-align:center}
.hyl-line{margin-top:4px;height:20px;font-size:14px;font-weight:500;color:#5B6B85;text-align:center;animation:hyl-fade 2.6s ease-in-out infinite}
.hyl-progress{margin-top:16px;display:flex;align-items:center;gap:10px;width:220px}
.hyl-rail{flex:1;height:6px;border-radius:999px;background:rgba(37,99,235,.12);overflow:hidden}
.hyl-fill{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#60A5FA,#2563EB);transition:width .28s ease;position:relative;overflow:hidden}
.hyl-fill::after{content:"";position:absolute;inset:0;width:40%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);animation:hyl-scan 1.4s infinite linear}
.hyl-num{min-width:36px;text-align:right;font-size:13px;font-weight:600;color:#2563EB;font-variant-numeric:tabular-nums}
.hyl-help{margin-top:28px;width:100%;max-width:320px;padding:16px;border-radius:20px;background:#fff;text-align:center;
  box-shadow:0 1px 2px rgba(0,0,0,.04),0 12px 30px -14px rgba(15,31,61,.25);animation:hyl-up .4s ease-out}
.hyl-help p{margin:0;font-size:14px;font-weight:600;color:#0F1F3D}
.hyl-help small{display:block;margin-top:2px;font-size:12.5px;font-weight:500;color:#5B6B85}
.hyl-btns{margin-top:12px;display:flex;gap:10px}
.hyl-btn{flex:1;height:44px;border-radius:999px;font:inherit;font-size:15px;font-weight:600;cursor:pointer;border:0;transition:transform .15s}
.hyl-btn:active{transform:scale(.97)}
.hyl-back{background:#EEF2F7;color:#0F1F3D}
.hyl-contact{background:#22C55E;color:#fff;display:inline-flex;align-items:center;justify-content:center;gap:6px}
@keyframes hyl-roll{0%{transform:translateY(0) rotateX(-8deg) rotateY(8deg) rotateZ(0)}11%{transform:translateY(-14px) rotateX(-8deg) rotateY(8deg) rotateZ(46deg)}
  22%,28%{transform:translateY(0) rotateX(-8deg) rotateY(8deg) rotateZ(90deg)}37.5%{transform:translateY(-14px) rotateX(-8deg) rotateY(8deg) rotateZ(136deg)}
  47%,53%{transform:translateY(0) rotateX(-8deg) rotateY(8deg) rotateZ(180deg)}62.5%{transform:translateY(-14px) rotateX(-8deg) rotateY(8deg) rotateZ(226deg)}
  72%,78%{transform:translateY(0) rotateX(-8deg) rotateY(8deg) rotateZ(270deg)}87.5%{transform:translateY(-14px) rotateX(-8deg) rotateY(8deg) rotateZ(316deg)}
  97%,100%{transform:translateY(0) rotateX(-8deg) rotateY(8deg) rotateZ(360deg)}}
@keyframes hyl-shadow{0%,22%,28%,47%,53%,72%,78%,97%,100%{transform:scaleX(.9);opacity:.55}11%,37.5%,62.5%,87.5%{transform:scaleX(.7);opacity:.3}}
@keyframes hyl-scan{from{transform:translateX(-120%)}to{transform:translateX(260%)}}
@keyframes hyl-fade{0%,100%{opacity:0;transform:translateY(3px)}15%,85%{opacity:1;transform:none}}
@keyframes hyl-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.hyl-cube,.hyl-shadow,.hyl-fill::after,.hyl-line{animation:none}}
`;

// Fills to 80% over ~12 s, then 1% every 2 s, never past 99% (the screen goes away when the page is ready)
const useFakeProgress = () => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const t = Date.now() - start;
      setValue(t < 12000 ? Math.floor((t / 12000) * 80) : Math.min(99, 80 + Math.floor((t - 12000) / 2000)));
    }, 150);
    return () => clearInterval(id);
  }, []);
  return value;
};

// Leaving a stuck screen: clear the saved "resume here" spots (a broken one can bring the learner straight back)
const clearResume = () => {
  try {
    localStorage.removeItem('hoshiyaar_last_path');
    Object.keys(localStorage).filter((k) => k.startsWith('resume_lesson_')).forEach((k) => localStorage.removeItem(k));
  } catch (_) {}
};

// inline: inside a page (e.g. the lesson map while it loads) instead of covering the whole screen
export default function HyLoader({ text = 'Loading', lines = LINES, inline = false }) {
  const progress = useFakeProgress();
  const [line, setLine] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const a = setInterval(() => setLine((i) => (i + 1) % lines.length), 2600);
    const b = setTimeout(() => setShowHelp(true), HELP_AFTER_MS);
    return () => { clearInterval(a); clearTimeout(b); };
  }, []);

  const goBack = () => {
    clearResume();
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/home';
  };
  const contact = () => {
    const msg = encodeURIComponent(`Hi HoshiYaar, the app is stuck on loading (${window.location.pathname}).`);
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${msg}`, '_blank', 'noopener');
  };

  return (
    <div className={`hyl${inline ? ' hyl-inline' : ''}`} role="status" aria-live="polite" aria-label={text}>
      <style>{CSS}</style>
      <div className="hyl-stage" aria-hidden="true">
        <span className="hyl-track" />
        <span className="hyl-shadow" />
        <div className="hyl-cube">
          <span className="hyl-face hyl-front" />
          <span className="hyl-face hyl-right" />
          <span className="hyl-face hyl-top" />
        </div>
      </div>

      <div className="hyl-title">{text}</div>
      <div className="hyl-line" key={line}>{lines[line % lines.length]}…</div>

      <div className="hyl-progress" aria-hidden="true">
        <span className="hyl-rail"><span className="hyl-fill" style={{ width: `${progress}%` }} /></span>
        <span className="hyl-num">{progress}%</span>
      </div>

      {showHelp && (
        <div className="hyl-help">
          <p>Taking longer than usual?</p>
          <small>Check your internet, go back, or tell us and we'll help.</small>
          <div className="hyl-btns">
            <button type="button" className="hyl-btn hyl-back" onClick={goBack}>Go back</button>
            <button type="button" className="hyl-btn hyl-contact" onClick={contact}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.4z" /></svg>
              Contact us
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
