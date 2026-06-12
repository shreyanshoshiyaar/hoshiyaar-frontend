import React, { useEffect, useState } from 'react';

export default function NoSkipsModal({ isOpen, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-start justify-center pt-20">
      <div className={`pointer-events-auto bg-red-50 border-l-4 border-red-500 rounded shadow-xl px-6 py-4 flex items-center transition-all duration-300 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
      }`}>
        <div className="text-2xl mr-4">⚠️</div>
        <div>
          <h3 className="text-red-800 font-bold">No Skips Left</h3>
          <p className="text-red-600 text-sm">You have exhausted all your skips for this lesson.</p>
        </div>
        <button 
          onClick={onClose}
          className="ml-6 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
