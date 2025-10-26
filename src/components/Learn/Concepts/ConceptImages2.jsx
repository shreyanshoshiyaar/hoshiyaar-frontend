import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ConceptLayout from './ConceptLayout.jsx';

const ConceptImages2 = ({ title = 'Blood is red in color', leftLabel = 'Image1', rightLabel = 'Image2', text = "Blood is the color of roses; it's red", onContinue, onClose, progress = 66 }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const chapter = params.get('chapter') || '1';
  return (
    <ConceptLayout
      footer={<div className="text-center"><button onClick={onContinue || (()=>navigate(`/concept/quiz?chapter=${chapter}`))} className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg transition-opacity duration-200 hover:opacity-90">Continue</button></div>}>
      <div className="text-left">
        <p className="text-sm text-gray-600 mb-2">Concept</p>
        <h2 className="text-xl font-bold mb-6">{title} (Chapter {chapter})</h2>
        <div className="flex items-start justify-center gap-6 mb-3">
          <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center">{leftLabel}</div>
          <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center">{rightLabel}</div>
        </div>
        <div className="text-center text-gray-700">{text}</div>
      </div>
    </ConceptLayout>
  );
};

export default ConceptImages2;


