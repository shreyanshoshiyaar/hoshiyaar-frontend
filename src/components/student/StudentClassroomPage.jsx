import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studentClassroomService from '../../services/studentClassroomService.js';
import JoinClassModal from './JoinClassModal.jsx';

export default function StudentClassroomPage({ user }) {
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [leavingId, setLeavingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await studentClassroomService.getStudentClassrooms();
      setClassrooms(res.data?.classrooms || []);
    } catch (err) {
      console.error('Failed to load classrooms', err);
      setError('Unable to load classrooms. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const handleLeaveClass = async (classroomId, className) => {
    if (!window.confirm(`Are you sure you want to leave ${className}? You will no longer receive assignments from this teacher.`)) {
      return;
    }
    try {
      setLeavingId(classroomId);
      await studentClassroomService.leaveClassroom(classroomId);
      loadClassrooms();
    } catch (err) {
      console.error('Failed to leave classroom', err);
      alert(err.response?.data?.message || 'Failed to leave classroom');
    } finally {
      setLeavingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/60 min-h-screen pb-24 md:pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">

        {/* Hero Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1E65FA] border border-blue-200/70 text-xs font-bold tracking-wide">
                <span>🏫 Student Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                My Classrooms
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                Connect with your school teachers, receive homework, and collaborate with your classmates.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsJoinOpen(true)}
                className="px-5 py-3 bg-[#1E65FA] hover:bg-[#1656e0] text-white text-xs font-black uppercase tracking-wider rounded-2xl border-b-4 border-[#0A3DAA] hover:border-b-2 hover:translate-y-[2px] transition-all shadow-sm active:translate-y-[4px] active:border-b-0 flex items-center gap-2 cursor-pointer"
              >
                <span>+</span>
                <span>Join Classroom</span>
              </button>
            </div>
          </div>
        </div>

        {/* Classroom List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-10 h-10 border-3 border-[#1E65FA] border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-xs font-bold">Loading your classrooms...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl text-center">
            ⚠️ {error}
          </div>
        ) : classrooms.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8 shadow-xs max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1E65FA] border border-blue-200 flex items-center justify-center text-3xl mx-auto">
              🏫
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">No Classrooms Joined Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Enter the unique 6-character code given by your teacher to join your class and access homework.
              </p>
            </div>
            <button
              onClick={() => setIsJoinOpen(true)}
              className="px-6 py-3 bg-[#1E65FA] hover:bg-[#1656e0] text-white text-xs font-black uppercase tracking-wider rounded-2xl border-b-4 border-[#0A3DAA] hover:border-b-2 hover:translate-y-[2px] transition-all shadow-sm active:translate-y-[4px] active:border-b-0 cursor-pointer"
            >
              + Enter Class Code
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classrooms.map((c) => (
              <div
                key={c._id}
                className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E65FA] border border-blue-200/70">
                        Class {c.classLevel}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {c.subject}
                      </span>
                    </div>

                    {c.activeAssignmentsCount > 0 ? (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                        📝 {c.activeAssignmentsCount} Task{c.activeAssignmentsCount === 1 ? '' : 's'} Due
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✔ Caught Up
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-slate-900 mb-1">{c.name}</h3>

                  <div className="space-y-1 text-xs text-slate-500 font-medium">
                    {c.school && (
                      <div className="flex items-center gap-2">
                        <span>🏫</span>
                        <span className="truncate">{c.school}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span>👩‍🏫</span>
                      <span>Teacher: <strong className="text-slate-700">{c.teacherName}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>👥</span>
                      <span>{c.studentCount} Classmate{c.studentCount === 1 ? '' : 's'}</span>
                    </div>
                  </div>

                  {/* Class Code Chip */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-150 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Class Code</span>
                      <span className="font-mono font-black text-slate-800 text-sm tracking-wider">{c.code}</span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(c.code, c._id)}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors shadow-2xs"
                    >
                      {copiedId === c._id ? '✔ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleLeaveClass(c._id, c.name)}
                    disabled={leavingId === c._id}
                    className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                  >
                    {leavingId === c._id ? 'Leaving...' : 'Leave Class'}
                  </button>

                  <button
                    onClick={() => navigate('/homework')}
                    className="px-4 py-2 bg-[#1E65FA] hover:bg-[#1656e0] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                  >
                    <span>View Homework</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Classroom Modal */}
      <JoinClassModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onClassJoined={() => {
          setIsJoinOpen(false);
          loadClassrooms();
        }}
      />
    </div>
  );
}
