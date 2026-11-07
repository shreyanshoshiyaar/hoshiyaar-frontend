import React from 'react';

// Card colours in the order the client's design uses them
const CARD_THEMES = [
  { bg: 'bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9]', bar: 'bg-[#22C55E]', track: 'bg-white/70', pct: 'text-[#15803D]', btn: 'bg-gradient-to-b from-[#4ADE80] to-[#16A34A] shadow-[0_3px_0_0_#15803D]' },
  { bg: 'bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB]', bar: 'bg-[#3B82F6]', track: 'bg-white/70', pct: 'text-[#1D4ED8]', btn: 'bg-gradient-to-b from-[#60A5FA] to-[#2563EB] shadow-[0_3px_0_0_#1E40AF]' },
  { bg: 'bg-gradient-to-br from-[#F3E5F5] to-[#E1BEE7]', bar: 'bg-[#9333EA]', track: 'bg-white/70', pct: 'text-[#7E22CE]', btn: 'bg-gradient-to-b from-[#C084FC] to-[#9333EA] shadow-[0_3px_0_0_#6B21A8]' },
  { bg: 'bg-gradient-to-br from-[#E8F5E9] to-[#DCFCE7]', bar: 'bg-[#14B8A6]', track: 'bg-white/70', pct: 'text-[#0F766E]', btn: 'bg-gradient-to-b from-[#2DD4BF] to-[#0D9488] shadow-[0_3px_0_0_#115E59]' },
];

// A picture for each chapter, picked from its title
const CHAPTER_ART = [
  [/water|states of matter|journey/i, '🌍'],
  [/separat|mixture|substance|acid|base|salt|chemical/i, '🧪'],
  [/material|metal|matter|crystal/i, '💎'],
  [/living|diversity|plant|animal|organism|life|biodiversity/i, '🌱'],
  [/light|shadow|reflect/i, '💡'],
  [/electric|circuit|current/i, '⚡'],
  [/magnet/i, '🧲'],
  [/food|nutrition|eat|diet/i, '🍎'],
  [/health|body|adolescen|disease/i, '🩺'],
  [/measure|length|distance/i, '📏'],
  [/heat|temperature/i, '🌡️'],
  [/motion|force|pressure|speed/i, '🚀'],
  [/air|weather|climate|wind/i, '🌬️'],
  [/earth|sky|space|star|planet/i, '🪐'],
  [/invisible|micro|cell/i, '🔬'],
];
export const artFor = (title = '') => (CHAPTER_ART.find(([re]) => re.test(title)) || [null, '🔬'])[1];

export default function ChaptersGrid({ chapters, loading, onContinue, onAllLessons }) {
  return (
    <div className="mx-3 mt-4 rounded-[24px] bg-white/95 border-2 border-white p-4 shadow-[0_0_0_4px_rgba(191,219,254,0.5),0_8px_24px_rgba(59,130,246,0.18)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-1.5 text-[20px] font-black text-slate-900">
          <span>📖</span> Chapters
        </h2>
        <button
          onClick={onAllLessons}
          className="rounded-full border-2 border-[#C4B5FD] bg-white px-3 py-1 text-xs font-black text-[#6D28D9] active:translate-y-px"
        >
          All Lessons →
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map(n => <div key={n} className="h-[170px] rounded-[20px] bg-slate-100 animate-pulse" />)}
        </div>
      ) : chapters.length === 0 ? (
        <div className="rounded-[20px] bg-slate-50 p-5 text-center">
          <p className="text-base font-black text-slate-800">Ready to learn?</p>
          <button onClick={onAllLessons} className="mt-3 rounded-full bg-[#16A34A] px-5 py-2 text-xs font-black text-white shadow-[0_3px_0_0_#15803D]">
            Start Learning
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {chapters.map((ch, idx) => {
            const theme = CARD_THEMES[idx % CARD_THEMES.length];
            const action = ch.isCompleted ? 'Review' : ch.isInProgress ? 'Continue' : 'Start';
            return (
              <div
                key={ch._id || idx}
                onClick={() => onContinue(ch)}
                className={`relative flex flex-col rounded-[20px] p-2.5 shadow-[0_3px_8px_rgba(0,0,0,0.08)] cursor-pointer active:translate-y-px ${theme.bg}`}
              >
                {ch.isCompleted && (
                  <span className="absolute top-2 right-2 rounded-full bg-[#22C55E] px-1.5 py-px text-[9px] font-black text-white shadow-sm">✓ DONE</span>
                )}
                <span className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[28px] shadow-sm mb-1.5">
                  {artFor(ch.title)}
                </span>
                <p className="text-[12.5px] font-black text-slate-900 leading-snug line-clamp-2 break-words min-h-[34px]" title={ch.title}>
                  {ch.title}
                </p>

                <div className="mt-auto pt-1.5">
                  {ch.isInProgress && ch.st.total > 0 ? (
                    <>
                      <div className="flex items-center justify-between text-[10px] font-black text-slate-600 mb-0.5">
                        <span>{ch.st.completed} of {ch.st.total} done</span>
                        <span className={theme.pct}>{ch.pct}%</span>
                      </div>
                      <div className={`h-1.5 w-full rounded-full overflow-hidden ${theme.track}`}>
                        <div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${Math.max(ch.pct, 6)}%` }} />
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] font-black text-slate-600">{ch.st.total > 0 ? `${ch.st.total} lessons` : 'Start learning'}</p>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onContinue(ch); }}
                    className={`mt-2 w-full rounded-full py-1.5 text-[13px] font-black text-white active:translate-y-px active:shadow-none ${theme.btn}`}
                  >
                    {action} →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
