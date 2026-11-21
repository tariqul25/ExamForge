import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ExamSession from '@/models/ExamSession';
import { memoryStore } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = await connectToDatabase();

    if (db) {
      try {
        const exam = await ExamSession.findById(id).lean();
        if (exam) {
          return NextResponse.json({ success: true, exam });
        }
      } catch (e) {
        // ID might not be an ObjectId, fall back to memory store
      }
    }

    const localExam = memoryStore.getExamById(id);
    if (localExam) {
      return NextResponse.json({ success: true, exam: localExam });
    }

    return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { userAnswers, timeSpentSeconds, status } = body;

    const db = await connectToDatabase();
    let currentExam: any = null;

    if (db) {
      try {
        currentExam = await ExamSession.findById(id);
      } catch (e) {
        // Not a MongoDB ObjectId
      }
    }

    if (!currentExam) {
      currentExam = memoryStore.getExamById(id);
    }

    if (!currentExam) {
      return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
    }

    // Calculate score, accuracy, counts
    const questions = currentExam.questions || [];
    const negativeMarking = currentExam.negativeMarking || 0;

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    const answersMap = new Map();
    if (Array.isArray(userAnswers)) {
      userAnswers.forEach((ans: any) => {
        answersMap.set(ans.questionId, ans);
      });
    }

    questions.forEach((q: any) => {
      const userAns = answersMap.get(q.id);
      if (userAns && userAns.selectedOption !== null && userAns.selectedOption !== undefined) {
        if (Number(userAns.selectedOption) === Number(q.correctAnswer)) {
          correctCount++;
        } else {
          wrongCount++;
        }
      } else {
        skippedCount++;
      }
    });

    const rawScore = correctCount * 1.0 - wrongCount * negativeMarking;
    const finalScore = Math.max(0, Number(rawScore.toFixed(2)));
    const totalAttempted = correctCount + wrongCount;
    const accuracy =
      totalAttempted > 0
        ? Math.round((correctCount / totalAttempted) * 100)
        : 0;

    const updatedData = {
      userAnswers: userAnswers || currentExam.userAnswers,
      timeSpentSeconds: timeSpentSeconds !== undefined ? timeSpentSeconds : currentExam.timeSpentSeconds,
      status: status || 'completed',
      score: finalScore,
      accuracy,
      correctCount,
      wrongCount,
      skippedCount,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    };

    if (db && currentExam.save) {
      try {
        Object.assign(currentExam, updatedData);
        await currentExam.save();
        return NextResponse.json({ success: true, exam: currentExam });
      } catch (err: any) {
        console.warn('Failed to update in MongoDB, saving to memory store:', err.message);
      }
    }

    const updatedLocal = memoryStore.saveExam({
      ...currentExam,
      ...updatedData,
    });

    return NextResponse.json({ success: true, exam: updatedLocal });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = await connectToDatabase();
    if (db) {
      try {
        await ExamSession.findByIdAndDelete(id);
      } catch (e) {
        // ignore
      }
    }
    memoryStore.deleteExam(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
