import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, requirePermission, requireSession } from '@/lib/auth-server';
import { mapTerminalSettings, toPrismaPrinterType } from '@/lib/mappers';
import type { TerminalSettings } from '@/types';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (session instanceof NextResponse) return session;

  let settings = await prisma.terminalSettings.findUnique({
    where: { singletonKey: 'default' },
  });

  if (!settings) {
    settings = await prisma.terminalSettings.create({
      data: { singletonKey: 'default' },
    });
  }

  return NextResponse.json(mapTerminalSettings(settings));
}

export async function PUT(request: NextRequest) {
  const session = await requirePermission(request, 'settings:manage');
  if (session instanceof NextResponse) return session;

  try {
    const body = (await request.json()) as TerminalSettings;
    const settings = await prisma.terminalSettings.upsert({
      where: { singletonKey: 'default' },
      update: {
        currency: body.currency,
        taxRate: body.taxRate,
        serviceChargeRate: body.serviceChargeRate,
        printerType: toPrismaPrinterType(body.printerType),
        stationId: body.stationId,
        operatorName: body.operatorName,
        soundEnabled: body.soundEnabled,
      },
      create: {
        singletonKey: 'default',
        currency: body.currency,
        taxRate: body.taxRate,
        serviceChargeRate: body.serviceChargeRate,
        printerType: toPrismaPrinterType(body.printerType),
        stationId: body.stationId,
        operatorName: body.operatorName,
        soundEnabled: body.soundEnabled,
      },
    });
    return NextResponse.json(mapTerminalSettings(settings));
  } catch {
    return jsonError('Failed to update terminal settings.', 500);
  }
}
