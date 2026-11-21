import { NextRequest, NextResponse } from 'next/server';
import { memoryStore } from '@/lib/store';
import { connectToDatabase } from '@/lib/mongodb';
import ExamSession from '@/models/ExamSession';
import WrittenSession from '@/models/WrittenSession';
import RevisionItem from '@/models/RevisionItem';

export const runtime = 'nodejs';

export async function GET() {
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
      appName: 'PrepLens',
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

export async function DELETE() {
  try {
    memoryStore.resetData();
    const db = await connectToDatabase();
    if (db) {
      try {
        await ExamSession.deleteMany({});
        await WrittenSession.deleteMany({});
        await RevisionItem.deleteMany({});
      } catch (e) {
        // ignore
      }
    }
    return NextResponse.json({ success: true, message: 'All study data reset to initial sample state' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
