import React, { useState, useEffect } from 'react';
import api from '../../services/apiClient';

const AiExamAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState(null);

  // Config form state
  const [config, setConfig] = useState({
    maxChaptersPerWeek: 3,
    maxAttemptsPerChapterPerWeek: 3,
    exhaustedMessage: '',
    chapterExhaustedMessage: '',
    enabled: true
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');

  const fetchAnalytics = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/ai/analytics?page=${pageNumber}&limit=15`);
      if (res.data) {
        setAnalytics(res.data);
        if (res.data.config) {
          setConfig(res.data.config);
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(page);
  }, [page]);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      setConfigSuccess('');
      const res = await api.post('/api/ai/config', config);
      if (res.data?.success) {
        setConfigSuccess('Weekly limits updated successfully!');
        setTimeout(() => setConfigSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Failed to update config:', err);
      alert('Failed to save settings: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const summary = analytics?.summary || {};

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800">AI Exam Mode Analytics & Control</h2>
          <p className="text-xs font-semibold text-gray-500">Monitor AI credit consumption, session audits, and dynamic weekly limits.</p>
        </div>
        <button
          onClick={() => fetchAnalytics(page)}
          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh Data
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm">
          <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">AI Tokens Consumed</span>
          <div className="text-3xl font-black text-indigo-600 mt-1">
            {summary.totalTokens ? summary.totalTokens.toLocaleString() : '0'}
          </div>
          <div className="text-[11px] font-semibold text-gray-400 mt-1">
            Today: <strong className="text-indigo-600">{summary.todayTokens ? summary.todayTokens.toLocaleString() : 0}</strong> • Week: <strong className="text-indigo-600">{summary.weekTokens ? summary.weekTokens.toLocaleString() : 0}</strong>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm">
          <span className="text-[10px] font-black uppercase text-purple-500 tracking-wider">AI Questions Graded</span>
          <div className="text-3xl font-black text-gray-800 mt-1">{summary.totalCredits || 0}</div>
          <div className="text-[11px] font-semibold text-gray-400 mt-1">
            Today: <strong className="text-purple-600">{summary.todayCredits || 0}</strong> • Sessions: <strong className="text-purple-600">{summary.totalSessions || 0}</strong>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
          <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Average Score</span>
          <div className="text-3xl font-black text-emerald-600 mt-1">{summary.avgScore || 0}%</div>
          <div className="text-[11px] font-semibold text-gray-400 mt-1">Across all evaluated exams</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
          <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider">Unique Students</span>
          <div className="text-3xl font-black text-gray-800 mt-1">{summary.totalUniqueUsers || 0}</div>
          <div className="text-[11px] font-semibold text-gray-400 mt-1">Tested with AI evaluation</div>
        </div>
      </div>

      {/* Backend Dynamic Limits Configuration Form */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div>
            <h3 className="text-lg font-black text-gray-800">Weekly Attempt Limits (Live Backend Config)</h3>
            <p className="text-xs text-gray-500">Changes take effect immediately without requiring users to update the app.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600">Limit Enforced:</span>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {configSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            {configSuccess}
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Max Chapters Per Week</label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.maxChaptersPerWeek}
              onChange={(e) => setConfig({ ...config, maxChaptersPerWeek: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-sm focus:border-indigo-500 outline-none"
            />
            <span className="text-[10px] text-gray-400">Total number of distinct chapters a student can attempt per week.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Max Attempts Per Chapter Per Week</label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.maxAttemptsPerChapterPerWeek}
              onChange={(e) => setConfig({ ...config, maxAttemptsPerChapterPerWeek: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-sm focus:border-indigo-500 outline-none"
            />
            <span className="text-[10px] text-gray-400">How many times a student can attempt the same chapter's exam in one week.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Weekly Limit Exhausted Message</label>
            <textarea
              rows="2"
              value={config.exhaustedMessage}
              onChange={(e) => setConfig({ ...config, exhaustedMessage: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Chapter Limit Exhausted Message</label>
            <textarea
              rows="2"
              value={config.chapterExhaustedMessage}
              onChange={(e) => setConfig({ ...config, chapterExhaustedMessage: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="md:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingConfig}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {savingConfig ? 'Saving...' : 'Save Weekly Limits'}
            </button>
          </div>
        </form>
      </div>

      {/* Chapter Performance Breakdown */}
      {analytics?.chapterBreakdown?.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm overflow-hidden">
          <h3 className="text-lg font-black text-gray-800 mb-4">Chapter-wise Exam Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-black uppercase tracking-wider border-b">
                <tr>
                  <th className="p-3">Chapter</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3 text-center">Total Attempts</th>
                  <th className="p-3 text-center">Avg Score</th>
                  <th className="p-3 text-center">Avg Time</th>
                  <th className="p-3 text-center">AI Questions Graded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                {analytics.chapterBreakdown.map((ch, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/70">
                    <td className="p-3 text-gray-900">{ch.chapterTitle || `Chapter ${ch._id}`}</td>
                    <td className="p-3 text-gray-500">{ch.subject || 'Science'}</td>
                    <td className="p-3 text-center">{ch.totalAttempts}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                        ch.avgScore >= 75 ? 'bg-green-100 text-green-800' : ch.avgScore >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(ch.avgScore)}%
                      </span>
                    </td>
                    <td className="p-3 text-center text-gray-500">{Math.round((ch.avgTimeSpent || 0) / 60)} mins</td>
                    <td className="p-3 text-center text-indigo-600">{ch.totalCredits || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Session-Wise Audit Logs */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm overflow-hidden">
        <h3 className="text-lg font-black text-gray-800 mb-4">Recent AI Exam Sessions</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-black uppercase tracking-wider border-b">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Chapter</th>
                <th className="p-3 text-center">Score</th>
                <th className="p-3 text-center">Attempt #</th>
                <th className="p-3 text-center">AI Questions</th>
                <th className="p-3 text-center">Tokens</th>
                <th className="p-3">Time</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
              {analytics?.sessions?.map((session) => {
                const userDisplay = session.userId?.name || session.userInfo?.name || session.userInfo?.username || 'Guest';
                const school = session.userId?.school || session.userInfo?.school || '';
                return (
                  <tr key={session._id} className="hover:bg-gray-50/70">
                    <td className="p-3">
                      <div className="text-gray-900">{userDisplay}</div>
                      {school && <div className="text-[10px] text-gray-400 font-normal truncate max-w-xs">{school}</div>}
                    </td>
                    <td className="p-3">
                      <div className="text-gray-900">{session.chapterTitle || `Chapter ${session.chapterId}`}</div>
                      <div className="text-[10px] text-gray-400">{session.subject}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        session.finalScore >= 75 ? 'bg-green-100 text-green-800' : session.finalScore >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {session.finalScore}%
                      </span>
                    </td>
                    <td className="p-3 text-center text-gray-600">#{session.attemptNumber || 1}</td>
                    <td className="p-3 text-center text-indigo-600">{session.aiCreditsUsed || 1}</td>
                    <td className="p-3 text-center text-gray-600 font-mono text-[11px]">{session.totalTokens ? session.totalTokens.toLocaleString() : '~'}</td>
                    <td className="p-3 text-gray-500 text-[11px] font-normal">
                      {new Date(session.createdAt).toLocaleDateString()} {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {analytics?.pagination?.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
            <span className="text-xs text-gray-500">
              Page {analytics.pagination.page} of {analytics.pagination.totalPages} ({analytics.pagination.total} total sessions)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= analytics.pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-800">
                  Exam Evaluation: {selectedSession.chapterTitle || `Chapter ${selectedSession.chapterId}`}
                </h3>
                <p className="text-xs text-gray-500">
                  Student: {selectedSession.userId?.name || selectedSession.userInfo?.name || 'Guest'} • Score: <strong className="text-indigo-600">{selectedSession.finalScore}%</strong> • Qs Evaluated: {selectedSession.aiCreditsUsed} • Tokens: <strong className="text-indigo-600">{selectedSession.totalTokens ? selectedSession.totalTokens.toLocaleString() : '~'}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedSession.questions?.map((q, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-gray-900">Q{idx + 1}. {q.question}</span>
                    <span className={`px-2 py-0.5 rounded-full font-black ${
                      q.score >= 75 ? 'bg-green-100 text-green-800' : q.score >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {q.score}/100
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-gray-100">
                    <span className="text-[10px] font-black uppercase text-gray-400">Student Answer:</span>
                    <p className="text-gray-800 font-semibold mt-0.5">{q.userAnswer || '(No answer provided)'}</p>
                  </div>

                  {q.right && (
                    <div className="text-emerald-700 bg-emerald-50 p-2 rounded-lg font-medium">
                      <strong>Right:</strong> {q.right}
                    </div>
                  )}

                  {q.missing && (
                    <div className="text-amber-700 bg-amber-50 p-2 rounded-lg font-medium">
                      <strong>Missing:</strong> {q.missing}
                    </div>
                  )}

                  {q.wrong && (
                    <div className="text-red-700 bg-red-50 p-2 rounded-lg font-medium">
                      <strong>Correction:</strong> {q.wrong}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiExamAnalytics;
