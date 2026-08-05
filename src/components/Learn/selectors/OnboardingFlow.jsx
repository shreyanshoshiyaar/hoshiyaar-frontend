import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import BoardSelect from './BoardSelect.jsx';

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [data, setData] = useState({ board: '', subject: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const updateData = (partial) => setData((d) => ({ ...d, ...(partial || {}) }));

  const saveAndContinue = async (finalData) => {
    try {
      const authMod = await import('../../../services/authService.js');
      const svc = authMod.default;
      if (user?._id) {
        await svc.updateProfile({
          userId: user._id,
          board: finalData.board,
          subject: finalData.subject,
        });
      }
    } catch (_) {}
    window.hyTrack?.('onboarding_step_completed', { board: finalData.board, subject: finalData.subject });
    try { login?.({ ...(user || {}), ...finalData, onboardingCompleted: true }); } catch (_) {}
    navigate('/welcome', { replace: true });
  };

  useEffect(() => {
    if (data.board && !data.subject && !isProcessing) {
      setIsProcessing(true);
      const fetchAndSave = async () => {
        try {
          const curriculumMod = await import('../../../services/curriculumService.js');
          const curriculumService = curriculumMod.default;
          // Get subjects for the board
          const subjectsRes = await curriculumService.listSubjects(data.board);
          let defaultSubjectId = 'dummy';
          
          if (subjectsRes.data && subjectsRes.data.length > 0) {
            defaultSubjectId = subjectsRes.data[0]._id; // fallback to first
            // Try to find science specifically
            const science = subjectsRes.data.find(s => s.title.toLowerCase().includes('science'));
            if (science) defaultSubjectId = science._id;
          }
          
          const finalData = { ...data, subject: defaultSubjectId };
          setData(finalData);
          saveAndContinue(finalData);
        } catch (e) {
          console.error("Failed to auto-fetch subject", e);
          const finalData = { ...data, subject: 'dummy' };
          setData(finalData);
          saveAndContinue(finalData);
        }
      };
      fetchAndSave();
    }
  }, [data.board, data.subject, isProcessing]);

  if (!data.board) {
    return (
      <BoardSelect
        updateData={updateData}
        onContinue={() => setData((d)=>({ ...d }))}
        onBack={() => navigate('/login')}
        autoAdvance={false}
      />
    );
  }

  // If board is selected but subject is missing, we are in the auto-processing state
  return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-semibold text-slate-500">Preparing your magical journey...</p>
      </div>
    </div>
  );
}


