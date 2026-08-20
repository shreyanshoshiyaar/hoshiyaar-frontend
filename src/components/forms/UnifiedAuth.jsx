import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import authService from '../../services/authService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getSignupSource, trackUserType, setUserProperties } from '../../utils/analytics.js';

const UnifiedAuth = () => {
  // Steps: 1=Phone, 2=Password(Login), 3=OTP(Signup), 4=Details(Signup)
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [userExists, setUserExists] = useState(null);
  const [userName, setUserName] = useState('');
  
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    otp: '',
    username: '',
    name: '',
    classLevel: '',
    email: '',
    whatsappOptIn: true,
  });

  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
  const navigate = useNavigate();
  const { login } = useAuth();

  const onChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  };

  // Debounced username availability check
  useEffect(() => {
    if (step !== 4) return;
    
    const value = formData.username?.trim();
    if (!value) {
      setUsernameStatus({ checking: false, available: null, message: '' });
      return;
    }
    setUsernameStatus((s) => ({ ...s, checking: true, message: '' }));
    const id = setTimeout(async () => {
      try {
        const { data } = await authService.checkUsername(value);
        setUsernameStatus({ checking: false, available: !!data?.available, message: data?.available ? 'Username available' : 'Username already taken' });
      } catch (e) {
        setUsernameStatus({ checking: false, available: null, message: 'Unable to verify username' });
      }
    }, 400);
    return () => clearTimeout(id);
  }, [formData.username, step]);

  useEffect(() => {
    let interval;
    if (step === 3 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handlePhoneCheck = async (e) => {
    e.preventDefault();
    if (formData.phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await authService.checkUser(formData.phone);
      if (response.data.exists) {
        setUserExists(true);
        setUserName(response.data.name || '');
        setStep(2); // Go to Password screen
      } else {
        setUserExists(false);
        // Send OTP for Signup automatically
        await authService.sendOtp(formData.phone, 'signup');
        setStep(3); // Go to OTP screen
        setResendTimer(60);
        setResendCount(0);
      }
    } catch (err) {
      if (!err.response) {
        setError('Network error: Unable to reach the server. Please check your internet connection.');
      } else {
        setError(err.response?.data?.message || 'Failed to verify number. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
        const response = await authService.login({
          phone: formData.phone,
          password: formData.password,
          region: sessionStorage.getItem('user_region') || null,
          city: sessionStorage.getItem('user_city') || null,
          country: sessionStorage.getItem('user_country') || null
        });
        
        if (response.data && response.data.token) {
          const userClass = response?.data?.user?.classLevel ||
                            response?.data?.user?.class ||
                            localStorage.getItem("classLevel") ||
                            "unknown_class";
          window.hyTrack?.("login", {
            method: "phone_password",
            user_type: "student",
            is_new_user: false,
            source: "unified_login_page",
            "class": userClass
          });
          login(response.data);
          try { sessionStorage.setItem('entryType', 'login'); } catch (_) {}
          navigate('/welcome');
        }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Incorrect password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (formData.otp.length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authService.verifyOtp(formData.phone, formData.otp);
      setStep(4); // Go to Profile creation
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendCount >= 3) return;
    setIsLoading(true);
    setError('');
    try {
      await authService.sendOtp(formData.phone, 'signup');
      setResendTimer(60);
      setResendCount(prev => prev + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitDetails = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await authService.register({
        username: formData.username.trim(),
        name: formData.name,
        classLevel: formData.classLevel || null,
        phone: formData.phone || null,
        email: formData.email.trim() || null,
        password: formData.password,
        whatsappOptIn: formData.whatsappOptIn,
        region: sessionStorage.getItem('user_region') || null,
        city: sessionStorage.getItem('user_city') || null,
        country: sessionStorage.getItem('user_country') || null
      });
      if (response.data && response.data.token) {
        const source = getSignupSource();
        const classLvl = formData.classLevel || "unknown_class";

        window.hyTrack?.("sign_up", {
          method: "phone_otp",
          user_type: "new",
          is_new_user: true,
          signup_source: source,
          "class": classLvl
        });
        
        // Persist user properties
        setUserProperties({
            signup_source: source,
            class: classLvl,
            user_type: 'new'
        });
        
        try {
          if (window.NativeFB && window.NativeFB.logSignup) {
            window.NativeFB.logSignup();
          }
        } catch (e) {
          console.error("Facebook logging failed", e);
        }

        login(response.data);
        try { sessionStorage.setItem('entryType', 'signup'); } catch (_) {}
        navigate('/learn');
      }
      
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title={step === 1 || step === 2 ? "Log In" : "Sign Up"} linkTo="/" linkText="Back to Home">
      <div className="w-full">
        {step === 1 && (
          <div className="animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-slate-900 text-center">Welcome</h1>
            <p className="text-slate-500 text-sm sm:text-base mb-8 text-center">Enter your mobile number to continue</p>
            
            {error && <p className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-6 text-sm">{error}</p>}
            
            <form onSubmit={handlePhoneCheck} className="space-y-6">
              <div className="text-left">
                <label className="text-xs sm:text-sm font-medium text-slate-600 mb-1.5 block ml-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData(prev => ({ ...prev, phone: val }));
                  }}
                  placeholder="10-digit mobile number"
                  autoComplete="tel"
                  className="w-full bg-white border border-slate-300 rounded-2xl p-3.5 sm:p-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm sm:text-base text-slate-900 placeholder-slate-400 shadow-sm"
                  required
                />
              </div>
              
              <button 
                  type="submit" 
                  disabled={isLoading || formData.phone.length !== 10}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide py-3.5 sm:py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex justify-center items-center ${(isLoading || formData.phone.length !== 10) ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  </div>
                ) : (
                  'Continue'
                )}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in text-center w-full">
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-slate-900">Welcome back, {userName ? userName.split(' ')[0] : 'there'}!</h1>
            <p className="text-slate-500 text-sm sm:text-base mb-8">Logging in as {formData.phone} <button onClick={() => setStep(1)} className="text-blue-600 font-semibold hover:underline text-xs ml-1">(Change)</button></p>
            
            {error && <p className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-6 text-sm text-left">{error}</p>}
            
            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              <div className="text-left relative">
                <div className="flex justify-between items-center mb-1.5 ml-1 mr-1">
                  <label className="text-xs sm:text-sm font-medium text-slate-600 block">Password</label>
                  <Link to="/forgot-password" className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap">
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
                    className="w-full bg-white border border-slate-300 rounded-2xl p-3.5 sm:p-4 pr-12 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm sm:text-base text-slate-900 shadow-sm"
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
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide py-3.5 sm:py-4 rounded-2xl transition-all shadow-md flex justify-center items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Logging In...' : 'Log In'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-6 h-6 text-[#25D366] animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                <h2 className="text-lg font-extrabold text-slate-900">Check Your WhatsApp</h2>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-slate-600 font-medium">Code sent to:</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-[#25D366]/20">{formData.phone}</span>
                <button type="button" onClick={() => setStep(1)} className="text-blue-600 font-bold hover:underline text-xs">(Change)</button>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3 text-center shadow-sm">
              <p className="text-red-600 font-bold text-xs">
                 ⚠️ Note: Please check the WhatsApp app on your PHONE, not WhatsApp Web!
              </p>
            </div>
            
            {error && <p className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-6 text-sm">{error}</p>}
            
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-left">
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0,6) }))}
                  placeholder="6-digit OTP"
                  className="w-full text-center tracking-widest font-bold text-xl bg-white border border-slate-300 rounded-2xl p-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-900 shadow-sm placeholder:tracking-normal placeholder:font-normal placeholder:text-base"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading || formData.otp.length !== 6}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide py-3 rounded-2xl transition-all shadow-md flex justify-center items-center ${(isLoading || formData.otp.length !== 6) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-slate-500 font-medium">
                  Resend code in <span className="text-blue-600 font-bold">{resendTimer}s</span>
                </p>
              ) : resendCount >= 3 ? (
                <p className="text-sm text-red-500 font-medium">Too many attempts. Please try again later.</p>
              ) : (
                <button 
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors focus:outline-none"
                >
                  Didn't receive code? Resend
                </button>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-6 text-slate-900 text-center">Complete Profile</h1>
            {error && <p className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-6 text-sm text-left">{error}</p>}
            
            <form onSubmit={onSubmitDetails} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  placeholder="Full Name"
                  className="w-full bg-white border border-slate-300 rounded-xl p-3.5 focus:outline-none focus:border-blue-500 transition-all text-sm shadow-sm"
                  required
                />
                <div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={onChange}
                    placeholder="Username (Unique)"
                    className={`w-full bg-white border rounded-xl p-3.5 focus:outline-none transition-all text-sm shadow-sm ${usernameStatus.available === false ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400' : 'border-slate-300 focus:border-blue-500'}`}
                    required
                  />
                  {usernameStatus.message && (
                    <p className={`text-[10px] mt-1 ml-1 font-medium ${usernameStatus.available ? 'text-green-600' : 'text-red-600'}`}>
                      {usernameStatus.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <select
                  name="classLevel"
                  value={formData.classLevel}
                  onChange={onChange}
                  className={`w-full bg-white border border-slate-300 rounded-xl p-3.5 focus:outline-none focus:border-blue-500 transition-all text-sm shadow-sm ${formData.classLevel ? 'text-slate-900' : 'text-slate-400'}`}
                  required
                >
                  <option value="" disabled className="text-slate-400">Select class</option>
                  {['6', '7', '8'].map(c => (
                    <option key={c} value={c} className="bg-white text-slate-900">Class {c}</option>
                  ))}
                </select>
              </div>

              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={onChange}
                  placeholder="Set a Password"
                  className="w-full bg-white border border-slate-300 rounded-xl p-3.5 pr-12 focus:outline-none focus:border-blue-500 transition-all text-sm shadow-sm"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 focus:outline-none text-xs font-semibold"
                  tabIndex="-1"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button 
                type="submit" 
                disabled={isLoading || usernameStatus.available === false}
                className={`w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center ${(isLoading || usernameStatus.available === false) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Creating Account...' : 'Complete Sign Up'}
              </button>
            </form>
          </div>
        )}
        
        <p className="text-xs text-slate-400 mt-8 text-center max-w-xs mx-auto">
          By continuing, you agree to our <br/>
          <span className="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer font-medium">Terms of Service</span> and <span className="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer font-medium">Privacy Policy</span>.
        </p>
      </div>
    </AuthLayout>
  );
};

export default UnifiedAuth;
