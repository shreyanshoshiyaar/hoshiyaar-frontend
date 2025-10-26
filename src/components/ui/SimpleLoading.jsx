import React from 'react';
import heroChar from '../../assets/images/loading_char.png';

export default function SimpleLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <img src={heroChar} alt="Mascot" className="w-40 h-40 object-contain mb-4" />
        <div className="flex items-center gap-3">
          <p className="text-xl font-bold text-gray-800">Loading</p>
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    </div>
  );
}
