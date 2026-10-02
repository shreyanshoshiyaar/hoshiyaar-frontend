import React, { useState } from 'react';
import studentClassroomService from '../../services/studentClassroomService.js';

export default function JoinClassModal({ isOpen, onClose, onClassJoined }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successClass, setSuccessClass] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter a 6-character class code.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await studentClassroomService.joinClassroom(code.trim().toUpperCase());
      if (res.data?.success) {
        setSuccessClass(res.data.classroom);
        setTimeout(() => {
          onClassJoined?.(res.data.classroom);
          onClose();
          setSuccessClass(null);
          setCode('');
        }, 1800);
      }
    } catch (err) {
      console.error('Failed to join classroom', err);
      setError(err.response?.data?.message || 'Invalid class code. Please check with your teacher.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 p-6 sm:p-8 w-full max-w-md relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm transition-colors"
        >
          ✕
        </button>

        {successClass ? (
          <div className="py-6 text-center space-y-3">
            <span className="text-5xl animate-bounce inline-block">🎉</span>
            <h4 className="text-xl font-black text-slate-800">You're in!</h4>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="text-sm font-black text-emerald-900">{successClass.name}</div>
              <div className="text-xs text-emerald-700 mt-0.5">
                Class {successClass.classLevel} • {successClass.subject} • Teacher: {successClass.teacherName}
              </div>
            </div>
            <p className="text-xs text-slate-400">Loading your class homework...</p>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-xs">
                🏫
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Join a Classroom</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter the 6-character code given by your teacher to access your class homework & tasks.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl mb-4 text-center">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={8}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HOSH7A"
                  className="w-full text-center text-2xl font-mono font-black uppercase tracking-widest px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-[#1E65FA] rounded-2xl outline-none transition-all placeholder:text-slate-300 placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:text-base"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.trim().length < 3}
                className="w-full py-3.5 bg-[#1E65FA] hover:bg-[#1656e0] disabled:bg-slate-300 text-white text-xs font-black uppercase tracking-wider rounded-2xl border-b-4 border-[#0A3DAA] hover:border-b-2 hover:translate-y-[2px] transition-all active:translate-y-[4px] active:border-b-0 shadow-md active:scale-95"
              >
                {loading ? 'Joining Classroom...' : 'Join Classroom →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
