import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import teacherService from '../../services/teacherService.js';
import AssignHomeworkModal from './AssignHomeworkModal.jsx';
import AssignmentTrackingModal from './AssignmentTrackingModal.jsx';

export default function ClassroomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classroom, setClassroom] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('homework'); // 'homework' | 'roster'

  // Modals state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [trackingAssignmentId, setTrackingAssignmentId] = useState(null);

  // Add from School state
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [schoolStudents, setSchoolStudents] = useState([]);
  const [schoolStudentsLoading, setSchoolStudentsLoading] = useState(false);
  const [schoolStudentsError, setSchoolStudentsError] = useState('');
  const [selectedSchoolStudentIds, setSelectedSchoolStudentIds] = useState(new Set());
  const [schoolFilterQuery, setSchoolFilterQuery] = useState('');
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkAddSuccess, setBulkAddSuccess] = useState('');

  // Delete classroom state
  const [deletingClassroom, setDeletingClassroom] = useState(false);

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    loadClassroom();
  }, [id]);

  const loadClassroom = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await teacherService.getClassroomDetails(id);
      setClassroom(res.data.classroom);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error('Failed to load classroom details', err);
      setError(err.response?.data?.message || 'Failed to load classroom.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClassroom = async () => {
    if (!classroom) return;
    const confirmMsg = `Are you sure you want to delete classroom "${classroom.name}"?\n\nThis will remove the classroom and all its assignments. Enrolled students will no longer see this class.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setDeletingClassroom(true);
      await teacherService.deleteClassroom(id);
      alert(`Classroom "${classroom.name}" has been deleted.`);
      navigate('/homework');
    } catch (err) {
      console.error('Failed to delete classroom', err);
      alert(err.response?.data?.message || 'Failed to delete classroom');
      setDeletingClassroom(false);
    }
  };

  const handleCopyCode = () => {
    if (!classroom?.code) return;
    navigator.clipboard.writeText(classroom.code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    });
  };

  const handleWhatsAppInvite = () => {
    if (!classroom) return;
    const text = `👋 Hello Students! Join our *${classroom.name}* classroom on *Hoshiyaar*!

Use this Class Code to join:
👉 *${classroom.code}*

1. Open Hoshiyaar app or visit: https://hoshiyaar.info
2. Go to Profile / Join Class
3. Enter code: *${classroom.code}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName || 'this student'} from the classroom?`)) {
      return;
    }
    try {
      await teacherService.removeStudent(id, studentId);
      loadClassroom();
    } catch (err) {
      console.error('Failed to remove student', err);
      alert(err.response?.data?.message || 'Failed to remove student');
    }
  };

  const handleOpenSchoolModal = async () => {
    setIsSchoolModalOpen(true);
    setSchoolStudentsError('');
    setBulkAddSuccess('');
    setSelectedSchoolStudentIds(new Set());
    setSchoolFilterQuery('');
    try {
      setSchoolStudentsLoading(true);
      const res = await teacherService.getSchoolStudents(id);
      setSchoolStudents(res.data?.students || []);
    } catch (err) {
      console.error('Failed to load school students', err);
      setSchoolStudentsError(err.response?.data?.message || 'Failed to load school students');
    } finally {
      setSchoolStudentsLoading(false);
    }
  };

  const handleToggleSelectStudent = (sid) => {
    setSelectedSchoolStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  };

  const handleToggleSelectAll = (filteredList) => {
    if (selectedSchoolStudentIds.size === filteredList.length && filteredList.length > 0) {
      setSelectedSchoolStudentIds(new Set());
    } else {
      setSelectedSchoolStudentIds(new Set(filteredList.map((s) => s._id)));
    }
  };

  const handleBulkAdd = async () => {
    if (selectedSchoolStudentIds.size === 0) return;
    try {
      setBulkAdding(true);
      setSchoolStudentsError('');
      const res = await teacherService.bulkAddStudents(id, Array.from(selectedSchoolStudentIds));
      setBulkAddSuccess(res.data?.message || 'Students added successfully!');
      setTimeout(() => {
        setIsSchoolModalOpen(false);
        loadClassroom();
      }, 1000);
    } catch (err) {
      console.error('Failed to bulk add students', err);
      setSchoolStudentsError(err.response?.data?.message || 'Failed to add students');
    } finally {
      setBulkAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-slate-500">Loading classroom...</p>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-3xl mb-4">
          ⚠️
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-2">Classroom Not Found</h3>
        <p className="text-sm text-slate-500 mb-6">{error || 'Unable to access classroom'}</p>
        <Link
          to="/teacher"
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all"
        >
          ← Back to Teacher Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* Top Banner Navigation */}
      <div className="bg-white/95 backdrop-blur border-b border-slate-200/90 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link
            to="/homework"
            className="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
          >
            <span>←</span>
            <span>All Classrooms</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAssignOpen(true)}
              className="px-4 py-2 bg-[#1E65FA] hover:bg-[#1656e0] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>+</span>
              <span>Assign Homework</span>
            </button>
            <button
              onClick={handleDeleteClassroom}
              disabled={deletingClassroom}
              className="px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-slate-200 hover:border-red-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Delete this classroom"
            >
              <span>🗑️</span>
              <span>{deletingClassroom ? 'Deleting...' : 'Delete Class'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-7">

        {/* Hero Card - White Background, Black Text, Hoshi Blue Accents */}
        <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-9 shadow-sm border border-slate-200/90 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1E65FA] border border-blue-200/70 text-xs font-bold">
                <span>Class {classroom.classLevel}</span>
                <span>•</span>
                <span>{classroom.subject}</span>
                {classroom.school && (
                  <>
                    <span>•</span>
                    <span>{classroom.school}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900">{classroom.name}</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Educator: <span className="text-slate-900 font-semibold">{classroom.teacherId?.name || classroom.teacherId?.username || 'You'}</span>
              </p>
            </div>

            {/* Unique Code Box */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col items-center sm:items-end text-center sm:text-right shrink-0 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Student Join Code
              </span>
              <div className="flex items-center gap-3 mt-1.5 mb-2.5">
                <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-[#1E65FA] select-all">
                  {classroom.code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200 shadow-2xs"
                >
                  {copiedCode ? '✔ Copied' : 'Copy'}
                </button>
              </div>

              <button
                onClick={handleWhatsAppInvite}
                className="w-full sm:w-auto px-4 py-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>Share Code on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200/90 bg-white px-6 rounded-2xl shadow-xs">
          <button
            onClick={() => setActiveTab('homework')}
            className={`py-4 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'homework'
                ? 'border-[#1E65FA] text-[#1E65FA]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>📝 Assigned Homework</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'homework' ? 'bg-blue-50 text-[#1E65FA]' : 'bg-slate-100 text-slate-600'
            }`}>
              {assignments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-4 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'border-[#1E65FA] text-[#1E65FA]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>👥 Student Roster</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'roster' ? 'bg-blue-50 text-[#1E65FA]' : 'bg-slate-100 text-slate-600'
            }`}>
              {classroom.students?.length || 0}
            </span>
          </button>
        </div>

        {/* Tab 1: Homework */}
        {activeTab === 'homework' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Homework & Quizzes</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Track real-time student completion and share WhatsApp progress reports in 1 click.
                </p>
              </div>
              <button
                onClick={() => setIsAssignOpen(true)}
                className="px-4 py-2 bg-[#1E65FA] hover:bg-[#1656e0] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                <span>+</span>
                <span>Assign Homework</span>
              </button>
            </div>

            {assignments.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8 shadow-xs">
                <span className="text-4xl">📚</span>
                <h4 className="text-base font-black text-slate-900 mt-3 mb-1">No Homework Assigned Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                  Assign entire chapters or specific lessons to this classroom. Students will see it on their dashboard immediately.
                </p>
                <button
                  onClick={() => setIsAssignOpen(true)}
                  className="px-6 py-2.5 bg-[#1E65FA] hover:bg-[#1656e0] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
                >
                  Assign First Homework
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map((a) => {
                  const isOverdue = new Date() > new Date(a.dueDate);
                  const dueDateFormatted = new Date(a.dueDate).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });

                  return (
                    <div
                      key={a._id}
                      className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-slate-400/90 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E65FA] border border-blue-200/70">
                            {a.chapterTitle}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isOverdue
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isOverdue ? 'Overdue' : 'Active'}
                          </span>
                        </div>

                        <h4 className="text-base font-black text-slate-900 mb-1">{a.title}</h4>
                        {a.instructions && (
                          <p className="text-xs text-slate-500 italic mb-3">"{a.instructions}"</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold mb-4">
                          <span className="flex items-center gap-1">
                            <span>📖</span>
                            <span>{a.targetLessons?.length || 0} Lessons</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span>⏰</span>
                            <span>Due: {dueDateFormatted}</span>
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => setTrackingAssignmentId(a._id)}
                        className="w-full py-2.5 bg-blue-50/80 hover:bg-blue-100 text-[#1E65FA] hover:text-[#0A3DAA] border border-blue-200/60 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95"
                      >
                        <span>📊 View Live Tracking & WhatsApp Report</span>
                        <span>→</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Student Roster */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-800">Enrolled Students</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {classroom.students?.length || 0} students have joined this classroom.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenSchoolModal}
                  className="px-4 py-2 bg-[#1E65FA] hover:bg-[#1656e0] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <span>🏫</span>
                  <span>Add from School</span>
                </button>
              </div>
            </div>

            {(!classroom.students || classroom.students.length === 0) ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 shadow-xs">
                <span className="text-4xl">👥</span>
                <h4 className="text-base font-black text-slate-800 mt-3 mb-1">No Students Enrolled Yet</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
                  Share the unique class code <strong className="text-indigo-600 font-mono text-sm">{classroom.code}</strong> with your students to have them join automatically, or add them from your school.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleOpenSchoolModal}
                    className="px-5 py-2.5 bg-[#1E65FA] hover:bg-[#1656e0] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <span>🏫</span>
                    <span>Add from School</span>
                  </button>
                  <button
                    onClick={handleWhatsAppInvite}
                    className="px-5 py-2.5 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span>Share Code via WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Points</th>
                        <th className="py-3 px-4">Accuracy</th>
                        <th className="py-3 px-4">Joined Date</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {classroom.students.map((student, idx) => (
                        <tr key={student._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-slate-400 font-semibold">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                                {(student.name || student.username || '?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-black text-slate-800">{student.name || 'Unnamed'}</div>
                                <div className="text-[11px] text-slate-400">@{student.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {student.phone || 'N/A'}
                          </td>
                          <td className="py-3 px-4 font-bold text-indigo-600">
                            ⭐ {student.totalPoints || 0}
                          </td>
                          <td className="py-3 px-4">
                            {(student.totalPoints > 0 && student.totalAttempts > 0) ? (
                              <span
                                className={`font-black font-mono text-xs px-2.5 py-1 rounded-lg border inline-flex items-center ${
                                  student.accuracy >= 80
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : student.accuracy >= 50
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {student.accuracy}%
                              </span>
                            ) : (
                              <span
                                className="text-[11px] font-bold text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md"
                                title={student.totalAttempts > 0 ? `${student.totalAttempts} questions tried, but no quiz stars earned yet` : 'No activity yet'}
                              >
                                —
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-medium">
                            {new Date(student.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleRemoveStudent(student._id, student.name || student.username)}
                              className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors"
                              title="Remove from class"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Homework Modal */}
      <AssignHomeworkModal
        classroom={classroom}
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onAssignmentCreated={() => {
          loadClassroom();
        }}
      />

      {/* Assignment Tracking Modal */}
      <AssignmentTrackingModal
        assignmentId={trackingAssignmentId}
        isOpen={!!trackingAssignmentId}
        onClose={() => setTrackingAssignmentId(null)}
      />

      {/* Add Students from School Modal */}
      {isSchoolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E65FA] flex items-center justify-center text-xl shrink-0 border border-blue-200">
                  🏫
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">Add Students from School</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {classroom.school ? `Showing registered students from "${classroom.school}"` : 'Select students from your school'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSchoolModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            {schoolStudentsError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl mb-3 border border-red-200">
                ⚠️ {schoolStudentsError}
              </div>
            )}
            {bulkAddSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl mb-3 border border-emerald-200">
                ✔ {bulkAddSuccess}
              </div>
            )}

            {/* Search filter within school students */}
            {schoolStudents.length > 0 && (
              <div className="mb-3 flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={schoolFilterQuery}
                  onChange={(e) => setSchoolFilterQuery(e.target.value)}
                  placeholder="Search students by name or @username..."
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:border-[#1E65FA]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const filtered = schoolStudents.filter((s) => {
                      const q = schoolFilterQuery.toLowerCase();
                      return (s.name || '').toLowerCase().includes(q) || (s.username || '').toLowerCase().includes(q);
                    });
                    handleToggleSelectAll(filtered);
                  }}
                  className="text-xs font-bold text-[#1E65FA] hover:text-[#0A3DAA] shrink-0"
                >
                  {selectedSchoolStudentIds.size === schoolStudents.length && schoolStudents.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            )}

            {/* Student List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
              {schoolStudentsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-8 h-8 border-3 border-[#1E65FA] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-xs font-bold">Finding school students...</span>
                </div>
              ) : schoolStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 p-4">
                  <span className="text-3xl block mb-2">🎓</span>
                  <p className="text-xs font-bold text-slate-700">No other students registered under this school yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Students can register and set their school to "{classroom.school || 'your school'}", or you can share your class code.
                  </p>
                </div>
              ) : (
                schoolStudents
                  .filter((s) => {
                    const q = schoolFilterQuery.toLowerCase();
                    return (s.name || '').toLowerCase().includes(q) || (s.username || '').toLowerCase().includes(q);
                  })
                  .map((s) => {
                    const isSelected = selectedSchoolStudentIds.has(s._id);
                    return (
                      <div
                        key={s._id}
                        onClick={() => handleToggleSelectStudent(s._id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/80 border-[#1E65FA] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-[#1E65FA] focus:ring-0 cursor-pointer"
                          />
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs shrink-0">
                            {(s.name || s.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-900 truncate">
                              {s.name || 'Unnamed Student'}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2">
                              <span>@{s.username}</span>
                              {s.classLevel && (
                                <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-bold">
                                  Class {s.classLevel}
                                </span>
                              )}
                              {s.phone && <span>• {s.phone}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-indigo-600 shrink-0">
                          ⭐ {s.totalPoints || 0}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-3">
              <span className="text-xs font-bold text-slate-600">
                {selectedSchoolStudentIds.size} student{selectedSchoolStudentIds.size === 1 ? '' : 's'} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkAdd}
                  disabled={bulkAdding || selectedSchoolStudentIds.size === 0}
                  className="px-5 py-2.5 bg-[#1E65FA] hover:bg-[#1656e0] disabled:bg-slate-300 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 disabled:cursor-not-allowed"
                >
                  {bulkAdding ? 'Adding Students...' : `Add Selected (${selectedSchoolStudentIds.size})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
