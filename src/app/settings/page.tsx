'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Database,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  Moon,
  Sun,
  ShieldCheck,
  FileCode,
  Copy,
  Check,
  Lock,
  Unlock,
  Key,
  User,
  GraduationCap,
  Mail,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PrepLensLogo from '@/components/PrepLensLogo';

export default function SettingsPage() {
  const { user, openAuthModal, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const [isDark, setIsDark] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Admin access unlock state
  const [adminPasscode, setAdminPasscode] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPasscodeError, setAdminPasscodeError] = useState<string | null>(null);

  // Backup / restore status message
  const [backupMsg, setBackupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const importInputRef = useRef<HTMLInputElement>(null);

  const isUserAdmin = user?.role === 'admin' || isAdminUnlocked;

  const fetchHealth = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (e) {
      console.error('Failed to fetch health:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const savedTheme = localStorage.getItem('preplens-theme');
    setIsDark(savedTheme !== 'light');
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('preplens-theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('preplens-theme', 'dark');
      setIsDark(true);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Unlock admin section with passcode
  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasscode.trim() === 'admin123' || adminPasscode.trim() === 'admin') {
      setIsAdminUnlocked(true);
      setAdminPasscodeError(null);
    } else {
      setAdminPasscodeError('Invalid admin passcode. (Hint: default is admin123 or sign in as admin@preplens.com)');
    }
  };

  // Export JSON backup
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preplens-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupMsg({ type: 'success', text: 'Backup downloaded successfully!' });
    } catch (e: any) {
      setBackupMsg({ type: 'error', text: 'Export failed: ' + e.message });
    }
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawJson = event.target?.result as string;
        const parsed = JSON.parse(rawJson);

        const res = await fetch('/api/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setBackupMsg({
            type: 'success',
            text: `Backup restored! (${data.counts.exams} exams, ${data.counts.written} written, ${data.counts.revision} revision items)`,
          });
          fetchHealth();
        } else {
          throw new Error(data.error || 'Failed to restore');
        }
      } catch (err: any) {
        setBackupMsg({ type: 'error', text: 'Invalid JSON backup: ' + err.message });
      }
    };
    reader.readAsText(file);
  };

  // Reset to initial sample data
  const handleResetData = async () => {
    if (!confirm('Are you sure you want to reset all exam, written, and revision records to initial sample data?')) {
      return;
    }
    try {
      const res = await fetch('/api/backup', { method: 'DELETE' });
      if (res.ok) {
        setBackupMsg({ type: 'success', text: 'Study records reset to initial sample set.' });
        fetchHealth();
      }
    } catch (e: any) {
      setBackupMsg({ type: 'error', text: 'Reset failed: ' + e.message });
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Profile & Platform Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your personal study account and platform preferences.
          </p>
        </div>

        {isUserAdmin && (
          <button
            onClick={fetchHealth}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Ping Services</span>
          </button>
        )}
      </div>

      {/* User Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
        <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>User Profile</span>
        </h3>

        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">{user.name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${user.role === 'admin'
                      ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                      }`}
                  >
                    {user.role === 'admin' ? (
                      <>
                        <Shield className="w-3 h-3" />
                        <span>Administrator</span>
                      </>
                    ) : (
                      'Student Account'
                    )}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Target: {user.targetExam || 'BCS & Bank Jobs'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-center space-y-3">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              You are currently viewing as an <strong>Anonymous Guest</strong>. Sign in to track your personal performance and save exams.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => openAuthModal('signin')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Theme & Display Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
        <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
          {isDark ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
          <span>Appearance & Theme</span>
        </h3>

        <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <div>
            <span className="text-xs font-bold text-gray-900 dark:text-white block">
              Color Theme Mode
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Current: {isDark ? 'Dark Mode (Eye comfort for nighttime prep)' : 'Light Mode (High contrast)'}
            </span>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            <span>Switch to {isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>

      {/* Data Backup & Export (Available for Users) */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
        <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-indigo-500" />
          <span>Data Backup & Export</span>
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Export your study sessions, exams, and revision items as a JSON backup or restore past progress.
        </p>

        {backupMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              backupMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{backupMsg.text}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup JSON</span>
          </button>

          <button
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Restore from Backup</span>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportBackup}
          />

          <button
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* Connection & Platform Settings (STRICTLY ADMIN ONLY) */}
      {user?.role === 'admin' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Connection & Platform Settings (Admin Only)</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Restricted to site administrator. Contains Gemini API credentials and database status.
              </p>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1">
              <Unlock className="w-3.5 h-3.5" />
              <span>Admin Verified</span>
            </span>
          </div>

          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Live Services Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Gemini 2.0 Flash Vision</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      health?.gemini?.configured
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {health?.gemini?.configured ? 'Active' : 'Demo Mode'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-gray-500 space-y-1">
                  <div>Key: GEMINI_API_KEY</div>
                  <div>Status: {health?.gemini?.configured ? 'Valid Key Configured' : 'Missing in .env.local'}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-cyan-500" />
                    <span>MongoDB Atlas</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      health?.mongodb?.connected
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                        : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                    }`}
                  >
                    {health?.mongodb?.connected ? 'Atlas Connected' : 'Memory Store'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-gray-500 space-y-1">
                  <div>URI: MONGODB_URI</div>
                  <div>Status: {health?.mongodb?.stateText}</div>
                </div>
              </div>
            </div>

            {/* Quick Setup Instructions & Env Variables Guide */}
            <div className="space-y-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
              <h4 className="font-bold text-gray-900 dark:text-white">
                Environment Configuration Guide (.env.local & Vercel)
              </h4>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white">
                  <span>1. Google Gemini API Key</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <pre className="p-2 rounded-lg bg-gray-900 text-gray-100 font-mono text-[11px] overflow-x-auto">
                  GEMINI_API_KEY=&quot;your_google_ai_studio_key_here&quot;
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white">
                  <span>2. MongoDB Atlas Connection URI</span>
                  <a
                    href="https://cloud.mongodb.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>MongoDB Atlas</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <pre className="p-2 rounded-lg bg-gray-900 text-gray-100 font-mono text-[11px] overflow-x-auto">
                  MONGODB_URI=&quot;mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.xxxxx.mongodb.net/preplens?retryWrites=true&amp;w=majority&quot;
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
