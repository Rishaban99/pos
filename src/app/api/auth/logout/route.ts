import { NextRequest, NextResponse } from 'next/server';
import {
  clearSessionCookie,
  destroySession,
} from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  await destroySession(request);
  const response = NextResponse.json({ success: true });
  return clearSessionCookie(response);
}
