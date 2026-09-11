import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import authService from '../../services/authService.js';

export default function DeleteAccountPage() {
  const { user, logout } = useAuth();
  // Steps: 1: Confirm & Request OTP, 2: Enter OTP, 3: Processing, 4: Done
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let interval;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = async () => {
    if (!confirmed) return;
    if (!user?._id) {
      setError('You must be logged in to delete your account.');
      return;
    }

    if (!user.phone) {
      return executeDeletion('');
    }

    setIsLoading(true);
    setError('');
    try {
      await authService.sendOtp(user.phone, 'delete_account');
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      await authService.sendOtp(user.phone, 'delete_account');
      setResendTimer(60);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndDelete = async (e) => {
    e?.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    await executeDeletion(otp.trim());
  };

  const executeDeletion = async (otpCode) => {
    setIsLoading(true);
    setError('');
    try {
      setStep(3);
      await authService.deleteAccount(user._id, { otp: otpCode });
      try { localStorage.clear(); } catch (_) {}
      try { sessionStorage.clear(); } catch (_) {}
      setStep(4);
      setTimeout(() => {
        logout?.();
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      setStep(user?.phone ? 2 : 1);
      setError(err?.response?.data?.message || 'Failed to delete account. Please verify OTP and try again.');
      setIsLoading(false);
    }
  };

  const maskedPhone = user?.phone ? `${user.phone.slice(0, 3)}****${user.phone.slice(-3)}` : '';

  // Show a very minimal, unbranded page — deliberately hard to find
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">

        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-black text-gray-900">Delete Account</h1>
              <p className="text-sm text-gray-500">
                This will <strong>permanently delete</strong> your account and all associated data including your progress, stars, and streak. This action <strong>cannot be undone</strong>.
              </p>
            </div>

            {user && (
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                <p><span className="font-bold">Username:</span> {user.username}</p>
                {user.name && <p><span className="font-bold">Name:</span> {user.name}</p>}
                {user.phone && <p><span className="font-bold">WhatsApp:</span> +91 {maskedPhone}</p>}
              </div>
            )}

            {!user && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                You are not currently logged in. Please log in first to delete your account.
              </div>
            )}

            <div className="flex items-start gap-3">
              <input
                id="confirm-check"
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-red-500 cursor-pointer"
              />
              <label htmlFor="confirm-check" className="text-sm text-gray-600 cursor-pointer leading-snug">
                I understand that deleting my account is permanent and all my data will be lost forever.
              </label>
            </div>

            {error && (
              <p className="text-xs font-bold text-red-500 text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={!confirmed || !user || isLoading}
                className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all ${
                  confirmed && user && !isLoading
                    ? 'bg-red-500 hover:bg-red-600 shadow-sm shadow-red-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Sending...' : user?.phone ? 'Send OTP' : 'Delete Account'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-xl font-black text-gray-900">Verify Identity</h1>
              <p className="text-sm text-gray-500">
                A 6-digit verification code has been sent to your WhatsApp number:
                <br />
                <span className="font-bold text-gray-800">+91 {maskedPhone}</span>
              </p>
            </div>

            {error && (
              <p className="text-xs font-bold text-red-500 text-center bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>
            )}

            <form onSubmit={handleVerifyAndDelete} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit OTP"
                  className="w-full text-center tracking-widest font-black text-2xl bg-white border border-slate-300 rounded-xl p-3.5 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-slate-900 shadow-sm"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={otp.length !== 6 || isLoading}
                className={`w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all ${
                  otp.length === 6 && !isLoading
                    ? 'bg-red-500 hover:bg-red-600 shadow-md shadow-red-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Verifying...' : 'Verify & Permanently Delete'}
              </button>

              <div className="flex justify-between items-center text-xs text-gray-500 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-gray-500 hover:text-gray-800 font-semibold"
                >
                  ← Back
                </button>

                {resendTimer > 0 ? (
                  <span>Resend in <strong className="text-red-500">{resendTimer}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-red-600 font-bold hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-gray-600">Deleting your account permanently...</p>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Account Deleted</h2>
              <p className="text-sm text-gray-500 mt-1">Your account has been permanently removed. Redirecting you to the homepage...</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
