import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, requirePermission, requireSession } from '@/lib/auth-server';
import { mapAmenityItem } from '@/lib/mappers';
import type { AmenityItem } from '@/types';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (session instanceof NextResponse) return session;

  const items = await prisma.amenityItem.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(items.map(mapAmenityItem));
}

export async function POST(request: NextRequest) {
  const session = await requirePermission(request, 'amenities:manage');
  if (session instanceof NextResponse) return session;

  try {
    const body = (await request.json()) as Omit<AmenityItem, 'id'>;
    const item = await prisma.amenityItem.create({
      data: {
        name: body.name,
        price: body.price,
        category: body.category,
        available: body.available,
      },
    });
    return NextResponse.json(mapAmenityItem(item), { status: 201 });
  } catch {
    return jsonError('Failed to create amenity item.', 500);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requirePermission(request, 'amenities:manage');
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const { id, ...updates } = body as Partial<AmenityItem> & { id: string };
    if (!id) return jsonError('Amenity item id is required.');

    const item = await prisma.amenityItem.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.price !== undefined && { price: updates.price }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.available !== undefined && { available: updates.available }),
      },
    });
    return NextResponse.json(mapAmenityItem(item));
  } catch {
    return jsonError('Failed to update amenity item.', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requirePermission(request, 'amenities:manage');
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return jsonError('Amenity item id is required.');

    await prisma.amenityItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError('Failed to delete amenity item.', 500);
  }
}
