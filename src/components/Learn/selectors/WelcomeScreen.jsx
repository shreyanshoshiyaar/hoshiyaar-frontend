import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// The old welcome step (Hoshi waving video + PLAY NOW button) has been removed. This step now
// finishes on its own straight away: it still marks the welcome as seen and runs onContinue
// (which saves onboarding and opens the dashboard), so the rest of the flow is unchanged.
export default function WelcomeScreen({ onContinue }) {
  const navigate = useNavigate();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    try {
      const userObj = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem(userObj?._id ? `welcomeVideoSeen_${userObj._id}` : 'welcomeVideoSeen_guest', 'true');
      if (userObj?._id) sessionStorage.setItem(`learnWasOnDashboard_${userObj._id}`, 'true');
    } catch { /* storage unavailable */ }

    if (onContinue) onContinue();
    else navigate('/learn', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="h-[100dvh] bg-white" />;
}
