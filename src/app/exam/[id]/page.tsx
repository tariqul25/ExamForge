'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Clock,
  Pause,
  Play,
  Bookmark,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  BookmarkCheck,
  Check,
  AlertCircle,
  Trophy,
  BarChart3,
  ListFilter,
  CheckSquare,
  Home,
} from 'lucide-react';
import MathRenderer from '@/components/MathRenderer';
import { ExamSessionData, MCQQuestion } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function ExamSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const hadUser = useRef(Boolean(user));
  const examId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<ExamSessionData | null>(null);

  // Active question index (0-based)
  const [currentIndex, setCurrentIndex] = useState(0);

  // User responses: questionId -> { selectedOption: number | null, isMarkedForReview: boolean }
  const [answers, setAnswers] = useState<
    Record<number, { selectedOption: number | null; isMarkedForReview: boolean }>
  >({});

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Submission & review state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savedToRevision, setSavedToRevision] = useState(false);
  const [isSavingRevision, setIsSavingRevision] = useState(false);

  // Filter in review mode: 'all' | 'wrong' | 'correct' | 'skipped'
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'correct' | 'skipped'>('all');

  // Immediate redirect on logout during exam session
  useEffect(() => {
    if (user) {
      hadUser.current = true;
    } else if (hadUser.current) {
      if (timerRef.current) clearInterval(timerRef.current);
      router.replace('/');
    }
  }, [user, router]);

  // Load Exam Data
  useEffect(() => {
    async function fetchExam() {
      try {
        setLoading(true);
        let examData: ExamSessionData | null = null;

        // 1. Try fetching from server
        try {
          const res = await fetch(`/api/exams/${examId}`);
          const data = await res.json();
          if (res.ok && data.success && data.exam) {
            examData = data.exam;
          }
        } catch (fetchErr) {
          console.warn('Network/server fetch error, will check local cache:', fetchErr);
        }

        // 2. If server didn't find it (e.g. serverless instance died/404), check localStorage
        if (!examData && typeof window !== 'undefined') {
          const cached = localStorage.getItem('examforge_exam_' + examId);
          if (cached) {
            try {
              examData = JSON.parse(cached);
            } catch (e) {}
          }
        }

        if (!examData) {
          throw new Error('Exam session not found or has expired.');
        }

        // Cache locally for offline/refresh resilience
        if (typeof window !== 'undefined') {
          localStorage.setItem('examforge_exam_' + examId, JSON.stringify(examData));
        }

        setExam(examData);

        // Prepopulate answers
        const initialAnswers: Record<
          number,
          { selectedOption: number | null; isMarkedForReview: boolean }
        > = {};
        if (examData.userAnswers && examData.userAnswers.length > 0) {
          examData.userAnswers.forEach((ans) => {
            initialAnswers[ans.questionId] = {
              selectedOption: ans.selectedOption,
              isMarkedForReview: ans.isMarkedForReview || false,
            };
          });
        } else {
          examData.questions.forEach((q) => {
            initialAnswers[q.id] = { selectedOption: null, isMarkedForReview: false };
          });
        }
        setAnswers(initialAnswers);

        // Check if already completed
        if (examData.status === 'completed') {
          setIsCompleted(true);
        } else {
          // Initialize timer: Remaining time (Half the number of questions in minutes)
          const totalLimit = examData.timeLimitSeconds || Math.max(60, Math.round(examData.questions.length * 30));
          setTimeLeft(totalLimit);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load exam');
      } finally {
        setLoading(false);
      }
    }

    if (examId) {
      fetchExam();
    }
  }, [examId]);

  // Timer Tick
  useEffect(() => {
    if (loading || isCompleted || isPaused || timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, isCompleted, isPaused, timeLeft]);

  // Submit full exam
  const handleSubmitExam = async () => {
    if (!exam || isCompleted || isSubmitting) return;

    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
        questionId: Number(qId),
        selectedOption: ans.selectedOption,
        isMarkedForReview: ans.isMarkedForReview,
      }));

      const totalTime = exam.timeLimitSeconds || exam.questions.length * 60;
      const timeSpent = Math.max(1, totalTime - timeLeft);

      // Local score calculation for bulletproof client resilience
      let correctCount = 0;
      let wrongCount = 0;
      let skippedCount = 0;
      const negativeMarking = exam.negativeMarking || 0;

      exam.questions.forEach((q) => {
        const userAns = answers[q.id]?.selectedOption;
        if (userAns === null || userAns === undefined) {
          skippedCount++;
        } else if (userAns === q.correctAnswer) {
          correctCount++;
        } else {
          wrongCount++;
        }
      });

      const rawScore = correctCount * 1 - wrongCount * negativeMarking;
      const score = Math.max(0, Math.round(rawScore * 100) / 100);
      const totalGraded = correctCount + wrongCount;
      const accuracy = totalGraded > 0 ? Math.round((correctCount / totalGraded) * 100) : 0;

      let finalizedExam: ExamSessionData = {
        ...exam,
        status: 'completed',
        userAnswers: formattedAnswers,
        timeSpentSeconds: timeSpent,
        score,
        accuracy,
        correctCount,
        wrongCount,
        skippedCount,
        completedAt: new Date().toISOString(),
      };

      // 1. Try sending to server
      try {
        const res = await fetch(`/api/exams/${examId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAnswers: formattedAnswers,
            timeSpentSeconds: timeSpent,
            status: 'completed',
            userId: user?.id,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.exam) {
          finalizedExam = data.exam;
        }
      } catch (serverErr) {
        console.warn('Server submission issue, using local exam calculation:', serverErr);
      }

      if (user?.id) {
        finalizedExam.userId = user.id;
      }

      // 2. Save completed exam to localStorage so it is never lost on sign-out or refresh
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('examforge_exam_' + examId, JSON.stringify(finalizedExam));
          const completedList: ExamSessionData[] = JSON.parse(
            localStorage.getItem('examforge_completed_exams') || '[]'
          );
          const filtered = completedList.filter((e) => e._id !== examId);
          filtered.unshift(finalizedExam);
          localStorage.setItem('examforge_completed_exams', JSON.stringify(filtered.slice(0, 30)));
        } catch (storageErr) {}
      }

      setExam(finalizedExam);
      setIsCompleted(true);

      // Trigger celebration confetti if score is >= 70%
      if (finalizedExam.accuracy >= 70) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      setIsCompleted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Select Option for Active Question
  const handleSelectOption = (optionIndex: number) => {
    if (isCompleted || !exam) return;
    const currentQ = exam.questions[currentIndex];
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selectedOption: optionIndex,
        isMarkedForReview: prev[currentQ.id]?.isMarkedForReview || false,
      },
    }));
  };

  // Clear choice
  const handleClearChoice = () => {
    if (isCompleted || !exam) return;
    const currentQ = exam.questions[currentIndex];
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selectedOption: null,
        isMarkedForReview: prev[currentQ.id]?.isMarkedForReview || false,
      },
    }));
  };

  // Toggle Mark for Review
  const handleToggleReview = () => {
    if (isCompleted || !exam) return;
    const currentQ = exam.questions[currentIndex];
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selectedOption: prev[currentQ.id]?.selectedOption ?? null,
        isMarkedForReview: !prev[currentQ.id]?.isMarkedForReview,
      },
    }));
  };

  // Retake this exam
  const handleRetakeExam = async () => {
    if (!exam) return;
    const resetAnswers: Record<
      number,
      { selectedOption: number | null; isMarkedForReview: boolean }
    > = {};
    exam.questions.forEach((q) => {
      resetAnswers[q.id] = { selectedOption: null, isMarkedForReview: false };
    });

    setAnswers(resetAnswers);
    setIsCompleted(false);
    setCurrentIndex(0);
    setSavedToRevision(false);
    setTimeLeft(exam.timeLimitSeconds || exam.questions.length * 60);

    // Update server status back to pending
    await fetch(`/api/exams/${examId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAnswers: [],
        status: 'pending',
      }),
    });
  };

  // Save mistakes to revision bank
  const handleSaveMistakesToRevision = async () => {
    if (!exam || !isCompleted || isSavingRevision) return;

    setIsSavingRevision(true);
    try {
      const mistakeItems: any[] = [];

      exam.questions.forEach((q) => {
        const userAns = answers[q.id]?.selectedOption;
        // If wrong or skipped
        if (userAns === null || userAns === undefined || userAns !== q.correctAnswer) {
          mistakeItems.push({
            type: 'mcq',
            subject: exam.subject,
            topic: exam.topic,
            sessionId: exam._id,
            questionId: q.id,
            question: q.question,
            options: q.options,
            userAnswer: userAns,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            isMastered: false,
          });
        }
      });

      if (mistakeItems.length === 0) {
        alert('All questions answered correctly! No mistakes to add to Revision Bank.');
        return;
      }

      // 1. Save mistake items to localStorage cache
      if (typeof window !== 'undefined') {
        try {
          const localRev = JSON.parse(localStorage.getItem('examforge_local_revision') || '[]');
          const toAdd = mistakeItems.map((m, idx) => ({
            ...m,
            _id: 'rev_loc_' + Date.now().toString(36) + '_' + idx,
            createdAt: new Date().toISOString(),
          }));
          const combined = [...toAdd, ...localRev];
          localStorage.setItem('examforge_local_revision', JSON.stringify(combined.slice(0, 50)));
        } catch (storageErr) {}
      }

      // 2. Try saving to server
      try {
        await fetch('/api/revision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mistakeItems),
        });
      } catch (e) {
        console.warn('Server revision sync notice:', e);
      }

      setSavedToRevision(true);
    } catch (err: any) {
      alert('Failed to save to Revision Bank: ' + err.message);
    } finally {
      setIsSavingRevision(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 animate-spin flex items-center justify-center text-white">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          Loading exam session...
        </p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Exam Not Found</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">{error || 'Invalid session ID'}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    );
  }

  const questions = exam.questions || [];
  const currentQ = questions[currentIndex] || questions[0];
  const currentAnswer = answers[currentQ?.id];

  // Counts for summary & navigation palette
  const answeredCount = Object.values(answers).filter((a) => a.selectedOption !== null).length;
  const markedCount = Object.values(answers).filter((a) => a.isMarkedForReview).length;
  const unansweredCount = questions.length - answeredCount;

  // Format timer seconds into mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // If exam is completed, show Detailed Result & Review Screen
  if (isCompleted) {
    const score = exam.score ?? 0;
    const accuracy = exam.accuracy ?? 0;
    const correctCount = exam.correctCount ?? 0;
    const wrongCount = exam.wrongCount ?? 0;
    const skippedCount = exam.skippedCount ?? 0;
    const timeSpent = exam.timeSpentSeconds ?? 0;

    // Filter questions for review
    const filteredQuestions = questions.filter((q) => {
      const ans = answers[q.id]?.selectedOption;
      if (reviewFilter === 'wrong') return ans !== null && ans !== undefined && ans !== q.correctAnswer;
      if (reviewFilter === 'correct') return ans === q.correctAnswer;
      if (reviewFilter === 'skipped') return ans === null || ans === undefined;
      return true;
    });

    return (
      <div className="space-y-8 pb-16">
        {/* Result Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-800/40 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
                <span>{exam.subject}</span>
                <span>•</span>
                <span>{exam.difficulty}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Exam Performance Analysis
              </h1>
              <p className="text-sm text-gray-300 mt-1 font-bangla">
                Topic: <strong>{exam.topic}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleRetakeExam}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/20 backdrop-blur-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Exam</span>
              </button>

              <button
                onClick={handleSaveMistakesToRevision}
                disabled={savedToRevision || isSavingRevision || wrongCount + skippedCount === 0}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
                  savedToRevision
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {savedToRevision ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    <span>Saved to Revision Bank!</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>
                      Save {wrongCount + skippedCount} Mistakes to Revision Bank
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Metric Summary Scorecards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Final Score
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {score}
              </span>
              <span className="text-xs text-gray-400">/ {questions.length}</span>
            </div>
            {exam.negativeMarking > 0 && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5">
                -{exam.negativeMarking} per wrong
              </span>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Accuracy
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`text-2xl font-extrabold ${
                  accuracy >= 75
                    ? 'text-emerald-500'
                    : accuracy >= 50
                    ? 'text-amber-500'
                    : 'text-red-500'
                }`}
              >
                {accuracy}%
              </span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              {accuracy >= 75 ? 'Mastery Level' : accuracy >= 50 ? 'Moderate' : 'Needs Review'}
            </span>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Correct
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-emerald-500">{correctCount}</span>
              <span className="text-xs text-gray-400">({Math.round((correctCount / questions.length) * 100)}%)</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
              +{(correctCount * 1).toFixed(1)} marks
            </span>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Wrong
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-red-500">{wrongCount}</span>
            </div>
            <span className="text-[10px] text-red-500 block mt-0.5">
              -{((wrongCount * exam.negativeMarking) || 0).toFixed(2)} penalty
            </span>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Skipped
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-gray-400">{skippedCount}</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-0.5">0 penalty</span>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Time Spent
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {formatTime(timeSpent)}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              ~{Math.round(timeSpent / questions.length)}s per question
            </span>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Question-by-Question Solution & AI Explanations</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Review your choices, see correct answers, and understand the core concept.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs">
              {(
                [
                  { id: 'all', label: `All (${questions.length})` },
                  { id: 'wrong', label: `Wrong (${wrongCount})` },
                  { id: 'correct', label: `Correct (${correctCount})` },
                  { id: 'skipped', label: `Skipped (${skippedCount})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setReviewFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    reviewFilter === f.id
                      ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {filteredQuestions.map((q, qIndex) => {
              const userAns = answers[q.id]?.selectedOption;
              const isCorrect = userAns === q.correctAnswer;
              const isSkipped = userAns === null || userAns === undefined;

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isCorrect
                      ? 'border-emerald-200 dark:border-emerald-950/80 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : isSkipped
                      ? 'border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/20'
                      : 'border-red-200 dark:border-red-950/80 bg-red-50/20 dark:bg-red-950/10'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isCorrect
                            ? 'bg-emerald-500 text-white'
                            : isSkipped
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {q.id}
                      </span>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white leading-relaxed font-sans">
                        <MathRenderer text={q.question} />
                      </h3>
                    </div>

                    <div className="shrink-0">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correct (+1)</span>
                        </span>
                      ) : isSkipped ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold">
                          <span>Skipped (0)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 text-xs font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Wrong (-{exam.negativeMarking})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-4">
                    {q.options.map((opt, optIdx) => {
                      const isThisSelected = userAns === optIdx;
                      const isThisCorrect = q.correctAnswer === optIdx;

                      let style = 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300';
                      if (isThisCorrect) {
                        style = 'border-emerald-500 bg-emerald-100/60 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/20';
                      } else if (isThisSelected && !isThisCorrect) {
                        style = 'border-red-500 bg-red-100/60 dark:bg-red-950/70 text-red-900 dark:text-red-100 font-bold ring-2 ring-red-500/20';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2 transition-all ${style}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <MathRenderer text={opt} />
                          </div>

                          {isThisCorrect && (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Correct Answer</span>
                            </span>
                          )}
                          {isThisSelected && !isThisCorrect && (
                            <span className="text-[11px] font-bold text-red-600 dark:text-red-400 shrink-0 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Your Choice</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Explanation Box */}
                  <div className="mt-3 p-3.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                    <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>AI Concept Breakdown & Solution:</span>
                    </div>
                    <p className="leading-relaxed font-sans">
                      <MathRenderer text={q.explanation} />
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>

            <Link
              href="/revision"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-colors"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>Go to Revision Bank</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active Exam Taking Screen
  return (
    <div className="space-y-6 pb-16">
      {/* Top Exam Header with Timer & Submit */}
      <div className="sticky top-18 z-40 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-800 p-4 shadow-sm transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              #{currentIndex + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-900 dark:text-white">
                  {exam.subject}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {exam.difficulty}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs sm:max-w-md font-bangla">
                {exam.topic}
              </p>
            </div>
          </div>

          {/* Timer & Controls */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Timer Pill */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                timeLeft < 60
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 animate-pulse'
                  : 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Pause / Resume button */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={isPaused ? 'Resume exam' : 'Pause timer'}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-500" /> : <Pause className="w-4 h-4" />}
            </button>

            {/* Submit Button */}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95"
            >
              Submit Full Exam
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Grid: Active Question Card (Left) & Question Palette (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Question Box */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-6 min-h-[420px] flex flex-col justify-between">
            <div>
              {/* Question header info */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  Question {currentIndex + 1} of {questions.length}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleReview}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      currentAnswer?.isMarkedForReview
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                        : 'border border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>
                      {currentAnswer?.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
                    </span>
                  </button>

                  {currentAnswer?.selectedOption !== null && (
                    <button
                      onClick={handleClearChoice}
                      className="text-xs text-gray-400 hover:text-red-500 underline transition-colors"
                    >
                      Clear Choice
                    </button>
                  )}
                </div>
              </div>

              {/* Question Text with Bangla & KaTeX support */}
              <div className="my-5">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-relaxed font-sans">
                  <MathRenderer text={currentQ.question} />
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((opt, optIndex) => {
                  const isSelected = currentAnswer?.selectedOption === optIndex;
                  return (
                    <button
                      key={optIndex}
                      onClick={() => handleSelectOption(optIndex)}
                      className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 font-semibold text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50/60 dark:hover:bg-gray-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-gray-300 dark:border-gray-600 text-gray-500 group-hover:border-indigo-400'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span className="leading-relaxed">
                          <MathRenderer text={opt} />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  currentIndex === 0
                    ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="text-xs text-gray-400">
                {currentIndex + 1} / {questions.length}
              </div>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Finish & Submit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Question Navigation Palette */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Question Palette
            </h3>

            {/* Palette legend */}
            <div className="grid grid-cols-3 gap-2 text-[11px] pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-gray-600 dark:text-gray-400">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-gray-600 dark:text-gray-400">Review ({markedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                <span className="text-gray-600 dark:text-gray-400">Left ({unansweredCount})</span>
              </div>
            </div>

            {/* Clickable Question Grid (Supports up to 30 MCQs) */}
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[360px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isCurrent = currentIndex === idx;
                const isAnswered = ans?.selectedOption !== null && ans?.selectedOption !== undefined;
                const isMarked = ans?.isMarkedForReview;

                let colorClasses = 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800';
                if (isMarked) {
                  colorClasses = 'bg-amber-400 text-slate-900 font-bold border-amber-500';
                } else if (isAnswered) {
                  colorClasses = 'bg-emerald-500 text-white font-bold border-emerald-600';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl border text-xs font-bold transition-all relative ${colorClasses} ${
                      isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900' : ''
                    }`}
                  >
                    {idx + 1}
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-1 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Session Stats */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Negative Marking:</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {exam.negativeMarking > 0 ? `-${exam.negativeMarking} marks` : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{questions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Submit Your Exam?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You will immediately receive your score, accuracy %, and full AI explanations.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Answered:</span>
                <span className="font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Unanswered / Skipped:</span>
                <span className="font-bold text-red-500">{unansweredCount}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Marked for Review:</span>
                <span className="font-bold text-amber-500">{markedCount}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Keep Testing
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleSubmitExam}
                className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-md shadow-indigo-500/20"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
