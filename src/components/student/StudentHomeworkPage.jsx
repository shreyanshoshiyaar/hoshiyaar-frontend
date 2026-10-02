import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studentClassroomService from '../../services/studentClassroomService.js';
import JoinClassModal from './JoinClassModal.jsx';

export default function StudentHomeworkPage({ user, onSwitchView }) {
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & State
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'pending' | 'completed'
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [assignRes, classRes] = await Promise.all([
        studentClassroomService.getStudentAssignments(),
        studentClassroomService.getStudentClassrooms(),
      ]);

      const assignList = assignRes.data?.assignments || [];
      setAssignments(assignList);
      setClassrooms(classRes.data?.classrooms || []);

      if (assignList.length > 0) {
        // Expand first pending assignment by default
        const firstPending = assignList.find((a) => !a.isCompleted) || assignList[0];
        setExpandedId(firstPending._id);
      }
    } catch (err) {
      console.error('Failed to load homework data', err);
      setError('Unable to load assignments. Please check your connection.');
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
      return { label: 'Overdue', isOverdue: true };
    } else if (diffHours <= 24) {
      return { label: `Due in ${Math.max(1, diffHours)}h`, isOverdue: false, isSoon: true };
    } else {
      const days = Math.round(diffHours / 24);
      return { label: `Due in ${days} ${days === 1 ? 'day' : 'days'}`, isOverdue: false, isSoon: false };
    }
  };

  // Calculations for Stats
  const totalCount = assignments.length;
  const completedCount = assignments.filter((a) => a.isCompleted).length;
  const pendingCount = totalCount - completedCount;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered List
  const filteredAssignments = assignments.filter((a) => {
    if (selectedClassFilter !== 'all' && a.classroomId !== selectedClassFilter) {
      return false;
    }
    if (filterTab === 'pending') return !a.isCompleted;
    if (filterTab === 'completed') return a.isCompleted;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/60 min-h-screen pb-24 md:pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">

        {/* Hero Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1E65FA] border border-blue-200/70 text-xs font-bold tracking-wide">
                <span>📝 School Curriculum & Homework</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Home Work & Tasks
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                Complete homework assigned by your school teacher, practice quiz missions, and track your completion rate.
              </p>

              {/* Classroom Pills */}
              {classrooms.length > 0 && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Your Classes:</span>
                  {classrooms.map((c) => (
                    <span
                      key={c._id}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-200"
                    >
                      <span>🏫</span>
                      <span>{c.name}</span>
                      <span className="text-slate-400 font-normal">({c.subject})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {onSwitchView && (
                <button
                  type="button"
                  onClick={() => onSwitchView('teacher')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Switch to Teacher Mode"
                >
                  <span>👨‍🏫</span>
                  <span>Teacher View</span>
                </button>
              )}
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

        {/* Stats Row */}
        {classrooms.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Tasks</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Pending</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Completed</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-black uppercase text-[#1E65FA] tracking-wider">Completion Rate</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-[#1E65FA] h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-10 h-10 border-3 border-[#1E65FA] border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-xs font-bold">Loading your homework...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl text-center">
            ⚠️ {error}
          </div>
        ) : classrooms.length === 0 ? (
          /* Zero Enrolled Classrooms */
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8 shadow-xs max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1E65FA] border border-blue-200 flex items-center justify-center text-3xl mx-auto">
              🏫
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">You haven't joined a classroom yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Ask your school teacher for your unique 6-character class code to receive assignments, quizzes, and class updates.
              </p>
            </div>
            <button
              onClick={() => setIsJoinOpen(true)}
              className="px-6 py-3 bg-[#1E65FA] hover:bg-[#1656e0] text-white text-xs font-black uppercase tracking-wider rounded-2xl border-b-4 border-[#0A3DAA] hover:border-b-2 hover:translate-y-[2px] transition-all shadow-sm active:translate-y-[4px] active:border-b-0 cursor-pointer"
            >
              + Join Classroom Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter Tabs Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                    filterTab === 'all'
                      ? 'bg-[#1E65FA] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Tasks ({totalCount})
                </button>
                <button
                  onClick={() => setFilterTab('pending')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                    filterTab === 'pending'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setFilterTab('completed')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                    filterTab === 'completed'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Completed ({completedCount})
                </button>
              </div>

              {/* Classroom Dropdown Filter */}
              {classrooms.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">Class:</span>
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#1E65FA]"
                  >
                    <option value="all">All Classes</option>
                    {classrooms.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Assignments List */}
            {filteredAssignments.length === 0 ? (
              <div className="py-14 text-center bg-white rounded-3xl border border-slate-200/80 p-8 shadow-2xs space-y-3">
                <span className="text-3xl">🎉</span>
                <h4 className="text-sm font-black text-slate-800">
                  {filterTab === 'pending'
                    ? 'No pending homework!'
                    : filterTab === 'completed'
                    ? 'No completed assignments yet.'
                    : 'No homework assigned yet for this classroom.'}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {filterTab === 'pending'
                    ? 'You have completed all assigned tasks. Keep up the awesome work!'
                    : 'Assignments from your teacher will appear here automatically.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((a) => {
                  const isExpanded = expandedId === a._id;
                  const dueInfo = formatDueDate(a.dueDate);

                  return (
                    <div
                      key={a._id}
                      className={`bg-white border rounded-3xl transition-all shadow-xs overflow-hidden ${
                        a.isCompleted
                          ? 'border-emerald-200'
                          : dueInfo.isOverdue
                          ? 'border-red-200'
                          : 'border-slate-200/90'
                      }`}
                    >
                      {/* Card Header (clickable to expand/collapse) */}
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : a._id)}
                        className="p-5 sm:p-6 cursor-pointer select-none flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E65FA] border border-blue-200/70">
                              {a.classroomName}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              • Teacher: {a.teacherName}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                a.isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : dueInfo.isOverdue
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {a.isCompleted ? '✔ Done' : dueInfo.label}
                            </span>
                          </div>

                          <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                            {a.title}
                          </h3>

                          {a.chapterTitle && (
                            <p className="text-xs text-slate-500 font-medium">
                              📖 Chapter: <strong className="text-slate-700">{a.chapterTitle}</strong>
                            </p>
                          )}
                        </div>

                        {/* Progress Indicator */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-900 block">
                              {a.completedCount} / {a.totalTargets} Lessons
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {a.progressPercent}% completed
                            </span>
                          </div>

                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold">
                            {isExpanded ? '▲' : '▼'}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4">
                          {a.instructions && (
                            <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
                              <span className="text-base shrink-0">💬</span>
                              <div>
                                <span className="font-bold block text-[11px] uppercase tracking-wider text-blue-800 mb-0.5">
                                  Teacher Note
                                </span>
                                <p className="italic leading-relaxed">{a.instructions}</p>
                              </div>
                            </div>
                          )}

                          {/* Lessons Checklist */}
                          <div className="space-y-2">
                            <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                              Assigned Lessons Checklist:
                            </span>

                            <div className="grid grid-cols-1 gap-2">
                              {a.lessons?.map((l, idx) => (
                                <div
                                  key={l.moduleId}
                                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-slate-300 transition-colors"
                                >
                                  <div className="flex items-center gap-3 min-w-0 pr-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[11px] font-black flex items-center justify-center shrink-0">
                                      {l.order || idx + 1}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      {l.title}
                                    </span>
                                  </div>

                                  {l.isCompleted ? (
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1 shrink-0">
                                      <span>✔</span>
                                      <span>Done</span>
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleStartLesson(l.moduleId)}
                                      className="px-4 py-1.5 bg-[#1E65FA] hover:bg-[#1656e0] text-white text-xs font-black rounded-xl transition-all shadow-xs shrink-0 active:scale-95"
                                    >
                                      Play →
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Join Classroom Modal */}
      <JoinClassModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onClassJoined={() => {
          setIsJoinOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
