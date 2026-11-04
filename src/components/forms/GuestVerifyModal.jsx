import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { GUEST_LESSON_LIMIT } from '../../utils/guestAccess.js';

const HOSHI = 'https://res.cloudinary.com/fhscvc7p/image/upload/v1790922377/img-to-link/yiua95vucvhqg1zlfb5d.webp';

// Shown to guests after their 3 free lessons: verify the number they gave at Get Started (WhatsApp OTP)
// and set a password. The guest account is upgraded in place, so lesson 1 progress is kept.
export default function GuestVerifyModal({ onClose }) {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user?.pendingPhone || '');
  const [step, setStep] = useState('phone'); // phone | code
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneTaken, setPhoneTaken] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    window.hyTrack?.('guest_verify_prompt', { class: user?.classLevel || 'unknown_class' });
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  const sendCode = async (e) => {
    e?.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setPhoneTaken(false);
    setLoading(true);
    try {
      await authService.sendOtp(phone, 'signup');
      setStep('code');
      setResendTimer(60);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not send the code. Please try again.';
      setError(msg);
      setPhoneTaken(/already exists/i.test(msg));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
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
      // Same user id, so login() keeps local progress; ProtectedRoute then shows the lesson
      login(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please try again.';
      setError(msg);
      setPhoneTaken(/already exists/i.test(msg));
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    logout();
    navigate('/login', { replace: true, state: { phone } });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4 font-sans">
      <div className="relative w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-lg font-bold"
        >
          ×
        </button>

        <div className="flex items-center gap-3 mb-4 pr-8">
          <img src={HOSHI} alt="" className="w-16 h-16 object-contain shrink-0" />
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">Create Account To Continue</h2>
            <p className="text-sm font-semibold text-slate-500 leading-snug mt-0.5">
              You've completed 5 lessons! Verify your number to unlock all lessons. Your stars stay with you.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
            {phoneTaken && (
              <button type="button" onClick={goToLogin} className="block mt-1 text-blue-700 underline font-bold">
                Log in with this number instead
              </button>
            )}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={sendCode}>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Mobile number</label>
            <div className="flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-blue-500 bg-slate-50 px-4 h-14 mb-4">
              <span className="text-base font-bold text-slate-400 mr-2">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                className="flex-1 bg-transparent outline-none text-lg font-bold text-slate-900 tracking-wide"
              />
            </div>
            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5b] disabled:opacity-50 text-white font-black text-base shadow-[0_4px_0_#128C7E] active:translate-y-[2px] active:shadow-none transition-all"
            >
              {loading ? 'Sending…' : 'Send code on WhatsApp'}
            </button>
            <div className="mt-4 text-center">
              <a
                href="https://wa.me/918310532323?text=Hi!%20I%20need%20help%20creating%20my%20Hoshiyaar%20account."
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
        ) : (
          <form onSubmit={verify}>
            <p className="text-sm font-semibold text-slate-600 mb-3">
              Code sent on WhatsApp to <strong>+91 {phone}</strong>{' '}
              <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="text-blue-600 underline font-bold">
                Change
              </button>
            </p>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">6-digit code</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              className="w-full h-14 rounded-2xl border-2 border-slate-200 focus:border-blue-500 bg-slate-50 outline-none text-center text-2xl font-black tracking-[0.5em] text-slate-900 mb-3"
            />
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Set a password</label>
            <div className="flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-blue-500 bg-slate-50 px-4 h-14 mb-1">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="flex-1 bg-transparent outline-none text-base font-bold text-slate-900"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-xs font-black text-blue-600 ml-2">
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-400 mb-4">You'll use your number and this password to log in.</p>
            <button
              type="submit"
              disabled={loading || otp.length !== 6 || password.length < 6}
              className="w-full h-14 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-black text-base shadow-[0_4px_0_#1E3A8A] active:translate-y-[2px] active:shadow-none transition-all"
            >
              {loading ? 'Verifying…' : 'Unlock all lessons'}
            </button>
            <div className="mt-3 text-center">
              {resendTimer > 0 ? (
                <span className="text-xs font-semibold text-slate-400">Resend code in {resendTimer}s</span>
              ) : (
                <button type="button" onClick={sendCode} disabled={loading} className="text-xs font-bold text-blue-600 underline">
                  Didn't get it? Resend
                </button>
              )}
            </div>
            <div className="mt-3 text-center">
              <a
                href="https://wa.me/918310532323?text=Hi!%20I%20need%20help%20with%20OTP%20verification%20for%20my%20Hoshiyaar%20account."
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

        
      </div>
    </div>
  );
}
