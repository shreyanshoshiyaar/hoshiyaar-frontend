import React from 'react';

export default function ProgressBar({ currentIndex, total }) {
  const percent = Math.min(100, Math.round(((currentIndex + 1) / Math.max(total || 1, 1)) * 100));
  return (
    <div className="w-full h-3 md:h-3.5 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full transition-all duration-300 ease-out shadow-lg" 
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  );
}


