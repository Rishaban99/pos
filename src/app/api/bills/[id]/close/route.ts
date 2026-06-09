import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { jsonError, requirePermission } from '@/lib/auth-server';
import { mapBill, mapReceipt } from '@/lib/mappers';
import {
  calculateBillTotals,
  generateInvoiceNumber,
} from '@/utils/billing';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(request, 'bills:complete');
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  try {
    const body = await request.json();
    const cashReceived = Number(body.cashReceived);
    if (!Number.isFinite(cashReceived) || cashReceived < 0) {
      return jsonError('Invalid cash received amount.');
    }

    const bill = await prisma.bill.findUnique({ where: { id } });
    if (!bill) return jsonError('Bill not found.', 404);
    if (bill.status === 'closed') return jsonError('Bill is already closed.');

    const terminalSettings = await prisma.terminalSettings.findUnique({
      where: { singletonKey: 'default' },
    });
    const serviceChargeRate = terminalSettings?.serviceChargeRate ?? 10;
    const taxRate = terminalSettings?.taxRate ?? 5;

    const mappedBill = {
      roomBookings: bill.roomBookings,
      foodOrders: bill.foodOrders,
      amenityCharges: bill.amenityCharges,
    };

    const totals = calculateBillTotals(
      mappedBill.roomBookings.map(r => ({
        id: r.id,
        name: r.name,
        roomNumber: r.roomNumber,
        pricePerNight: r.pricePerNight,
        nights: r.nights,
        discountPercentage: r.discountPercentage,
        discountAmount: r.discountAmount,
        boardPlan: r.boardPlan as never,
        boardPlanPricePerNight: r.boardPlanPricePerNight ?? undefined,
        totalPrice: r.totalPrice,
      })),
      mappedBill.foodOrders.map(f => ({
        id: f.id,
        name: f.name,
        price: f.price,
        quantity: f.quantity,
        totalPrice: f.totalPrice,
      })),
      mappedBill.amenityCharges.map(a => ({
        id: a.id,
        name: a.name,
        price: a.price,
        quantity: a.quantity,
        totalPrice: a.totalPrice,
      })),
      serviceChargeRate,
      taxRate
    );

    // Generate a unique invoice number by using today's latest invoice and retrying on collision.
    const now = new Date();
    const datePrefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
    const lastReceipt = await prisma.salesReceipt.findFirst({
      where: {
        invoiceNumber: { startsWith: datePrefix },
      },
      orderBy: { timestamp: 'desc' },
      select: { invoiceNumber: true },
    });

    let nextIndex = 1;
    if (lastReceipt) {
      const parsed = parseInt(lastReceipt.invoiceNumber.slice(datePrefix.length), 10);
      if (Number.isFinite(parsed)) {
        nextIndex = parsed + 1;
      }
    }

    let invoiceNumber = `${datePrefix}${String(nextIndex).padStart(4, '0')}`;
    let receipt;
    while (true) {
      try {
        receipt = await prisma.salesReceipt.create({
          data: {
            invoiceNumber,
            billId: bill.id,
            billNumber: bill.billNumber,
            customer: bill.customer,
            roomCharges: totals.roomChargesOriginal,
            foodCharges: totals.foodCharges,
            amenityCharges: totals.amenityCharges,
            subtotal: totals.subtotal,
            roomDiscount: totals.roomDiscountTotal,
            tax: totals.tax,
            foodServiceCharge: totals.foodServiceCharge,
            total: totals.total,
            cashReceived,
            cashChange: cashReceived - totals.total,
            rooms: bill.roomBookings.map(r => ({
              name: r.name,
              roomNumber: r.roomNumber,
              nights: r.nights,
              pricePerNight: r.pricePerNight,
              discountAmount: r.discountAmount,
              boardPlan: r.boardPlan,
              boardPlanPricePerNight: r.boardPlanPricePerNight,
            })),
            foods: bill.foodOrders.map(f => ({
              name: f.name,
              quantity: f.quantity,
              price: f.price,
            })),
            amenities: bill.amenityCharges.map(a => ({
              name: a.name,
              quantity: a.quantity,
              price: a.price,
            })),
          },
        });
        break;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          const target = error.meta?.target;
          const isInvoiceTarget = Array.isArray(target) ? target.includes('invoiceNumber') : false;
          if (isInvoiceTarget) {
            nextIndex += 1;
            invoiceNumber = `${datePrefix}${String(nextIndex).padStart(4, '0')}`;
            continue;
          }
        }
        throw error;
      }
    }

    const updatedBill = await prisma.bill.update({
      where: { id },
      data: {
        status: 'closed',
        closedAt: new Date(),
        receiptId: receipt.id,
      },
    });

    const roomIds = bill.roomBookings.map(r => r.id);
    if (roomIds.length > 0) {
      await prisma.room.updateMany({
        where: { id: { in: roomIds } },
        data: { status: 'available' },
      });
    }

    return NextResponse.json({
      bill: mapBill(updatedBill),
      receipt: mapReceipt(receipt),
    });
  } catch (error) {
    console.error(error);
    return jsonError('Failed to close bill.', 500);
  }
}
