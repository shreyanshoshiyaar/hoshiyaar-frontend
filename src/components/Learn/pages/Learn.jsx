import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import authService from '../../../services/authService.js';
import Welcome from './Welcome.jsx';
import BoardSelect from '../selectors/BoardSelect.jsx';
import SubjectSelect from '../selectors/SubjectSelect.jsx';
import ChapterSelect from '../selectors/ChapterSelect.jsx';
import LearnDashboard from './LearnDashboard.jsx'; // Import the final dashboard component
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import ErrorBoundary from '../../ui/ErrorBoundary.jsx';

const Learn = () => {
  const [step, setStep] = useState(1);
  // Add state here to store all the user's choices
  const [onboardingData, setOnboardingData] = useState({
    board: null,
    subject: null,
    chapter: null, // Add chapter to state
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
    
    if (user?._id && onboardingData.board && onboardingData.subject && onboardingData.chapter) {
      setIsSaving(true);
      setError(null);
      try {
        const response = await authService.updateProfile({
          userId: user._id,
          board: onboardingData.board,
          subject: onboardingData.subject,
          chapter: onboardingData.chapter,
        });
        // Update local user state to reflect completion
        login?.({ ...user, ...onboardingData, onboardingCompleted: true });
        console.log('Onboarding data saved successfully:', response.data);
        
        // Clean up saved progress since onboarding is complete
        if (user?._id) {
          try {
            localStorage.removeItem(`onboarding_progress_${user._id}`);
          } catch (_) {}
        }
        setIsSaving(false);
        return true;
      } catch (err) {
        console.error('Failed to save onboarding data:', err);
        setError('Your preferences were not saved to the server. Please try again later.');
        setIsSaving(false);
        return false;
      }
    } else {
      console.warn('Cannot save onboarding data: missing user ID or required selections (board, subject, chapter)');
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
      // Ensure onboarding data is saved when reaching dashboard
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

        const params = new URLSearchParams(window.location.search);
        const go = params.get('go');

        const keys = getScopedKeys(user._id);
        // Always start from Welcome for first-time users (no skipping, no auto-resume)
        // Also handle legacy users incorrectly marked completed but missing selections
        const missingSelections = !(user.board && user.subject && user.chapter);
        if (!go && (!user.onboardingCompleted || missingSelections)) {
          setOnboardingData({ board: null, subject: null, chapter: null });
          setStep(2); // Start from BoardSelect directly, skip Welcome
          return;
        }

        // Otherwise go to dashboard
        setOnboardingData({
          board: user.board ?? onboardingData.board,
          subject: user.subject ?? onboardingData.subject,
          chapter: user.chapter ?? onboardingData.chapter,
        });
        setStep(5);
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
        return <Welcome onContinue={nextStep} />;
      case 2:
        return <BoardSelect onContinue={nextStep} onBack={prevStep} updateData={updateOnboardingData} autoAdvance={false} />;
      case 3:
        return <SubjectSelect onContinue={nextStep} onBack={prevStep} updateData={updateOnboardingData} selectedBoard={onboardingData.board} autoAdvance={false} />;
      case 4:
        return (
          <ChapterSelect
            onContinue={nextStep}
            onBack={prevStep}
            updateData={updateOnboardingData}
            autoAdvance={false}
            board={onboardingData.board}
            subject={onboardingData.subject}
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
        backgroundImage: window.innerWidth < 768 ? 'url("https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778582100/img-to-link/avlrqghu3x4rh4gjyvcq.webp")' : 'none',
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
      {loading ? <SimpleLoading /> : renderStep()}
    </div>
  );
};

export default Learn;

