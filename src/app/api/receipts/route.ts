import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, requirePermission, requireSession } from '@/lib/auth-server';
import { mapReceipt } from '@/lib/mappers';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (session instanceof NextResponse) return session;

  const receipts = await prisma.salesReceipt.findMany({
    orderBy: { timestamp: 'desc' },
  });
  return NextResponse.json(receipts.map(mapReceipt));
}

export async function DELETE(request: NextRequest) {
  const session = await requirePermission(request, 'ledger:clear');
  if (session instanceof NextResponse) return session;

  try {
    await prisma.salesReceipt.deleteMany();
    return NextResponse.json({ success: true });
  } catch {
    return jsonError('Failed to clear receipts.', 500);
  }
}
