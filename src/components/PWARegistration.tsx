'use client';

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import ExamForgeLogo from '@/components/ExamForgeLogo';

export default function PWARegistration() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('ExamForge PWA Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('ExamForge PWA Service Worker registration failed:', err);
          });
      });
    }

    // 2. Check if already running in standalone app mode
    if (typeof window !== 'undefined') {
      const isApp =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isApp);

      const mediaQuery = window.matchMedia('(display-mode: standalone)');
      const handleChange = (e: MediaQueryListEvent) => {
        setIsStandalone(e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  useEffect(() => {
    // 3. Listen for browser install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem('examforge_pwa_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('examforge_pwa_dismissed', 'true');
  };

  if (isStandalone || !showInstallBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[90] max-w-sm w-[calc(100vw-2rem)] sm:w-auto animate-in slide-in-from-bottom duration-300">
      <div className="p-3.5 rounded-2xl bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-700/80 shadow-2xl text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <ExamForgeLogo size={40} showText={false} />
          </div>
          <div>
            <p className="text-xs font-bold leading-tight">Install ExamForge App</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Full screen, fast & no URL bar</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-transform active:scale-95 flex items-center gap-1.5 shadow-sm shadow-indigo-500/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
