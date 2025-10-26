import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ className = '' }) {
  const navigate = useNavigate();
  const goBack = () => {
    try {
      if (window.history.length > 1) navigate(-1);
      else navigate('/learn');
    } catch (_) {
      navigate('/learn');
    }
  };
  return (
    <button onClick={goBack} aria-label="Back" className={`w-10 h-10 rounded-full bg-white/90 border-2 border-blue-200 text-blue-700 font-extrabold shadow hover:bg-white ${className}`}>
      ←
    </button>
  );
}
