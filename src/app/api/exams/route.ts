import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ExamSession from '@/models/ExamSession';
import { memoryStore } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    let userId: string | undefined = undefined;
    const userCookie = req.cookies.get('preplens_user');
    if (userCookie?.value) {
      try {
        const parsed = JSON.parse(userCookie.value);
        userId = parsed.id;
      } catch (e) {}
    }

    const db = await connectToDatabase();
    if (db) {
      try {
        const query: any = userId ? { userId } : { $or: [{ userId: null }, { userId: { $exists: false } }] };
        const exams = await ExamSession.find(query).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, exams: exams || [] });
      } catch (err: any) {
        console.warn('MongoDB query failed, falling back to memory store:', err.message);
      }
    }

    const allExams = memoryStore.getAllExams();
    const userExams = userId
      ? allExams.filter((e) => e.userId === userId)
      : allExams.filter((e) => !e.userId);

    return NextResponse.json({ success: true, exams: userExams });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let userId: string | undefined = undefined;
    const userCookie = req.cookies.get('preplens_user');
    if (userCookie?.value) {
      try {
        const parsed = JSON.parse(userCookie.value);
        userId = parsed.id;
      } catch (e) {}
    }

    const examPayload = {
      ...body,
      userId: userId || body.userId,
    };

    const db = await connectToDatabase();
    if (db) {
      try {
        const session = await ExamSession.create(examPayload);
        return NextResponse.json({ success: true, exam: session });
      } catch (err: any) {
        console.warn('MongoDB insert failed, saving to memory store:', err.message);
      }
    }

    const localId = 'exam_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const examData = {
      ...examPayload,
      _id: localId,
      createdAt: new Date().toISOString(),
    };
    memoryStore.saveExam(examData);
    return NextResponse.json({ success: true, exam: examData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
