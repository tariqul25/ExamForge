import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import WrittenSession from '@/models/WrittenSession';
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
        const session = await WrittenSession.findById(id).lean();
        if (session) {
          return NextResponse.json({ success: true, writtenSession: session });
        }
      } catch (e) {
        // Not a MongoDB ObjectId
      }
    }

    const localSession = memoryStore.getWrittenById(id);
    if (localSession) {
      return NextResponse.json({ success: true, writtenSession: localSession });
    }

    return NextResponse.json({ success: false, error: 'Written session not found' }, { status: 404 });
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
    const { questionId, status } = body;

    const db = await connectToDatabase();
    let session: any = null;

    if (db) {
      try {
        session = await WrittenSession.findById(id);
        if (session) {
          const q = session.questions.find((item: any) => item.id === questionId);
          if (q) {
            q.status = status;
            await session.save();
            return NextResponse.json({ success: true, writtenSession: session });
          }
        }
      } catch (e) {
        // Fall back to memory store
      }
    }

    const localSession = memoryStore.getWrittenById(id);
    if (localSession) {
      const q = localSession.questions.find((item: any) => item.id === questionId);
      if (q) {
        q.status = status;
        localSession.updatedAt = new Date().toISOString();
        memoryStore.saveWritten(localSession);
        return NextResponse.json({ success: true, writtenSession: localSession });
      }
    }

    return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
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
        await WrittenSession.findByIdAndDelete(id);
      } catch (e) {
        // ignore
      }
    }
    memoryStore.deleteWritten(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
