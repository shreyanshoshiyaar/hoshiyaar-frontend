import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import authService from '../../../services/authService.js';
import WelcomeScreen from '../selectors/WelcomeScreen.jsx';
import BoardSelect from '../selectors/BoardSelect.jsx';
import SubjectSelect from '../selectors/SubjectSelect.jsx';
import ChapterSelect from '../selectors/ChapterSelect.jsx';
import LearnDashboard from './LearnDashboard.jsx'; // Import the final dashboard component
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import ErrorBoundary from '../../ui/ErrorBoundary.jsx';

const Learn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  // Add state here to store all the user's choices (CBSE by default for new users)
  const [onboardingData, setOnboardingData] = useState({
    board: 'CBSE',
    subject: 'Science',
    chapter: '1',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const { user, loading, login } = useAuth();

  const getScopedKeys = (uid) => ({
    local: `learnOnboarded_${uid}`,
    session: `learnWasOnDashboard_${uid}`,
  });

  // Function to save onboarding data to backend
  const saveOnboardingData = async () => {
    if (isSaving) return;
    
    const boardToSave = onboardingData.board || user?.board || 'CBSE';
    const subjectToSave = onboardingData.subject || user?.subject || 'Science';
    const chapterToSave = onboardingData.chapter || user?.chapter || '1';

    if (user?._id) {
      setIsSaving(true);
      setError(null);
      try {
        const response = await authService.updateProfile({
          userId: user._id,
          board: boardToSave,
          subject: subjectToSave,
          chapter: chapterToSave,
        });
        // Update local user state to reflect completion
        login?.({ ...user, board: boardToSave, subject: subjectToSave, chapter: chapterToSave, onboardingCompleted: true });
        console.log('Onboarding data saved successfully:', response.data);
        
        // Clean up saved progress since onboarding is complete
        if (user?._id) {
          try {
            localStorage.removeItem(`onboarding_progress_${user._id}`);
          } catch (_) {}
        }
        
        // Clear onboardingData so it stops overriding user context for future updates
        setOnboardingData({ board: null, subject: null, chapter: null });
        setIsSaving(false);
        return true;
      } catch (err) {
        console.error('Failed to save onboarding data:', err);
        setError('Your preferences were not saved to the server. Please try again later.');
        setIsSaving(false);
        return false;
      }
    } else {
      console.warn('Cannot save onboarding data: missing user ID');
      return false;
    }
  };

  const nextStep = () => {
    setStep(prevStep => {
      const next = prevStep + 1;
      if (next >= 5 && user?._id) {
        const keys = getScopedKeys(user._id);
        try { localStorage.setItem(keys.local, 'true'); } catch (_) {}
        try { sessionStorage.setItem(keys.session, 'true'); } catch (_) {}
        
        // Force navigation to /learn so they end up on the "learn" tab, not "home" or "more"
        if (location.pathname !== '/learn') {
           navigate('/learn');
        }
      }
      return next;
    });
  };

  const prevStep = () => {
    setStep(prevStep => prevStep - 1);
  };

  // Function to save data from child components
  const updateOnboardingData = (data) => {
      setOnboardingData(prevData => {
        const newData = { ...prevData, ...data };
        // Save progress to localStorage for persistence across refreshes
        if (user?._id) {
          try {
            localStorage.setItem(`onboarding_progress_${user._id}`, JSON.stringify(newData));
          } catch (_) {}
        }
        return newData;
      });
  };

  // Persist dashboard state across refreshes and save onboarding data
  useEffect(() => {
    if (step === 5 && user?._id) {
      const keys = getScopedKeys(user._id);
      try { sessionStorage.setItem(keys.session, 'true'); } catch (_) {}
      try { localStorage.setItem(keys.local, 'true'); } catch (_) {}
      // Ensure onboarding data is saved when reaching dashboard (or welcome screen)
      if (onboardingData.board && onboardingData.subject && onboardingData.chapter && !user.onboardingCompleted) {
        saveOnboardingData();
      }
    }
  }, [step, user, onboardingData]);

  // On mount, enforce Welcome first for users without onboarding completed; no auto-resume
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        if (loading) {
          return;
        }
        if (!user?._id) return;


        const keys = getScopedKeys(user._id);
        const hasSession = sessionStorage.getItem(keys.session) === 'true';
        
        // Always start from Welcome for first-time users (no skipping, no auto-resume)
        // Also handle legacy users incorrectly marked completed but missing selections
        const missingSelections = !(user.board && user.subject && user.chapter);
        const cleanPhone = String(user.phone || '').replace(/\D/g, '');
        const isAdmin = user.role === 'admin' ||
          ['9867735936', '7021970672', '9820277252'].some(p => cleanPhone.endsWith(p)) ||
          ['Host', 'hostcbse', 'AKSHITRAVULA', 'AKSHIT', 'SB10', 'Nidhi sekhri'].includes(user.username);
        if (!hasSession && (!user.onboardingCompleted || missingSelections || isAdmin)) {
          const defaultBoard = user.board || 'CBSE';
          const defaultSubject = user.subject || 'Science';
          const defaultChapter = user.chapter || '1';
          setOnboardingData({ board: defaultBoard, subject: defaultSubject, chapter: defaultChapter });
          setStep(4); // Skip BoardSelect directly — default to CBSE, show WelcomeScreen
          return;
        }

        // Otherwise go to dashboard
        // We set onboardingData to null so it doesn't override user's active selections in LearnDashboard
        setOnboardingData({
          board: null,
          subject: null,
          chapter: null,
        });
        setStep(5); // Go directly to LearnDashboard if already onboarded
      } catch (_) {
        // ignore storage errors
      }
    };

    checkOnboardingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const renderStep = () => {
    switch (step) {
      case 1:
      case 2:
      case 3:
        // Board & Chapter selection skipped for new users — default to CBSE & Science Chapter 1
        return null;
      case 4:
        return (
          <WelcomeScreen 
            onContinue={async () => {
              if (user?._id) {
                const keys = getScopedKeys(user._id);
                try { sessionStorage.setItem(keys.session, 'true'); } catch (_) {}
                try { localStorage.setItem(keys.local, 'true'); } catch (_) {}
              }
              await saveOnboardingData();
              setStep(5);
              if (location.pathname !== '/learn') {
                navigate('/learn', { replace: true });
              }
            }} 
          />
        );
      case 5:
        return (
          <ErrorBoundary>
            <LearnDashboard onboardingData={onboardingData} />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary>
            <LearnDashboard onboardingData={onboardingData} />
          </ErrorBoundary>
        );
    }
  };

  return (
    <div 
      className="min-h-screen relative bg-white md:bg-white overflow-hidden"
      style={{
        backgroundImage: window.innerWidth < 768 ? 'url("https://res.cloudinary.com/imq5966f/image/upload/v1791543806/img-to-link/avlrqghu3x4rh4gjyvcq.webp")' : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-red-500 text-white p-4 rounded-xl shadow-lg flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="text-sm font-bold">{error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-white hover:opacity-75">✕</button>
        </div>
      )}
      {isSaving && (
        <div className="fixed inset-0 z-50 bg-white/80 flex flex-col items-center justify-center">
          <SimpleLoading />
          <p className="mt-4 font-bold text-duo-blue">Saving your preferences...</p>
        </div>
      )}
      {/* Skip button for admin */}
      {(user?.role === 'admin' || ['Host', 'hostcbse', 'AKSHITRAVULA', 'AKSHIT', 'SB10', 'Nidhi sekhri'].includes(user?.username) || ['9867735936', '7021970672', '9820277252'].some(p => String(user?.phone || '').replace(/\D/g, '').endsWith(p))) && step >= 2 && step <= 4 && (
        <button 
          onClick={() => setStep(5)} 
          className="absolute top-4 right-4 z-50 bg-white/80 backdrop-blur border border-slate-200 text-slate-700 px-4 py-2 rounded-full font-bold shadow-sm hover:bg-slate-100 transition-colors"
        >
          Skip Onboarding
        </button>
      )}

      {loading ? <SimpleLoading /> : renderStep()}
    </div>
  );
};

export default Learn;
