import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const userCount = await prisma.user.count();
  const bootstrapConfigured = Boolean(
    process.env.NEXT_PUBLIC_INITIAL_SUPER_ADMIN_USERNAME?.trim() &&
      process.env.INITIAL_SUPER_ADMIN_PASSWORD?.trim()
  );

  return NextResponse.json({
    session,
    hasUsers: userCount > 0,
    bootstrapConfigured,
  });
}
