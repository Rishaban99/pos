import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, requirePermission, requireSession } from '@/lib/auth-server';
import { mapDiscountSettings } from '@/lib/mappers';
import type { DiscountSettings } from '@/types';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (session instanceof NextResponse) return session;

  let settings = await prisma.discountSettings.findUnique({
    where: { singletonKey: 'default' },
  });

  if (!settings) {
    settings = await prisma.discountSettings.create({
      data: {
        singletonKey: 'default',
        autoRules: [
          { minNights: 5, discountPercent: 15 },
          { minNights: 3, discountPercent: 10 },
        ],
        manualOptions: [0, 5, 10, 15, 20],
      },
    });
  }

  return NextResponse.json(mapDiscountSettings(settings));
}

export async function PUT(request: NextRequest) {
  const session = await requirePermission(request, 'discounts:manage');
  if (session instanceof NextResponse) return session;

  try {
    const body = (await request.json()) as DiscountSettings;
    const settings = await prisma.discountSettings.upsert({
      where: { singletonKey: 'default' },
      update: {
        autoRules: body.autoRules.map(r => ({
          minNights: r.minNights,
          discountPercent: r.discountPercent,
        })),
        manualOptions: body.manualOptions,
      },
      create: {
        singletonKey: 'default',
        autoRules: body.autoRules.map(r => ({
          minNights: r.minNights,
          discountPercent: r.discountPercent,
        })),
        manualOptions: body.manualOptions,
      },
    });
    return NextResponse.json(mapDiscountSettings(settings));
  } catch {
    return jsonError('Failed to update discount settings.', 500);
  }
}
