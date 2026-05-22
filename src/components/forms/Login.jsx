import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx'; // Import the useAuth hook
import AuthLayout from './AuthLayout';
import { GoogleIcon, FacebookIcon, CalendarIcon } from '../ui/Icons';
import authService from '../../services/authService.js';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    dateOfBirth: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // Get the login function from our context

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const handleDobChange = (e) => {
    let val = e.target.value;
    const isDeleting = val.length < formData.dateOfBirth.length;
    
    if (isDeleting) {
      setFormData(prev => ({ ...prev, dateOfBirth: val }));
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
    setFormData(prev => ({ ...prev, dateOfBirth: res }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    try {
      // Parse dateOfBirth if it's in DD/MM/YYYY or DD-MM-YYYY format
      let dob = formData.dateOfBirth;
      if (dob && /^\d{2}[/-]\d{2}[/-]\d{4}$/.test(dob)) {
        const parts = dob.split(/[/-]/);
        dob = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
      }

      const response = await authService.login({
        ...formData,
        dateOfBirth: dob,
      });
      if (response.data && response.data.token) {
        // THE FIX: Use the login function from context to update global state
        login(response.data);
        // Mark entry type so Learn can decide flow
        try { sessionStorage.setItem('entryType', 'login'); } catch (_) {}
        // Redirect to the learn page
        navigate('/home');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <AuthLayout title="Log in" linkTo="/signup" linkText="Sign up">
      <div className="text-center w-full max-w-sm sm:max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Log in</h1>
        
        {error && <p className="bg-red-500 text-white p-3 rounded-md mb-4 text-sm sm:text-base text-overflow-fix">{error}</p>}

        <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={onChange}
            placeholder="Username"
            className="w-full bg-[#3c3c3c] border-2 border-[#585858] rounded-xl sm:rounded-2xl p-3 sm:p-4 focus:outline-none focus:border-duo-blue text-sm sm:text-base"
            required
          />
          <div className="text-left">
            <label className="text-xs sm:text-sm text-gray-300 mb-2 block">Date of Birth</label>
            <div className="relative">
              <input
                type="text"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleDobChange}
                placeholder="DD/MM/YYYY"
                className="w-full bg-[#3c3c3c] border-2 border-[#585858] rounded-xl sm:rounded-2xl p-3 sm:p-4 focus:outline-none focus:border-duo-blue text-sm sm:text-base text-white pr-12"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10">
                <CalendarIcon className="text-gray-400 w-6 h-6 pointer-events-none" />
                <input
                  type="date"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const d = e.target.value; // YYYY-MM-DD
                    if (d) {
                      const [y, m, d_] = d.split('-');
                      setFormData(prev => ({ ...prev, dateOfBirth: `${d_}/${m}/${y}` }));
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <button type="submit" className="w-full bg-duo-blue text-white font-bold uppercase tracking-wider py-3 sm:py-4 rounded-xl sm:rounded-2xl border-b-4 border-duo-blue-dark hover:bg-blue-500 transition btn-responsive">
            Log In
          </button>
        </form>


        <p className="text-xs sm:text-sm text-gray-400 mt-6 sm:mt-8 text-overflow-fix">
          By signing in to Hoshiyaar, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;

