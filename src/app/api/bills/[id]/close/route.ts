import { NextRequest, NextResponse } from 'next/server';
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

    // Generate a unique invoice number by finding the max for today and incrementing
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayReceipts = await prisma.salesReceipt.findMany({
      where: {
        timestamp: {
          gte: new Date(todayStr),
          lt: new Date(new Date(todayStr).getTime() + 86400000),
        },
      },
      select: { invoiceNumber: true },
      orderBy: { invoiceNumber: 'desc' },
      take: 1,
    });

    let invoiceNumber: string;
    if (todayReceipts.length > 0) {
      const lastInvoice = todayReceipts[0].invoiceNumber;
      const lastNumber = parseInt(lastInvoice.split('-')[2], 10);
      invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastNumber + 1).padStart(4, '0')}`;
    } else {
      invoiceNumber = generateInvoiceNumber(0);
    }
    const cashChange = cashReceived - totals.total;

    const receipt = await prisma.salesReceipt.create({
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
        cashChange,
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
