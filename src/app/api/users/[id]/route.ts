import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, requirePermission } from '@/lib/auth-server';
import { mapUser } from '@/lib/mappers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(request, 'users:manage');
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  if (id === session.userId) {
    return jsonError('You cannot deactivate your own account.');
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return jsonError('User not found.', 404);
  if (!user.active) return jsonError('User is already inactive.');

  const updated = await prisma.user.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json(mapUser(updated));
}
