import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import authService from '../../../services/authService.js';
import ConceptLayout from './ConceptLayout.jsx';

const ConceptIntro = ({ title = 'What is Blood?', imageLabel = 'Image', text = "Blood is a red colored liquid, helps to transport nutrients to body", onContinue, onClose, progress = 33 }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const chapter = params.get('chapter') || '1';
  const { user } = useAuth();

  // Mark concept started/completed when landing here
  useEffect(() => {
    const update = async () => {
      try {
        if (user?._id) {
          await authService.updateProgress({ userId: user._id, chapter: Number(chapter), conceptCompleted: true });
        }
      } catch (e) {
        // ignore
      }
    };
    update();
  }, [user, chapter]);

  // Keyboard: Enter to continue (remove Escape close; handled by layout)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter') navigate(`/concept/step2?chapter=${chapter}`);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, chapter]);
  return (
    <ConceptLayout
      footer={<div className="text-center"><button onClick={onContinue || (()=>navigate(`/concept/step2?chapter=${chapter}`))} className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg transition-opacity duration-200 hover:opacity-90">Continue</button></div>}>
      <div className="text-left">
        <p className="text-sm text-gray-600 mb-2">Concept</p>
        <h2 className="text-xl font-bold mb-6">{title} (Chapter {chapter})</h2>
        <div className="mx-auto w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center mb-2">{imageLabel}</div>
        <div className="text-center text-gray-700">{text}</div>
      </div>
    </ConceptLayout>
  );
};

export default ConceptIntro;


