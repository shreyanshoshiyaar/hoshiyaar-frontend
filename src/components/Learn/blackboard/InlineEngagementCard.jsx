import React, { useState } from 'react';
import correctSfx from '../../../assets/sounds/correct-choice-43861.mp3';
import errorSfx from '../../../assets/sounds/error-010-206498.mp3';

/**
 * Extracts the reason / reaction / explanation for a selected option
 * from the item's sheet data (inputJson.react, explanation, reason, etc.)
 */
export function getReasonForOption(item, selectedOption) {
  if (!item || !selectedOption) return null;

  // 1. Parse inputJson if string or object
  let ij = item.inputJson || item.input_json;
  if (typeof ij === 'string') {
    try {
      ij = JSON.parse(ij);
    } catch (_) {
      ij = null;
    }
  }

  // 2. Check react dictionary (per-option feedback / teacher guidance)
  const react = item.react || ij?.react;
  if (react && typeof react === 'object') {
    const selClean = String(selectedOption).trim().toLowerCase();

    // Exact or lowercased match
    for (const [key, reasonText] of Object.entries(react)) {
      if (String(key).trim().toLowerCase() === selClean) {
        return reasonText;
      }
    }

    // Partial/contains match
    for (const [key, reasonText] of Object.entries(react)) {
      const kClean = String(key).trim().toLowerCase();
      if (kClean && (selClean.includes(kClean) || kClean.includes(selClean))) {
        return reasonText;
      }
    }
  }

  // 3. Fallback to explanation or reason from item
  const explanation = item.explanation || ij?.explanation || item.reason || ij?.reason || item.why;
  if (explanation && typeof explanation === 'string' && explanation.trim()) {
    return explanation.trim();
  }

  return null;
}

/**
 * InlineEngagementCard:
 * Renders non-audio engagement questions (MCQ, Rearrange, Tap one)
 * directly in the text series inside cards rather than opening a modal bottom-sheet.
 */
export default function InlineEngagementCard({ item, onComplete, onSkip }) {
  if (!item) return null;

  const type = String(item.type || 'engagement-mcq').toLowerCase().trim();
  const isRearrange = type.includes('rearrange');

  // Sound effects
  const playSound = (isCorrect) => {
    try {
      const audio = new Audio(isCorrect ? correctSfx : errorSfx);
      audio.volume = isCorrect ? 0.6 : 0.4;
      audio.play().catch(() => {});
    } catch (_) {}
  };

  if (isRearrange) {
    return <InlineRearrange item={item} onComplete={onComplete} onSkip={onSkip} playSound={playSound} />;
  }

  return <InlineMcq item={item} onComplete={onComplete} onSkip={onSkip} playSound={playSound} />;
}

