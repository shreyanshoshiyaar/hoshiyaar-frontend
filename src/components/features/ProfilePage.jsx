import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import authService from '../../services/authService.js';
import heroChar from '../../assets/images/heroChar.png';
import BackButton from '../ui/BackButton.jsx';
import ProgressPanel from './ProgressPanel.jsx';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ username: '', name: '', email: '', phone: '', board: '', classLevel: '', school: '', age: '', dateOfBirth: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [mascotSrc, setMascotSrc] = useState(heroChar);
  const [usernameStatus, setUsernameStatus] = useState('');

  // Fetch user details from DB (ignore subject/chapter), fallback to 'Not Defined' where absent
  useEffect(() => {
    const load = async () => {
      if (!user?._id) return;
      try {
        const res = await authService.getUser(user._id);
        const dbUser = res?.data || {};
        setForm({
          username: (dbUser.username ?? ''),
          name: (dbUser.name ?? 'Not Defined'),
          email: (dbUser.email ?? 'Not Defined'),
          phone: (dbUser.phone ?? 'Not Defined'),
          board: (dbUser.board ?? 'Not Defined'),
          classLevel: (dbUser.classLevel ?? 'Not Defined'),
          school: (dbUser.school ?? 'Not Defined'),
          age: (dbUser.age ?? 'Not Defined'),
          dateOfBirth: dbUser.dateOfBirth ? String(dbUser.dateOfBirth).slice(0,10) : 'Not Defined',
        });
      } catch (_) {
        // Fallback to auth context if fetch fails
        setForm({
          username: (user?.username ?? ''),
          name: (user?.name ?? 'Not Defined'),
          email: (user?.email ?? 'Not Defined'),
          phone: (user?.phone ?? 'Not Defined'),
          board: (user?.board ?? 'Not Defined'),
          classLevel: (user?.classLevel ?? 'Not Defined'),
          school: (user?.school ?? 'Not Defined'),
          age: (user?.age ?? 'Not Defined'),
          dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).slice(0,10) : 'Not Defined',
        });
      }
    };
    load();
  }, [user]);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!user?._id) return;
    setSaving(true);
    setSaveError('');
    try {
      // Normalize date to YYYY-MM-DD if user agent produced DD-MM-YYYY
      let dob = form.dateOfBirth;
      if (dob && dob !== 'Not Defined') {
        // Accept values like '30-10-2025' and convert to '2025-10-30'
        if (/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
          const [dd, mm, yyyy] = dob.split('-');
          dob = `${yyyy}-${mm}-${dd}`;
        }
      } else {
        dob = null;
      }
      await authService.updateProfile({
        userId: user._id,
        username: form.username || undefined,
        board: form.board === 'Not Defined' ? null : form.board,
        subject: user.subject,
        chapter: user.chapter,
        name: form.name === 'Not Defined' ? null : form.name,
        phone: form.phone === 'Not Defined' ? null : form.phone,
        classLevel: form.classLevel === 'Not Defined' ? null : form.classLevel,
        school: form.school === 'Not Defined' ? null : form.school,
        dateOfBirth: dob,
        email: form.email === 'Not Defined' ? null : form.email,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Update failed. Please try again.';
      setSaveError(msg);
      console.error('Profile update failed', e?.response?.data || e?.message);
    }
    setSaving(false);
  };

  const handleLogout = () => {
    try { logout?.(); } catch (_) {}
    try { window.location.href = '/'; } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F2FF] to-[#F7FBFF] py-4 px-6 relative overflow-y-auto">
      <style>{`
        /* Thin scrollbar with transparent track and colored thumb */
        .transparent-scroll { scrollbar-width: thin; scrollbar-color: rgba(37,99,235,0.6) transparent; }
        .transparent-scroll::-webkit-scrollbar { width: 6px; }
        .transparent-scroll::-webkit-scrollbar-track { background: transparent; }
        .transparent-scroll::-webkit-scrollbar-thumb { background-color: rgba(37,99,235,0.6); border-radius: 8px; }
        .transparent-scroll::-webkit-scrollbar-thumb:hover { background-color: rgba(37,99,235,0.8); }
      `}</style>
      <BackButton className="fixed left-6 top-6 z-10" />
      {/* Header */}
      <div className="max-w-6xl mx-auto mt-16 mb-4 flex items-center justify-between px-1">
        <h1 className="text-3xl font-extrabold text-blue-700">Edit Profile</h1>
        <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-red-500 text-white font-extrabold">Logout</button>
      </div>
      {/* Two side-by-side cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Details card */}
        <div className="bg-white border-2 border-blue-200 rounded-2xl shadow-lg p-6 sm:p-8 lg:col-span-5 max-h-[calc(100vh-180px)] overflow-auto transparent-scroll">
          <h2 className="text-2xl font-extrabold text-blue-700 mb-4">Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="block">
            <span className="text-sm font-bold text-gray-700">Username</span>
            <input placeholder={form.username || 'Choose a unique username'} value={form.username} readOnly className="mt-1 w-full px-4 py-3 rounded-2xl border-2 bg-gray-50 border-blue-200 text-gray-600" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-gray-700">Name</span>
            <input placeholder={form.name || 'Not Defined'} value={form.name} onChange={e=>update('name', e.target.value)} className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-blue-200 focus:outline-none focus:border-blue-400" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-gray-700">Email</span>
            <input placeholder={form.email || 'Not Defined'} value={form.email} onChange={e=>update('email', e.target.value)} className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-blue-200 focus:outline-none focus:border-blue-400" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-gray-700">Phone number</span>
            <input placeholder={form.phone || 'Not Defined'} value={form.phone} onChange={e=>update('phone', e.target.value)} className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-blue-200 focus:outline-none focus:border-blue-400" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-gray-700">Board</span>
            <input placeholder={form.board || 'Not Defined'} value={form.board} onChange={e=>update('board', e.target.value)} className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-blue-200 focus:outline-none focus:border-blue-400" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-gray-700">Class</span>
            <select
              value={form.classLevel === 'Not Defined' ? '' : String(form.classLevel || '')}
              onChange={e => update('classLevel', e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-blue-200 focus:outline-none focus:border-blue-400 bg-white text-gray-800"
            >
              <option value="" disabled>Select class</option>
              {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-gray-700">School</span>
            <input placeholder={form.school || 'Not Defined'} value={form.school === 'Not Defined' ? '' : form.school} onChange={e=>update('school', e.target.value)} className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-blue-200 focus:outline-none focus:border-blue-400" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-gray-700">Age</span>
            <input placeholder={String(form.age || 'Not Defined')} value={form.age} onChange={e=>update('age', e.target.value)} disabled className="mt-1 w-full px-4 py-3 rounded-2xl border-2 bg-gray-50 border-blue-200" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-gray-700">Date of Birth</span>
            <input type="date" placeholder={form.dateOfBirth || 'Not Defined'} value={form.dateOfBirth === 'Not Defined' ? '' : form.dateOfBirth} onChange={e=>update('dateOfBirth', e.target.value)} className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-blue-200 focus:outline-none focus:border-blue-400" />
          </label>
          </div>
          <div className="mt-8 text-center">
            <button onClick={handleSave} disabled={saving} className="px-10 py-4 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white text-xl font-extrabold shadow-[0_10px_0_0_rgba(0,0,0,0.15)] disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
            {saveError && <div className="mt-3 text-red-600 font-bold">{saveError}</div>}
            {saved && <div className="mt-3 text-green-700 font-bold">Saved!</div>}
          </div>
        </div>
        {/* Right: Progress card */}
        <div className="bg-gradient-to-b from-blue-50 to-white border-2 border-blue-200 rounded-2xl shadow-xl p-6 sm:p-8 relative max-h-[calc(100vh-180px)] overflow-auto transparent-scroll lg:col-span-7">
          <h2 className="text-2xl font-extrabold text-blue-700 mb-4">Progress</h2>
          <ProgressPanel />
          <img src={mascotSrc} alt="Mascot" className="hidden lg:block absolute right-4 bottom-4 w-28 h-28 object-contain opacity-95 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
