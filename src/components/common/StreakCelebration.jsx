import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const triggerHeavyHaptic = async (times = 2) => {
  try {
    for (let i = 0; i < times; i++) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      await new Promise(r => setTimeout(r, 150));
    }
  } catch (err) {
    if (navigator.vibrate) {
      if (times > 2) navigator.vibrate([100, 50, 100, 50, 100]);
      else navigator.vibrate([100, 50, 100]);
    }
  }
};

const StreakCelebration = ({ isOpen, onClose, streakCount }) => {
  const isMilestone = [7, 14, 30, 100].includes(streakCount);

  useEffect(() => {
    if (isOpen) {
      triggerHeavyHaptic(isMilestone ? 4 : 2); // Stronger haptics for milestones
      
      const duration = (isMilestone ? 5 : 3) * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { 
        startVelocity: isMilestone ? 45 : 30, 
        spread: 360, 
        ticks: 60, 
        zIndex: 9999 
      };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = (isMilestone ? 80 : 40) * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        
        if (isMilestone) {
           // Extra burst from the center for milestones
           confetti(Object.assign({}, defaults, { particleCount: particleCount / 2, origin: { x: 0.5, y: 0.5 } }));
        }
      }, 250);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, isMilestone]);

  const getEmoji = () => {
    if (streakCount >= 100) return '👑';
    if (streakCount >= 30) return '🏆';
    if (streakCount >= 14) return '⭐';
    if (streakCount >= 7) return '🎉';
    return '🔥';
  };

  const getMessage = () => {
    if (streakCount >= 100) return "LEGENDARY!";
    if (streakCount >= 30) return "INCREDIBLE!";
    if (streakCount >= 14) return "UNSTOPPABLE!";
    if (streakCount >= 7) return "AMAZING!";
    return "GREAT JOB!";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className={`relative bg-white rounded-[32px] p-6 w-full max-w-sm flex flex-col items-center justify-center text-center shadow-2xl border-4 ${isMilestone ? 'border-yellow-300' : 'border-orange-100'}`}
          >
            {isMilestone && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="absolute -top-10 bg-yellow-400 text-white font-black text-xs px-4 py-1.5 rounded-full shadow-lg border-2 border-white"
              >
                MILESTONE UNLOCKED!
              </motion.div>
            )}

            <motion.div 
              className={`mb-4 ${isMilestone ? 'text-8xl' : 'text-6xl'}`}
              animate={{ 
                scale: [1, isMilestone ? 1.3 : 1.2, 1],
                rotate: [-5, 5, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {getEmoji()}
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-black text-gray-800 mb-1"
            >
              {getMessage()}
            </motion.h2>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`${isMilestone ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300 text-yellow-700' : 'bg-orange-50 border-orange-200 text-orange-500'} font-extrabold text-xl mb-4 px-4 py-2 rounded-full border`}
            >
              {streakCount} Day Streak {isMilestone ? 'Achieved!' : ''}
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-500 font-bold mb-8"
            >
              {isMilestone 
                ? "You've unlocked a massive milestone! You're building an incredible habit." 
                : "You're on fire! Keep up the great work and maintain this momentum."}
            </motion.p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={`w-full text-white font-black py-4 rounded-2xl transition-all text-lg ${isMilestone ? 'bg-yellow-500 shadow-[0_4px_0_0_#ca8a04]' : 'bg-blue-600 shadow-[0_4px_0_0_#1d4ed8]'}`}
            >
              {isMilestone ? 'CLAIM REWARD' : 'CONTINUE'}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StreakCelebration;