// ─────────────────────────────────────────────────────────────
// INLINE MCQ / TAP ONE (Matches exact styling of user screenshot)
// ─────────────────────────────────────────────────────────────
function InlineMcq({ item, onComplete, onSkip, playSound }) {
  const rawOptions = item.options || item.inputJson?.options;
  const options = Array.isArray(rawOptions) && rawOptions.length > 0 
    ? rawOptions 
    : (typeof rawOptions === 'string' && rawOptions.trim()
        ? rawOptions.split(',').map(s => s.trim())
        : (item.answer ? [item.answer, 'Option A', 'Option B'] : ['Option 1', 'Option 2', 'Option 3']));

  const resolveCorrectAnswer = () => {
    const rawAns = item.answer != null ? String(item.answer).trim() : '';
    if (rawAns.length > 0) return rawAns;
    if (item.targetWord && String(item.targetWord).trim()) return String(item.targetWord).trim();

    let react = item.react;
    if (!react) {
      const ij = typeof item.inputJson === 'string' ? (() => { try { return JSON.parse(item.inputJson); } catch (_) { return null; } })() : item.inputJson;
      react = ij?.react;
    }
    if (react && typeof react === 'object' && Array.isArray(options) && options.length > 0) {
      const reactKeys = Object.keys(react).map(k => k.trim().toLowerCase());
      const unreacted = options.filter(o => !reactKeys.includes(String(o).trim().toLowerCase()));
      if (unreacted.length === 1) return unreacted[0];
    }
    return options[0] || '';
  };

  const correctAnswer = resolveCorrectAnswer().trim().toLowerCase();

  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState('idle'); // 'idle' | 'success' | 'wrong'
  const [isAnswered, setIsAnswered] = useState(false);
  const [wrongOptions, setWrongOptions] = useState(() => new Set());
  const [wrongReason, setWrongReason] = useState(null);

  const handleOptionClick = (opt) => {
    if (isAnswered) return;

    setSelectedOption(opt);
    const cleanOpt = String(opt || '').trim().toLowerCase();
    const isCorrect = cleanOpt === correctAnswer || (correctAnswer && cleanOpt.includes(correctAnswer));

    if (isCorrect) {
      setFeedback('success');
      setIsAnswered(true);
      setWrongReason(null);
      playSound(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 750);
    } else {
      setFeedback('wrong');
      setWrongOptions(prev => new Set(prev).add(opt));
      playSound(false);

      // Extract reason/explanation mentioned in the sheet for this wrong choice
      const reason = getReasonForOption(item, opt);
      if (reason) {
        setWrongReason(reason);
      } else {
        setWrongReason(null);
      }

      // Reset shake feedback state after 450ms so user can immediately click another option
      setTimeout(() => {
        setFeedback('idle');
        setSelectedOption(null);
      }, 450);
    }
  };

  const handleSkipClick = (e) => {
    e.stopPropagation();
    if (onSkip) onSkip();
    else if (onComplete) onComplete();
  };

  const questionText = item.question || item.text || 'Which of these is correct?';

  return (
    <div className="mt-3 pt-3 border-t border-white/10 animate-fade-in select-none">
      <style>{`
        @keyframes inlineShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-inline-shake {
          animation: inlineShake 0.4s ease-in-out;
        }
      `}</style>

      {/* Question title */}
      <h4 
        style={{ fontFamily: "'Fredoka', Trebuchet MS, sans-serif" }}
        className="text-[16px] sm:text-[20px] md:text-[22px] font-bold text-white mb-1.5 leading-snug tracking-normal"
      >
        {questionText}
      </h4>

      {/* Label: WHAT DO YOU THINK? TAP ONE */}
      <div 
        style={{ fontFamily: "'Nunito', sans-serif" }}
        className="text-[11px] sm:text-xs font-black tracking-wider text-[#F59E0B] uppercase mt-1.5 mb-2.5"
      >
        WHAT DO YOU THINK? TAP ONE
      </div>

      {/* Option pills & Skip button */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {options.map((opt, idx) => {
          const isSelected = selectedOption === opt;
          const isCorrect = isSelected && feedback === 'success';
          const isCurrentlyShaking = isSelected && feedback === 'wrong';
          const isPreviouslyWrong = wrongOptions.has(opt);

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => handleOptionClick(opt)}
              style={{ fontFamily: "'Fredoka', sans-serif" }}
              className={`px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-full text-sm sm:text-base md:text-lg font-bold border-2 transition-all duration-150 active:scale-95 shadow-md flex items-center justify-center cursor-pointer select-none ${
                isCorrect
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-[1.02]'
                  : isCurrentlyShaking
                  ? 'bg-rose-600 border-rose-400 text-white animate-inline-shake'
                  : isPreviouslyWrong
                  ? 'bg-rose-950/60 border-rose-500/70 text-rose-200 opacity-75'
                  : 'bg-[#0B1522] border-[#38BDF8] text-white hover:bg-[#152840] hover:border-[#7DD3FC]'
              }`}
            >
              <span>{opt}</span>
              {isPreviouslyWrong && !isCurrentlyShaking && (
                <span className="ml-1.5 text-xs font-black text-rose-400">✕</span>
              )}
            </button>
          );
        })}

        {/* Skip button beside options */}
        <button
          type="button"
          onClick={handleSkipClick}
          style={{ fontFamily: "'Nunito', sans-serif" }}
          className="text-[#F59E0B] hover:text-[#FBBF24] font-black text-xs sm:text-base flex items-center gap-0.5 ml-2 cursor-pointer active:scale-95 transition-transform"
          title="Skip question"
        >
          <span>Skip</span>
          <span className="text-sm sm:text-base font-bold">›</span>
        </button>
      </div>

      {/* ── REASON / EXPLANATION FROM SHEET (SHOWN WHEN WRONG) ── */}
      {wrongReason && (
        <div className="w-full mt-3.5 p-3 sm:p-3.5 rounded-2xl bg-[#1A1A24] border border-amber-400/40 text-amber-200 text-sm sm:text-base flex items-start gap-2.5 animate-fade-in shadow-md">
          <span className="text-base sm:text-lg flex-shrink-0 mt-0.5">💡</span>
          <div className="flex-1 min-w-0 leading-snug">
            <span 
              style={{ fontFamily: "'Nunito', sans-serif" }}
              className="font-black text-amber-400 text-xs sm:text-sm uppercase tracking-wider block mb-1"
            >
              Think about this:
            </span>
            <p 
              style={{ fontFamily: "'Fredoka', Trebuchet MS, sans-serif" }}
              className="text-slate-100 text-sm sm:text-base font-medium leading-relaxed"
            >
              {wrongReason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INLINE REARRANGE (Clean inline word sequencing)
// ─────────────────────────────────────────────────────────────
function InlineRearrange({ item, onComplete, onSkip, playSound }) {
  const rawWords = item.words || item.options;
  const words = Array.isArray(rawWords) && rawWords.length > 0 
    ? rawWords 
    : (typeof rawWords === 'string' && rawWords.trim()
        ? rawWords.split(',').map(s => s.trim())
        : (item.answer ? String(item.answer).split(',').map(s => s.trim()) : []));

  const [availableWords, setAvailableWords] = useState(() => 
    words.map((w, idx) => ({ id: `${w}_${idx}`, text: String(w).trim() })).sort(() => Math.random() - 0.5)
  );
  const [selectedWords, setSelectedWords] = useState([]);
  const [feedback, setFeedback] = useState('idle');
  const [isAnswered, setIsAnswered] = useState(false);
  const [wrongReason, setWrongReason] = useState(null);

  const correctAnswer = String(item.answer || item.targetWord || words.join('')).replace(/[\s,.-]/g, '').toLowerCase();

  const handleSelectWord = (wordObj) => {
    if (isAnswered) return;
    const nextSelected = [...selectedWords, wordObj];
    const nextAvail = availableWords.filter(w => w.id !== wordObj.id);
    setSelectedWords(nextSelected);
    setAvailableWords(nextAvail);
    setFeedback('idle');

    // If all words are placed, auto-verify!
    if (nextAvail.length === 0) {
      const assembled = nextSelected.map(w => w.text).join('').replace(/[\s,.-]/g, '').toLowerCase();
      if (assembled === correctAnswer) {
        setFeedback('success');
        setIsAnswered(true);
        setWrongReason(null);
        playSound(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 750);
      } else {
        setFeedback('wrong');
        playSound(false);
        const reason = getReasonForOption(item, assembled);
        if (reason) setWrongReason(reason);
        setTimeout(() => {
          setFeedback('idle');
        }, 700);
      }
    }
  };

  const handleRemoveWord = (wordObj) => {
    if (isAnswered) return;
    setSelectedWords(prev => prev.filter(w => w.id !== wordObj.id));
    setAvailableWords(prev => [...prev, wordObj]);
    setFeedback('idle');
  };

  const handleReset = () => {
    if (isAnswered) return;
    setAvailableWords(words.map((w, idx) => ({ id: `${w}_${idx}`, text: String(w).trim() })).sort(() => Math.random() - 0.5));
    setSelectedWords([]);
    setFeedback('idle');
    setWrongReason(null);
  };

  const handleSkipClick = (e) => {
    e.stopPropagation();
    if (onSkip) onSkip();
    else if (onComplete) onComplete();
  };

  const questionText = item.question || item.text || 'Put the words in the correct order:';

  return (
    <div className="mt-3 pt-3 border-t border-white/10 animate-fade-in select-none">
      {/* Question title */}
      <h4 
        style={{ fontFamily: "'Fredoka', Trebuchet MS, sans-serif" }}
        className="text-[18px] sm:text-[20px] md:text-[22px] font-bold text-white mb-2 leading-snug tracking-normal"
      >
        {questionText}
      </h4>

      {/* Label */}
      <div 
        style={{ fontFamily: "'Nunito', sans-serif" }}
        className="text-xs sm:text-sm font-black tracking-wider text-[#F59E0B] uppercase mt-2 mb-3"
      >
        TAP WORDS TO BUILD THE ANSWER
      </div>

      {/* Answer slot */}
      <div 
        className={`min-h-[50px] p-2.5 rounded-2xl mb-3 flex flex-wrap items-center gap-2 border-2 transition-all ${
          feedback === 'success'
            ? 'bg-emerald-950/40 border-emerald-400'
            : feedback === 'wrong'
            ? 'bg-rose-950/40 border-rose-400'
            : 'bg-[#060D17] border-[#38BDF8]/60'
        }`}
      >
        {selectedWords.length === 0 ? (
          <span className="text-slate-500 text-sm font-medium italic px-2">Tap words below to arrange...</span>
        ) : (
          selectedWords.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => handleRemoveWord(w)}
              disabled={isAnswered}
              style={{ fontFamily: "'Fredoka', sans-serif" }}
              className="px-4 py-1.5 rounded-full text-sm sm:text-base font-bold bg-[#1E74FD] text-white hover:bg-rose-500 active:scale-95 transition-all cursor-pointer shadow-sm"
              title="Tap to remove"
            >
              {w.text} ✕
            </button>
          ))
        )}
      </div>

      {/* Word bank & Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {availableWords.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => handleSelectWord(w)}
            style={{ fontFamily: "'Fredoka', sans-serif" }}
            className="px-4 py-1.5 rounded-full text-sm sm:text-base font-bold bg-[#0B1522] border-2 border-[#38BDF8] text-white hover:bg-[#152840] hover:border-[#7DD3FC] active:scale-95 transition-all cursor-pointer shadow-md"
          >
            {w.text}
          </button>
        ))}

        {selectedWords.length > 0 && !isAnswered && (
          <button
            type="button"
            onClick={handleReset}
            style={{ fontFamily: "'Nunito', sans-serif" }}
            className="text-slate-400 hover:text-white font-bold text-xs sm:text-sm px-2 py-1 underline cursor-pointer"
          >
            Reset
          </button>
        )}

        <button
          type="button"
          onClick={handleSkipClick}
          style={{ fontFamily: "'Nunito', sans-serif" }}
          className="text-[#F59E0B] hover:text-[#FBBF24] font-black text-sm sm:text-base flex items-center gap-0.5 ml-auto cursor-pointer active:scale-95 transition-transform"
          title="Skip question"
        >
          <span>Skip</span>
          <span className="text-base font-bold">›</span>
        </button>
      </div>

      {/* Reason / Explanation from sheet when wrong */}
      {wrongReason && (
        <div className="w-full mt-3.5 p-3 sm:p-3.5 rounded-2xl bg-[#1A1A24] border border-amber-400/40 text-amber-200 text-sm sm:text-base flex items-start gap-2.5 animate-fade-in shadow-md">
          <span className="text-base sm:text-lg flex-shrink-0 mt-0.5">💡</span>
          <div className="flex-1 min-w-0 leading-snug">
            <span 
              style={{ fontFamily: "'Nunito', sans-serif" }}
              className="font-black text-amber-400 text-xs sm:text-sm uppercase tracking-wider block mb-1"
            >
              Think about this:
            </span>
            <p 
              style={{ fontFamily: "'Fredoka', Trebuchet MS, sans-serif" }}
              className="text-slate-100 text-sm sm:text-base font-medium leading-relaxed"
            >
              {wrongReason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
