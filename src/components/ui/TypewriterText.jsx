import React, { useState, useEffect, useRef } from 'react';

const TypewriterText = ({ 
  text, 
  onComplete, 
  typingSpeed = 40,
  shouldSpeak = true,
  voicePitch = 1,
  voiceRate = 1,
  voiceType = null
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  // Ref to hold the current utterance so we can cancel it if component unmounts
  const utteranceRef = useRef(null);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    
    let currentIndex = 0;
    let currentString = '';
    
    // Start Audio
    if (shouldSpeak && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = voicePitch;
      utterance.rate = voiceRate;
      
      if (voiceType) {
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;
        
        if (voiceType === 'girl') {
          selectedVoice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha'));
        } else if (voiceType === 'kid') {
          // Try a British or Australian voice for Hoshi to give a distinct, clear character sound without distorting pitch
          selectedVoice = voices.find(v => v.name.includes('Google UK English Male')) 
            || voices.find(v => v.lang === 'en-GB' || v.lang === 'en-AU')
            || voices.find(v => v.name.toLowerCase().includes('male'));
        } else if (voiceType === 'male') {
          selectedVoice = voices.find(v => v.name.includes('Google US English Male'))
            || voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('alex'));
        }
        
        // Fallback to English voices if specific gender not found
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.startsWith('en'));
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
      
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }

    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        currentString += text.charAt(currentIndex);
        setDisplayedText(currentString);
        currentIndex++;
      } else {
        clearInterval(intervalId);
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    }, typingSpeed);

    return () => {
      clearInterval(intervalId);
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text, typingSpeed, shouldSpeak, voicePitch, voiceRate]);

  return (
    <span>
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-1.5 h-4 ml-1 bg-current animate-pulse opacity-75" />
      )}
    </span>
  );
};

export default TypewriterText;
