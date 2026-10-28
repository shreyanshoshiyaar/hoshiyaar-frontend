import React from 'react';

// Where an item's feedback text can live (sheet columns vary between chapters)
const explanationTextOf = (item) => String(
  item?.explanation || 
  item?.Explanation || 
  item?.solution || 
  item?.Solution || 
  item?.why || 
  item?.reason || 
  ''
).trim();

const onWrongTextOf = (item) => String(
  item?.onWrong || 
  item?.OnWrong || 
  item?.on_wrong || 
  item?.hint || 
  item?.Hint || 
  item?.thinkOfIt || 
  item?.think_of_it || 
  item?.mnemonic || 
  item?.trick || 
  ''
).trim();

/** True when a wrong answer will show feedback cards (used to lay them out beside the question on desktop). */
export const hasQuizFeedback = (item) => Boolean(item && (explanationTextOf(item) || onWrongTextOf(item)));

/**
 * QuizFeedbackCards
 * Displays Card 1 (Red/Pink explanation) and Card 2 (Blue "Think of it this way" mnemonic/hint)
 * strictly only when present in Excel / item curriculum data.
 * If neither is present, renders nothing.
 */
export default function QuizFeedbackCards({ item, showResult, isCorrect }) {
  if (!showResult || isCorrect || !item) return null;

  const rawExplanation = explanationTextOf(item);

  const correctAnswerStr = Array.isArray(item?.answer) ? item.answer.join(', ') : String(item?.answer || '');

  const explanationContent = rawExplanation
    ? (rawExplanation.toLowerCase().startsWith('the answer is')
        ? rawExplanation
        : (correctAnswerStr ? `The answer is “${correctAnswerStr}”. ${rawExplanation}` : rawExplanation))
    : '';

  const onWrongContent = onWrongTextOf(item);

  if (!explanationContent && !onWrongContent) return null;

  return (
    <div className="w-full flex flex-col gap-2.5 my-2 animate-fade-in text-left">
      {/* Card 1: Not quite – here is the right one. */}
      {explanationContent && (
        <div className="w-full bg-[#FEECEB] rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 lgshort:p-3.5 text-left border border-red-200/70 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="text-[#8A2C2A] font-black text-2xl leading-none mt-0.5 select-none">✕</div>
            <div className="flex-1">
              <h4 
                style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }} 
                className="font-black text-[#8A2C2A] text-lg sm:text-xl lgshort:text-base leading-tight"
              >
                Not quite – here is the right one.
              </h4>
              <p className="text-sm sm:text-base lgshort:text-sm font-bold text-[#8A2C2A] leading-relaxed lgshort:leading-snug mt-1.5 lgshort:mt-1 opacity-90">
                {explanationContent}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Card 2: Think of it this way */}
      {onWrongContent && (
        <div className="w-full bg-[#EBF5FF] rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 lgshort:p-3.5 text-left border border-blue-200/70 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="text-[#133E68] font-black text-2xl leading-none mt-0.5 select-none">›</div>
            <div className="flex-1">
              <h4 
                style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }} 
                className="font-black text-[#133E68] text-lg sm:text-xl lgshort:text-base leading-tight"
              >
                Think of it this way
              </h4>
              <p className="text-sm sm:text-base lgshort:text-sm font-bold text-[#1D4A77] leading-relaxed lgshort:leading-snug mt-1.5 lgshort:mt-1 opacity-90">
                {onWrongContent}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
