import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient.js';
import SimpleLoading from '../ui/SimpleLoading.jsx';

export default function ReportManager() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, reviewed: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterCategory !== 'all') params.set('category', filterCategory);
      if (search.trim()) params.set('search', search.trim());

      const [resReports, resStats] = await Promise.all([
        apiClient.get(`/reports?${params.toString()}`),
        apiClient.get('/reports/stats')
      ]);

      if (resReports?.data?.data) {
        setReports(resReports.data.data);
      }
      if (resStats?.data?.stats) {
        setStats(resStats.data.stats);
      }
    } catch (err) {
      console.error('[ReportManager] Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterStatus, filterCategory]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    fetchReports();
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await apiClient.patch(`/reports/${id}/status`, { status: newStatus });
      setReports(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
      // Refresh stats
      const resStats = await apiClient.get('/reports/stats');
      if (resStats?.data?.stats) setStats(resStats.data.stats);
    } catch (err) {
      console.error('[ReportManager] Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await apiClient.delete(`/reports/${id}`);
      setReports(prev => prev.filter(r => r._id !== id));
      const resStats = await apiClient.get('/reports/stats');
      if (resStats?.data?.stats) setStats(resStats.data.stats);
    } catch (err) {
      console.error('[ReportManager] Failed to delete report:', err);
    }
  };

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'The answer is wrong':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Spelling or words':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Picture problem':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Sound problem':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 border border-emerald-300">✓ Resolved</span>;
      case 'reviewed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-700 border border-blue-300">👁 Reviewed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-700 border border-amber-300 animate-pulse">⏳ Pending</span>;
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🚩</span>
            <span>Question Problem Reports</span>
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Real-time student feedback, typo reports, wrong answers, and audio issues.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchReports}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 self-start cursor-pointer"
        >
          <span>↻</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Reports</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{stats.total}</span>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs flex flex-col">
          <span className="text-xs font-black text-amber-700 uppercase tracking-wider">Pending</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-800 mt-1">{stats.pending}</span>
        </div>
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-xs flex flex-col">
          <span className="text-xs font-black text-blue-700 uppercase tracking-wider">Reviewed</span>
          <span className="text-2xl sm:text-3xl font-black text-blue-800 mt-1">{stats.reviewed}</span>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs flex flex-col">
          <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Resolved</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">{stats.resolved}</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Screen ID, question, or student..."
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">⏳ Pending</option>
            <option value="reviewed">👁 Reviewed</option>
            <option value="resolved">✓ Resolved</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="The answer is wrong">The answer is wrong</option>
            <option value="Spelling or words">Spelling or words</option>
            <option value="Picture problem">Picture problem</option>
            <option value="Sound problem">Sound problem</option>
            <option value="Something else">Something else</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <SimpleLoading text="Loading student reports..." />
      ) : reports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-lg font-bold text-slate-800">No reports found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Everything looks clean! Try resetting the filters or checking back later.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => {
            const isUpdating = updatingId === report._id;
            const dateStr = new Date(report.createdAt).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div 
                key={report._id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                {/* Left: Info & Details */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-900 text-white rounded-lg shadow-2xs">
                      {report.itemId}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCategoryBadgeClass(report.category)}`}>
                      {report.category}
                    </span>
                    {getStatusBadge(report.status)}
                    <span className="text-[11px] text-slate-400 font-medium ml-auto md:ml-0">
                      {dateStr}
                    </span>
                  </div>

                  {report.questionText && (
                    <div className="text-sm font-semibold text-slate-800 line-clamp-2 mt-1">
                      <span className="text-slate-400 font-normal mr-1">Q:</span>
                      {report.questionText}
                    </div>
                  )}

                  {report.details && (
                    <div className="text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mt-1">
                      <span className="font-bold text-slate-700 mr-1">Student Note:</span>
                      "{report.details}"
                    </div>
                  )}

                  <div className="text-[11px] font-medium text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Reported by: <strong>{report.userName}</strong></span>
                    {report.userPhone && <span>• Phone: {report.userPhone}</span>}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex md:flex-col items-center md:items-end gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {report.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(report._id, 'resolved')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1"
                      >
                        ✓ Resolve
                      </button>
                    )}
                    {report.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(report._id, 'reviewed')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
                      >
                        Review
                      </button>
                    )}
                    {report.status === 'resolved' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(report._id, 'pending')}
                        disabled={isUpdating}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        Re-open
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(report._id)}
                      className="px-2.5 py-1.5 rounded-xl text-red-500 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
                      title="Delete report"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
