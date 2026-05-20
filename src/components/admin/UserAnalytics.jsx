import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import authService from '../../services/authService';

// Custom color palette for modern premium look
const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6'];

// Helper to format active minutes
const formatDuration = (mins) => {
  if (mins === 0) return '0 mins';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
};

// Helper for human-readable dates
const formatRelativeDate = (dateVal) => {
  if (!dateVal) return 'Never';
  const date = new Date(dateVal);
  const now = new Date();
  const diffMs = now - date;

  if (diffMs < 0 || isNaN(diffMs)) {
    return date.toLocaleDateString();
  }

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;

  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

// Detailed Row Component showing per-chapter performance
const UserProgressDetails = ({ chaptersProgress }) => {
  if (!chaptersProgress || chaptersProgress.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">
        No lesson progress or quiz activity has been logged yet for this student.
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shadow-inner">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        <span>📖 Detailed Learning & Performance Logs</span>
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chaptersProgress.map((ch, idx) => {
          const statsArray = ch.stats ? (ch.stats instanceof Map ? Array.from(ch.stats.entries()) : Object.entries(ch.stats)) : [];
          return (
            <div key={idx} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                      {ch.subject || 'Science'}
                    </span>
                    <h5 className="text-sm font-extrabold text-slate-800">Chapter {ch.chapter}</h5>
                  </div>
                  <div className="flex gap-1">
                    {ch.conceptCompleted && (
                      <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        Concept Done
                      </span>
                    )}
                    {ch.quizCompleted && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        Quiz Done
                      </span>
                    )}
                  </div>
                </div>

                {ch.completedModules && ch.completedModules.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider block mb-1">
                      COMPLETED MODULES
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {ch.completedModules.map((modId, mIdx) => (
                        <span
                          key={mIdx}
                          className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-medium border border-slate-200"
                        >
                          {modId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {statsArray.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider block">
                      LESSON SCORES & ACCURACY
                    </span>
                    {statsArray.map(([lessonTitle, stat]) => {
                      const total = stat.correct + stat.wrong;
                      const acc = total > 0 ? Math.round((stat.correct / total) * 100) : 0;
                      return (
                        <div
                          key={lessonTitle}
                          className="text-xs bg-slate-50 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between border border-slate-100 gap-2"
                        >
                          <div className="font-semibold text-slate-700 truncate max-w-[200px]" title={lessonTitle}>
                            {lessonTitle}
                          </div>
                          <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-[10px]">
                            <span className="text-slate-500">
                              Best: <strong className="text-indigo-600">{stat.bestScore}</strong>
                            </span>
                            <span className="flex items-center gap-1 font-bold">
                              <span className="text-green-600">✓{stat.correct}</span>
                              <span className="text-red-500">✗{stat.wrong}</span>
                            </span>
                            <span
                              className={`font-bold px-1.5 py-0.5 rounded-md text-[9px] ${
                                acc >= 80
                                  ? 'bg-green-100 text-green-800'
                                  : acc >= 50
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {acc}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic mt-2">
                    No individual lesson performance logs.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const UserAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [chartsData, setChartsData] = useState({
    gradeDistribution: [],
    schoolDistribution: [],
    activeTimeline: []
  });
  const [users, setUsers] = useState([]);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, registered, guest
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  const [filterAccuracy, setFilterAccuracy] = useState('all'); // all, high, med, low

  // Expanded user detail rows map
  const [expandedUsers, setExpandedUsers] = useState({});

  // Sorting state
  const [sortField, setSortField] = useState('lastActive');
  const [sortDirection, setSortDirection] = useState('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authService.getUsersAnalytics();
      if (response.data && response.data.success) {
        setStats(response.data.stats || {});
        setChartsData(response.data.chartsData || {});
        setUsers(response.data.users || []);
      } else {
        setError('Failed to load tracking data');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRow = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Get distinct schools list for dropdown filter
  const schoolOptions = useMemo(() => {
    const schools = new Set();
    users.forEach(u => {
      if (u.school && u.school !== 'Self Study / Individual') {
        schools.add(u.school);
      }
    });
    return Array.from(schools).sort();
  }, [users]);

  // Distinct grades list for dropdown filter
  const gradeOptions = useMemo(() => {
    const grades = new Set();
    users.forEach(u => {
      if (u.classLevel && u.classLevel !== 'Not Specified') {
        grades.add(u.classLevel);
      }
    });
    return Array.from(grades).sort();
  }, [users]);

  // Filtered and Sorted Users list
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        u =>
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.school && u.school.toLowerCase().includes(q))
      );
    }

    // Filter by type
    if (filterType === 'guest') {
      result = result.filter(u => u.isGuest);
    } else if (filterType === 'registered') {
      result = result.filter(u => !u.isGuest);
    }

    // Filter by grade
    if (filterGrade !== 'all') {
      result = result.filter(u => u.classLevel === filterGrade);
    }

    // Filter by school
    if (filterSchool !== 'all') {
      result = result.filter(u => u.school === filterSchool);
    }

    // Filter by accuracy
    if (filterAccuracy === 'high') {
      result = result.filter(u => u.accuracy >= 80);
    } else if (filterAccuracy === 'med') {
      result = result.filter(u => u.accuracy >= 50 && u.accuracy < 80);
    } else if (filterAccuracy === 'low') {
      result = result.filter(u => u.useTime > 0 && u.accuracy < 50);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle null/dates
      if (sortField === 'lastActive' || sortField === 'createdAt') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, search, filterType, filterGrade, filterSchool, filterAccuracy, sortField, sortDirection]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-sm font-bold text-gray-500">Loading student analytics & usage metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl font-medium text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* 1. Aggregated Cards Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Total Users */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Users</span>
            <span className="text-3xl font-black text-slate-800">{stats.totalUsers || 0}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-3 pt-2 border-t border-slate-50 flex justify-between">
            <span>👤 Active Accounts</span>
          </div>
        </div>

        {/* Guests vs Registered */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Registered Users</span>
            <span className="text-3xl font-black text-indigo-600">{stats.registeredCount || 0}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-3 pt-2 border-t border-slate-50 flex justify-between">
            <span>Guests: {stats.guestsCount || 0}</span>
          </div>
        </div>

        {/* Avg Points */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Avg Points</span>
            <span className="text-3xl font-black text-amber-500">{stats.avgPoints || 0}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-3 pt-2 border-t border-slate-50 flex justify-between">
            <span>⭐ Engagement Score</span>
          </div>
        </div>

        {/* Clustered Avg Time */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Avg Use Time</span>
            <span className="text-3xl font-black text-emerald-500">{formatDuration(stats.avgUseTime || 0)}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-3 pt-2 border-t border-slate-50 flex justify-between">
            <span>⏱️ Active Session Total</span>
          </div>
        </div>

        {/* Avg Accuracy */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Avg Accuracy</span>
            <span className={`text-3xl font-black ${stats.avgAccuracy >= 75 ? 'text-green-500' : stats.avgAccuracy >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
              {stats.avgAccuracy || 0}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-3 pt-2 border-t border-slate-50 flex justify-between">
            <span>🎯 Quiz Answer Rate</span>
          </div>
        </div>

        {/* Onboarding Rate */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Onboard Rate</span>
            <span className="text-3xl font-black text-purple-500">{stats.onboardingRate || 0}%</span>
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-3 pt-2 border-t border-slate-50 flex justify-between">
            <span>🚀 Profile Complete</span>
          </div>
        </div>
      </div>

      {/* 2. Visualizations and Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Usage & Signups Timeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-8 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-black text-slate-800">Signups & Active Users Timeline</h3>
            <p className="text-xs text-slate-400 font-medium">Daily registration signups compared to student activity over the last 30 days.</p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartsData.activeTimeline}>
                <defs>
                  <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    return parts.length > 2 ? `${parts[2]}/${parts[1]}` : val;
                  }}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Area type="monotone" dataKey="signups" name="New Signups" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSignups)" />
                <Area type="monotone" dataKey="activeUsers" name="Active Students" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorActive)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-1">Class Levels</h3>
            <p className="text-xs text-slate-400 font-medium mb-4">Breakdown of student counts by class grade level.</p>
          </div>
          <div className="h-[200px] w-full flex items-center justify-center">
            {chartsData.gradeDistribution && chartsData.gradeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartsData.gradeDistribution}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartsData.gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-sm italic text-gray-400">No grade data available.</span>
            )}
          </div>
          {/* Custom Legends */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600 max-h-[80px] overflow-y-auto">
            {chartsData.gradeDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                <span className="truncate">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Schools */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-black text-slate-800">Top Schools & Academic Institutions</h3>
          <p className="text-xs text-slate-400 font-medium">Ranked list of schools by total student enrollment count and average score metrics.</p>
        </div>
        <div className="h-[220px] w-full">
          {chartsData.schoolDistribution && chartsData.schoolDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.schoolDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#6366f1" tick={{ fontSize: 10, fontWeight: 600 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 10, fontWeight: 600 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Bar yAxisId="left" dataKey="count" name="Student Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="avgPoints" name="Avg Stars/Points" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center italic text-sm text-gray-400">
              No school distribution logs found.
            </div>
          )}
        </div>
      </div>

      {/* 3. Detailed User List & Searching */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar Header */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800">Student Logs & Individual Activity Tracking</h3>
              <p className="text-xs text-slate-400 font-medium">Comprehensive listing of all users, points milestones, active usage clustering and lesson progress.</p>
            </div>
            <div className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-lg self-start md:self-auto">
              Showing <strong className="text-slate-800">{filteredUsers.length}</strong> of {users.length} Students
            </div>
          </div>

          {/* Search and Filters grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search username, name, school..."
                className="w-full pl-3 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* User Type */}
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All User Types</option>
              <option value="registered">Registered Accounts Only</option>
              <option value="guest">Guest Profiles Only</option>
            </select>

            {/* School */}
            <select
              value={filterSchool}
              onChange={(e) => { setFilterSchool(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 truncate"
            >
              <option value="all">All Schools</option>
              <option value="Self Study / Individual">Individual / Self Study</option>
              {schoolOptions.map(sch => (
                <option key={sch} value={sch}>{sch}</option>
              ))}
            </select>

            {/* Grade Level */}
            <select
              value={filterGrade}
              onChange={(e) => { setFilterGrade(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All Grades</option>
              {gradeOptions.map(gr => (
                <option key={gr} value={gr}>Class {gr}</option>
              ))}
              <option value="Not Specified">Not Specified</option>
            </select>

            {/* Accuracy Rate */}
            <select
              value={filterAccuracy}
              onChange={(e) => { setFilterAccuracy(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All Performance Levels</option>
              <option value="high">High Accuracy (≥80%)</option>
              <option value="med">Moderate Accuracy (50% - 79%)</option>
              <option value="low">Needs Support (&lt;50% active)</option>
            </select>
          </div>
        </div>

        {/* Table Render */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-100">
                <th className="py-4 px-6 select-none cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('username')}>
                  Student Profile {sortField === 'username' ? (sortDirection === 'asc' ? '▴' : '▾') : ''}
                </th>
                <th className="py-4 px-5 select-none">Email</th>
                <th className="py-4 px-5 select-none">Phone</th>
                <th className="py-4 px-6 select-none cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('school')}>
                  School / Institution {sortField === 'school' ? (sortDirection === 'asc' ? '▴' : '▾') : ''}
                </th>
                <th className="py-4 px-4 text-center select-none cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('classLevel')}>
                  Class {sortField === 'classLevel' ? (sortDirection === 'asc' ? '▴' : '▾') : ''}
                </th>
                <th className="py-4 px-4 text-center select-none cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('totalPoints')}>
                  Stars/Points {sortField === 'totalPoints' ? (sortDirection === 'asc' ? '▴' : '▾') : ''}
                </th>
                <th className="py-4 px-4 text-center select-none cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('useTime')}>
                  Active Use Time {sortField === 'useTime' ? (sortDirection === 'asc' ? '▴' : '▾') : ''}
                </th>
                <th className="py-4 px-4 text-center select-none cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('accuracy')}>
                  Accuracy {sortField === 'accuracy' ? (sortDirection === 'asc' ? '▴' : '▾') : ''}
                </th>
                <th className="py-4 px-6 select-none cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('lastActive')}>
                  Last Active {sortField === 'lastActive' ? (sortDirection === 'asc' ? '▴' : '▾') : ''}
                </th>
                <th className="py-4 px-6 text-center">Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => {
                  const isExpanded = !!expandedUsers[user._id];
                  return (
                    <React.Fragment key={user._id}>
                      <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50/20' : ''}`}>
                        {/* Name Profile */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                              {user.username}
                              {user.isGuest ? (
                                <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                  Guest
                                </span>
                              ) : (
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                  Student
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">Name: {user.name}</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-5">
                          {user.email ? (
                            <a
                              href={`mailto:${user.email}`}
                              className="flex items-center gap-1.5 text-indigo-600 font-semibold hover:underline truncate max-w-[180px]"
                              title={user.email}
                            >
                              <span>✉</span>
                              <span className="truncate">{user.email}</span>
                            </a>
                          ) : (
                            <span className="text-slate-300 font-medium italic">No email</span>
                          )}
                        </td>

                        {/* Phone */}
                        <td className="py-4 px-5">
                          {user.phone ? (
                            <a
                              href={`tel:${user.phone}`}
                              className="flex items-center gap-1.5 text-emerald-600 font-semibold hover:underline"
                            >
                              <span>📞</span>
                              <span>{user.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-300 font-medium italic">No phone</span>
                          )}
                        </td>

                        {/* School */}
                        <td className="py-4 px-6 font-semibold text-slate-600">
                          {user.school}
                        </td>

                        {/* Grade */}
                        <td className="py-4 px-4 text-center font-bold text-slate-700">
                          {user.classLevel === 'Not Specified' ? '—' : `Class ${user.classLevel}`}
                        </td>

                        {/* Points */}
                        <td className="py-4 px-4 text-center">
                          <span className="font-black text-amber-500 bg-amber-50 border border-amber-200/50 px-2.5 py-1 rounded-lg inline-block text-xs font-mono">
                            ⭐ {user.totalPoints}
                          </span>
                        </td>

                        {/* Use Time */}
                        <td className="py-4 px-4 text-center font-bold font-mono text-slate-600 text-xs">
                          {formatDuration(user.useTime)}
                        </td>

                        {/* Accuracy */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`font-black font-mono text-xs px-2 py-1 rounded-lg border ${
                              user.useTime === 0
                                ? 'bg-slate-50 text-slate-400 border-slate-200/50'
                                : user.accuracy >= 80
                                ? 'bg-green-50 text-green-700 border-green-200/50'
                                : user.accuracy >= 50
                                ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                                : 'bg-red-50 text-red-700 border-red-200/50'
                            }`}
                          >
                            {user.useTime === 0 ? 'N/A' : `${user.accuracy}%`}
                          </span>
                        </td>

                        {/* Last Active */}
                        <td className="py-4 px-6 text-slate-500 font-semibold text-xs whitespace-nowrap">
                          {formatRelativeDate(user.lastActive)}
                        </td>

                        {/* Action Expand */}
                        <td className="py-4 px-6 text-center" style={{minWidth:'70px'}}>
                          <button
                            onClick={() => handleToggleRow(user._id)}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all duration-300 ${
                              isExpanded
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                            title="Toggle Performance logs"
                          >
                            {isExpanded ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Progress Logs Sub-Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className="py-4 px-8 bg-slate-50/40 border-t border-b border-slate-100">
                            <UserProgressDetails chaptersProgress={user.chaptersProgress} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 italic font-medium">
                    No students matched the search and filters query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-600 transition-all duration-200"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-600 transition-all duration-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAnalytics;
