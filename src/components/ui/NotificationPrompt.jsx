import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useAuth } from '../../context/AuthContext';
import { setupPushNotifications } from '../../utils/pushNotifications';

export default function NotificationPrompt() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!Capacitor.isNativePlatform() || !user) return;
      
      const today = new Date().toISOString().split('T')[0];
      const trackingData = JSON.parse(localStorage.getItem('pushPromptTracking') || '{"date":"","count":0}');
      
      if (trackingData.date !== today) {
        trackingData.date = today;
        trackingData.count = 0;
      }

      // If they've seen it 2 times today, don't show it again
      if (trackingData.count >= 2) return;

      try {
        const permStatus = await PushNotifications.checkPermissions();
        
        // If not granted, we show our custom reminder UI
        if (permStatus.receive !== 'granted') {
          setTimeout(() => {
            setShowPrompt(true);
            // Increment the counter when it is actually shown
            trackingData.count += 1;
            localStorage.setItem('pushPromptTracking', JSON.stringify(trackingData));
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to check push permissions', err);
      }
    };
    checkPermissions();
  }, [user]);

  const handleEnable = async () => {
    setShowPrompt(false);
    if (user) {
      await setupPushNotifications(user._id, true);
      
      const permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'denied') {
        alert("Push notifications are disabled. Please go to your device Settings > Hoshiyaar > Notifications to turn them on.");
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-[100] p-4 pb-8 animate-in slide-in-from-bottom-10 fade-in duration-500 pointer-events-none">
      <div className="bg-white rounded-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col items-center text-center relative overflow-hidden max-w-sm mx-auto border border-blue-50 pointer-events-auto">
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          ✕
        </button>
        
        <h3 className="text-xl font-extrabold text-[#0F204C] mb-2 mt-4">
          Never miss an update!
        </h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed px-2">
          Enable notifications to get daily study reminders and alerts for new missions from Hoshi.
        </p>
        
        <div className="flex w-full gap-3">
          <button 
            onClick={handleDismiss}
            className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            Not Now
          </button>
          <button 
            onClick={handleEnable}
            className="flex-1 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            Turn On
          </button>
        </div>
      </div>
    </div>
  );
}
