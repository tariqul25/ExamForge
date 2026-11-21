'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, X, AlertCircle } from 'lucide-react';

export default function StatusBanner() {
  const [show, setShow] = useState(false);
  const [configStatus, setConfigStatus] = useState<{
    geminiConfigured: boolean;
    mongoConnected: boolean;
  }>({
    geminiConfigured: true,
    mongoConnected: true,
  });

  useEffect(() => {
    // Check if user dismissed banner for this session
    const dismissed = sessionStorage.getItem('examforge-banner-dismissed');
    if (dismissed) return;

    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        const geminiOk = Boolean(data?.gemini?.configured);
        const mongoOk = Boolean(data?.mongodb?.connected);
        setConfigStatus({
          geminiConfigured: geminiOk,
          mongoConnected: mongoOk,
        });
        if (!geminiOk || !mongoOk) {
          setShow(true);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('examforge-banner-dismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="mb-6 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-indigo-50/90 dark:from-indigo-950/40 dark:via-gray-900 dark:to-indigo-950/40 p-4 shadow-xs transition-all">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="mt-0.5 sm:mt-0 p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-white">
              Running in Smart Interactive Mode:
            </span>{' '}
            {!configStatus.geminiConfigured && (
              <span className="inline-block mr-2 text-indigo-700 dark:text-indigo-300">
                • Gemini 2.5 Vision running in Intelligent Generator mode.
              </span>
            )}
            {!configStatus.mongoConnected && (
              <span className="inline-block text-cyan-700 dark:text-cyan-300">
                • MongoDB running in instant local memory store.
              </span>
            )}
            <span className="block sm:inline sm:ml-2 text-gray-500 dark:text-gray-400">
              Paste keys into <code className="px-1 py-0.5 rounded bg-white dark:bg-gray-800 text-xs font-mono">.env.local</code> anytime!
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/settings"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
          >
            <span>Connection Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={dismiss}
            aria-label="Dismiss banner"
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
