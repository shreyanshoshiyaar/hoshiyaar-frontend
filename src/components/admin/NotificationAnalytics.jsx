import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { getApiBase } from '../../utils/apiBase';

const TYPE_CONFIG = {
  daily_mass: { label: 'Daily Mass (5 PM)', color: '#3B82F6' },
  streak_risk: { label: 'Streak Risk (8 PM)', color: '#EF4444' },
  inactivity_nudge: { label: 'Inactivity Nudge', color: '#F59E0B' },
  rank_drop: { label: 'Rank Drop', color: '#EC4899' },
  chapter_promo: { label: 'Chapter Promo', color: '#10B981' },
  manual_nudge: { label: 'Manual Nudge', color: '#8B5CF6' },
  unknown: { label: 'Other', color: '#94A3B8' }
};

export default function NotificationAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  const fetchAnalytics = async (selectedDays = days) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBase()}/api/admin/notification-analytics?days=${selectedDays}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notification analytics');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(days);
  }, [days]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>🔔</span> Firebase Notification Click Analytics
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Day-wise count of users opening the app by clicking push notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDays(7)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${days === 7 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDays(30)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${days === 30 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => fetchAnalytics(days)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-xl transition-all"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold">Loading notification analytics...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Clicks ({days}d)</span>
              <div className="text-3xl font-black text-slate-800 mt-2">{data?.totalClicks || 0}</div>
              <span className="text-[11px] text-slate-400 mt-1">App opens via push notification</span>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last 7 Days</span>
              <div className="text-3xl font-black text-indigo-600 mt-2">{data?.last7Total || 0}</div>
              <span className="text-[11px] text-slate-400 mt-1">Active weekly response</span>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Mass Clicks</span>
              <div className="text-3xl font-black text-blue-600 mt-2">{data?.typeBreakdown?.daily_mass || 0}</div>
              <span className="text-[11px] text-slate-400 mt-1">5 PM mass reminder</span>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Streak Risk Clicks</span>
              <div className="text-3xl font-black text-rose-500 mt-2">{data?.typeBreakdown?.streak_risk || 0}</div>
              <span className="text-[11px] text-slate-400 mt-1">8 PM urgency alerts</span>
            </div>
          </div>

          {/* Day-wise Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">
                Day-Wise Notification Clicks
              </h3>
              <span className="text-xs text-slate-400 font-medium">Stacked by Type</span>
            </div>

            {(!data?.timeline || data.timeline.length === 0 || data.totalClicks === 0) ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <span className="text-3xl block mb-2">📊</span>
                No notification click records yet. Clicks will populate as users open the app through Firebase notifications.
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={{ stroke: '#CBD5E1' }}
                      tickFormatter={(d) => {
                        const parts = d.split('-');
                        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
                      }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '0.75rem',
                        border: 'none',
                        color: '#FFF',
                        fontSize: '12px'
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(val) => TYPE_CONFIG[val]?.label || val}
                    />
                    {Object.keys(TYPE_CONFIG).map((key) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        name={key}
                        stackId="a"
                        fill={TYPE_CONFIG[key].color}
                        radius={[0, 0, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Breakdown Table by Type */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              Clicks Breakdown by Notification Type
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="pb-3">Notification Type</th>
                    <th className="pb-3">Clicks ({days}d)</th>
                    <th className="pb-3">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                    const count = data?.typeBreakdown?.[key] || 0;
                    const pct = data?.totalClicks > 0 ? Math.round((count / data.totalClicks) * 100) : 0;
                    return (
                      <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }}></span>
                          <span className="font-semibold text-slate-700">{config.label}</span>
                        </td>
                        <td className="py-3 font-bold text-slate-900">{count}</td>
                        <td className="py-3 text-slate-500 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: config.color }}></div>
                            </div>
                            <span className="text-xs">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
