import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AuthLayout from '../forms/AuthLayout';
import { CalendarIcon } from '../ui/Icons';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(() => {
    if (user && user.role !== 'admin') return false;
    const sessionAdmin = sessionStorage.getItem('isAdmin') === 'true';
    const contextAdmin = user?.role === 'admin';
    return sessionAdmin || contextAdmin;
  });
  const [formData, setFormData] = useState({ username: '', dob: '' });
  const [error, setError] = useState('');

  // Sync state with AuthContext and session
  React.useEffect(() => {
    let isActuallyAdmin = user?.role === 'admin' || sessionStorage.getItem('isAdmin') === 'true';
    if (user && user.role !== 'admin') isActuallyAdmin = false;
    
    if (isActuallyAdmin !== isAdmin) {
      setIsAdmin(isActuallyAdmin);
    }
  }, [user, isAdmin]);

  const handleDobChange = (e) => {
    let val = e.target.value;
    const isDeleting = val.length < formData.dob.length;
    
    if (isDeleting) {
      setFormData(prev => ({ ...prev, dob: val }));
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
    setFormData(prev => ({ ...prev, dob: res }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Parse dateOfBirth if it's in DD/MM/YYYY format
      let dob = formData.dob;
      if (dob && /^\d{2}[/-]\d{2}[/-]\d{4}$/.test(dob)) {
        const parts = dob.split(/[/-]/);
        dob = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
      }

      const { data } = await authService.adminLogin({
        username: formData.username,
        dateOfBirth: dob
      });
      
      if (data.token && data.role === 'admin') {
        setIsAdmin(true);
        sessionStorage.setItem('isAdmin', 'true');
        sessionStorage.setItem('adminToken', data.token);
      } else {
        setError('Unauthorized: Admin access required');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid admin credentials');
    }
  };

  // Check if we are actually on an admin path
  const isExplicitAdminPath = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  // If we're already an admin, or if we're NOT on an admin path, just render the content
  if (isAdmin || !isExplicitAdminPath) {
    return children;
  }

  return (
    <AuthLayout title="Admin Login" linkTo="/" linkText="Back to Home">
      <div className="text-center w-full max-w-sm sm:max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-duo-blue">Admin Access</h1>
        
        {error && (
          <p className="bg-red-500 text-white p-3 rounded-md mb-4 text-sm sm:text-base">
            {error}
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
