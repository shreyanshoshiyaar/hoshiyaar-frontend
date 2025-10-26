import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ConceptLayout from './ConceptLayout.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import authService from '../../../services/authService.js';

const Option = ({ label, selected, onClick }) => (
  <button onClick={onClick} className={`w-24 h-24 rounded-xl border-2 ${selected ? 'border-green-500' : 'border-gray-400'} flex items-center justify-center`}>{label}</button>
);

const ConceptQuiz = ({ question = "Which is blood in it's correct form", onContinue, onClose, progress = 100 }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const chapter = params.get('chapter') || '1';
  const [selected, setSelected] = useState('Image');
  const [validated, setValidated] = useState(false);
  const { user } = useAuth();

  // Enter to continue
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter') return;
      handleContinue();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [validated]);

  const handleContinue = () => {
    if (!validated) {
      setValidated(true);
    } else {
      // Persist quiz completion then navigate
      const go = async () => {
        try {
          if (user?._id) {
            await authService.updateProgress({ userId: user._id, chapter: Number(chapter), quizCompleted: true });
          }
        } catch (e) {}
        (onContinue || (()=>navigate('/learn')))();
      };
      go();
    }
  };

  return (
    <ConceptLayout
      footer={
        <div>
          {validated && (
            <div className="mb-3 bg-green-100 text-green-800 rounded-lg px-4 py-2">✔ Excellent!</div>
          )}
          <div className="text-center">
            <button onClick={handleContinue} className={`px-6 py-2 rounded-lg font-bold transition-opacity duration-200 hover:opacity-90 ${validated ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{validated ? 'Continue' : 'Continue'}</button>
          </div>
        </div>
      }>
      <div className="text-left">
        <h2 className="text-xl font-bold mb-6">{question} (Chapter {chapter})</h2>
        <div className="flex items-start justify-center gap-6">
          {['Image', 'Image', 'Image'].map((lbl, idx) => (
            <Option key={idx} label={lbl} selected={selected === lbl && idx === 0} onClick={() => setSelected(lbl)} />
          ))}
        </div>
        <div className="flex items-start justify-center gap-24 mt-2 text-gray-600">
          <span>Text</span><span>Text</span><span>Text</span>
        </div>
      </div>
    </ConceptLayout>
  );
};

export default ConceptQuiz;


