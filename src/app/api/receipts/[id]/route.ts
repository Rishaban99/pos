import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, requirePermission } from '@/lib/auth-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(request, 'ledger:clear');
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  try {
    const deleted = await prisma.salesReceipt.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, receiptId: deleted.id });
  } catch (error) {
    const prismaError = error as { code?: string };
    if (prismaError?.code === 'P2025') {
      return jsonError('Receipt not found.', 404);
    }
    return jsonError('Failed to delete receipt.', 500);
  }
}
