import React, { useState, useEffect } from 'react';
import heroChar from '../../assets/images/loading_char.png';

export default function SimpleLoading({ text = "Loading adventure", spinnerOnly = false }) {
  const [showTimeoutReturn, setShowTimeoutReturn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeoutReturn(true);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleReturn = () => {
    // Clear potentially broken state
    try {
      localStorage.removeItem('hoshiyaar_last_path');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('resume_lesson_')) {
          localStorage.removeItem(key);
        }
      }
    } catch (_) {}
    window.location.href = '/learn';
  };

  if (spinnerOnly) {
    return (
      <div className="fixed inset-0 z-[100] w-full h-full bg-white flex flex-col items-center justify-center overflow-hidden">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-bold text-gray-800 tracking-wider">{text}</p>
        
        {showTimeoutReturn && (
          <button
            onClick={handleReturn}
            className="mt-8 px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md animate-fade-in hover:bg-red-700 active:scale-95 transition-all"
          >
            Taking too long? Go to Dashboard
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Mobile Loading Screen (Branded) */}
      <div className="md:hidden fixed inset-0 z-[100] w-full h-full bg-[#fcf9ff] flex flex-col items-center justify-center overflow-hidden">
        <img 
          src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778249705/img-to-link/jcwmajaolrm6corrduii.webp" 
          alt="Loading Background" 
          className="absolute inset-0 w-full h-full object-contain object-center"
        />
        <div className="absolute bottom-[20%] left-0 right-0 z-10 flex flex-col items-center justify-center">
          <div className="bg-white/40 backdrop-blur-md px-8 py-3 rounded-full border border-white/20 shadow-lg">
            <p className="text-xl font-bold text-gray-800 tracking-wider">{text}</p>
          </div>
          {showTimeoutReturn && (
            <button
              onClick={handleReturn}
              className="mt-6 px-6 py-3 bg-red-600/90 text-white font-bold rounded-xl shadow-lg backdrop-blur-md animate-fade-in hover:bg-red-700 active:scale-95 transition-all"
            >
              Taking too long? Go to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Desktop Loading Screen (Simple Spinner) */}
      <div className="hidden md:flex fixed inset-0 z-[100] w-full h-full bg-white flex-col items-center justify-center overflow-hidden">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-bold text-gray-800 tracking-wider">{text}</p>
        
        {showTimeoutReturn && (
          <button
            onClick={handleReturn}
            className="mt-8 px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md animate-fade-in hover:bg-red-700 active:scale-95 transition-all"
          >
            Taking too long? Go to Dashboard
          </button>
        )}
      </div>
    </>
  );
}
