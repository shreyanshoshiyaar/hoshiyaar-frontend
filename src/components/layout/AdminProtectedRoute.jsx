import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AuthLayout from '../forms/AuthLayout';
import { CalendarIcon } from '../ui/Icons';
import authService from '../../services/authService';
import api from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { isUserAdmin } from '../../utils/adminCheck.js';

// The server decides who is an admin (GET /api/admin/verify). The device only decides whether
// it's worth asking: the logged-in account looks like an admin, or there is an admin-login session.
const AdminProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminPath = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  const hasAdminSession = () => {
    try { return Boolean(sessionStorage.getItem('adminToken')); } catch (_) { return false; }
  };
  // 'checking' | 'ok' | 'denied'
  const [status, setStatus] = useState(() => (isUserAdmin(user) || hasAdminSession() ? 'checking' : 'denied'));
  const [notice, setNotice] = useState('');
  const [formData, setFormData] = useState({ username: '', dob: '' });
  const [error, setError] = useState('');

  const verify = useCallback(async () => {
    setStatus('checking');
    try {
      await api.get('/api/admin/verify', { timeout: 15000 });
      setStatus('ok');
      setNotice('');
    } catch (err) {
      const code = err.response?.status;
      if (code === 401 || code === 403) {
        // A stale admin session must not keep failing every request
        try { sessionStorage.removeItem('adminToken'); sessionStorage.removeItem('isAdmin'); } catch (_) {}
        setNotice(code === 401 ? 'Your login has expired. Please log in again.' : 'This account does not have admin access.');
        setStatus('denied');
      } else {
        // Offline or the server is slow: let the panel open; each admin request is still checked by the server
        setStatus('ok');
      }
    }
  }, []);

  useEffect(() => {
    if (!isAdminPath) return;
    if (isUserAdmin(user) || hasAdminSession()) verify();
    else setStatus('denied');
  }, [user?._id, user?.token, isAdminPath, verify]);

  const handleDobChange = (e) => {
    const val = e.target.value;
    if (val.length < formData.dob.length) {
      setFormData(prev => ({ ...prev, dob: val }));
      return;
    }
    const cleaned = val.replace(/\D/g, '').slice(0, 8);
    let res = '';
    if (cleaned.length > 0) {
      res = cleaned.slice(0, 2);
      if (cleaned.length > 2) {
        res += '/' + cleaned.slice(2, 4);
        if (cleaned.length > 4) res += '/' + cleaned.slice(4, 8);
      }
    }
    setFormData(prev => ({ ...prev, dob: res }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let dob = formData.dob;
      if (dob && /^\d{2}[/-]\d{2}[/-]\d{4}$/.test(dob)) {
        const parts = dob.split(/[/-]/);
        dob = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
      }
      const { data } = await authService.adminLogin({ username: formData.username, dateOfBirth: dob });
      if (data.token && data.role === 'admin') {
        sessionStorage.setItem('isAdmin', 'true');
        sessionStorage.setItem('adminToken', data.token);
        await verify();
      } else {
        setError('Unauthorized: Admin access required');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid admin credentials');
    }
  };

  if (!isAdminPath || status === 'ok') return children;

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Checking admin access…
        </div>
      </div>
    );
  }

  return (
    <AuthLayout title="Admin Login" linkTo="/" linkText="Back to Home">
      <div className="text-center w-full max-w-sm sm:max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-duo-blue">Admin Access</h1>

        {(error || notice) && (
          <p className={`${error ? 'bg-red-500' : 'bg-amber-500'} text-white p-3 rounded-md mb-4 text-sm sm:text-base`}>
            {error || notice}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            className="w-full bg-[#3c3c3c] border-2 border-[#585858] rounded-xl p-3 sm:p-4 focus:outline-none focus:border-duo-blue text-sm sm:text-base text-white"
            required
          />
          <div className="relative">
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              value={formData.dob}
              onChange={handleDobChange}
              className="w-full bg-[#3c3c3c] border-2 border-[#585858] rounded-xl p-3 sm:p-4 focus:outline-none focus:border-duo-blue text-sm sm:text-base text-white pr-12"
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10">
              <CalendarIcon className="text-gray-400 w-6 h-6 pointer-events-none" />
              <input
                type="date"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const d = e.target.value;
                  if (d) {
                    const [y, m, d_] = d.split('-');
                    setFormData(prev => ({ ...prev, dob: `${d_}/${m}/${y}` }));
                  }
                }}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-duo-blue text-white font-bold uppercase tracking-wider py-3 sm:py-4 rounded-xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition"
          >
            Verify Access
          </button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default AdminProtectedRoute;
