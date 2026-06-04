import React from 'react';
import heroChar from '../../assets/images/loading_char.png';

export default function SimpleLoading({ text = "Loading adventure" }) {
  return (
    <>
      {/* Mobile Loading Screen (Branded) */}
      <div className="md:hidden min-h-screen w-full bg-white flex flex-col items-center justify-center relative overflow-hidden">
        <img 
          src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778249705/img-to-link/jcwmajaolrm6corrduii.webp" 
          alt="Loading Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute bottom-[20%] left-0 right-0 z-10 flex flex-col items-center justify-center">
          <div className="bg-white/40 backdrop-blur-md px-8 py-3 rounded-full border border-white/20 shadow-lg">
            <p className="text-xl font-bold text-gray-800 tracking-wider">{text}</p>
          </div>
        </div>
      </div>

      {/* Desktop Loading Screen (Simple Spinner) */}
      <div className="hidden md:flex min-h-screen w-full bg-white flex-col items-center justify-center relative overflow-hidden">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-bold text-gray-800 tracking-wider">{text}</p>
      </div>
    </>
  );
}
