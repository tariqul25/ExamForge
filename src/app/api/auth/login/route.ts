import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { memoryStore, hashPassword } from '@/lib/store';

export const runtime = 'nodejs';

const COOKIE_OPTIONS = {
  path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30 days
  sameSite: 'lax' as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Please enter your email and password.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const pwdHash = hashPassword(password);

    const db = await connectToDatabase();
    if (db) {
      try {
        const user = await User.findOne({ email: cleanEmail });
        if (user) {
          if (user.passwordHash !== pwdHash) {
            return NextResponse.json(
              { success: false, error: 'Invalid password. Please try again.' },
              { status: 401 }
            );
          }

          const userData = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar || undefined,
            targetExam: user.targetExam || 'BCS & Bank Jobs',
          };

          const res = NextResponse.json({ success: true, user: userData });
          res.cookies.set('examforge_user', JSON.stringify(userData), COOKIE_OPTIONS);
          return res;
        }
      } catch (err: any) {
        console.warn('MongoDB login query failed, checking memory store:', err.message);
      }
    }

    // In-memory store fallback
    const localUser = memoryStore.getUserByEmail(cleanEmail);
    if (!localUser || localUser.passwordHash !== pwdHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password. Please try again.' },
        { status: 401 }
      );
    }

    const userData = {
      id: localUser.id,
      name: localUser.name,
      email: localUser.email,
      role: localUser.role,
      avatar: localUser.avatar || undefined,
      targetExam: localUser.targetExam || 'BCS & Bank Jobs',
    };

    const res = NextResponse.json({ success: true, user: userData });
    res.cookies.set('examforge_user', JSON.stringify(userData), COOKIE_OPTIONS);
    return res;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
