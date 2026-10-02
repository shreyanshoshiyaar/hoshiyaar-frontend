import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studentClassroomService from '../../services/studentClassroomService.js';
import JoinClassModal from './JoinClassModal.jsx';

export default function StudentHomeworkCard({ onOpenJoinModal }) {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [internalJoinOpen, setInternalJoinOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await studentClassroomService.getStudentAssignments();
      const list = res.data?.assignments || [];
      setAssignments(list);
      if (list.length > 0) {
        // Expand first pending assignment by default
        const firstPending = list.find(a => !a.isCompleted) || list[0];
        setExpandedId(firstPending._id);
      }
    } catch (err) {
      console.warn('Could not load student assignments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLesson = (moduleId) => {
    if (!moduleId) return;
    navigate(`/learn/module/${moduleId}`);
  };

  const formatDueDate = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    const now = new Date();
    const diffHours = Math.round((d - now) / (1000 * 60 * 60));

    if (diffHours < 0) {
      return 'Overdue';
    } else if (diffHours <= 24) {
      return `Due in ${Math.max(1, diffHours)}h`;
    } else {
      const days = Math.round(diffHours / 24);
      return `Due in ${days} ${days === 1 ? 'day' : 'days'}`;
    }
  };

  if (loading) return null;

  return (
    <>
      {assignments.length > 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📝</span>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">Class Homework</h3>
                <p className="text-[11px] text-slate-400 font-semibold">Assigned by your school teacher</p>
              </div>
            </div>

            <button
              onClick={() => (onOpenJoinModal ? onOpenJoinModal() : setInternalJoinOpen(true))}
              className="text-xs font-black text-[#1E65FA] hover:text-[#1656e0] flex items-center gap-1"
            >
              <span>+ Join Class</span>
            </button>
          </div>

          <div className="space-y-3">
            {assignments.map((a) => {
              const isExpanded = expandedId === a._id;
              const dueBadge = formatDueDate(a.dueDate);
              const isOverdue = dueBadge === 'Overdue';

              return (
                <div
                  key={a._id}
                  className={`border rounded-2xl transition-all overflow-hidden ${
                    a.isCompleted
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isOverdue
                      ? 'bg-red-50/30 border-red-200'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  {/* Card Header (clickable to expand/collapse) */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : a._id)}
                    className="p-4 cursor-pointer flex items-center justify-between gap-3 select-none"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-[#1E65FA] border border-blue-200/70">
                          {a.classroomName}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            a.isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOverdue
                              ? 'bg-red-100 text-red-700 font-bold'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {a.isCompleted ? '✔ Done' : dueBadge}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-800 truncate">{a.title}</h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        {a.chapterTitle} • {a.completedCount}/{a.totalTargets} lessons completed
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Mini Progress Bar */}
                      <div className="w-14 sm:w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            a.isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${a.progressPercent}%` }}
                        ></div>
                      </div>

                      <span className="text-slate-400 text-xs font-bold w-4 text-center">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Lessons List */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 space-y-2">
                      {a.instructions && (
                        <p className="text-xs text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-150 mb-2">
                          💬 Teacher note: "{a.instructions}"
                        </p>
                      )}

                      <div className="space-y-1.5">
                        {a.lessons?.map((l, idx) => (
                          <div
                            key={l.moduleId}
                            className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                              <span className="text-xs font-bold text-slate-800 truncate">{l.title}</span>
                            </div>

                            {l.isCompleted ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1 shrink-0">
                                <span>✔</span>
                                <span>Done</span>
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartLesson(l.moduleId);
                                }}
                                className="px-3.5 py-1.5 bg-[#1E65FA] hover:bg-[#1656e0] text-white text-xs font-black rounded-xl transition-all shadow-xs shrink-0 active:scale-95"
                              >
                                Play →
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Zero Classrooms Banner */
        <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 mb-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E65FA] border border-blue-200/80 flex items-center justify-center text-xl shadow-xs shrink-0">
              🏫
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-800">Has your teacher shared a class code?</h4>
              <p className="text-[11px] text-slate-500 font-medium">Join your classroom to see school homework and tasks.</p>
            </div>
          </div>

          <button
            onClick={() => (onOpenJoinModal ? onOpenJoinModal() : setInternalJoinOpen(true))}
            className="px-4 py-2.5 bg-[#1E65FA] hover:bg-[#1656e0] text-white text-xs font-black uppercase tracking-wider rounded-xl border-b-4 border-[#0A3DAA] hover:border-b-2 hover:translate-y-[2px] transition-all active:translate-y-[4px] active:border-b-0 shadow-sm shrink-0 active:scale-95"
          >
            Join Class
          </button>
        </div>
      )}

      {/* Internal Join Modal if invoked directly */}
      <JoinClassModal
        isOpen={internalJoinOpen}
        onClose={() => setInternalJoinOpen(false)}
        onClassJoined={() => {
          loadAssignments();
        }}
      />
    </>
  );
}
