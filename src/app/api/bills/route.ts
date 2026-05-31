import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, requirePermission, requireSession } from '@/lib/auth-server';
import { mapBill } from '@/lib/mappers';
import { generateBillNumber } from '@/utils/billing';
import type { CustomerSnapshot, RoomBookingItem } from '@/types';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (session instanceof NextResponse) return session;

  const bills = await prisma.bill.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(bills.map(mapBill));
}

export async function POST(request: NextRequest) {
  const session = await requirePermission(request, 'bills:create');
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const customerSnapshot = body.customer as CustomerSnapshot;
    const roomBookings = body.roomBookings as RoomBookingItem[];
    let customerId = body.existingCustomerId as string | undefined;

    if (!customerId) {
      const customer = await prisma.customer.create({
        data: {
          name: customerSnapshot.name,
          phone: customerSnapshot.phone,
          email: customerSnapshot.email,
          idNumber: customerSnapshot.idNumber,
        },
      });
      customerId = customer.id;
    } else {
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          name: customerSnapshot.name,
          phone: customerSnapshot.phone,
          email: customerSnapshot.email,
          idNumber: customerSnapshot.idNumber,
        },
      });
    }

    const billCount = await prisma.bill.count();
    const bill = await prisma.bill.create({
      data: {
        billNumber: generateBillNumber(billCount),
        customerId,
        customer: {
          name: customerSnapshot.name,
          phone: customerSnapshot.phone,
          email: customerSnapshot.email ?? null,
          idNumber: customerSnapshot.idNumber ?? null,
        },
        status: 'held',
        roomBookings: roomBookings.map(r => ({
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
        foodOrders: [],
        amenityCharges: [],
      },
    });

    const roomIds = roomBookings.map(r => r.id);
    if (roomIds.length > 0) {
      await prisma.room.updateMany({
        where: { id: { in: roomIds } },
        data: { status: 'booked' },
      });
    }

    return NextResponse.json(mapBill(bill), { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError('Failed to create bill.', 500);
  }
}
