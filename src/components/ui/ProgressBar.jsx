import React from 'react';

export default function ProgressBar({ currentIndex, total, percent: directPercent, className = '' }) {
  const percent = typeof directPercent === 'number'
    ? Math.min(100, Math.max(0, directPercent))
    : Math.min(100, Math.round(((Number(currentIndex || 0) + 1) / Math.max(Number(total || 1), 1)) * 100));
  const bgClass = className || 'bg-gray-200';
  return (
    <div className={`w-full h-2.5 sm:h-3 md:h-3.5 rounded-full overflow-hidden ${bgClass}`}>
      <div 
        className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full transition-all duration-300 ease-out shadow-lg" 
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  );
}
