import React from 'react';

export default function FeedbackModal({ open, correct, expectedText, onClose, onNext }) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-11/12 max-w-lg p-8 transform transition-all duration-300 scale-100">
        {/* Header with Icon */}
        <div className="text-center mb-6">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
            correct ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {correct ? (
              <div className="text-4xl">🎉</div>
            ) : (
              <div className="text-4xl">😔</div>
            )}
          </div>
          
          <h2 className={`text-2xl font-bold ${
            correct ? 'text-green-600' : 'text-red-600'
          }`}>
            {correct ? 'Excellent!' : 'Not quite right'}
          </h2>
          
          <p className={`text-lg mt-2 ${
            correct ? 'text-green-700' : 'text-red-700'
          }`}>
            {correct ? 'You got it right!' : 'Let\'s try again next time'}
          </p>
        </div>

        {/* Correct Answer Display */}
        {!correct && expectedText && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border-2 border-dashed border-gray-300">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">The correct answer is:</p>
              {(() => {
                // Check if expectedText is an image URL
                const isImageUrl = typeof expectedText === 'string' && 
                  (expectedText.startsWith('http') || expectedText.startsWith('https'));
                
                if (isImageUrl) {
                  return (
                    <div className="flex justify-center">
                      <img 
                        src={expectedText} 
                        alt="Correct answer"
                        className="w-24 h-24 object-contain rounded border border-gray-300 bg-white p-2"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-lg inline-block" style={{display: 'none'}}>
                        Image failed to load
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-lg inline-block">
                      {expectedText}
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        )}

        {/* Success Message for Correct */}
        {correct && (
          <div className="bg-green-50 rounded-2xl p-4 mb-6 border-2 border-green-200">
            <div className="text-center">
              <p className="text-green-700 font-semibold">Great job! Keep it up! 🚀</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200"
          >
            Close
          </button>
          <button 
            onClick={onNext}
            className={`flex-1 px-6 py-3 rounded-2xl font-bold text-white transition-all duration-200 hover:scale-105 ${
              correct 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {correct ? 'Continue' : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  );
}


