import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminViewSwitcher() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('admin_view_mode') || 'admin';
    } catch {
      return 'admin';
    }
  });
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      const current = localStorage.getItem('admin_view_mode') || 'admin';
      setViewMode(current);
    };
    window.addEventListener('adminViewModeChanged', handleStorageChange);
    return () => window.removeEventListener('adminViewModeChanged', handleStorageChange);
  }, []);

  // Only admins can see and use the preview switcher
  if (user?.role !== 'admin') {
    return null;
  }

  const toggleMode = () => {
    const nextMode = viewMode === 'admin' ? 'student' : 'admin';
    setViewMode(nextMode);
    try {
      localStorage.setItem('admin_view_mode', nextMode);
      window.dispatchEvent(new Event('adminViewModeChanged'));
    } catch (e) {
      console.warn('Could not save admin view mode:', e);
    }
  };

  const isStudent = viewMode === 'student';

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMinimized(false)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-xl border text-xs font-black transition-transform active:scale-95 ${
            isStudent
              ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600 animate-pulse'
              : 'bg-slate-900 text-white border-slate-700 hover:bg-black'
          }`}
          title="Open Admin View Controls"
        >
          <span>{isStudent ? '🎓 Student Preview' : '👑 Admin View'}</span>
          <span className="text-[10px] opacity-75">▲</span>
        </button>
      </div>
    );
  }

  return (
    <aside aria-label="Admin View Controls" className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div
        className={`rounded-2xl p-3 shadow-2xl border backdrop-blur-md transition-all ${
          isStudent
            ? 'bg-amber-950/90 text-amber-50 border-amber-500/50 shadow-amber-900/30'
            : 'bg-slate-950/90 text-slate-100 border-slate-700/60 shadow-slate-950/50'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{isStudent ? '🎓' : '👑'}</span>
            <span className="text-xs font-black uppercase tracking-wider">
              {isStudent ? 'Student Preview (Unsubscribed)' : 'Admin Mode (Full Access)'}
            </span>
          </div>
          <button
            onClick={() => setMinimized(true)}
            className="text-gray-400 hover:text-white text-xs px-1 rounded transition-colors"
            title="Minimize bar"
          >
            ✕
          </button>
        </div>

        <p className="text-[11px] leading-relaxed opacity-85 mb-2.5">
          {isStudent
            ? 'Simulating an unsubscribed student. Locked chapters, real completion percentages, and paywalls are active.'
            : 'Viewing with administrative privileges. All modules and chapters unlocked; paywalls are bypassed.'}
        </p>

        <div className="flex flex-col gap-1.5 pt-1 border-t border-white/10">
          <button
            onClick={toggleMode}
            className={`w-full py-1.5 px-3 rounded-xl font-black text-xs transition-transform active:scale-95 shadow-md flex items-center justify-center gap-1.5 ${
              isStudent
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            <span>{isStudent ? '⚡ Switch to Admin View' : '👁️ Preview as Student'}</span>
          </button>
          
          <a
            href="/teacher"
            className="w-full py-1.5 px-3 rounded-xl font-black text-xs bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <span>👩‍🏫 Open Teacher Mode (B2B)</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
