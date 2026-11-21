import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { memoryStore, hashPassword } from '@/lib/store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, targetExam } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Please provide name, email, and password.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const pwdHash = hashPassword(password);
    const role = cleanEmail.includes('admin@') || cleanEmail.endsWith('admin@preplens.com') ? 'admin' : 'user';

    const db = await connectToDatabase();
    if (db) {
      try {
        const existing = await User.findOne({ email: cleanEmail });
        if (existing) {
          return NextResponse.json(
            { success: false, error: 'An account with this email already exists.' },
            { status: 400 }
          );
        }

        const newUser = await User.create({
          name: name.trim(),
          email: cleanEmail,
          passwordHash: pwdHash,
          role,
          avatar: undefined,
          targetExam: targetExam || 'BCS & Bank Jobs',
        });

        const userData = {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatar: newUser.avatar,
          targetExam: newUser.targetExam,
        };

        const res = NextResponse.json({ success: true, user: userData });
        res.cookies.set('preplens_user', JSON.stringify(userData), {
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          sameSite: 'lax',
        });
        return res;
      } catch (err: any) {
        console.warn('MongoDB register fallback:', err.message);
      }
    }

    // In-memory fallback
    const existing = memoryStore.getUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    const localId = 'user_' + Date.now().toString(36);
    const newRecord = {
      id: localId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: pwdHash,
      role: role as 'admin' | 'user',
      avatar: undefined,
      targetExam: targetExam || 'BCS & Bank Jobs',
      createdAt: new Date().toISOString(),
    };
    memoryStore.saveUser(newRecord);

    const userData = {
      id: newRecord.id,
      name: newRecord.name,
      email: newRecord.email,
      role: newRecord.role,
      avatar: newRecord.avatar,
      targetExam: newRecord.targetExam,
    };

    const res = NextResponse.json({ success: true, user: userData });
    res.cookies.set('preplens_user', JSON.stringify(userData), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });
    return res;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
