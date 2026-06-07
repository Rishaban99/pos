import {
  Room,
  RoomBookingItem,
  FoodOrderItem,
  AmenityChargeItem,
  BoardPlan,
  Bill,
  DiscountSettings,
  DEFAULT_DISCOUNT_SETTINGS,
} from '../types';

export function resolveAutoDiscountPercent(
  nights: number,
  discountSettings: DiscountSettings = DEFAULT_DISCOUNT_SETTINGS
): number {
  const sorted = [...discountSettings.autoRules].sort((a, b) => b.minNights - a.minNights);
  const match = sorted.find(rule => nights > rule.minNights);
  return match?.discountPercent ?? 0;
}

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
  discountType: 'auto' | 'percentage' | 'fixed' = 'auto',
  discountValue: number = 0,
  discountReason: string = '',
  boardPlan?: BoardPlan,
  boardPlanPricePerNight?: number,
  discountSettings: DiscountSettings = DEFAULT_DISCOUNT_SETTINGS
): RoomBookingItem {
  const actualBoardPlan = boardPlan || 'Room Only';
  const boardPriceRate = boardPlanPricePerNight || 0;
  const totalRatePerNight = room.pricePerNight + boardPriceRate;

  const basePrice = totalRatePerNight * nights;
  let discountAmt = 0;
  let discountPct = 0;

  if (discountType === 'fixed') {
    discountAmt = discountValue;
    discountPct = basePrice > 0 ? (discountAmt / basePrice) * 100 : 0;
  } else if (discountType === 'percentage') {
    discountPct = discountValue;
    discountAmt = basePrice * (discountPct / 100);
  } else {
    // auto
    discountPct = resolveAutoDiscountPercent(nights, discountSettings);
    discountAmt = basePrice * (discountPct / 100);
  }

  const finalPrice = Math.max(0, basePrice - discountAmt);

  return {
    id: room.id,
    name: room.name,
    roomNumber: room.roomNumber,
    pricePerNight: room.pricePerNight,
    nights,
    discountPercentage: discountPct,
    discountAmount: discountAmt,
    discountReason,
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
