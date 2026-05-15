import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import authService from '../../services/authService.js';

export default function DeleteAccountPage() {
  const { user, logout } = useAuth();
  const [step, setStep] = useState(1); // 1: confirm, 2: processing, 3: done
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async () => {
    if (!confirmed) return;
    if (!user?._id) {
      setError('You must be logged in to delete your account.');
      return;
    }

    try {
      setStep(2);
      await authService.deleteAccount(user._id);
      // Clear all local data
      try { localStorage.clear(); } catch (_) {}
      try { sessionStorage.clear(); } catch (_) {}
      setStep(3);
      // Logout and redirect after a moment
      setTimeout(() => {
        logout?.();
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      setStep(1);
      setError(err?.response?.data?.message || 'Failed to delete account. Please try again.');
    }
  };

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
                onClick={() => window.history.back()}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!confirmed || !user}
                className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all ${
                  confirmed && user
                    ? 'bg-red-500 hover:bg-red-600 shadow-sm shadow-red-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Delete My Account
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-gray-600">Deleting your account...</p>
          </div>
        )}

        {step === 3 && (
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
