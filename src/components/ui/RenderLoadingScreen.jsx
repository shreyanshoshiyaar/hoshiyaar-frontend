import React, { useState, useEffect } from 'react';

const RenderLoadingScreen = () => {
  const [dots, setDots] = useState('');
  const [currentMessage, setCurrentMessage] = useState(0);
  const [bounce, setBounce] = useState(false);

  const messages = [
    "Getting ready for your learning adventure! 🚀",
    "Preparing your study materials 📚",
    "Loading your personalized dashboard ✨",
    "Setting up your learning environment 🎯",
    "Almost ready to start learning! 🌟"
  ];

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 3000);

    const bounceInterval = setInterval(() => {
      setBounce(prev => !prev);
    }, 1000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(messageInterval);
      clearInterval(bounceInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in">
        {/* Animated Character */}
        <div className={`mb-6 transition-transform duration-500 ${bounce ? 'transform -translate-y-2' : ''}`}>
          <div className="text-6xl animate-bounce">🎓</div>
        </div>

        {/* Loading Animation */}
        <div className="mb-6">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto animate-spin"></div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4 animate-fade-in">
          Hoshiyaar Learning Platform
        </h1>

        {/* Dynamic Message */}
        <p className="text-lg text-gray-600 mb-6 animate-fade-in">
          {messages[currentMessage]}
        </p>

        {/* Loading Dots */}
        <div className="text-2xl text-purple-600 font-bold mb-6">
          Loading{dots}
        </div>

        {/* Render Info */}
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 animate-fade-in">
          <div className="flex items-center justify-center mb-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-medium text-purple-700">
              Render Free Instance
            </span>
          </div>
          <p className="text-xs text-purple-600">
            Your app is spinning up! This usually takes 30-60 seconds.
          </p>
        </div>

        {/* Fun Facts */}
        <div className="mt-6 text-sm text-gray-500 animate-fade-in">
          <p>💡 <strong>Did you know?</strong> Your brain can learn new things every day!</p>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Setting up your learning environment...</p>
        </div>
      </div>
    </div>
  );
};

export default RenderLoadingScreen;
