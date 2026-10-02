import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ className = '', onClick, fallbackPath }) {
  const navigate = useNavigate();

  const goBack = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (onClick) {
      onClick(e);
      return;
    }

    const token = localStorage.getItem('token');
    const targetFallback = fallbackPath || (token ? '/more' : '/');

    try {
      if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
        navigate(-1);
      } else if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(targetFallback, { replace: true });
      }
    } catch (_) {
      navigate(targetFallback, { replace: true });
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Back"
      className={`w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-all active:scale-95 shadow-xs border border-blue-100 cursor-pointer shrink-0 ${className}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
