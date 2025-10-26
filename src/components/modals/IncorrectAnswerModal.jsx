import React, { useEffect, useState, useRef } from 'react';

export default function IncorrectAnswerModal({ 
  isOpen, 
  onClose, 
  onContinue, 
  onTryAgain, 
  incorrectText, 
  correctAnswer,
  showContinueButton = true,
  showTryAgainButton = true
}) {
  const [isVisible, setIsVisible] = useState(false);
  const continueBtnRef = useRef(null);
  const tryAgainBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure smooth animation
      setTimeout(() => setIsVisible(true), 10);

      // Focus primary action for reliable Enter handling (does not affect other components)
      setTimeout(() => {
        const target = (typeof onContinue === 'function') ? continueBtnRef.current : tryAgainBtnRef.current;
        try { target && target.focus(); } catch (_) {}
      }, 30);

      const onKey = (e) => {
        if (e.key !== 'Enter') return;
        if (e.repeat) return; // avoid multiple triggers when held
        if (e.isComposing) return; // ignore IME composing
        e.preventDefault();
        e.stopPropagation();
        // Prefer Continue if it's available AND shown
        if (typeof onContinue === 'function' && showContinueButton) {
          onContinue();
        } 
        // Otherwise, use Try Again if it's available AND shown
        else if (typeof onTryAgain === 'function' && showTryAgainButton) {
          onTryAgain();
        }
      };
      window.addEventListener('keydown', onKey, { capture: true });
      return () => window.removeEventListener('keydown', onKey, { capture: true });
    } else {
      setIsVisible(false);
    }
  }, [isOpen, onContinue, onTryAgain, showContinueButton, showTryAgainButton]);

  if (!isOpen) return null;

  return (
    <>
      {/* Small screens: centered compact popup with overlay */}
      <div className={`fixed inset-0 z-50 md:hidden ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 shadow-xl bg-pink-50 border-pink-400 rounded-2xl transition-all duration-300 ease-out ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}>
          <div className="max-w-md mx-auto px-6 py-4 flex flex-row items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="text-left">
                <div className="text-base font-extrabold text-gray-900">Incorrect answer</div>
                <div className="text-sm text-gray-700">
                  <span>Correct answer: </span>
                  {(() => {
                    const isImageUrl = typeof correctAnswer === 'string' && 
                      (correctAnswer.startsWith('http') || correctAnswer.startsWith('https'));
                    if (isImageUrl) {
                      return (
                        <div className="flex items-center gap-2 mt-1">
                          <img 
                            src={correctAnswer} 
                            alt="Correct answer"
                            className="w-10 h-10 object-contain rounded border border-gray-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <span className="text-xs text-gray-500" style={{display: 'none'}}>
                            Image failed to load
                          </span>
                        </div>
                      );
                    }
                    return <span className="font-semibold">{correctAnswer}</span>;
                  })()}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {typeof onTryAgain === 'function' && showTryAgainButton && (
                <button
                  ref={tryAgainBtnRef}
                  onClick={onTryAgain}
                  className="px-4 py-2 rounded-xl text-white font-extrabold text-sm bg-orange-600 hover:bg-orange-700 transition-colors"
                >
                  Try Again
                </button>
              )}
              {typeof onContinue === 'function' && showContinueButton && (
                <button
                  ref={continueBtnRef}
                  onClick={onContinue}
                  className="px-4 py-2 rounded-xl text-white font-extrabold text-sm bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* md+ screens: restore older wide bottom banner style (no overlay) */}
      <div className={`hidden md:block fixed left-0 right-0 bottom-0 z-50 border-t-4 shadow-2xl bg-pink-50 border-pink-400 transform transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="text-left">
              <div className="text-lg font-extrabold text-gray-900">Incorrect answer</div>
              <div className="text-sm text-gray-700">
                <span>Correct answer: </span>
                {(() => {
                  const isImageUrl = typeof correctAnswer === 'string' && 
                    (correctAnswer.startsWith('http') || correctAnswer.startsWith('https'));
                  if (isImageUrl) {
                    return (
                      <div className="inline-flex items-center gap-2 ml-1">
                        <img 
                          src={correctAnswer} 
                          alt="Correct answer"
                          className="w-12 h-12 object-contain rounded border border-gray-300 bg-white"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'inline-block';
                          }}
                        />
                        <span className="text-xs text-gray-500" style={{display: 'none'}}>Image failed to load</span>
                      </div>
                    );
                  }
                  return <span className="font-semibold">{correctAnswer}</span>;
                })()}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {typeof onTryAgain === 'function' && showTryAgainButton && (
              <button
                ref={tryAgainBtnRef}
                onClick={onTryAgain}
                className="px-6 py-3 rounded-2xl text-white font-extrabold text-lg bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                Try Again
              </button>
            )}
            {typeof onContinue === 'function' && showContinueButton && (
              <button
                ref={continueBtnRef}
                onClick={onContinue}
                className="px-8 py-3 rounded-2xl text-white font-extrabold text-xl bg-green-600 hover:bg-green-700 transition-colors"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
