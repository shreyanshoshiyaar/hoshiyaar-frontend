// src/components/layout/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import curriculumService from '../../services/curriculumService';
import DesktopHome from './DesktopHome';
import WelcomeShell from './WelcomeShell.jsx';

const MobileWelcomeScreen = () => {
  const navigate = useNavigate();
  return (
    <WelcomeShell>
          {/* Start my adventure (guest start; verify later) */}
          <button
            type="button"
            onClick={() => navigate('/start')}
            style={{ height: 'clamp(50px, 7.4dvh, 58px)', fontSize: 'clamp(20px, 3.1dvh, 23px)' }}
            className="w-full shrink-0 rounded-full bg-gradient-to-b from-[#2F6BFF] to-[#1743D8] text-white font-dialogue font-bold tracking-tight shadow-[0_6px_0_0_#0F2E9E,0_14px_28px_rgba(23,67,216,0.35)] active:translate-y-[3px] active:shadow-[0_3px_0_0_#0F2E9E,0_8px_18px_rgba(23,67,216,0.3)] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Start my adventure</span>
            <span className="text-[22px] leading-none" aria-hidden="true">→</span>
          </button>

          {/* Log in */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="shrink-0 font-dialogue text-[16.5px] font-medium text-slate-700 cursor-pointer"
          >
            Already learning with us? <span className="text-[#1743D8] font-bold">Log in</span>
          </button>
    </WelcomeShell>
  );
};

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Logged in users land on the home screen
  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  // Lock mobile body completely to prevent any page drag or bouncing
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.height = '100dvh';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      document.body.style.height = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    };
  }, []);

  return (
    <>
      {/* Mobile View: Fixed, zero-scroll container */}
      <div className="block md:hidden overflow-hidden h-[100dvh] max-h-[100dvh] fixed inset-0 z-0">
        <MobileWelcomeScreen />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block w-full">
        <DesktopHome />
      </div>
    </>
  );
};

export default HomePage;