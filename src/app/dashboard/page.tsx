'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Target,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
  FileText,
  BookmarkCheck,
  Sparkles,
  BarChart2,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Pin,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { DashboardMetrics } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, openAuthModal } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('examforge_dashboard_cache');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('examforge_dashboard_cache');
    }
    return true;
  });

  // Filters for History Table
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  const [selectedModeFilter, setSelectedModeFilter] = useState<'All' | 'mcq' | 'written'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      if (res.ok && data.success) {
        let mergedMetrics: DashboardMetrics = { ...data.metrics };

        // Seamless local storage synchronization: merge locally taken exams
        if (typeof window !== 'undefined') {
          try {
            const localRaw = localStorage.getItem('examforge_completed_exams');
            if (localRaw) {
              const localCompleted: any[] = JSON.parse(localRaw);
              const serverHistoryIds = new Set((mergedMetrics.recentHistory || []).map((h: any) => h.id));

              localCompleted.forEach((locExam) => {
                if (!serverHistoryIds.has(locExam._id)) {
                  mergedMetrics.recentHistory = [
                    {
                      id: locExam._id,
                      type: 'mcq',
                      subject: locExam.subject,
                      topic: locExam.topic,
                      date: new Date(locExam.completedAt || locExam.createdAt || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }),
                      scoreText: `${locExam.score ?? 0}/${locExam.totalQuestions || locExam.questions?.length || 0}`,
                      status: locExam.status || 'completed',
                    },
                    ...(mergedMetrics.recentHistory || []),
                  ];
                  serverHistoryIds.add(locExam._id);
                }
              });

              if (localCompleted.length > 0) {
                mergedMetrics.totalExamsTaken = Math.max(
                  mergedMetrics.totalExamsTaken,
                  mergedMetrics.recentHistory.length
                );
              }
            }
            localStorage.setItem('examforge_dashboard_cache', JSON.stringify(mergedMetrics));
          } catch (storageErr) {}
        }

        setMetrics(mergedMetrics);
      }
    } catch (e) {
      console.error('Error fetching dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 animate-spin flex items-center justify-center text-white">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          Calculating preparation analytics...
        </p>
      </div>
    );
  }

  const m = metrics || {
    totalExamsTaken: 0,
    overallAccuracy: 0,
    studyStreakDays: 1,
    totalQuestionsSolved: 0,
    subjectPerformance: [],
    scoreTrend: [],
    weaknessAreas: [],
    recentHistory: [],
  };

  // Filter history items
  const filteredHistory = (m.recentHistory || []).filter((item) => {
    const matchesSubject = selectedSubjectFilter === 'All' || item.subject === selectedSubjectFilter;
    const matchesMode = selectedModeFilter === 'All' || item.type === selectedModeFilter;
    const matchesSearch =
      searchTerm.trim() === '' ||
      item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesMode && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Preparation Analytics & Progress
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tracking your competitive job exam readiness across Bangla, English, Math, GK, and IT.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Stats</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <span>+ New Exam</span>
          </Link>
        </div>
      </div>

      {/* Logged-In User Zero-State Banner */}
      {user && m.totalExamsTaken === 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Welcome to ExamForge, {user.name}!</span>
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              You haven&apos;t taken any exams yet. Upload your first study note photos or type any topic to begin tracking your preparation progress!
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>+ Start Your First Exam</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Guest Mode Notice */}
      {!user && (
        <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-indigo-950 dark:text-indigo-200">
            <Pin className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              <strong>Guest Preview Mode:</strong> You are viewing sample preparation metrics across all 5 subjects. Sign in to start your personal daily study streak and track your own exams!
            </span>
          </div>
          <button
            onClick={() => openAuthModal('signin')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 transition-colors shadow-2xs"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Exams Completed
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              {m.totalExamsTaken}
            </div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block mt-1">
              Real-time graded
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Overall Accuracy
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {m.overallAccuracy}%
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
              {m.overallAccuracy >= 70 ? 'High Competitiveness' : 'Aiming for 75%+ target'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Daily Study Streak
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-1">
              {m.studyStreakDays} Days
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-1">
              Keep momentum daily!
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-500 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Questions Solved
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-1">
              {m.totalQuestionsSolved}
            </div>
            <span className="text-[10px] text-gray-400 block mt-1">MCQ + Written tasks</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Weakness Detector Card */}
      {m.weaknessAreas && m.weaknessAreas.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-red-50 to-amber-50 dark:from-amber-950/30 dark:via-red-950/20 dark:to-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Weakness Detector: Focus Areas to Revise
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Topics where accuracy dropped below 65%. Recommended for immediate revision.
                </p>
              </div>
            </div>

            <Link
              href="/revision"
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Go to Revision Bank</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {m.weaknessAreas.map((w, idx) => (
              <div
                key={idx}
                className="bg-white/80 dark:bg-gray-900/80 p-3.5 rounded-xl border border-amber-200/70 dark:border-amber-900/40 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 dark:text-gray-200 truncate">
                    {w.subject}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 font-extrabold text-[10px]">
                    {w.accuracy}% Acc
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium truncate font-bangla">
                  {w.topic}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{w.recommendedAction}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Analytics Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Subject Comparison Bar Chart */}
        <div className="lg:col-span-6 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-500" />
                <span>Subject Accuracy Breakdown</span>
              </h3>
              <p className="text-[11px] text-gray-400">Average % accuracy across core subjects</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.subjectPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="subject"
                  tick={{ fontSize: 11, fill: '#888888' }}
                  tickFormatter={(val) => {
                    if (val === 'Computer Science / IT') return 'CS/IT';
                    if (val === 'General Knowledge') return 'GK';
                    return val;
                  }}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#888888' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value}% Accuracy`, 'Performance']}
                />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Trend Line Chart */}
        <div className="lg:col-span-6 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Recent Exam Performance Trend</span>
              </h3>
              <p className="text-[11px] text-gray-400">Score & accuracy trajectory over time</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {m.scoreTrend && m.scoreTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={m.scoreTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888888' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#888888' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      borderColor: '#374151',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any) => [
                      name === 'accuracy' ? `${val}%` : val,
                      name === 'accuracy' ? 'Accuracy' : 'Raw Score',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Complete your first MCQ exam to visualize your score trend!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exam & Study History Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Exam & Study Session History
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Filter by subject or mode, search by chapter name, and review past sheets.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search topic..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-36 sm:w-44"
              />
            </div>

            {/* Subject Dropdown */}
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 focus:outline-hidden"
            >
              <option value="All">All Subjects</option>
              <option value="Bangla">Bangla</option>
              <option value="English">English</option>
              <option value="Mathematics">Mathematics</option>
              <option value="General Knowledge">General Knowledge</option>
              <option value="Computer Science / IT">Computer Science / IT</option>
            </select>

            {/* Mode Selector */}
            <select
              value={selectedModeFilter}
              onChange={(e) => setSelectedModeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 focus:outline-hidden"
            >
              <option value="All">All Modes</option>
              <option value="mcq">MCQ Exams</option>
              <option value="written">Written Questions</option>
            </select>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Date & Time</th>
                <th className="pb-3 font-semibold">Subject</th>
                <th className="pb-3 font-semibold">Topic / Chapter</th>
                <th className="pb-3 font-semibold">Mode</th>
                <th className="pb-3 font-semibold">Score / Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-3 font-semibold text-gray-900 dark:text-white">
                      {item.subject}
                    </td>
                    <td className="py-3 text-gray-700 dark:text-gray-300 font-bangla max-w-xs truncate">
                      {item.topic}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.type === 'mcq'
                            ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                            : 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300'
                        }`}
                      >
                        {item.type === 'mcq' ? 'MCQ Exam' : 'Written'}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-gray-800 dark:text-gray-200">
                      {item.scoreText}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={item.type === 'mcq' ? `/exam/${item.id}` : `/written/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                      >
                        <span>{item.type === 'mcq' ? 'Review Exam' : 'Open Sheet'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No sessions match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
