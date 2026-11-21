import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ExamSession from '@/models/ExamSession';
import WrittenSession from '@/models/WrittenSession';
import { memoryStore } from '@/lib/store';
import { ExamSessionData, WrittenSessionData } from '@/types';

export const runtime = 'nodejs';

const CORE_SUBJECTS = [
  'Bangla',
  'English',
  'Mathematics',
  'General Knowledge',
  'Computer Science / IT',
];

const SUBJECT_COLORS: Record<string, string> = {
  Bangla: '#10b981', // emerald
  English: '#3b82f6', // blue
  Mathematics: '#8b5cf6', // purple
  'General Knowledge': '#f59e0b', // amber
  'Computer Science / IT': '#06b6d4', // cyan
};

export async function GET(req: NextRequest) {
  try {
    // Check logged-in user identity
    let userId: string | undefined = undefined;
    const userCookie = req.cookies.get('preplens_user');
    if (userCookie?.value) {
      try {
        const parsed = JSON.parse(userCookie.value);
        userId = parsed.id;
      } catch (e) {}
    }

    let exams: ExamSessionData[] = [];
    let writtenSessions: WrittenSessionData[] = [];

    const db = await connectToDatabase();
    if (db) {
      try {
        const examQuery: any = userId ? { userId } : { $or: [{ userId: null }, { userId: { $exists: false } }] };
        const writtenQuery: any = userId ? { userId } : { $or: [{ userId: null }, { userId: { $exists: false } }] };

        const dbExams = await ExamSession.find(examQuery).sort({ createdAt: -1 }).lean();
        const dbWritten = await WrittenSession.find(writtenQuery).sort({ createdAt: -1 }).lean();
        if (dbExams && dbExams.length > 0) {
          exams = dbExams as unknown as ExamSessionData[];
        }
        if (dbWritten && dbWritten.length > 0) {
          writtenSessions = dbWritten as unknown as WrittenSessionData[];
        }
      } catch (err: any) {
        console.warn('MongoDB dashboard aggregation failed, using memory store:', err.message);
      }
    }

    if (exams.length === 0) {
      const allMemoryExams = memoryStore.getAllExams();
      if (userId) {
        // STRICT USER ISOLATION: A logged-in user only sees their own exams!
        exams = allMemoryExams.filter((e) => e.userId === userId);
      } else {
        // Anonymous guest preview gets demo exams
        exams = allMemoryExams.filter((e) => !e.userId);
      }
    }

    if (writtenSessions.length === 0) {
      const allMemoryWritten = memoryStore.getAllWritten();
      if (userId) {
        writtenSessions = allMemoryWritten.filter((w) => w.userId === userId);
      } else {
        writtenSessions = allMemoryWritten.filter((w) => !w.userId);
      }
    }

    // If logged-in user has 0 exams taken yet, return a clean empty state
    if (userId && exams.length === 0 && writtenSessions.length === 0) {
      return NextResponse.json({
        success: true,
        metrics: {
          totalExamsTaken: 0,
          overallAccuracy: 0,
          studyStreakDays: 0,
          totalQuestionsSolved: 0,
          subjectPerformance: CORE_SUBJECTS.map((subject) => ({
            subject,
            accuracy: 0,
            totalExams: 0,
            color: SUBJECT_COLORS[subject] || '#6366f1',
          })),
          scoreTrend: [],
          weaknessAreas: [],
          recentHistory: [],
        },
      });
    }

    const completedExams = exams.filter((e) => e.status === 'completed');

    // Total Exams Taken
    const totalExamsTaken = completedExams.length;

    // Overall Average Accuracy
    const overallAccuracy =
      totalExamsTaken > 0
        ? Math.round(
            completedExams.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) /
              totalExamsTaken
          )
        : 0;

    // Total Questions Solved
    const totalMCQSolved = completedExams.reduce(
      (acc, curr) => acc + (curr.correctCount || 0) + (curr.wrongCount || 0),
      0
    );
    const totalWrittenPracticed = writtenSessions.reduce(
      (acc, curr) =>
        acc +
        (curr.questions?.filter((q) => q.status !== 'Not Practiced').length || 0),
      0
    );
    const totalQuestionsSolved = totalMCQSolved + totalWrittenPracticed;

    // Daily Study Streak calculation
    const datesWithActivity = new Set<string>();
    completedExams.forEach((e) => {
      datesWithActivity.add(new Date(e.createdAt).toISOString().split('T')[0]);
    });
    writtenSessions.forEach((w) => {
      datesWithActivity.add(new Date(w.createdAt).toISOString().split('T')[0]);
    });
    const studyStreakDays = datesWithActivity.size;

    // Subject-Wise Analytics
    const subjectMap: Record<
      string,
      { totalAccuracy: number; examCount: number; questionsSolved: number }
    > = {};

    CORE_SUBJECTS.forEach((subj) => {
      subjectMap[subj] = { totalAccuracy: 0, examCount: 0, questionsSolved: 0 };
    });

    completedExams.forEach((e) => {
      if (!subjectMap[e.subject]) {
        subjectMap[e.subject] = { totalAccuracy: 0, examCount: 0, questionsSolved: 0 };
      }
      subjectMap[e.subject].totalAccuracy += e.accuracy || 0;
      subjectMap[e.subject].examCount += 1;
      subjectMap[e.subject].questionsSolved += (e.correctCount || 0) + (e.wrongCount || 0);
    });

    const subjectPerformance = Object.keys(subjectMap).map((subject) => {
      const data = subjectMap[subject];
      const avgAcc =
        data.examCount > 0 ? Math.round(data.totalAccuracy / data.examCount) : 0;
      return {
        subject,
        accuracy: avgAcc,
        totalExams: data.examCount,
        color: SUBJECT_COLORS[subject] || '#6366f1',
      };
    });

    // Score Trend over recent exam sessions
    const scoreTrend = completedExams
      .slice(0, 10)
      .reverse()
      .map((e, index) => ({
        examName: `Test ${index + 1} (${e.subject.split(' ')[0]})`,
        accuracy: e.accuracy || 0,
        score: e.score || 0,
        total: e.totalQuestions,
      }));

    // Weakness Detector (< 60% accuracy)
    const weaknessAreas: Array<{
      subject: string;
      topic: string;
      accuracy: number;
      recommendation: string;
    }> = [];

    completedExams.forEach((e) => {
      if ((e.accuracy || 0) < 60) {
        weaknessAreas.push({
          subject: e.subject,
          topic: e.topic,
          accuracy: e.accuracy || 0,
          recommendation: `Revise textbook chapter on ${e.topic} and retake a 10-question practice set.`,
        });
      }
    });

    // Recent Exam & Study History
    const mcqHistory = exams.map((e) => ({
      id: e._id,
      date: new Date(e.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      subject: e.subject,
      topic: e.topic,
      type: 'mcq' as const,
      score: e.status === 'completed' ? `${e.score}/${e.totalQuestions}` : 'Pending',
      accuracy: e.status === 'completed' ? `${e.accuracy}%` : '--',
      status: e.status,
    }));

    const writtenHistory = writtenSessions.map((w) => ({
      id: w._id,
      date: new Date(w.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      subject: w.subject,
      topic: w.topic,
      type: 'written' as const,
      score: `${w.questions?.filter((q) => q.status === 'Mastered').length || 0}/${w.totalQuestions} Mastered`,
      accuracy: '--',
      status: 'completed',
    }));

    const recentHistory = [...mcqHistory, ...writtenHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      success: true,
      metrics: {
        totalExamsTaken,
        overallAccuracy,
        studyStreakDays,
        totalQuestionsSolved,
        subjectPerformance,
        scoreTrend,
        weaknessAreas,
        recentHistory,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
