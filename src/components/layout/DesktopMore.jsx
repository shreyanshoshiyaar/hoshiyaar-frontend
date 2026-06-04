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

const DesktopMore = ({ stars, weeklyStars }) => {
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

        const summaryRes = await authService.getSummary({ userId: user._id, days: 7 });
        if (summaryRes?.data?.timeSeries) {
          const formatted = summaryRes.data.timeSeries.map(item => ({
            name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
            stars: item.points
          }));
          
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

      const isAcademicChanged = form.board !== user.board || String(form.classLevel) !== String(user.classLevel);

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

      if (isAcademicChanged) {
         updateData.subject = '';
         updateData.chapter = '';
         updateData.subjectId = null;
         updateData.chapterId = null;
      }

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
        <div className="bg-white border border-blue-100 p-2 rounded-lg shadow-md">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
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
    <div className="w-full h-full bg-[#F8FAFC] flex flex-col items-center overflow-y-auto p-4 lg:p-6 no-scrollbar relative">
      <div className="w-full max-w-6xl flex flex-col h-full gap-4">
        
        {/* Header */}
        <div className="flex items-center gap-4 bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 shrink-0">
           <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">⚙️</div>
           <div>
             <h1 className="text-xl font-black text-gray-800">Settings & Profile</h1>
             <p className="text-gray-500 font-bold text-xs mt-0.5">Manage your account details and view your progress.</p>
           </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          
          {/* Left Column: Form Settings */}
          <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto no-scrollbar">
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 shrink-0">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-gray-50 border border-transparent rounded-lg p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-gray-50 border border-transparent rounded-lg p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Phone</label>
                  <input 
                    type="tel" 
                    value={form.phone}
                    onChange={e => update('phone', e.target.value)}
                    placeholder="Phone"
                    className="w-full bg-gray-50 border border-transparent rounded-lg p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Date of Birth</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={form.dateOfBirth}
                      onChange={handleDobChange}
                      placeholder="DD/MM/YYYY"
                      className="w-full bg-gray-50 border border-transparent rounded-lg p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all pr-8"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 shrink-0">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4">Academic Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">School Name</label>
                  <input 
                    type="text" 
                    value={form.school}
                    onChange={e => update('school', e.target.value)}
                    placeholder="Enter your school"
                    className="w-full bg-gray-50 border border-transparent rounded-lg p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Board</label>
                  <select
                    value={form.board}
                    onChange={e => update('board', e.target.value)}
                    className="w-full bg-gray-50 border border-transparent rounded-lg p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer"
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
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Class</label>
                  <select
                    value={form.classLevel}
                    onChange={e => update('classLevel', e.target.value)}
                    className="w-full bg-gray-50 border border-transparent rounded-lg p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select Class</option>
                    {['6', '7', '8'].map(c => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Save Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-blue-50 rounded-2xl p-4 border border-blue-100 shrink-0">
               <div className="flex flex-col flex-1">
                 {saveSuccess && <span className="text-green-600 font-bold text-xs mb-0.5">Profile updated successfully! ✨</span>}
                 {error && <span className="text-red-500 font-bold text-xs mb-0.5">{error}</span>}
                 {!saveSuccess && !error && <span className="text-blue-800 font-bold text-xs">Don't forget to save your changes</span>}
               </div>
               <button 
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm transition-all active:scale-[0.98] ${saving ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {saving ? 'Updating...' : 'Save Profile'}
                </button>
            </div>
          </div>

          {/* Right Column: Graphs & Extra Actions */}
          <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col h-48 shrink-0">
               <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Star Progress (7 Days)</h3>
               <div className="flex-1 w-full -ml-4 mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData}>
                    <defs>
                      <linearGradient id="colorStarsDesktop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fontWeight: 700, fill: '#94A3B8'}}
                      dy={5}
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="stars" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorStarsDesktop)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden shrink-0">
               <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                 <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Account Actions</h3>
               </div>
               <div className="p-1 flex flex-col">
                 {(user?.role === 'admin' || user?.role === 'master' || user?.username === 'Host' || user?.username === 'hostcbse') && (
                   <button 
                    onClick={() => navigate('/admin')}
                    className="px-4 py-2.5 text-left font-bold text-xs text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-between"
                  >
                    Admin Dashboard
                    <span className="text-blue-400">›</span>
                  </button>
                 )}
                 <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to logout?')) {
                      logout();
                      window.location.href = '/';
                    }
                  }}
                  className="px-4 py-2.5 text-left font-bold text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between"
                >
                  Log out
                  <span className="text-gray-400">›</span>
                </button>
                 <button 
                  onClick={async () => {
                    if (window.confirm('WARNING: Are you sure you want to PERMANENTLY DELETE your account? This action cannot be undone and all your progress will be lost.')) {
                      try {
                        setSaving(true);
                        await authService.deleteAccount(user._id);
                        logout();
                        window.location.href = '/';
                      } catch (err) {
                        setError('Failed to delete account. Please try again.');
                        setSaving(false);
                      }
                    }
                  }}
                  className="px-4 py-2.5 text-left font-bold text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5 flex items-center justify-between"
                >
                  Delete Account
                  <span className="text-red-300">›</span>
                </button>
               </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden shrink-0">
               <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                 <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Legal</h3>
               </div>
               <div className="p-1 flex flex-col">
                 <button onClick={() => navigate('/blogs')} className="px-4 py-2 text-left font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-xs">Blogs & Articles</button>
                 <button onClick={() => navigate('/privacy-policy')} className="px-4 py-2 text-left font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-xs">Privacy Policy</button>
                 <button onClick={() => navigate('/terms-conditions')} className="px-4 py-2 text-left font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-xs">Terms & Conditions</button>
                 <button onClick={() => window.location.href = 'mailto:cg.hoshiyaar@gmail.com'} className="px-4 py-2 text-left font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs mt-1 border border-blue-50">Contact Support</button>
               </div>
            </div>
            
            <div className="py-2 text-center opacity-30 mt-auto shrink-0">
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Hoshiyaar Academy v5.1</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default React.memo(DesktopMore);
