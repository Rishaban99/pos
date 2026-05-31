import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, requirePermission, requireSession } from '@/lib/auth-server';
import { mapBill } from '@/lib/mappers';
import type { Bill } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession(request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const bill = await prisma.bill.findUnique({ where: { id } });
  if (!bill) return jsonError('Bill not found.', 404);
  return NextResponse.json(mapBill(bill));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(request, 'bills:update');
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<Bill>;
    const bill = await prisma.bill.update({
      where: { id },
      data: {
        ...(body.customer !== undefined && {
          customer: {
            name: body.customer.name,
            phone: body.customer.phone,
            email: body.customer.email ?? null,
            idNumber: body.customer.idNumber ?? null,
          },
        }),
        ...(body.roomBookings !== undefined && {
          roomBookings: body.roomBookings.map(r => ({
            id: r.id,
            name: r.name,
            roomNumber: r.roomNumber,
            pricePerNight: r.pricePerNight,
            nights: r.nights,
            discountPercentage: r.discountPercentage,
            discountAmount: r.discountAmount,
            boardPlan: r.boardPlan ?? null,
            boardPlanPricePerNight: r.boardPlanPricePerNight ?? null,
            totalPrice: r.totalPrice,
          })),
        }),
        ...(body.foodOrders !== undefined && {
          foodOrders: body.foodOrders.map(f => ({
            id: f.id,
            name: f.name,
            price: f.price,
            quantity: f.quantity,
            totalPrice: f.totalPrice,
          })),
        }),
        ...(body.amenityCharges !== undefined && {
          amenityCharges: body.amenityCharges.map(a => ({
            id: a.id,
            name: a.name,
            price: a.price,
            quantity: a.quantity,
            totalPrice: a.totalPrice,
          })),
        }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.closedAt !== undefined && { closedAt: new Date(body.closedAt) }),
        ...(body.receiptId !== undefined && { receiptId: body.receiptId }),
      },
    });
    return NextResponse.json(mapBill(bill));
  } catch {
    return jsonError('Failed to update bill.', 500);
  }
}
