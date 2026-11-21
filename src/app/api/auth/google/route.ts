import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { memoryStore } from '@/lib/store';

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
    const { name, email, avatar, googleUid } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Google account email is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const displayName = name ? name.trim() : cleanEmail.split('@')[0];
    const configuredAdmin = (process.env.ADMIN_EMAIL || 'admin@examforge.com').toLowerCase().trim();
    const role = cleanEmail === configuredAdmin ? 'admin' : 'user';

    const db = await connectToDatabase();
    if (db) {
      try {
        let user = await User.findOne({ email: cleanEmail });

        if (user) {
          // Update profile details
          user.authProvider = 'google';
          if (avatar && !user.avatar) user.avatar = avatar;
          if (googleUid) user.googleId = googleUid;
          await user.save();
        } else {
          user = await User.create({
            name: displayName,
            email: cleanEmail,
            role,
            avatar: avatar || undefined,
            targetExam: 'BCS & Bank Jobs',
            authProvider: 'google',
            googleId: googleUid || undefined,
          });
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
      } catch (err: any) {
        console.warn('MongoDB Google login error, falling back to memoryStore:', err.message);
      }
    }

    // In-memory fallback
    let localUser = memoryStore.getUserByEmail(cleanEmail);
    if (!localUser) {
      localUser = memoryStore.createUser({
        name: displayName,
        email: cleanEmail,
        role,
        avatar: avatar || undefined,
        targetExam: 'BCS & Bank Jobs',
      });
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
    console.error('Google Auth Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Google authentication failed.' },
      { status: 500 }
    );
  }
}
