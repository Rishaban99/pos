import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, requirePermission, requireSession } from '@/lib/auth-server';
import { mapFoodItem } from '@/lib/mappers';
import type { FoodItem } from '@/types';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (session instanceof NextResponse) return session;

  const items = await prisma.foodItem.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(items.map(mapFoodItem));
}

export async function POST(request: NextRequest) {
  const session = await requirePermission(request, 'food:manage');
  if (session instanceof NextResponse) return session;

  try {
    const body = (await request.json()) as Omit<FoodItem, 'id'>;
    const item = await prisma.foodItem.create({
      data: {
        name: body.name,
        price: body.price,
        category: body.category,
        available: body.available,
      },
    });
    return NextResponse.json(mapFoodItem(item), { status: 201 });
  } catch {
    return jsonError('Failed to create food item.', 500);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requirePermission(request, 'food:manage');
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const { id, ...updates } = body as Partial<FoodItem> & { id: string };
    if (!id) return jsonError('Food item id is required.');

    const item = await prisma.foodItem.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.price !== undefined && { price: updates.price }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.available !== undefined && { available: updates.available }),
      },
    });
    return NextResponse.json(mapFoodItem(item));
  } catch {
    return jsonError('Failed to update food item.', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requirePermission(request, 'food:manage');
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return jsonError('Food item id is required.');

    await prisma.foodItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError('Failed to delete food item.', 500);
  }
}
