import React, { useEffect, useMemo, useState } from 'react';
import pointsService from '../../services/pointsService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend
} from 'recharts';

export default function ProgressPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({ totalPoints: 0, timeSeries: [], byChapter: [], byModule: [] });
  const [selectedChapter, setSelectedChapter] = useState('');

  useEffect(() => {
    (async () => {
      if (!user?._id) return;
      setLoading(true);
      setError('');
      try {
        const { data } = await pointsService.summary({ userId: user._id, days: 30 });
        setData({
          totalPoints: Number(data?.totalPoints || 0),
          timeSeries: Array.isArray(data?.timeSeries) ? data.timeSeries : [],
          byChapter: Array.isArray(data?.byChapter) ? data.byChapter : [],
          byModule: Array.isArray(data?.byModule) ? data.byModule : [],
        });
      } catch (e) {
        setError('Failed to load progress');
      }
      setLoading(false);
    })();
  }, [user?._id]);

  const filteredModules = useMemo(() => {
    // In current schema, byModule has moduleId, no chapter mapping; we show all for now
    return data.byModule;
  }, [data.byModule, selectedChapter]);

  if (loading) return <div className="p-4">Loading progress…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-blue-200 p-4 bg-white/70 backdrop-blur-sm">
        <div className="flex items-baseline justify-between">
          <h3 className="text-xl font-extrabold text-blue-700">Overview</h3>
          <div className="text-sm text-gray-600">Last 30 days</div>
        </div>
        <div className="mt-2 text-3xl font-extrabold">{data.totalPoints} pts</div>
        <div className="mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.timeSeries} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" hide />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="points" stroke="#2563eb" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-blue-200 p-4 bg-white/70 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-blue-700">Points by Module</h3>
        </div>
        <div className="mt-3 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredModules} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="moduleId" hide />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="points" name="Points" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}


