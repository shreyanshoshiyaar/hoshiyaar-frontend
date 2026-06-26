import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import authService from '../../services/authService.js';
import { useAuth } from '../../context/AuthContext.jsx';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    username: '',
    name: '',
    classLevel: '',
    email: '',
    password: '',
  });

  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
  const navigate = useNavigate();
  const { login } = useAuth();

  const onChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Debounced username availability check (only active on step 3)
  useEffect(() => {
    if (step !== 3) return;
    
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
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (formData.phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authService.sendOtp(formData.phone, 'signup');
      setStep(2);
      setResendTimer(60);
      setResendCount(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP via WhatsApp. Please try again.');
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
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
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
        password: formData.password
      });
      if (response.data && response.data.token) {
        window.hyTrack?.("sign_up", {
          method: "phone_otp",
          user_type: "student",
          is_new_user: true,
          source: "signup_page",
          "class": formData.classLevel || "unknown_class"
        });
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
    <AuthLayout title="Sign Up" linkTo="/login" linkText="Log in">
      <div className="w-full">
        {step === 1 && (
          <div className="animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-slate-900 text-center">Create account</h1>
            <p className="text-slate-500 text-sm sm:text-base mb-8 text-center">Let's start with your phone number</p>
            
            {error && <p className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-6 text-sm">{error}</p>}
            
            <form onSubmit={handleSendOtp} className="space-y-6">
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
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide py-3.5 sm:py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center ${(isLoading || formData.phone.length !== 10) ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Sending OTP...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    Send OTP via WhatsApp
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-slate-900 text-center">Verify Number</h1>
            <div className="text-slate-500 text-sm sm:text-base mb-8 text-center">
              <span className="block mb-1">Enter the code sent to WhatsApp</span>
              <span className="inline-flex items-center justify-center gap-1.5 font-semibold text-slate-700">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg> 
                +91 {formData.phone}
              </span>
            </div>
            
            <p className="text-red-500 font-bold text-xs sm:text-sm text-center mb-6">
               Note: Please check the WhatsApp app on your PHONE, not WhatsApp Web!
            </p>
            
            {error && <p className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-6 text-sm">{error}</p>}
            
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-left">
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setFormData(prev => ({ ...prev, otp: val }));
                  }}
                  placeholder="Enter 6-digit OTP"
                  autoComplete="one-time-code"
                  className="w-full bg-white border border-slate-300 rounded-2xl p-3 sm:p-4 text-center text-xl sm:text-2xl tracking-[0.3em] sm:tracking-[0.5em] placeholder:tracking-normal focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-900 placeholder-slate-300 shadow-sm"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading || formData.otp.length < 6}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide py-3.5 sm:py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center ${(isLoading || formData.otp.length < 6) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Verifying...</span>
                  </div>
                ) : 'Verify'}
              </button>
              
              <div className="text-center space-y-3">
                {resendCount >= 3 ? (
                  <p className="text-sm text-red-500 font-medium">
                    Maximum resend attempts reached.
                  </p>
                ) : resendTimer > 0 ? (
                  <p className="text-sm text-slate-500 font-medium">
                    Resend OTP in <span className="text-blue-600 font-bold">{resendTimer}s</span>
                  </p>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-sm text-blue-600 hover:text-blue-800 font-bold transition-colors disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}
                <button type="button" onClick={() => setStep(1)} className="block w-full text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
                  Change phone number
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
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
                  className="w-full bg-white border border-slate-300 rounded-xl p-3.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm text-slate-900 placeholder-slate-400 shadow-sm"
                />
                <div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={onChange}
                    placeholder="Username (Unique)"
                    className={`w-full bg-white border rounded-xl p-3.5 focus:outline-none transition-all text-sm text-slate-900 placeholder-slate-400 shadow-sm ${usernameStatus.available === false ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400' : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                    required
                  />
                  {usernameStatus.message && (
                    <p className={`text-[10px] mt-1 ml-1 font-medium ${usernameStatus.available ? 'text-green-600' : 'text-red-600'}`}>
                      {usernameStatus.message}
                    </p>
                  )}
                </div>
              </div>
              
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                placeholder="Email Address"
                className="w-full bg-white border border-slate-300 rounded-xl p-3.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm text-slate-900 placeholder-slate-400 shadow-sm"
              />

              <div className="grid grid-cols-1 gap-4">
                
                <select
                  name="classLevel"
                  value={formData.classLevel}
                  onChange={onChange}
                  className={`w-full bg-white border border-slate-300 rounded-xl p-3.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm shadow-sm ${formData.classLevel ? 'text-slate-900' : 'text-slate-400'}`}
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
                  placeholder="Create Password"
                  className="w-full bg-white border border-slate-300 rounded-xl p-3.5 pr-12 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm text-slate-900 placeholder-slate-400 shadow-sm"
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

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isLoading || usernameStatus.available === false || usernameStatus.checking}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center ${(isLoading || usernameStatus.available === false || usernameStatus.checking) ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span>Creating Account...</span>
                    </div>
                  ) : 'Create Account'}
                </button>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default Signup;