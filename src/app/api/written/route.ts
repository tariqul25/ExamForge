import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import WrittenSession from '@/models/WrittenSession';
import { memoryStore } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    let userId: string | undefined = undefined;
    const userCookie = req.cookies.get('examforge_user');
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
        const sessions = await WrittenSession.find(query).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, writtenSessions: sessions || [] });
      } catch (err: any) {
        console.warn('MongoDB query failed, falling back to memory store:', err.message);
      }
    }

    const allSessions = memoryStore.getAllWritten();
    const sessions = userId
      ? allSessions.filter((s) => s.userId === userId)
      : allSessions.filter((s) => !s.userId);

    return NextResponse.json({ success: true, writtenSessions: sessions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let userId: string | undefined = undefined;
    const userCookie = req.cookies.get('examforge_user');
    if (userCookie?.value) {
      try {
        const parsed = JSON.parse(userCookie.value);
        userId = parsed.id;
      } catch (e) {}
    }

    const payload = {
      ...body,
      userId: userId || body.userId,
    };

    const db = await connectToDatabase();
    if (db) {
      try {
        const session = await WrittenSession.create(payload);
        return NextResponse.json({ success: true, writtenSession: session });
      } catch (err: any) {
        console.warn('MongoDB insert failed, saving to memory store:', err.message);
      }
    }

    const localId = 'written_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const sessionData = {
      ...payload,
      _id: localId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryStore.saveWritten(sessionData);
    return NextResponse.json({ success: true, writtenSession: sessionData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
