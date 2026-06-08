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

export async function DELETE(request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.salesReceipt.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Receipt deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete receipt",
      },
      { status: 500 }
    );
  }
}