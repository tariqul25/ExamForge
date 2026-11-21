'use client';

import React, { useState } from 'react';

export default function GoogleAuthPopupPage() {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const handleSelectAccount = (account: { email: string; name: string }) => {
    if (window.opener) {
      window.opener.postMessage(
        {
          type: 'GOOGLE_AUTH_SUCCESS',
          profile: account,
        },
        window.location.origin
      );
      window.close();
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const name = customName.trim() || customEmail.split('@')[0];
    handleSelectAccount({ email: customEmail.trim(), name });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center p-6 text-gray-800 font-sans">
      <div className="w-full max-w-sm border border-gray-200 rounded-2xl p-6 shadow-lg space-y-6">
        {/* Google Logo */}
        <div className="flex flex-col items-center space-y-2">
          <svg className="w-8 h-8" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <h1 className="text-xl font-bold text-gray-900">Sign in with Google</h1>
          <p className="text-xs text-gray-500">to continue to <strong className="text-indigo-600">ExamForge</strong></p>
        </div>

        {!isCustom ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-600">Choose an account:</p>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => handleSelectAccount({ email: 'learner@gmail.com', name: 'Learner' })}
                className="w-full p-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  L
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-gray-900">Learner</p>
                  <p className="text-[11px] text-gray-500">learner@gmail.com</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleSelectAccount({ email: 'bcs.aspirant@gmail.com', name: 'BCS Aspirant' })}
                className="w-full p-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  B
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-gray-900">BCS Aspirant</p>
                  <p className="text-[11px] text-gray-500">bcs.aspirant@gmail.com</p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className="w-full py-2 text-xs text-blue-600 font-semibold hover:underline text-center"
            >
              Use another Google account
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Google Email</label>
              <input
                type="email"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Display Name (Optional)</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCustom(false)}
                className="flex-1 py-2 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        <div className="text-[11px] text-gray-400 text-center">
          To continue, Google will share your name and email address with ExamForge.
        </div>
      </div>
    </div>
  );
}
