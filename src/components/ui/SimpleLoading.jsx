import React from 'react';
import heroChar from '../../assets/images/loading_char.png';

export default function SimpleLoading({ text = "Loading" }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Branded Background Image */}
      <img 
        src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778249705/img-to-link/jcwmajaolrm6corrduii.webp" 
        alt="Loading Background" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Loading Text at Bottom */}
      <div className="absolute bottom-[20%] left-0 right-0 z-10 flex flex-col items-center justify-center">
        <div className="bg-white/40 backdrop-blur-md px-8 py-3 rounded-full border border-white/20 shadow-lg">
          <p className="text-xl font-bold text-gray-800 tracking-wider">{text}</p>
        </div>
      </div>
    </div>
  );
}
