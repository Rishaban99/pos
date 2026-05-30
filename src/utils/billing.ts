import { Room, RoomBookingItem, FoodOrderItem, AmenityChargeItem, BoardPlan, Bill } from '../types';

export interface BillTotals {
  roomChargesOriginal: number;
  roomDiscountTotal: number;
  roomChargesFinal: number;
  foodCharges: number;
  amenityCharges: number;
  foodServiceCharge: number;
  tax: number;
  subtotal: number;
  total: number;
}

export function buildRoomBookingItem(
  room: Room,
  nights: number,
  discountOverride?: number,
  boardPlan?: BoardPlan,
  boardPlanPricePerNight?: number
): RoomBookingItem {
  const actualBoardPlan = boardPlan || 'Room Only';
  const boardPriceRate = boardPlanPricePerNight || 0;
  const totalRatePerNight = room.pricePerNight + boardPriceRate;

  let discountPct = 0;
  if (discountOverride !== undefined) {
    discountPct = discountOverride;
  } else if (nights > 5) {
    discountPct = 15;
  } else if (nights > 3) {
    discountPct = 10;
  }

  const basePrice = totalRatePerNight * nights;
  const discountAmt = basePrice * (discountPct / 100);
  const finalPrice = basePrice - discountAmt;

  return {
    id: room.id,
    name: room.name,
    roomNumber: room.roomNumber,
    pricePerNight: room.pricePerNight,
    nights,
    discountPercentage: discountPct,
    discountAmount: discountAmt,
    boardPlan: actualBoardPlan,
    boardPlanPricePerNight: boardPriceRate,
    totalPrice: finalPrice
  };
}

export function normalizeBill(raw: Bill): Bill {
  return {
    ...raw,
    status: raw.status === 'closed' ? 'closed' : 'held',
    roomBookings: Array.isArray(raw.roomBookings) ? raw.roomBookings : [],
    foodOrders: Array.isArray(raw.foodOrders) ? raw.foodOrders : [],
    amenityCharges: Array.isArray(raw.amenityCharges) ? raw.amenityCharges : [],
    customer: raw.customer ?? { name: 'Guest', phone: '—' },
  };
}

export function getHeldRoomIds(bills: Bill[]): Set<string> {
  return new Set(
    bills
      .filter(b => b.status === 'held')
      .flatMap(b => b.roomBookings.map(r => r.id))
  );
}

export function calculateBillTotals(
  roomBookings: RoomBookingItem[] = [],
  foodOrders: FoodOrderItem[] = [],
  amenityCharges: AmenityChargeItem[] = [],
  serviceChargeRate: number,
  taxRate: number
): BillTotals {
  const roomChargesOriginal = roomBookings.reduce(
    (sum, item) => sum + ((item.pricePerNight + (item.boardPlanPricePerNight || 0)) * item.nights),
    0
  );
  const roomDiscountTotal = roomBookings.reduce((sum, item) => sum + item.discountAmount, 0);
  const roomChargesFinal = roomChargesOriginal - roomDiscountTotal;

  const foodCharges = foodOrders.reduce((sum, item) => sum + item.totalPrice, 0);
  const amenityChargesTotal = amenityCharges.reduce((sum, item) => sum + item.totalPrice, 0);
  const foodServiceCharge = foodCharges * (serviceChargeRate / 100);
  const tax = (roomChargesFinal + foodCharges + amenityChargesTotal) * (taxRate / 100);

  const subtotal = roomChargesOriginal + foodCharges + amenityChargesTotal;
  const total = roomChargesFinal + foodCharges + amenityChargesTotal + foodServiceCharge + tax;

  return {
    roomChargesOriginal,
    roomDiscountTotal,
    roomChargesFinal,
    foodCharges,
    amenityCharges: amenityChargesTotal,
    foodServiceCharge,
    tax,
    subtotal,
    total
  };
}

export function generateBillNumber(existingCount: number): string {
  const now = new Date();
  return `BILL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(existingCount + 1001).padStart(4, '0')}`;
}

export function generateInvoiceNumber(receiptCount: number): string {
  const now = new Date();
  return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(receiptCount + 1001).padStart(4, '0')}`;
}
