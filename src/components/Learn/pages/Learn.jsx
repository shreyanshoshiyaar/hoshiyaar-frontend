import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import authService from '../../../services/authService.js';
import Welcome from './Welcome.jsx';
import BoardSelect from '../selectors/BoardSelect.jsx';
import SubjectSelect from '../selectors/SubjectSelect.jsx';
import ChapterSelect from '../selectors/ChapterSelect.jsx';
import LearnDashboard from './LearnDashboard.jsx'; // Import the final dashboard component
import SimpleLoading from '../../ui/SimpleLoading.jsx';

const Learn = () => {
  const [step, setStep] = useState(1);
  // Add state here to store all the user's choices
  const [onboardingData, setOnboardingData] = useState({
    board: null,
    subject: null,
    chapter: null, // Add chapter to state
  });
  const { user, loading, login } = useAuth();

  const getScopedKeys = (uid) => ({
    local: `learnOnboarded_${uid}`,
    session: `learnWasOnDashboard_${uid}`,
  });

  // Function to save onboarding data to backend
  const saveOnboardingData = async () => {
    if (user?._id && onboardingData.board && onboardingData.subject && onboardingData.chapter) {
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
        return true;
      } catch (error) {
        console.error('Failed to save onboarding data:', error);
        // Still proceed to dashboard even if save fails, but show a warning
        alert('Warning: Your preferences were not saved to the server. Please try again later.');
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
      // Save onboarding data when reaching the dashboard (step 5)
      if (next === 5) {
        saveOnboardingData();
      }
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
          setStep(1);
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
        return <LearnDashboard onboardingData={onboardingData} />;
      default:
        return <LearnDashboard onboardingData={onboardingData} />;
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {loading ? <SimpleLoading /> : renderStep()}
    </div>
  );
};

export default Learn;

