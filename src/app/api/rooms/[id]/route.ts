import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, requirePermission } from '@/lib/auth-server';
import { mapRoom, toPrismaRoomType } from '@/lib/mappers';
import type { Room } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(request, 'rooms:manage');
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = (await request.json()) as Partial<Room>;

  try {
    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.type !== undefined && { type: toPrismaRoomType(body.type) }),
        ...(body.pricePerNight !== undefined && { pricePerNight: body.pricePerNight }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.roomNumber !== undefined && { roomNumber: body.roomNumber }),
      },
    });
    return NextResponse.json(mapRoom(room));
  } catch {
    return jsonError('Failed to update room.', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(request, 'rooms:manage');
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  try {
    await prisma.room.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError('Failed to delete room.', 500);
  }
}
