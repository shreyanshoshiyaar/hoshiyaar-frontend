import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import teacherService from '../../services/teacherService.js';
import authService from '../../services/authService.js';

export default function TeacherDashboard({ embedded = false, onSwitchView }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Curriculum options from database
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [classSubjectMap, setClassSubjectMap] = useState({});
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Create Classroom Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [school, setSchool] = useState(user?.school || '');
  const [schoolSuggestions, setSchoolSuggestions] = useState([]);
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  const [isSearchingSchool, setIsSearchingSchool] = useState(false);
  const schoolSearchTimeout = useRef(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Copy feedback
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadClassrooms();
    loadCurriculumOptions();
  }, []);

  const loadCurriculumOptions = async () => {
    try {
      setOptionsLoading(true);
      const res = await teacherService.getCurriculumOptions();
      const cls = res.data?.classes || [];
      const subs = res.data?.subjects || [];
      const map = res.data?.classSubjectMap || {};

      setAvailableClasses(cls);
      setAvailableSubjects(subs);
      setClassSubjectMap(map);

      // Set initial defaults from database options
      if (cls.length > 0) {
        // Prefer Class 7 if available, else first class in DB
        const defaultClass = cls.find(c => c.value === '7')?.value || cls[0].value;
        setClassLevel(defaultClass);

        const subjectsForClass = map[defaultClass] || subs;
        if (subjectsForClass.length > 0) {
          setSubject(subjectsForClass[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to load curriculum options from database, using fallback', err);
      setAvailableClasses([
        { value: '6', label: 'Class 6' },
        { value: '7', label: 'Class 7' },
        { value: '8', label: 'Class 8' }
      ]);
      setAvailableSubjects(['Science']);
      setClassLevel('7');
      setSubject('Science');
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleClassChange = (selectedClass) => {
    setClassLevel(selectedClass);
    const validSubjects = classSubjectMap[selectedClass] || availableSubjects;
    if (validSubjects && validSubjects.length > 0) {
      if (!validSubjects.includes(subject)) {
        setSubject(validSubjects[0]);
      }
    }
  };

  const handleSchoolChange = (val) => {
    setSchool(val);
    if (schoolSearchTimeout.current) {
      clearTimeout(schoolSearchTimeout.current);
    }
    if (!val || val.trim().length < 2) {
      setSchoolSuggestions([]);
      setShowSchoolSuggestions(false);
      return;
    }
    setShowSchoolSuggestions(true);
    setIsSearchingSchool(true);
    schoolSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await authService.getOlaSchoolSuggestions(val.trim());
        const preds = res?.data?.predictions || [];
        setSchoolSuggestions(preds);
      } catch (err) {
        console.error('Failed to get school suggestions', err);
        setSchoolSuggestions([]);
      } finally {
        setIsSearchingSchool(false);
      }
    }, 300);
  };

  const handleSelectSchool = (suggestion) => {
    const schoolName = suggestion.structured_formatting?.main_text || suggestion.description || '';
    setSchool(schoolName);
    setShowSchoolSuggestions(false);
  };

  const loadClassrooms = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await teacherService.getTeacherClassrooms();
      setClassrooms(res.data?.classrooms || []);
    } catch (err) {
      console.error('Failed to load classrooms', err);
      setError('Unable to load classrooms. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setCreateError('Please enter a classroom name');
      return;
    }
    if (!classLevel || !subject) {
      setCreateError('Please select both a grade/class and subject');
      return;
    }

    try {
      setCreating(true);
      setCreateError('');
      const res = await teacherService.createClassroom({
        name: name.trim(),
        classLevel,
        subject,
        school: school.trim(),
      });

      if (res.data?.success) {
        setIsCreateOpen(false);
        setName('');
        loadClassrooms();
        // Navigate directly to the new classroom
        navigate(`/teacher/classrooms/${res.data.classroom._id}`);
      }
    } catch (err) {
      console.error('Failed to create classroom', err);
      setCreateError(err.response?.data?.message || 'Failed to create classroom');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const handleWhatsAppInvite = (c) => {
    const text = `👋 Hello Students! Join our *${c.name}* classroom on *Hoshiyaar*!

Use this Class Code to join:
👉 *${c.code}*

1. Open Hoshiyaar app or visit: https://hoshiyaar.info
2. Go to Profile / Join Class
3. Enter code: *${c.code}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Aggregated stats
  const totalStudents = classrooms.reduce((acc, c) => acc + (c.studentCount || 0), 0);
  const totalActiveAssignments = classrooms.reduce((acc, c) => acc + (c.activeAssignmentsCount || 0), 0);

  // Current subjects for selected class
  const currentClassSubjects = (classLevel && classSubjectMap[classLevel] && classSubjectMap[classLevel].length > 0)
    ? classSubjectMap[classLevel]
    : availableSubjects;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-800">
      {/* Top Navbar - Only shown when standalone */}
      {!embedded && (
        <div className="bg-white/95 backdrop-blur border-b border-slate-200/90 sticky top-0 z-20 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/learn" className="flex items-center gap-2 group">
                <span className="text-xl group-hover:scale-105 transition-transform">🦉</span>
                <span className="font-black text-slate-900 tracking-tight text-lg">Hoshiyaar</span>
              </Link>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-slate-800 shadow-xs flex items-center gap-1">
                <span>Teacher Mode</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              {onSwitchView ? (
                <button
                  type="button"
                  onClick={() => onSwitchView('student')}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  ← Student App
                </button>
              ) : (
                <Link
                  to="/learn"
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  ← Student App
                </Link>
              )}
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 bg-[#1E65FA] hover:bg-[#1656e0] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                <span>+</span>
                <span>New Classroom</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-7">

        {/* Hero Header - White Background, Black Text, Hoshi Blue Button */}
        <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-9 shadow-sm border border-slate-200/90 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1E65FA] border border-blue-200/70 text-xs font-bold tracking-wide">
                <span>🏛️ Educator & School Platform</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                Welcome, {user?.name || user?.username || 'Teacher'}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed font-normal">
                Create classrooms, share unique codes with students, assign homework by chapter or individual lessons, and get instant WhatsApp progress reports.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-6 py-3.5 bg-[#1E65FA] hover:bg-[#1656e0] text-white text-xs font-black uppercase tracking-wider rounded-2xl border-b-4 border-[#0A3DAA] hover:border-b-2 hover:translate-y-[2px] transition-all shadow-md active:translate-y-[4px] active:border-b-0 flex items-center gap-2"
              >
                <span>+ Create Classroom</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Summary Stats - 3 bricks horizontally in a row on phone & desktop */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 sm:p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-100 text-slate-900 border border-slate-200/80 flex items-center justify-center text-sm sm:text-xl font-black shrink-0">
              🏛️
            </div>
            <div className="min-w-0">
              <span className="text-[8.5px] sm:text-[10px] font-black uppercase text-slate-400 tracking-tight sm:tracking-wider block leading-tight">Total Classrooms</span>
              <div className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 sm:mt-1">{classrooms.length}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 sm:p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-150 flex items-center justify-center text-sm sm:text-xl font-black shrink-0">
              👥
            </div>
            <div className="min-w-0">
              <span className="text-[8.5px] sm:text-[10px] font-black uppercase text-slate-400 tracking-tight sm:tracking-wider block leading-tight">Active Students</span>
              <div className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 sm:mt-1">{totalStudents}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 sm:p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-50 text-amber-700 border border-amber-150 flex items-center justify-center text-sm sm:text-xl font-black shrink-0">
              📝
            </div>
            <div className="min-w-0">
              <span className="text-[8.5px] sm:text-[10px] font-black uppercase text-slate-400 tracking-tight sm:tracking-wider block leading-tight">Active Homeworks</span>
              <div className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 sm:mt-1">{totalActiveAssignments}</div>
            </div>
          </div>
        </div>
        {/* Classrooms Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Your Classrooms</h3>
              <p className="text-xs text-slate-500 font-medium">
                Manage your classrooms, student rosters, and curriculum chapter assignments.
              </p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="text-xs font-black text-slate-900 hover:text-amber-600 flex items-center gap-1 transition-colors"
            >
              <span>+ Create Another Classroom</span>
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-slate-900 border-t-amber-400 rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-bold text-slate-400">Loading your classrooms...</p>
            </div>
          ) : classrooms.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8 shadow-xs">
              <div className="w-16 h-16 bg-slate-100 text-slate-900 border border-slate-200 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-xs">
                🏛️
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-1">Create Your First Classroom</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                Form a classroom for your students. Classes and subjects are connected directly to your syllabus database.
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-6 py-3 bg-[#1E65FA] hover:bg-[#1656e0] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
              >
                + Create Classroom Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {classrooms.map((c) => (
                <div
                  key={c._id}
                  className="bg-white border border-slate-200/90 hover:border-slate-400/90 rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E65FA] border border-blue-200/70">
                        Class {c.classLevel} • {c.subject}
                      </span>
                      {c.school && (
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">
                          {c.school}
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-black text-slate-900 tracking-tight mb-2 group-hover:text-slate-800 transition-colors">
                      {c.name}
                    </h4>

                    {/* Join Code Box */}
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl mb-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                          Student Join Code
                        </span>
                        <span className="font-mono text-xl font-black tracking-widest text-[#1E65FA] select-all">
                          {c.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyCode(c.code, c._id)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
                        >
                          {copiedId === c._id ? '✔' : 'Copy'}
                        </button>
                        <button
                          onClick={() => handleWhatsAppInvite(c)}
                          className="w-7 h-7 bg-[#25D366] hover:bg-[#1ebd5a] text-white rounded-lg flex items-center justify-center transition-colors shadow-2xs"
                          title="Invite on WhatsApp"
                        >
                          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-center text-xs mb-4">
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Students</span>
                        <strong className="text-slate-900 text-sm font-black">{c.studentCount || 0}</strong>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Active Tasks</span>
                        <strong className="text-[#1E65FA] text-sm font-black">{c.activeAssignmentsCount || 0}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Open Classroom Button */}
                  <Link
                    to={`/teacher/classrooms/${c._id}`}
                    className="w-full py-2.5 bg-[#1E65FA] hover:bg-[#1656e0] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>Manage Classroom</span>
                    <span>→</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Classroom Modal - Classy & Modern Design with DB-driven Options */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-6 sm:p-7 w-full max-w-md">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#1E65FA] border border-blue-200/80 flex items-center justify-center text-xl font-black shadow-xs shrink-0">
                  🏛️
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">Create New Classroom</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Classes & subjects are loaded directly from syllabus
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl mb-4 flex items-center gap-2">
                <span>⚠️</span>
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClassroom} className="space-y-4">
              {/* Classroom Name */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Classroom Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Class 7 - Section A Science"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 transition-all"
                  required
                />
              </div>

              {/* Class and Subject fetched dynamically from database */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                      Grade / Class <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      value={classLevel}
                      onChange={(e) => handleClassChange(e.target.value)}
                      disabled={optionsLoading}
                      className="w-full px-3 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 transition-all cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed appearance-none pr-8"
                    >
                      {optionsLoading ? (
                        <option value="">Loading classes...</option>
                      ) : availableClasses.length === 0 ? (
                        <option value="">No classes in DB</option>
                      ) : (
                        availableClasses.map((cl) => (
                          <option key={cl.value} value={cl.value}>
                            {cl.label}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                      Subject <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={optionsLoading || currentClassSubjects.length === 0}
                      className="w-full px-3 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 transition-all cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed appearance-none pr-8"
                    >
                      {optionsLoading ? (
                        <option value="">Loading subjects...</option>
                      ) : currentClassSubjects.length === 0 ? (
                        <option value="">No subject found</option>
                      ) : (
                        currentClassSubjects.map((subName) => (
                          <option key={subName} value={subName}>
                            {subName}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* School Name with Ola Maps Autocomplete */}
              <div className="relative">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>School Name <span className="text-slate-400 font-normal lowercase">(optional)</span></span>
                  {isSearchingSchool && <span className="text-[10px] text-[#1E65FA] font-bold animate-pulse">Searching schools...</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => handleSchoolChange(e.target.value)}
                    onFocus={() => {
                      if (schoolSuggestions.length > 0) setShowSchoolSuggestions(true);
                    }}
                    placeholder="Search your school name (e.g. DPS, KV, Don Bosco)"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1E65FA] focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                  {school && (
                    <button
                      type="button"
                      onClick={() => {
                        setSchool('');
                        setSchoolSuggestions([]);
                        setShowSchoolSuggestions(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {showSchoolSuggestions && schoolSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {schoolSuggestions.map((sug, idx) => {
                      const mainText = sug.structured_formatting?.main_text || sug.description || '';
                      const secondaryText = sug.structured_formatting?.secondary_text || '';
                      return (
                        <div
                          key={sug.place_id || idx}
                          onClick={() => handleSelectSchool(sug)}
                          className="p-3 hover:bg-blue-50/80 cursor-pointer transition-colors flex items-start gap-2.5 text-left"
                        >
                          <span className="text-lg shrink-0 mt-0.5">🏫</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-black text-slate-800 truncate">{mainText}</div>
                            {secondaryText && (
                              <div className="text-[10px] text-slate-500 truncate">{secondaryText}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || optionsLoading || !classLevel || !subject}
                  className="px-6 py-3.5 bg-[#1E65FA] hover:bg-[#1656e0] disabled:bg-slate-300 text-white text-xs font-black uppercase tracking-wider rounded-2xl border-b-4 border-[#0A3DAA] hover:border-b-2 hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0 transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>{creating ? 'Creating...' : 'Create Classroom →'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

