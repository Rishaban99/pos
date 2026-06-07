import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  jsonError,
  requirePermission,
  requireSession,
} from '@/lib/auth-server';
import { mapUser } from '@/lib/mappers';
import { hashPassword } from '@/auth/password';
import type { UserRole } from '@/auth/types';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (session instanceof NextResponse) return session;

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(users.map(mapUser));
}

export async function POST(request: NextRequest) {
  const session = await requirePermission(request, 'users:manage');
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const username = String(body.username ?? '').trim().toLowerCase();
    const displayName = String(body.displayName ?? '').trim();
    const password = String(body.password ?? '');
    const role = body.role as UserRole;

    if (!username || username.length < 3) {
      return jsonError('Username must be at least 3 characters.');
    }
    if (!displayName) {
      return jsonError('Display name is required.');
    }
    if (!password || password.length < 6) {
      return jsonError('Password must be at least 6 characters.');
    }
    if (role !== 'super_admin' && role !== 'receptionist') {
      return jsonError('Invalid role.');
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return jsonError('Username already exists.');
    }

    const user = await prisma.user.create({
      data: {
        username,
        displayName,
        passwordHash: await hashPassword(password),
        role,
        createdBy: session.userId,
        active: true,
      },
    });

    return NextResponse.json(mapUser(user), { status: 201 });
  } catch {
    return jsonError('Failed to create user.', 500);
  }
}
