import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService.js';
import { useAuth } from '../../context/AuthContext.jsx';

const HOSHI = 'https://res.cloudinary.com/fhscvc7p/image/upload/v1790922377/img-to-link/yiua95vucvhqg1zlfb5d.webp';

function transferGuestLessons(fromUserId, toUserId) {
  if (!fromUserId || !toUserId || fromUserId === toUserId) return;
  try {
    const fromList = JSON.parse(localStorage.getItem(`guest_lessons_v1__${fromUserId}`) || '[]');
    const toList = JSON.parse(localStorage.getItem(`guest_lessons_v1__${toUserId}`) || '[]');
    const combined = Array.from(new Set([...toList, ...fromList]));
    localStorage.setItem(`guest_lessons_v1__${toUserId}`, JSON.stringify(combined));
  } catch (_) {}
}

export default function GuestVerifyModal({ onClose }) {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user?.pendingPhone || '');
  // Steps: 'phone' -> 'password' (existing user) | 'code' (new user signup) | 'otp-login' (existing user OTP)
  const [step, setStep] = useState('phone');
  const [existingUserName, setExistingUserName] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    window.hyTrack?.('guest_verify_prompt', { class: user?.classLevel || 'unknown_class' });
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  // Step 1: Submit mobile number -> verify if account exists
  const handlePhoneSubmit = async (e) => {
    e?.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { data } = await authService.checkUser(phone);
      if (data?.exists) {
        setExistingUserName(data.name || '');
        setStep('password');
        setPassword('');
        setError('');
      } else {
        await authService.sendOtp(phone, 'signup');
        setStep('code');
        setOtp('');
        setPassword('');
        setResendTimer(60);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not verify number. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2A: Existing user logs in with password
  const handlePasswordLogin = async (e) => {
    e?.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { data } = await authService.login({
        phone,
        password,
        guestUserId: user?._id,
      });

      transferGuestLessons(user?._id, data._id);
      window.hyTrack?.('login', {
        method: 'guest_prompt_password',
        class: data?.classLevel || user?.classLevel || 'unknown_class',
      });

      login(data);
      onClose?.();
    } catch (err) {
      const msg = err.response?.data?.message || 'Incorrect password. Try again or log in with WhatsApp code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Send WhatsApp OTP for existing user (forgot password / OTP login)
  const handleSendOtpForLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.sendOtp(phone, 'login');
      setStep('otp-login');
      setOtp('');
      setPassword('');
      setResendTimer(60);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not send WhatsApp code. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2B: Existing user logs in with WhatsApp OTP
  const handleOtpLogin = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code from WhatsApp');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { data } = await authService.loginWithOtp({
        phone,
        otp,
        newPassword: password.length >= 6 ? password : undefined,
        guestUserId: user?._id,
      });

      transferGuestLessons(user?._id, data._id);
      window.hyTrack?.('login', {
        method: 'guest_prompt_otp',
        class: data?.classLevel || user?.classLevel || 'unknown_class',
      });

      login(data);
      onClose?.();
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please check the code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2C: New user verifies signup OTP + sets password
  const handleSignupVerify = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit code from WhatsApp'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);

    try {
      const { data } = await authService.upgradeGuest({ phone, otp, password });
      window.hyTrack?.('sign_up', {
        method: 'guest_upgrade',
        user_type: 'new',
        is_new_user: true,
        class: data?.classLevel || user?.classLevel || 'unknown_class',
      });
      try { window.NativeFB?.logSignup?.(); } catch (_) {}
      try { sessionStorage.setItem('entryType', 'signup'); } catch (_) {}

      login(data);
      onClose?.();
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend code handler
  const handleResend = async () => {
    if (resendTimer > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      const otpType = step === 'code' ? 'signup' : 'login';
      await authService.sendOtp(phone, otpType);
      setResendTimer(60);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not resend code. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/65 backdrop-blur-md p-0 sm:p-4 font-sans select-none">
      <div className="relative w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-7 border border-slate-100 animate-fade-in">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-lg font-bold transition-transform active:scale-90 cursor-pointer z-10"
        >
          ✕
        </button>

        {/* Top Header Card */}
        <div className="flex items-center gap-3.5 mb-4 pr-7">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-50 border-2 border-blue-200/60 p-1 flex items-center justify-center shadow-inner">
              <img src={HOSHI} alt="Hoshi" className="w-full h-full object-contain drop-shadow" />
            </div>
            <span className="absolute -bottom-1 -right-1 text-sm">⭐</span>
          </div>
          <div className="min-w-0 flex-1">
            {/* Pill Badge */}
            <div className="mb-1">
              {step === 'password' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                  ✨ Account Found
                </span>
              ) : step === 'otp-login' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  💬 WhatsApp Login
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                  🎯 5 Free Lessons Played
                </span>
              )}
            </div>

            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {step === 'password'
                ? (existingUserName ? `Welcome back, ${existingUserName}!` : 'Welcome back!')
                : step === 'otp-login'
                ? 'Log In with Code'
                : 'Save Your Progress'}
            </h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-0.5">
              {step === 'password'
                ? 'Log in to keep your 5 free lessons and unlock all chapters.'
                : step === 'otp-login'
                ? 'Enter the 6-digit code sent to your WhatsApp.'
                : 'Verify your number to keep your stars and unlock all lessons.'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-3.5 rounded-2xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-red-700 flex items-start gap-2 animate-shake">
            <span className="text-base shrink-0 leading-none">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* STEP 1: Phone number entry */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#25D366] inline-block animate-pulse"></span>
                  WhatsApp Mobile Number
                </label>
                <span className="text-[11px] font-bold text-slate-400">Step 1 of 2</span>
              </div>
              
              <div className="flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100 bg-slate-50/80 px-3.5 h-14 transition-all shadow-xs">
                <span className="flex items-center gap-1.5 text-base font-black text-slate-700 mr-2 shrink-0 select-none">
                  <span className="text-lg">🇮🇳</span> +91
                </span>
                <span className="h-6 w-px bg-slate-200 mr-2.5"></span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  className="flex-1 bg-transparent outline-none text-lg font-black text-slate-900 tracking-wider placeholder:font-bold placeholder:text-slate-300"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5b] disabled:opacity-50 text-white font-black text-base shadow-[0_4px_0_#128C7E] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Checking number…</span>
              ) : (
                <>
                  <span>Continue with WhatsApp</span>
                  <span className="text-lg">→</span>
                </>
              )}
            </button>

            <div className="pt-1 flex items-center justify-center gap-3 text-center text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1">🔒 Fast & Secure</span>
              <span>•</span>
              <span className="flex items-center gap-1">⭐ Progress Kept</span>
              <span>•</span>
              <span className="flex items-center gap-1">🚫 No Spam</span>
            </div>

            <div className="pt-1 text-center">
              <a
                href="https://wa.me/918310532323?text=Hi!%20I%20need%20help%20with%20my%20Hoshiyaar%20lessons."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-1"
              >
                <span>Need help?</span>
                <span className="text-[#128C7E] font-black underline flex items-center gap-1">
                  Chat on WhatsApp
                </span>
              </a>
            </div>
          </form>
        )}

        {/* STEP 2A: Existing User - Password Login */}
        {step === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-3.5">
            {/* Number chip */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-blue-50 border border-blue-200/70 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">📱</span>
                <span className="font-bold text-slate-700">Account: <strong>+91 {phone}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => { setStep('phone'); setError(''); }}
                className="text-blue-700 hover:text-blue-900 underline font-black cursor-pointer"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Enter Password</label>
              <div className="flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 bg-slate-50/80 px-4 h-14 transition-all">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="flex-1 bg-transparent outline-none text-base font-bold text-slate-900"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-xs font-black text-blue-600 hover:text-blue-800 ml-2 px-2 py-1 rounded-md bg-blue-50 cursor-pointer"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full h-14 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-black text-base shadow-[0_4px_0_#1E3A8A] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Logging in…' : 'Log In & Save Progress 🚀'}
            </button>

            {/* Alternative: WhatsApp OTP */}
            <div className="pt-1 flex flex-col gap-2.5 items-center text-center">
              <button
                type="button"
                onClick={handleSendOtpForLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-800 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>💬</span>
                <span>Forgot password? Log in with WhatsApp Code</span>
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setError(''); }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Use a different phone number
              </button>
            </div>
          </form>
        )}

        {/* STEP 2B: Existing User - WhatsApp OTP Login */}
        {step === 'otp-login' && (
          <form onSubmit={handleOtpLogin} className="space-y-3.5">
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <span className="font-bold text-slate-700">Code sent to: <strong>+91 {phone}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => { setStep('phone'); setError(''); setOtp(''); }}
                className="text-emerald-700 hover:text-emerald-900 underline font-black cursor-pointer"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">6-Digit WhatsApp Code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="w-full h-14 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 bg-slate-50/80 outline-none text-center text-2xl font-black tracking-[0.5em] text-slate-900 shadow-xs"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Set new password (optional)</label>
              <div className="flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-blue-500 bg-slate-50 px-3.5 h-12">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters (optional)"
                  className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-xs font-black text-blue-600 ml-2"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full h-14 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-black text-base shadow-[0_4px_0_#1E3A8A] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              {loading ? 'Verifying…' : 'Verify & Log In'}
            </button>

            <div className="pt-1 flex flex-col gap-2 items-center text-center">
              {resendTimer > 0 ? (
                <span className="text-xs font-semibold text-slate-400">Resend code in {resendTimer}s</span>
              ) : (
                <button type="button" onClick={handleResend} disabled={loading} className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer">
                  Didn't receive code? Resend
                </button>
              )}
              <button
                type="button"
                onClick={() => { setStep('password'); setError(''); }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline cursor-pointer"
              >
                Log in with password instead
              </button>
            </div>
          </form>
        )}

        {/* STEP 2C: New User - Signup OTP + Password */}
        {step === 'code' && (
          <form onSubmit={handleSignupVerify} className="space-y-3.5">
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-purple-50 border border-purple-200/70 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <span className="font-bold text-slate-700">Code sent to: <strong>+91 {phone}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="text-purple-700 hover:text-purple-900 underline font-black cursor-pointer"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">6-Digit WhatsApp Code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="w-full h-14 rounded-2xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 bg-slate-50/80 outline-none text-center text-2xl font-black tracking-[0.5em] text-slate-900 shadow-xs"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">Create a Password</label>
              <div className="flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-purple-500 bg-slate-50 px-3.5 h-13">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="flex-1 bg-transparent outline-none text-base font-bold text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-xs font-black text-purple-600 ml-2"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 mt-1">You'll use this password to log in next time.</p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6 || password.length < 6}
              className="w-full h-14 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-black text-base shadow-[0_4px_0_#1E3A8A] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Creating account…' : 'Unlock All Lessons 🚀'}
            </button>

            <div className="pt-1 text-center">
              {resendTimer > 0 ? (
                <span className="text-xs font-semibold text-slate-400">Resend code in {resendTimer}s</span>
              ) : (
                <button type="button" onClick={handleResend} disabled={loading} className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer">
                  Didn't receive code? Resend
                </button>
              )}
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
