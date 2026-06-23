import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WelcomeScreen({ onContinue }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      // Attempt to autoplay
      videoRef.current.play().catch(error => {
        console.log("Autoplay failed or needs interaction first:", error);
      });
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#131f24] items-center justify-between p-6 pb-10 font-sans">
      
      {/* Spacer to push content down to middle */}
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        


        {/* Character Video */}
        <div className="w-[180px] h-[180px] flex items-center justify-center mb-8">
          <video 
            ref={videoRef}
            src="/Video/Hoshi_waves_and_smiles_202606221854.mov" 
            autoPlay 
            playsInline
            muted={false}
            loop
            className="w-full h-full object-contain"
          />
        </div>

      </div>

      {/* Continue Button */}
      <div className="w-full max-w-sm mt-auto">
        <button 
          onClick={() => {
            if (onContinue) {
              onContinue();
            } else {
              navigate('/learn');
            }
          }}
          className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-extrabold py-4 rounded-2xl shadow-[0_4px_0_#1d4ed8] active:shadow-[0_0px_0_#1d4ed8] active:translate-y-1 transition-all text-lg tracking-wider"
        >
          CONTINUE
        </button>
      </div>

    </div>
  );
}
