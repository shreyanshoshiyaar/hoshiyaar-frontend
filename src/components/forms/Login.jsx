import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import AuthLayout from './AuthLayout';
import authService from '../../services/authService.js';

const Login = () => {
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
        const response = await authService.login({
          phone: formData.phone,
          password: formData.password
        });
        
        if (response.data && response.data.token) {
          const userClass = response?.data?.user?.classLevel ||
                            response?.data?.user?.class ||
                            localStorage.getItem("classLevel") ||
                            "unknown_class";
          window.hyTrack?.("login", {
            method: "phone_otp",
            user_type: "student",
            is_new_user: false,
            source: "login_page",
            "class": userClass
          });
          login(response.data);
          try { sessionStorage.setItem('entryType', 'login'); } catch (_) {}
          navigate('/home');
        }
      
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Log in" linkTo="/signup" linkText="Sign Up">
      <div className="text-center w-full">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-slate-900">Welcome back</h1>
        <p className="text-slate-500 text-sm sm:text-base mb-8">Enter your details to continue</p>
        

        <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
          <div className="text-left">
            <label className="text-xs sm:text-sm font-medium text-slate-600 mb-1.5 block ml-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={onChange}
              placeholder="10-digit mobile number"
              autoComplete="tel"
              className="w-full bg-white border border-slate-300 rounded-2xl p-3.5 sm:p-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm sm:text-base text-slate-900 placeholder-slate-400 shadow-sm"
              required
            />
          </div>
          
          <div className="text-left relative">
            <div className="flex justify-between items-center mb-1.5 ml-1 mr-1">
              <label className="text-xs sm:text-sm font-medium text-slate-600 block">Password</label>
              <Link to="/forgot-password" className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={onChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full bg-white border border-slate-300 rounded-2xl p-3.5 sm:p-4 pr-12 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm sm:text-base text-slate-900 placeholder-slate-400 shadow-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50/80 border border-red-200/60 rounded-xl p-3 flex items-start gap-2.5 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-600 text-sm font-medium text-left leading-tight pt-0.5">{error}</p>
            </div>
          )}
          
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide py-3.5 sm:py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Log In'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            New here?{' '}
            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Create an account
            </Link>
          </p>
        </div>

        <p className="text-xs text-slate-400 mt-8 text-center max-w-xs mx-auto">
          By signing in to Hoshiyaar, you agree to our <br/>
          <span className="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer font-medium">Terms of Service</span> and <span className="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer font-medium">Privacy Policy</span>.
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
