import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx'; // Import the useAuth hook
import AuthLayout from './AuthLayout';
import { GoogleIcon, FacebookIcon } from '../ui/Icons';
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

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    try {
      const response = await authService.login(formData);
      if (response.data && response.data.token) {
        // THE FIX: Use the login function from context to update global state
        login(response.data);
        // Mark entry type so Learn can decide flow
        try { sessionStorage.setItem('entryType', 'login'); } catch (_) {}
        // Redirect to the learn page
        navigate('/learn');
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
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={onChange}
              placeholder="Date of Birth"
              className="w-full bg-[#3c3c3c] border-2 border-[#585858] rounded-xl sm:rounded-2xl p-3 sm:p-4 focus:outline-none focus:border-duo-blue text-sm sm:text-base"
              required
            />
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

