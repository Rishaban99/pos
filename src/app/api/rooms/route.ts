import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, requirePermission, requireSession } from '@/lib/auth-server';
import { mapRoom, toPrismaRoomType } from '@/lib/mappers';
import type { Room } from '@/types';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (session instanceof NextResponse) return session;

  const rooms = await prisma.room.findMany({ orderBy: { roomNumber: 'asc' } });
  return NextResponse.json(rooms.map(mapRoom));
}

export async function POST(request: NextRequest) {
  const session = await requirePermission(request, 'rooms:manage');
  if (session instanceof NextResponse) return session;

  try {
    const body = (await request.json()) as Omit<Room, 'id'>;
    const room = await prisma.room.create({
      data: {
        name: body.name,
        type: toPrismaRoomType(body.type),
        pricePerNight: body.pricePerNight,
        status: body.status,
        roomNumber: body.roomNumber,
      },
    });
    return NextResponse.json(mapRoom(room), { status: 201 });
  } catch {
    return jsonError('Failed to create room.', 500);
  }
}
