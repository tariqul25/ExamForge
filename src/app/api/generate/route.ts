import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ExamSession from '@/models/ExamSession';
import WrittenSession from '@/models/WrittenSession';
import { memoryStore } from '@/lib/store';
import { processStudyMaterialWithGemini } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      images = [],
      subject = 'General Knowledge',
      topic = '',
      mode = 'mcq',
      mcqCount = 5,
      difficulty = 'Job-Exam Standard',
      negativeMarking = 0,
      writtenCount = 3,
      questionMix = 'Broad/Descriptive',
      sourceType = 'image',
      isStudyGuide = false,
    } = body;

    // Check auth cookie or body
    let userId: string | undefined = undefined;
    const userCookie = req.cookies.get('examforge_user');
    if (userCookie?.value) {
      try {
        const parsed = JSON.parse(userCookie.value);
        userId = parsed.id;
      } catch (e) {}
    }

    const validatedCount = Math.min(30, Math.max(1, Number(mcqCount) || 5));

    const result = await processStudyMaterialWithGemini({
      images,
      subject,
      topic,
      mode,
      mcqCount: validatedCount,
      difficulty,
      negativeMarking: Number(negativeMarking),
      writtenCount: Number(writtenCount),
      questionMix,
      sourceType,
      isStudyGuide,
    } as any);

    // Resolve final subject (use detectedSubject if AI or topic-matching identified the specific discipline)
    const finalSubject =
      result.detectedSubject && !result.detectedSubject.startsWith('Auto')
        ? result.detectedSubject
        : subject.startsWith('Auto')
        ? 'General Knowledge'
        : subject;

    // Time Limit Rule: Half of the total question count in minutes
    // e.g. 30 MCQs = 15 minutes (900s); 10 MCQs = 5 minutes (300s)
    const questions = result.mcqQuestions || [];
    const timeLimitSeconds = Math.max(60, Math.round(questions.length * 30));

    const db = await connectToDatabase();

    if (mode === 'mcq') {
      if (db) {
        try {
          const session = await ExamSession.create({
            userId,
            subject: finalSubject,
            topic: result.detectedTopic,
            difficulty,
            negativeMarking: Number(negativeMarking),
            totalQuestions: questions.length,
            timeLimitSeconds,
            questions,
            status: 'pending',
            userAnswers: questions.map((q) => ({
              questionId: q.id,
              selectedOption: null,
              isMarkedForReview: false,
            })),
          });

          return NextResponse.json({
            success: true,
            sessionId: session._id.toString(),
            type: 'mcq',
            subject: finalSubject,
            topic: result.detectedTopic,
            summary: result.summaryOfContent,
            isDemoFallback: result.isDemoFallback,
            notes: result.notes,
            exam: session,
          });
        } catch (dbErr: any) {
          console.warn('MongoDB insert failed, saving to local store:', dbErr.message);
        }
      }

      // Memory Store fallback
      const localId = 'exam_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
      const localExam = memoryStore.saveExam({
        _id: localId,
        userId,
        subject: finalSubject,
        topic: result.detectedTopic,
        difficulty,
        negativeMarking: Number(negativeMarking),
        totalQuestions: questions.length,
        timeLimitSeconds,
        questions,
        status: 'pending',
        userAnswers: questions.map((q) => ({
          questionId: q.id,
          selectedOption: null,
          isMarkedForReview: false,
        })),
        score: 0,
        accuracy: 0,
        correctCount: 0,
        wrongCount: 0,
        skippedCount: questions.length,
        timeSpentSeconds: 0,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        sessionId: localId,
        type: 'mcq',
        subject: finalSubject,
        topic: result.detectedTopic,
        summary: result.summaryOfContent,
        isDemoFallback: result.isDemoFallback,
        notes: result.notes,
        exam: localExam,
      });
    } else {
      // Written Questions Mode
      const writtenQuestions = result.writtenQuestions || [];

      if (db) {
        try {
          const session = await WrittenSession.create({
            userId,
            subject: finalSubject,
            topic: result.detectedTopic,
            questionMix,
            totalQuestions: writtenQuestions.length,
            questions: writtenQuestions,
          });

          return NextResponse.json({
            success: true,
            sessionId: session._id.toString(),
            type: 'written',
            subject: finalSubject,
            topic: result.detectedTopic,
            summary: result.summaryOfContent,
            isDemoFallback: result.isDemoFallback,
            notes: result.notes,
          });
        } catch (dbErr: any) {
          console.warn('MongoDB written insert failed, saving to local store:', dbErr.message);
        }
      }

      const localId = 'written_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
      memoryStore.saveWritten({
        _id: localId,
        userId,
        subject: finalSubject,
        topic: result.detectedTopic,
        questionMix,
        totalQuestions: writtenQuestions.length,
        questions: writtenQuestions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        sessionId: localId,
        type: 'written',
        topic: result.detectedTopic,
        summary: result.summaryOfContent,
        isDemoFallback: result.isDemoFallback,
        notes: result.notes,
      });
    }
  } catch (error: any) {
    console.error('Error in /api/generate:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process study material',
      },
      { status: 500 }
    );
  }
}
