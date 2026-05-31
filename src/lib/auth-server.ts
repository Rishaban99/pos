import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasPermission, type Permission } from '@/auth/permissions';
import type { UserRole } from '@/auth/types';

export const SESSION_COOKIE = 'hotel_pos_session';
const SESSION_DAYS = 7;

export interface SessionPayload {
  userId: string;
  username: string;
  role: UserRole;
  displayName: string;
  loggedInAt: string;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonUnauthorized(message = 'Unauthorized') {
  return jsonError(message, 401);
}

export function jsonForbidden(message = 'Forbidden') {
  return jsonError(message, 403);
}

export async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  const user = await prisma.user.findFirst({
    where: { id: session.userId, active: true },
  });
  if (!user) return null;

  return {
    userId: user.id,
    username: user.username,
    role: user.role as UserRole,
    displayName: user.displayName,
    loggedInAt: session.loggedInAt.toISOString(),
  };
}

export async function requireSession(request: NextRequest): Promise<
  SessionPayload | NextResponse
> {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonUnauthorized();
  return session;
}

export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<SessionPayload | NextResponse> {
  const session = await requireSession(request);
  if (session instanceof NextResponse) return session;
  if (!hasPermission(session.role, permission)) {
    return jsonForbidden();
  }
  return session;
}

export async function createSessionCookie(user: {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
}) {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: {
      token,
      userId: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      expiresAt,
    },
  });

  const payload: SessionPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    loggedInAt: new Date().toISOString(),
  };

  const response = NextResponse.json({ session: payload });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export async function destroySession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
}
