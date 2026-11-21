import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const userCookie = req.cookies.get('preplens_user');
    if (!userCookie || !userCookie.value) {
      return NextResponse.json({ success: true, user: null });
    }

    const user = JSON.parse(userCookie.value);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: true, user: null });
  }
}
