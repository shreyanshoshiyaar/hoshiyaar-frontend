import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService.js';
import curriculumService from '../../services/curriculumService';
import { CalendarIcon } from '../ui/Icons';
import SimpleLoading from '../ui/SimpleLoading.jsx';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const MobileMore = ({ stars, weeklyStars }) => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    board: '', 
    classLevel: '', 
    school: '', 
    dateOfBirth: '' 
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [graphData, setGraphData] = useState([]);
  const [boards, setBoards] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;
      try {
        // Fetch user details
        const userRes = await authService.getUser(user._id);
        const dbUser = userRes?.data || {};
        setForm({
          name: dbUser.name || '',
          email: dbUser.email || '',
          phone: dbUser.phone || '',
          board: dbUser.board || '',
          classLevel: dbUser.classLevel || '',
          school: dbUser.school || '',
          dateOfBirth: dbUser.dateOfBirth ? String(dbUser.dateOfBirth).slice(0, 10) : '',
        });

        // Fetch points summary for the graph
        const summaryRes = await authService.getSummary({ userId: user._id, days: 7 });
        if (summaryRes?.data?.timeSeries) {
          // Format data for Recharts: { name: 'Date', stars: 10 }
          const formatted = summaryRes.data.timeSeries.map(item => ({
            name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
            stars: item.points
          }));
          
          // Pad with last 7 days to ensure a full graph even if no data
          const padded = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const existing = formatted.find(f => f.name === dayName);
            padded.push(existing || { name: dayName, stars: 0 });
          }
          setGraphData(padded);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
        // Fallback to context
        setForm({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          board: user.board || '',
          classLevel: user.classLevel || '',
          school: user.school || '',
          dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchBoards = async () => {
      try {
        const res = await curriculumService.listBoards();
        setBoards(res.data || []);
      } catch (err) {
        console.error('Failed to fetch boards', err);
      }
    };

    fetchData();
    fetchBoards();
  }, [user]);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleDobChange = (e) => {
    let val = e.target.value;
    const isDeleting = val.length < (form.dateOfBirth?.length || 0);
    
    if (isDeleting) {
      update('dateOfBirth', val);
      return;
    }

    let cleaned = val.replace(/\D/g, '').slice(0, 8);
    let res = '';
    if (cleaned.length > 0) {
      res = cleaned.slice(0, 2);
      if (cleaned.length > 2) {
        res += '/' + cleaned.slice(2, 4);
        if (cleaned.length > 4) {
          res += '/' + cleaned.slice(4, 8);
        }
      }
    }
    update('dateOfBirth', res);
  };

  const handleSave = async () => {
    if (!user?._id) return;
    setSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      let dob = form.dateOfBirth;
      if (dob && /^\d{2}[/-]\d{2}[/-]\d{4}$/.test(dob)) {
        const [dd, mm, yyyy] = dob.split(/[/-]/);
        dob = `${yyyy}-${mm}-${dd}`;
      }

      const updateData = {
        userId: user._id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        board: form.board,
        classLevel: form.classLevel,
        school: form.school,
        dateOfBirth: dob || null,
      };

      const res = await authService.updateProfile(updateData);
      if (res.data && updateUser) {
        updateUser({ ...user, ...res.data });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md border border-blue-100 p-2 rounded-xl shadow-xl">
          <p className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest leading-none mb-1">{payload[0].payload.name}</p>
          <p className="text-sm font-black text-blue-600 flex items-center gap-1">
            {payload[0].value} <span className="text-xs">⭐</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) return <SimpleLoading />;

  return (
    <div className="flex-grow flex flex-col bg-[#F8FAFC] pb-24 overflow-y-auto no-scrollbar pt-20">
      {/* Settings Sections */}
      <div className="px-6 space-y-6">
        {/* Daily Progress Graph */}
        <div>
          <h3 className="text-sm font-black text-blue-900/40 uppercase tracking-widest ml-1 mb-3">Star Progress (Last 7 Days)</h3>
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 h-52 w-full flex flex-col overflow-hidden">
            <div className="flex-1 w-full -ml-8 -mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphData}>
                  <defs>
                    <linearGradient id="colorStars" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 800, fill: '#94A3B8'}}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="stars" 
                    stroke="#3B82F6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorStars)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black text-blue-900/40 uppercase tracking-widest ml-1 mb-3">Personal Information</h3>
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-wider ml-1">Full Name</label>
              <input 
                type="text" 
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-blue-50/30 border-2 border-blue-50 rounded-2xl p-3.5 text-sm font-bold text-blue-900 focus:outline-none focus:border-blue-200 transition-all"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-wider ml-1">Email Address</label>
              <input 
                type="email" 
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-blue-50/30 border-2 border-blue-50 rounded-2xl p-3.5 text-sm font-bold text-blue-900 focus:outline-none focus:border-blue-200 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-wider ml-1">Phone</label>
                <input 
                  type="tel" 
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                  placeholder="Phone"
                  className="w-full bg-blue-50/30 border-2 border-blue-50 rounded-2xl p-3.5 text-sm font-bold text-blue-900 focus:outline-none focus:border-blue-200 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-wider ml-1">Date of Birth</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={form.dateOfBirth}
                    onChange={handleDobChange}
                    placeholder="DD/MM/YYYY"
                    className="w-full bg-blue-50/30 border-2 border-blue-50 rounded-2xl p-3.5 text-sm font-bold text-blue-900 focus:outline-none focus:border-blue-200 transition-all pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CalendarIcon className="w-4 h-4 text-blue-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black text-blue-900/40 uppercase tracking-widest ml-1 mb-3">Academic Details</h3>
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 space-y-4">
             <div className="space-y-1.5">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-wider ml-1">School Name</label>
              <input 
                type="text" 
                value={form.school}
                onChange={e => update('school', e.target.value)}
                placeholder="Enter your school"
                className="w-full bg-blue-50/30 border-2 border-blue-50 rounded-2xl p-3.5 text-sm font-bold text-blue-900 focus:outline-none focus:border-blue-200 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-wider ml-1">Board</label>
                <select
                  value={form.board}
                  onChange={e => update('board', e.target.value)}
                  className="w-full bg-blue-50/30 border-2 border-blue-50 rounded-2xl p-3.5 text-sm font-bold text-blue-900 focus:outline-none focus:border-blue-200 transition-all appearance-none"
                >
                  <option value="" disabled>Select Board</option>
                  {boards.map(b => (
                    <option key={b._id} value={b.name}>{b.name}</option>
                  ))}
                  {!boards.some(b => b.name === form.board) && form.board && (
                    <option value={form.board}>{form.board}</option>
                  )}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-wider ml-1">Class</label>
                <select
                  value={form.classLevel}
                  onChange={e => update('classLevel', e.target.value)}
                  className="w-full bg-blue-50/30 border-2 border-blue-50 rounded-2xl p-3.5 text-sm font-bold text-blue-900 focus:outline-none focus:border-blue-200 transition-all appearance-none"
                >
                  <option value="" disabled>Select Class</option>
                  {['6', '7', '8'].map(c => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 space-y-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-4 rounded-[24px] text-sm font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] ${saving ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'}`}
          >
            {saving ? 'Updating Profile...' : 'Save Changes'}
          </button>

          {saveSuccess && (
            <p className="text-center text-xs font-black text-green-500 uppercase animate-bounce">Profile Updated Successfully! ✨</p>
          )}
          {error && (
            <p className="text-center text-xs font-black text-red-500 uppercase">{error}</p>
          )}

          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                logout();
                window.location.href = '/';
              }
            }}
            className="w-full py-4 rounded-[24px] text-sm font-black uppercase tracking-widest text-red-500 border-2 border-red-50 hover:bg-red-50 transition-all active:scale-[0.98]"
          >
            Logout
          </button>
        </div>

        {/* Legal Section */}
        <div>
          <h3 className="text-sm font-black text-blue-900/40 uppercase tracking-widest ml-1 mb-3">Legal & Support</h3>
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 divide-y divide-gray-50">
            <button 
              onClick={() => navigate('/blogs')}
              className="w-full flex items-center justify-between p-4 hover:bg-blue-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-blue-900">Blogs & Articles</span>
              </div>
              <svg className="w-4 h-4 text-blue-200 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button 
              onClick={() => navigate('/privacy-policy')}
              className="w-full flex items-center justify-between p-4 hover:bg-blue-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-blue-900">Privacy Policy</span>
              </div>
              <svg className="w-4 h-4 text-blue-200 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button 
              onClick={() => navigate('/terms-conditions')}
              className="w-full flex items-center justify-between p-4 hover:bg-blue-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-blue-900">Terms & Conditions</span>
              </div>
              <svg className="w-4 h-4 text-blue-200 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button 
              onClick={() => window.location.href = 'mailto:support@hoshiyaar.info'}
              className="w-full flex items-center justify-between p-4 hover:bg-blue-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-blue-900">Contact Support</span>
              </div>
              <svg className="w-4 h-4 text-blue-200 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Branding Footer */}
        <div className="py-8 text-center opacity-20">
          <p className="text-[10px] font-black text-blue-900 uppercase tracking-[0.3em]">Hoshiyaar Academy v5.1</p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MobileMore);
