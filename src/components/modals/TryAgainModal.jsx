import React, { useEffect, useState } from 'react';

export default function TryAgainModal({ isOpen, onClose, onTryAgain }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure smooth animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      {/* Bottom-up sliding feedback bar */}
      <div className={`fixed left-0 right-0 bottom-0 z-50 border-t-4 shadow-2xl bg-pink-50 border-pink-400 transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 mr-4 bg-pink-100 rounded-full flex items-center justify-center">
              <span className="text-2xl text-red-500">✕</span>
            </div>
            <div>
              <div className="text-xl font-extrabold text-gray-900">
                Try Again!
              </div>
              <div className="text-gray-700">
                That's not quite right. Take another look and try again.
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-2xl text-gray-700 font-semibold bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
            <button
              onClick={onTryAgain}
              className="px-6 py-3 rounded-2xl text-white font-extrabold bg-pink-600 hover:bg-pink-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

