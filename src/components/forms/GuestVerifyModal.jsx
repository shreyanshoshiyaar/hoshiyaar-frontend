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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-4 font-sans select-none overflow-y-auto overscroll-contain">
      <div className="relative w-full max-w-md bg-white rounded-[28px] shadow-2xl px-5 pt-6 pb-6 border border-slate-100 animate-fade-in my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto mx-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition-all cursor-pointer z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Top Header */}
        <div className="flex items-center gap-3.5 mb-5 pr-7">
          <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-2xl bg-blue-50/80 border border-blue-100 p-1 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={HOSHI}
              alt="Hoshi"
              width={48}
              height={48}
              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
              className="w-12 h-12 object-contain shrink-0"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1">
              <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-amber-50 text-amber-900 border border-amber-200/80">
                5 Guest Lessons Played
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {step === 'password'
                ? (existingUserName ? `Welcome back, ${existingUserName}` : 'Welcome back')
                : step === 'otp-login'
                ? 'Log In via WhatsApp'
                : 'Create account to continue'}
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
              {step === 'password'
                ? 'Log in to keep your 5 guest lessons and unlock all chapters.'
                : step === 'otp-login'
                ? 'Enter the 6-digit code sent to your WhatsApp.'
                : 'Verify your number to keep your progress and unlock all lessons.'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-semibold text-red-700 flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* STEP 1: Phone number entry */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  WhatsApp Mobile Number
                </label>
                <span className="text-[11px] font-semibold text-slate-400">Step 1 of 2</span>
              </div>
              
              <div className="flex items-center rounded-xl border border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 bg-white px-3.5 h-14 transition-all">
                <span className="text-sm font-bold text-slate-700 mr-2 shrink-0 select-none">
                  +91
                </span>
                <span className="h-5 w-px bg-slate-200 mr-3"></span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  className="flex-1 bg-transparent outline-none text-base font-bold text-slate-900 tracking-wider placeholder:font-normal placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full h-14 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] disabled:opacity-50 text-white font-bold text-base shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Checking number...</span>
              ) : (
                <span>Continue with WhatsApp</span>
              )}
            </button>

            <div className="pt-1 flex items-center justify-center gap-3 text-center text-xs font-medium text-slate-400">
              <span>Secure Verification</span>
              <span>•</span>
              <span>Progress Saved</span>
              <span>•</span>
              <span>No Spam</span>
            </div>

            <div className="pt-1 text-center">
              <a
                href="https://wa.me/918310532323?text=Hi!%20I%20need%20help%20with%20my%20Hoshiyaar%20account."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1"
              >
                <span>Need help?</span>
                <span className="text-[#128C7E] font-bold underline">
                  Chat on WhatsApp
                </span>
              </a>
            </div>
          </form>
        )}

        {/* STEP 2A: Existing User - Password Login */}
        {step === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            {/* Number chip */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Account: <strong>+91 {phone}</strong></span>
              <button
                type="button"
                onClick={() => { setStep('phone'); setError(''); }}
                className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Enter Password</label>
              <div className="flex items-center rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 bg-white px-3.5 h-14 transition-all">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="flex-1 bg-transparent outline-none text-base font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 cursor-pointer"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Logging in...' : 'Log In & Save Progress'}
            </button>

            {/* Alternative: WhatsApp OTP */}
            <div className="pt-1 flex flex-col gap-2.5 items-center text-center">
              <button
                type="button"
                onClick={handleSendOtpForLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Forgot password? Log in with WhatsApp Code
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setError(''); }}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Use a different phone number
              </button>
            </div>
          </form>
        )}

        {/* STEP 2B: Existing User - WhatsApp OTP Login */}
        {step === 'otp-login' && (
          <form onSubmit={handleOtpLogin} className="space-y-4">
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Code sent to: <strong>+91 {phone}</strong></span>
              <button
                type="button"
                onClick={() => { setStep('phone'); setError(''); setOtp(''); }}
                className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">6-Digit WhatsApp Code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="w-full h-14 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white outline-none text-center text-xl font-bold tracking-[0.4em] text-slate-900 transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Set New Password (Optional)</label>
              <div className="flex items-center rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 bg-white px-3.5 h-14 transition-all">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters (optional)"
                  className="flex-1 bg-transparent outline-none text-base font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 cursor-pointer"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base shadow-sm transition-all cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Verify & Log In'}
            </button>

            <div className="pt-1 flex flex-col gap-2 items-center text-center">
              {resendTimer > 0 ? (
                <span className="text-xs font-medium text-slate-400">Resend code in {resendTimer}s</span>
              ) : (
                <button type="button" onClick={handleResend} disabled={loading} className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer">
                  Didn't receive code? Resend
                </button>
              )}
              <button
                type="button"
                onClick={() => { setStep('password'); setError(''); }}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 underline cursor-pointer"
              >
                Log in with password instead
              </button>
            </div>
          </form>
        )}

        {/* STEP 2C: New User - Signup OTP + Password */}
        {step === 'code' && (
          <form onSubmit={handleSignupVerify} className="space-y-4">
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Code sent to: <strong>+91 {phone}</strong></span>
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">6-Digit WhatsApp Code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="w-full h-14 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white outline-none text-center text-xl font-bold tracking-[0.4em] text-slate-900 transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Create a Password</label>
              <div className="flex items-center rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 bg-white px-3.5 h-14 transition-all">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="flex-1 bg-transparent outline-none text-base font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 cursor-pointer"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">You will use this password to log in next time.</p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6 || password.length < 6}
              className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base shadow-sm transition-all cursor-pointer flex items-center justify-center"
            >
              {loading ? 'Creating account...' : 'Unlock All Lessons'}
            </button>

            <div className="pt-1 text-center">
              {resendTimer > 0 ? (
                <span className="text-xs font-medium text-slate-400">Resend code in {resendTimer}s</span>
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
