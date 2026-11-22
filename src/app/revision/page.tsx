'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookmarkCheck,
  Bookmark,
  CheckCircle2,
  Trash2,
  HelpCircle,
  Eye,
  EyeOff,
  Filter,
  Sparkles,
  ArrowRight,
  BookOpen,
  Pin,
  CheckCircle,
} from 'lucide-react';
import MathRenderer from '@/components/MathRenderer';
import { RevisionItemData } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function RevisionBankPage() {
  const { user, openAuthModal } = useAuth();
  const [items, setItems] = useState<RevisionItemData[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('examforge_revision_cache');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('examforge_revision_cache');
    }
    return true;
  });
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'mcq' | 'written'>('All');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'mastered' | 'all'>('pending');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/revision');
      const data = await res.json();
      if (res.ok && data.success) {
        let fetched: RevisionItemData[] = data.items || [];
        // Merge with any locally saved revision items from completed exams
        if (typeof window !== 'undefined') {
          try {
            const localRaw = localStorage.getItem('examforge_local_revision');
            if (localRaw) {
              const localList: RevisionItemData[] = JSON.parse(localRaw);
              const existingIds = new Set(fetched.map((i) => i._id));
              localList.forEach((item) => {
                if (!existingIds.has(item._id)) {
                  fetched.unshift(item);
                  existingIds.add(item._id);
                }
              });
            }
            localStorage.setItem('examforge_revision_cache', JSON.stringify(fetched));
          } catch (e) {}
        }
        setItems(fetched);
      }
    } catch (e) {
      console.error('Error fetching revision items:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMastered = async (id: string, currentState: boolean) => {
    try {
      const newState = !currentState;
      setItems((prev) => {
        const updated = prev.map((it) => (it._id === id ? { ...it, isMastered: newState } : it));
        if (typeof window !== 'undefined') {
          localStorage.setItem('examforge_revision_cache', JSON.stringify(updated));
        }
        return updated;
      });

      await fetch('/api/revision', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isMastered: newState }),
      });
    } catch (e) {
      // rollback or handle
    }
  };

  const deleteItem = async (id: string) => {
    try {
      setItems((prev) => {
        const updated = prev.filter((it) => it._id !== id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('examforge_revision_cache', JSON.stringify(updated));
        }
        return updated;
      });
      await fetch(`/api/revision?id=${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      // handle error
    }
  };

  const masteredCount = items.filter((it) => it.isMastered).length;
  const pendingCount = items.length - masteredCount;

  const filteredItems = items.filter((it) => {
    const matchesSubject = subjectFilter === 'All' || it.subject === subjectFilter;
    const matchesType = typeFilter === 'All' || it.type === typeFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && !it.isMastered) ||
      (statusFilter === 'mastered' && it.isMastered);
    return matchesSubject && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 animate-spin flex items-center justify-center text-white">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          Loading Revision Bank...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-800/40 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <BookmarkCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Smart Mistake & Revision Repository</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Personalized Revision Bank
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl font-sans">
              Mistakes from past exams and questions marked for review are collected here. Practice by testing yourself before revealing the correct answer.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 backdrop-blur-xs text-center">
              <span className="text-[10px] uppercase font-bold text-gray-300 block">Pending</span>
              <span className="text-xl font-extrabold text-amber-400">{pendingCount}</span>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 backdrop-blur-xs text-center">
              <span className="text-[10px] uppercase font-bold text-gray-300 block">Mastered</span>
              <span className="text-xl font-extrabold text-emerald-400">{masteredCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Mode Notice */}
      {!user && (
        <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-indigo-950 dark:text-indigo-200">
            <Pin className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              <strong>Guest Preview Mode:</strong> You are viewing sample revision items. Sign in or register to save your own exam mistakes and maintain a personalized study repository!
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

      {/* Status Segment Tabs: To Revise vs Mastered vs All */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <span>To Revise (Pending)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('mastered')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'mastered'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <span>Mastered</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              statusFilter === 'mastered'
                ? 'bg-emerald-700 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {masteredCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <span>All Questions</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              statusFilter === 'all'
                ? 'bg-indigo-700 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {items.length}
          </span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>Filter:</span>
          </span>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 focus:outline-hidden"
          >
            <option value="All">All Subjects ({items.length})</option>
            <option value="Bangla">Bangla</option>
            <option value="English">English</option>
            <option value="Mathematics">Mathematics</option>
            <option value="General Knowledge">General Knowledge</option>
            <option value="Computer Science / IT">Computer Science / IT</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 focus:outline-hidden"
          >
            <option value="All">All Formats</option>
            <option value="mcq">MCQ Mistakes Only</option>
            <option value="written">Written Review Only</option>
          </select>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          Showing {filteredItems.length} questions
        </div>
      </div>

      {/* Revision Items Stack */}
      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isRevealed = revealedIds[item._id] || false;

            return (
              <div
                key={item._id}
                className={`bg-white dark:bg-gray-900 rounded-2xl border p-5 sm:p-6 transition-all shadow-xs ${item.isMastered
                  ? 'border-emerald-200 dark:border-emerald-950/60 opacity-80'
                  : 'border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-800'
                  }`}
              >
                {/* Item Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${item.type === 'mcq'
                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300'
                        }`}
                    >
                      {item.type === 'mcq' ? 'MCQ Mistake' : 'Written Review'}
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {item.subject}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400 truncate max-w-xs font-bangla">
                      {item.topic}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => toggleMastered(item._id, item.isMastered)}
                      className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${item.isMastered
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                        : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{item.isMastered ? 'Mastered' : 'Mark as Mastered'}</span>
                    </button>

                    <button
                      onClick={() => deleteItem(item._id)}
                      className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                      title="Remove from Revision Bank"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question */}
                <div className="my-4">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-relaxed font-sans">
                    <MathRenderer text={item.question} />
                  </h3>
                </div>

                {/* Options if MCQ */}
                {item.type === 'mcq' && item.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
                    {item.options.map((opt, optIdx) => {
                      const isCorrect = item.correctAnswer === optIdx;
                      const isUserChoice = item.userAnswer === optIdx;

                      let style = 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-300';
                      if (isRevealed) {
                        if (isCorrect) {
                          style = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 font-bold';
                        } else if (isUserChoice) {
                          style = 'border-red-400 bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-100 line-through';
                        }
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${style}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <MathRenderer text={opt} />
                          </div>
                          {isRevealed && isCorrect && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reveal Answer Button */}
                <div className="pt-2">
                  <button
                    onClick={() => toggleReveal(item._id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition-colors"
                  >
                    {isRevealed ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide Explanation</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Reveal Answer & Explanation</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Solution Accordion */}
                {isRevealed && (
                  <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 space-y-2">
                    {item.type === 'mcq' ? (
                      <div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                          Correct Option: {String.fromCharCode(65 + (item.correctAnswer ?? 0))}
                        </span>
                        <div className="leading-relaxed font-sans">
                          <MathRenderer text={item.explanation || ''} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                            Model Answer:
                          </span>
                          <div className="leading-relaxed font-sans">
                            <MathRenderer text={item.modelAnswer || ''} />
                          </div>
                        </div>

                        {item.keyPoints && item.keyPoints.length > 0 && (
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white block mb-1">
                              Key Verification Points:
                            </span>
                            <ul className="list-disc pl-4 space-y-1">
                              {item.keyPoints.map((kp, kIdx) => (
                                <li key={kIdx} className="font-sans">
                                  <MathRenderer text={kp} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Revision Bank is Clear!
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            No questions currently pending revision. Take new exams or upload textbook notes to continue your preparation.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-colors"
          >
            <span>Take a New Exam</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
