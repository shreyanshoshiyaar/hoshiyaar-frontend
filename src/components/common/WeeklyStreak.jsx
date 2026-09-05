import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Helper to trigger haptics safely across web/mobile
const triggerHaptic = async (style = ImpactStyle.Light) => {
  try {
    await Haptics.impact({ style });
  } catch (err) {
    // Fallback for web if Capacitor Haptics fails
    if (navigator.vibrate) {
      if (style === ImpactStyle.Heavy) navigator.vibrate([100]);
      else if (style === ImpactStyle.Medium) navigator.vibrate([50]);
      else navigator.vibrate([20]);
    }
  }
};

const WeeklyStreak = ({ streakCount = 0, currentDayCompleted = false, onCompleteDay }) => {
  const [completedDays, setCompletedDays] = useState([]);
  const [localStreak, setLocalStreak] = useState(streakCount);
  const [isCompleted, setIsCompleted] = useState(currentDayCompleted);

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  // Dynamically calculate today's index (Monday = 0, Sunday = 6)
  const todayIndex = (new Date().getDay() + 6) % 7;

  useEffect(() => {
    let effectiveStreak = Number(streakCount) || 0;
    if (currentDayCompleted && effectiveStreak < 1) {
      effectiveStreak = 1;
    }
    setLocalStreak(effectiveStreak);
    
    // Logic to show previous days as completed based on actual streak count
    const prevDays = [];
    // If currentDayCompleted is true, streakCount already includes today.
    let previousDaysToTick = currentDayCompleted ? effectiveStreak - 1 : effectiveStreak;
    
    // We only display the current week (Monday to Sunday), so clamp previous days to todayIndex
    previousDaysToTick = Math.min(Math.max(previousDaysToTick, 0), todayIndex);
    
    for (let i = 0; i < previousDaysToTick; i++) {
      // tick backwards from yesterday
      prevDays.push(todayIndex - 1 - i);
    }
    
    if (currentDayCompleted) {
      setCompletedDays([...prevDays, todayIndex]);
      setIsCompleted(true);
    } else {
      setCompletedDays(prevDays);
    }
  }, [currentDayCompleted, streakCount, todayIndex]);

  const handleDayClick = async (index) => {
    // Only allow clicking today if not already completed
    if (index === todayIndex && !isCompleted) {
      triggerHaptic(ImpactStyle.Light);
      // Removed manual streak claim on click. Streak must be earned via gameplay.
    } else {
      triggerHaptic(ImpactStyle.Light);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-800 font-extrabold text-lg flex items-center gap-2">
          Daily Streak
        </h3>
        <motion.div 
          className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full"
          animate={{ scale: isCompleted ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.span 
            className="text-orange-500 text-xl"
            animate={{ 
              y: [0, -3, 0],
              scale: [1, 1.1, 1],
              rotate: [-5, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            🔥
          </motion.span>
          <motion.span 
            key={localStreak}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-orange-600 font-black text-sm"
          >
            {localStreak} Days
          </motion.span>
        </motion.div>
      </div>

      {/* Calendar Progress */}
      <div className="flex justify-between items-center px-1">
        {days.map((day, idx) => {
          const isToday = idx === todayIndex;
          const isCompletedDay = completedDays.includes(idx);
          const isFuture = idx > todayIndex;

          return (
            <motion.div 
              key={day}
              className="flex flex-col items-center gap-2"
              whileTap={!isCompletedDay && isToday ? { scale: 0.85 } : { scale: 0.95 }}
              onClick={() => handleDayClick(idx)}
            >
              <span className={`text-[10px] font-bold ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                {day}
              </span>
              
              <div className="relative">
                {/* Background Circle */}
                <motion.div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center
                    ${isCompletedDay ? 'bg-orange-500 shadow-[0_4px_0_0_#c2410c]' : 
                      isToday ? 'bg-white border-2 border-dashed border-orange-400' : 
                      'bg-gray-100'} 
                    ${isToday && !isCompletedDay ? 'animate-pulse' : ''}
                  `}
                  animate={isCompletedDay && isToday ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, -10, 10, 0]
                  } : {}}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <AnimatePresence>
                    {isCompletedDay && (
                      <motion.svg 
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                        className="w-5 h-5 text-white" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      >
                        <motion.path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M5 13l4 4L19 7" 
                        />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Sparkle effect on completion */}
                <AnimatePresence>
                  {isCompletedDay && isToday && (
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: [1, 1.5, 0], opacity: [1, 0.8, 0] }}
                      transition={{ duration: 0.6 }}
                      className="absolute -top-1 -right-1 text-yellow-400 text-sm"
                    >
                      ✨
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyStreak;
