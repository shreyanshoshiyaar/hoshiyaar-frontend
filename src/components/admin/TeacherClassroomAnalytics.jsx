import React, { useState, useEffect, useMemo } from 'react';
import authService from '../../services/authService';

const TeacherClassroomAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({ summary: {}, teachers: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'has_classrooms', 'no_classrooms'
  const [sortBy, setSortBy] = useState('most_classrooms'); // 'most_classrooms', 'most_students', 'name', 'recent'
  const [expandedTeacherIds, setExpandedTeacherIds] = useState(new Set());
  const [expandedClassroomIds, setExpandedClassroomIds] = useState(new Set());
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await authService.getTeachersAnalytics();
      if (res.data?.success) {
        setData({
          summary: res.data.summary || {},
          teachers: res.data.teachers || [],
        });
      } else {
        setError('Failed to load teacher analytics');
      }
    } catch (err) {
      console.error('Error loading teacher analytics:', err);
      setError(err.response?.data?.message || err.message || 'Error loading teacher analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const toggleTeacherExpand = (teacherId) => {
    setExpandedTeacherIds(prev => {
      const next = new Set(prev);
      if (next.has(teacherId)) {
        next.delete(teacherId);
      } else {
        next.add(teacherId);
      }
      return next;
    });
  };

  const toggleClassroomExpand = (classroomId) => {
    setExpandedClassroomIds(prev => {
      const next = new Set(prev);
      if (next.has(classroomId)) {
        next.delete(classroomId);
      } else {
        next.add(classroomId);
      }
      return next;
    });
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered & Sorted Teachers
  const filteredTeachers = useMemo(() => {
    let list = [...(data.teachers || [])];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => {
        const t = item.teacher || {};
        const name = (t.name || '').toLowerCase();
        const username = (t.username || '').toLowerCase();
        const phone = (t.phone || '').toLowerCase();
        const email = (t.email || '').toLowerCase();
        const school = (t.school || '').toLowerCase();
        const matchClass = (item.classrooms || []).some(c =>
          (c.name || '').toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q)
        );
        return name.includes(q) || username.includes(q) || phone.includes(q) || email.includes(q) || school.includes(q) || matchClass;
      });
    }

    // Filter mode
    if (filterMode === 'has_classrooms') {
      list = list.filter(item => item.classroomsCount > 0);
    } else if (filterMode === 'no_classrooms') {
      list = list.filter(item => item.classroomsCount === 0);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'most_classrooms') {
        return b.classroomsCount - a.classroomsCount || b.totalStudentsCount - a.totalStudentsCount;
      }
      if (sortBy === 'most_students') {
        return b.totalStudentsCount - a.totalStudentsCount || b.classroomsCount - a.classroomsCount;
      }
      if (sortBy === 'name') {
        const nameA = (a.teacher?.name || a.teacher?.username || '').toLowerCase();
        const nameB = (b.teacher?.name || b.teacher?.username || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'recent') {
        return new Date(b.teacher?.createdAt || 0) - new Date(a.teacher?.createdAt || 0);
      }
      return 0;
    });

    return list;
  }, [data.teachers, searchQuery, filterMode, sortBy]);

  const { summary = {} } = data;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">👨‍🏫</span>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Teacher &amp; Classroom Analytics</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Monitor teacher adoption, active classrooms created, and student enrollments across all schools.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider rounded-xl border border-indigo-200 shadow-2xs transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Teachers</span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-black">👨‍🏫</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{summary.totalTeachers || 0}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">
            {summary.activeTeachersCount || 0} active with classrooms
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Classrooms</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E65FA] flex items-center justify-center text-sm font-black">🏫</span>
          </div>
          <div className="text-3xl font-black text-[#1E65FA]">{summary.totalClassrooms || 0}</div>
          <div className="text-[11px] text-slate-400 font-bold mt-1">
            Across registered teachers
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Enrolled Students</span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-black">🎓</span>
          </div>
          <div className="text-3xl font-black text-purple-700">{summary.totalEnrollments || 0}</div>
          <div className="text-[11px] text-purple-600 font-bold mt-1">
            {summary.totalUniqueStudents || 0} unique students
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Class Size</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-black">📊</span>
          </div>
          <div className="text-3xl font-black text-amber-600">{summary.avgStudentsPerClassroom || 0}</div>
          <div className="text-[11px] text-slate-400 font-bold mt-1">
            Students / classroom
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teacher by name, phone, email, school, or class code..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Status Filter */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="all">All Teachers ({data.teachers?.length || 0})</option>
            <option value="has_classrooms">With Classrooms ({summary.activeTeachersCount || 0})</option>
            <option value="no_classrooms">Without Classrooms ({(summary.totalTeachers || 0) - (summary.activeTeachersCount || 0)})</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="most_classrooms">Sort: Most Classrooms</option>
            <option value="most_students">Sort: Most Students</option>
            <option value="name">Sort: Alphabetical</option>
            <option value="recent">Sort: Recently Joined</option>
          </select>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={fetchAnalytics} className="underline hover:text-red-900 ml-4">Retry</button>
        </div>
      )}

      {/* Teacher Cards / Table */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading teacher analytics...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8">
          <span className="text-4xl">👨‍🏫</span>
          <h4 className="text-base font-black text-slate-800 mt-3 mb-1">No Teachers Found</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? `No teachers match "${searchQuery}". Try a different keyword.`
              : 'No teachers registered yet. You can assign the Teacher role to any user in User Analytics.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTeachers.map((item) => {
            const t = item.teacher || {};
            const isExpanded = expandedTeacherIds.has(t._id);
            const classrooms = item.classrooms || [];

            return (
              <div
                key={t._id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
              >
                {/* Teacher Summary Header Row */}
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Avatar & Profile Info */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                      {(t.name || t.username || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <h3 className="text-base font-black text-slate-900 leading-tight">
                          {t.name || 'Unnamed Teacher'}
                        </h3>
                        <span className="px-2 py-0.5 bg-blue-50 text-[#1E65FA] border border-blue-200 rounded-md text-[10px] font-black uppercase tracking-wider">
                          @{t.username || 'unknown'}
                        </span>
                        {t.role === 'admin' && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-black uppercase tracking-wider">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        {t.phone && (
                          <span className="flex items-center gap-1">
                            <span>📞</span>
                            <a href={`tel:${t.phone}`} className="hover:text-indigo-600 font-semibold">{t.phone}</a>
                          </span>
                        )}
                        {t.email && (
                          <span className="flex items-center gap-1">
                            <span>✉️</span>
                            <span className="truncate max-w-[200px]">{t.email}</span>
                          </span>
                        )}
                        {t.school && (
                          <span className="flex items-center gap-1 text-slate-700">
                            <span>🏫</span>
                            <strong className="truncate max-w-[240px]">{t.school}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics & Expand Action */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 self-stretch sm:self-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    {/* Classrooms Badge */}
                    <div className="px-3.5 py-2 bg-blue-50/70 border border-blue-200 rounded-xl text-center min-w-[90px]">
                      <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider block">Classrooms</span>
                      <strong className="text-base font-black text-blue-900">{item.classroomsCount}</strong>
                    </div>

                    {/* Students Badge */}
                    <div className="px-3.5 py-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center min-w-[90px]">
                      <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider block">Students</span>
                      <strong className="text-base font-black text-emerald-900">{item.totalStudentsCount}</strong>
                    </div>

                    {/* Expand/Collapse Classrooms Button */}
                    <button
                      onClick={() => toggleTeacherExpand(t._id)}
                      className={`px-4 py-2 text-xs font-black rounded-xl border transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                        isExpanded
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      <span>{isExpanded ? 'Hide Classrooms' : `View Classrooms (${item.classroomsCount})`}</span>
                      <span>{isExpanded ? '▲' : '▼'}</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Classrooms List */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-200 p-5 sm:p-6 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Classrooms managed by {t.name || t.username} ({classrooms.length})
                      </h4>
                      <span className="text-xs text-slate-400 font-medium">
                        Joined on {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    {classrooms.length === 0 ? (
                      <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 font-medium">
                        This teacher has not created any classrooms yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {classrooms.map((c) => {
                          const isClassExpanded = expandedClassroomIds.has(c._id);
                          const students = c.students || [];

                          return (
                            <div
                              key={c._id}
                              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow"
                            >
                              {/* Classroom Header */}
                              <div className="flex items-start justify-between gap-3 mb-2.5">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="text-sm font-black text-slate-900">{c.name}</h5>
                                    <span className="px-2 py-0.5 bg-blue-50 text-[#1E65FA] rounded-md text-[10px] font-bold">
                                      Class {c.classLevel || 'General'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 font-medium">
                                    {c.school || 'School not specified'}
                                  </p>
                                </div>

                                {/* Join Code Pill */}
                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                                  <span className="font-mono text-xs font-black text-indigo-700 select-all">
                                    {c.code}
                                  </span>
                                  <button
                                    onClick={() => handleCopyCode(c.code)}
                                    className="text-[10px] font-bold text-slate-500 hover:text-slate-900"
                                    title="Copy Code"
                                  >
                                    {copiedCode === c.code ? '✔' : '📋'}
                                  </button>
                                </div>
                              </div>

                              {/* Classroom Stats */}
                              <div className="grid grid-cols-2 gap-2 text-center text-xs my-3">
                                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Students</span>
                                  <strong className="text-slate-900 text-sm font-black">{c.studentCount || 0}</strong>
                                </div>
                                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Assignments</span>
                                  <strong className="text-indigo-600 text-sm font-black">{c.assignmentsCount || 0}</strong>
                                </div>
                              </div>

                              {/* Toggle Student Roster */}
                              {students.length > 0 && (
                                <button
                                  onClick={() => toggleClassroomExpand(c._id)}
                                  className="w-full text-center text-[11px] font-bold text-indigo-600 hover:text-indigo-800 py-1.5 bg-indigo-50/50 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                  {isClassExpanded ? '▲ Hide Student Roster' : `▼ View Student Roster (${students.length})`}
                                </button>
                              )}

                              {/* Student Roster List */}
                              {isClassExpanded && students.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100 max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                  {students.map((s, idx) => (
                                    <div
                                      key={s._id || idx}
                                      className="flex items-center justify-between text-xs py-1 px-2 rounded-md bg-slate-50 border border-slate-100"
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                                        <strong className="text-slate-800 truncate">{s.name || s.username || 'Student'}</strong>
                                        {s.phone && (
                                          <span className="text-[10px] text-slate-400">({s.phone})</span>
                                        )}
                                      </div>
                                      <span className="text-[11px] font-black text-amber-600 shrink-0 ml-2">
                                        ⭐ {s.totalPoints || 0}
                                      </span>
                                    </div>
                                  ))}
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherClassroomAnalytics;
