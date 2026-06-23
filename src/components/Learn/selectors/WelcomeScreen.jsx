import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WelcomeScreen({ onContinue }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [videoError, setVideoError] = React.useState(null);

  useEffect(() => {
    if (videoRef.current) {
      // Attempt to autoplay
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Autoplay failed or needs interaction first:", error);
          // Don't set error state for autoplay prevention, just let controls be used
        });
      }
    }
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-black items-center justify-between p-6 pb-10 font-sans overflow-hidden relative">
      
      {/* Spacer to push content down to middle */}
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        


        {/* Character Video */}
        <div className="w-full max-w-[800px] aspect-square max-h-[60vh] flex items-center justify-center mb-8">
          {videoError ? (
            <div className="text-red-500 text-center font-bold">
              Video Format Unsupported.<br/>
              <span className="text-sm font-normal">Please convert the .mov to .mp4 format.</span>
            </div>
          ) : (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              muted={false}
              loop
              onError={(e) => {
                console.error("Video error:", e);
                setVideoError(true);
              }}
              className="w-full h-full object-contain bg-transparent pointer-events-none scale-[1.8] md:scale-[1.2] origin-center translate-y-[10%] md:translate-y-0"
            >
              <source src="/Video/Hoshi_waves_and_smiles_202606221854.mp4" type="video/mp4" />
              <source src="/Video/Hoshi-Video.mp4" type="video/mp4" />
            </video>
          )}
        </div>

      </div>

      {/* Continue Button */}
      <div className="w-full max-w-sm mt-auto relative z-10">
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
