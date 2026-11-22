import { NextRequest, NextResponse } from 'next/server';
import { memoryStore } from '@/lib/store';
import { connectToDatabase } from '@/lib/mongodb';
import ExamSession from '@/models/ExamSession';
import WrittenSession from '@/models/WrittenSession';
import RevisionItem from '@/models/RevisionItem';

export const runtime = 'nodejs';

function getUser(req: NextRequest): { id: string; role?: string } | null {
  try {
    const userCookie = req.cookies.get('examforge_user');
    if (!userCookie || !userCookie.value) return null;
    return JSON.parse(userCookie.value);
  } catch {
    return null;
  }
}

function verifyAdmin(req: NextRequest): boolean {
  const user = getUser(req);
  return Boolean(user && user.role === 'admin');
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
  }
  try {
    const db = await connectToDatabase();
    let exams = memoryStore.getAllExams();
    let written = memoryStore.getAllWritten();
    let revision = memoryStore.getAllRevision();

    if (db) {
      try {
        const dbExams = await ExamSession.find().lean();
        const dbWritten = await WrittenSession.find().lean();
        const dbRevision = await RevisionItem.find().lean();
        if (dbExams.length > 0) exams = dbExams as any;
        if (dbWritten.length > 0) written = dbWritten as any;
        if (dbRevision.length > 0) revision = dbRevision as any;
      } catch (e) {
        // use memoryStore
      }
    }

    const backupData = {
      appName: 'ExamForge',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      counts: {
        exams: exams.length,
        written: written.length,
        revision: revision.length,
      },
      data: {
        exams,
        writtenSessions: written,
        revisionItems: revision,
      },
    };

    return NextResponse.json(backupData);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json({ success: false, error: 'Invalid backup format' }, { status: 400 });
    }

    memoryStore.importAll(data);

    const db = await connectToDatabase();
    if (db) {
      try {
        if (Array.isArray(data.exams) && data.exams.length > 0) {
          await ExamSession.deleteMany({});
          await ExamSession.insertMany(data.exams);
        }
        if (Array.isArray(data.writtenSessions) && data.writtenSessions.length > 0) {
          await WrittenSession.deleteMany({});
          await WrittenSession.insertMany(data.writtenSessions);
        }
        if (Array.isArray(data.revisionItems) && data.revisionItems.length > 0) {
          await RevisionItem.deleteMany({});
          await RevisionItem.insertMany(data.revisionItems);
        }
      } catch (err: any) {
        console.warn('MongoDB backup restore partial failure:', err.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Backup imported successfully',
      counts: {
        exams: data.exams?.length || 0,
        written: data.writtenSessions?.length || 0,
        revision: data.revisionItems?.length || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = getUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Please sign in.' }, { status: 401 });
  }
  try {
    const userId = user.id;
    const isAdmin = user.role === 'admin';

    // 1. Clear memory store completely without dummy seed data
    if (isAdmin) {
      memoryStore.clearAllExamsAndSessions();
    } else if (userId) {
      memoryStore.clearUserData(userId);
    }

    // 2. Clear MongoDB
    const db = await connectToDatabase();
    if (db) {
      try {
        const query = isAdmin ? {} : { userId };
        await ExamSession.deleteMany(query);
        await WrittenSession.deleteMany(query);
        await RevisionItem.deleteMany(query);
      } catch (e) {
        console.warn('MongoDB delete failed:', e);
      }
    }
    return NextResponse.json({ success: true, message: 'All study records reset successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
