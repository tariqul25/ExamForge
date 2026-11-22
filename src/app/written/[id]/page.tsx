'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  ArrowLeft,
  Award,
  Layers,
  HelpCircle,
} from 'lucide-react';
import MathRenderer from '@/components/MathRenderer';
import { WrittenSessionData, WrittenQuestion } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function WrittenSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const hadUser = useRef(Boolean(user));
  const sessionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<WrittenSessionData | null>(null);

  // Immediate redirect on logout during written exam session
  useEffect(() => {
    if (user) {
      hadUser.current = true;
    } else if (hadUser.current) {
      router.replace('/');
    }
  }, [user, router]);

  // Expanded accordion states: questionId -> boolean
  const [expandedAnswers, setExpandedAnswers] = useState<Record<number, boolean>>({});

  // Question statuses: questionId -> 'Not Practiced' | 'Needs Review' | 'Mastered'
  const [statuses, setStatuses] = useState<
    Record<number, 'Not Practiced' | 'Needs Review' | 'Mastered'>
  >({});

  const [savedToRevision, setSavedToRevision] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function fetchWrittenSession() {
      try {
        setLoading(true);
        const res = await fetch(`/api/written/${sessionId}`);
        const data = await res.json();

        if (!res.ok || !data.success || !data.writtenSession) {
          throw new Error(data.error || 'Written session not found');
        }

        const sess: WrittenSessionData = data.writtenSession;
        setSession(sess);

        const initialStatuses: Record<number, 'Not Practiced' | 'Needs Review' | 'Mastered'> = {};
        sess.questions.forEach((q) => {
          initialStatuses[q.id] = q.status || 'Not Practiced';
        });
        setStatuses(initialStatuses);
      } catch (err: any) {
        setError(err.message || 'Failed to load written session');
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      fetchWrittenSession();
    }
  }, [sessionId]);

  const toggleAccordion = (qId: number) => {
    setExpandedAnswers((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleUpdateStatus = async (
    qId: number,
    newStatus: 'Not Practiced' | 'Needs Review' | 'Mastered'
  ) => {
    setStatuses((prev) => ({ ...prev, [qId]: newStatus }));

    try {
      await fetch(`/api/written/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: qId, status: newStatus }),
      });
    } catch (e) {
      // rollback or handle silently
    }
  };

  const handleSaveToRevision = async (q: WrittenQuestion) => {
    try {
      const payload = {
        type: 'written',
        subject: session?.subject,
        topic: session?.topic,
        sessionId: session?._id,
        questionId: q.id,
        question: q.question,
        marks: q.marks,
        modelAnswer: q.modelAnswer,
        keyPoints: q.keyPoints,
        isMastered: false,
      };

      const res = await fetch('/api/revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSavedToRevision((prev) => ({ ...prev, [q.id]: true }));
      }
    } catch (e) {
      alert('Failed to save to Revision Bank');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 animate-spin flex items-center justify-center text-white">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          Loading written questions...
        </p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Session Not Found</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">{error || 'Invalid session ID'}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    );
  }

  const questions = session.questions || [];
  const masteredCount = Object.values(statuses).filter((s) => s === 'Mastered').length;
  const reviewCount = Object.values(statuses).filter((s) => s === 'Needs Review').length;
  const notPracticedCount = Object.values(statuses).filter((s) => s === 'Not Practiced').length;

  return (
    <div className="space-y-8 pb-16">
      {/* Session Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-800/40 shadow-xl print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>{session.subject}</span>
              <span>•</span>
              <span>{session.questionMix}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Written Questions & Self-Evaluation
            </h1>
            <p className="text-sm text-gray-300 mt-1 font-bangla">
              Topic: <strong>{session.topic}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/20"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-md"
            >
              <span>View in Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Mastered
            </span>
            <div className="text-2xl font-extrabold text-emerald-500 mt-0.5">
              {masteredCount} / {questions.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Needs Review
            </span>
            <div className="text-2xl font-extrabold text-amber-500 mt-0.5">
              {reviewCount} / {questions.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Not Practiced
            </span>
            <div className="text-2xl font-extrabold text-gray-400 mt-0.5">
              {notPracticedCount} / {questions.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Instructions callout */}
      <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3 print:hidden">
        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Recommended Study Flow:</span> Write your complete answers on paper without looking at the model answers first. Once done, open the collapsible accordion to self-grade against the AI Model Answer & Key Points, and mark your mastery status!
        </div>
      </div>

      {/* Questions Stack */}
      <div className="space-y-6">
        {questions.map((q, idx) => {
          const currentStatus = statuses[q.id] || 'Not Practiced';
          const isExpanded = expandedAnswers[q.id] || false;
          const isSaved = savedToRevision[q.id] || false;

          return (
            <div
              key={q.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden transition-all"
            >
              {/* Question Card Header */}
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                          {q.marks || 5} Marks
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-relaxed font-sans">
                        <MathRenderer text={q.question} />
                      </h3>
                    </div>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 print:hidden">
                    {(['Not Practiced', 'Needs Review', 'Mastered'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(q.id, st)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          currentStatus === st
                            ? st === 'Mastered'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : st === 'Needs Review'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-xs'
                            : 'border border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collapsible Trigger */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between print:hidden">
                  <button
                    onClick={() => toggleAccordion(q.id)}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>Hide Model Answer & Key Points</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>Show Model Answer & Key Points</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleSaveToRevision(q)}
                    disabled={isSaved}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                      isSaved
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                        : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>Saved to Revision</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Add to Revision Bank</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Model Answer & Key Points Section */}
              {(isExpanded || typeof window === 'undefined') && (
                <div className="p-6 bg-gray-50/70 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800 space-y-4">
                  {/* Model Answer */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Model Answer:</span>
                    </h4>
                    <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-sans">
                      <MathRenderer text={q.modelAnswer} />
                    </div>
                  </div>

                  {/* Key Points Checklist */}
                  {q.keyPoints && q.keyPoints.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Essential Points Required for Full Marks:</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {q.keyPoints.map((kp, kIdx) => (
                          <li
                            key={kIdx}
                            className="flex items-start gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-sans"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                            <span>
                              <MathRenderer text={kp} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
