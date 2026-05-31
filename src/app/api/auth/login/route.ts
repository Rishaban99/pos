import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createSessionCookie,
  jsonError,
} from '@/lib/auth-server';
import { verifyPassword } from '@/auth/password';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body.username ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!username || !password) {
      return jsonError('Username and password are required.');
    }

    const user = await prisma.user.findFirst({
      where: { username, active: true },
    });

    if (!user) {
      return jsonError('Invalid username or password.', 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return jsonError('Invalid username or password.', 401);
    }

    return createSessionCookie({
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
    });
  } catch {
    return jsonError('Login failed.', 500);
  }
}
