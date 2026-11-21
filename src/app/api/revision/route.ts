import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import RevisionItem from '@/models/RevisionItem';
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

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const type = searchParams.get('type');

    const db = await connectToDatabase();
    if (db) {
      try {
        const query: any = userId ? { userId } : { $or: [{ userId: null }, { userId: { $exists: false } }] };
        if (subject && subject !== 'All') query.subject = subject;
        if (type && type !== 'All') query.type = type;

        const items = await RevisionItem.find(query).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, items: items || [] });
      } catch (err: any) {
        console.warn('MongoDB revision query failed, falling back to memory store:', err.message);
      }
    }

    const allItems = memoryStore.getAllRevision();
    let items = userId
      ? allItems.filter((i) => i.userId === userId)
      : allItems.filter((i) => !i.userId);

    if (subject && subject !== 'All') {
      items = items.filter((i) => i.subject === subject);
    }
    if (type && type !== 'All') {
      items = items.filter((i) => i.type === type);
    }

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let userId: string | undefined = undefined;
    const userCookie = req.cookies.get('preplens_user');
    if (userCookie?.value) {
      try {
        const parsed = JSON.parse(userCookie.value);
        userId = parsed.id;
      } catch (e) {}
    }

    const body = await req.json();
    const db = await connectToDatabase();

    const itemsToAdd = Array.isArray(body) ? body : [body];
    const createdItems = [];

    for (const item of itemsToAdd) {
      const itemWithUser = {
        ...item,
        userId: userId || item.userId,
      };

      if (db) {
        try {
          const created = await RevisionItem.create({
            ...itemWithUser,
            createdAt: new Date(),
          });
          createdItems.push(created);
          continue;
        } catch (dbErr: any) {
          console.warn('MongoDB revision insert failed, using memory store:', dbErr.message);
        }
      }

      const localId = 'rev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
      const saved = memoryStore.saveRevisionItem({
        ...itemWithUser,
        _id: localId,
        createdAt: new Date().toISOString(),
      });
      createdItems.push(saved);
    }

    return NextResponse.json({ success: true, count: createdItems.length, items: createdItems });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
