import type {
  AmenityItem as PrismaAmenity,
  Bill as PrismaBill,
  Customer as PrismaCustomer,
  DiscountSettings as PrismaDiscountSettings,
  FoodItem as PrismaFood,
  Room as PrismaRoom,
  SalesReceipt as PrismaReceipt,
  TerminalSettings as PrismaTerminal,
  User as PrismaUser,
} from '@prisma/client';
import type {
  AmenityItem,
  Bill,
  Customer,
  DiscountSettings,
  FoodItem,
  Room,
  SalesReceipt,
  TerminalSettings,
} from '@/types';
import type { StoredUser, UserRole } from '@/auth/types';

function mapRoomType(type: string): Room['type'] {
  if (type === 'Family_Suite') return 'Family Suite';
  return type as Room['type'];
}

function toPrismaRoomType(type: Room['type']): PrismaRoom['type'] {
  if (type === 'Family Suite') return 'Family_Suite';
  return type as PrismaRoom['type'];
}

export function mapRoom(room: PrismaRoom): Room {
  return {
    id: room.id,
    name: room.name,
    type: mapRoomType(room.type),
    pricePerNight: room.pricePerNight,
    status: room.status,
    roomNumber: room.roomNumber,
  };
}

export function mapFoodItem(item: PrismaFood): FoodItem {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
    available: item.available,
  };
}

export function mapAmenityItem(item: PrismaAmenity): AmenityItem {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
    available: item.available,
  };
}

export function mapCustomer(customer: PrismaCustomer): Customer {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email ?? undefined,
    idNumber: customer.idNumber ?? undefined,
    createdAt: customer.createdAt.toISOString(),
  };
}

export function mapBill(bill: PrismaBill): Bill {
  return {
    id: bill.id,
    billNumber: bill.billNumber,
    customerId: bill.customerId,
    customer: {
      name: bill.customer.name,
      phone: bill.customer.phone,
      email: bill.customer.email ?? undefined,
      idNumber: bill.customer.idNumber ?? undefined,
    },
    status: bill.status,
    createdAt: bill.createdAt.toISOString(),
    closedAt: bill.closedAt?.toISOString(),
    roomBookings: bill.roomBookings.map(r => ({
      id: r.id,
      name: r.name,
      roomNumber: r.roomNumber,
      pricePerNight: r.pricePerNight,
      nights: r.nights,
      discountPercentage: r.discountPercentage,
      discountAmount: r.discountAmount,
      boardPlan: r.boardPlan as Bill['roomBookings'][0]['boardPlan'],
      boardPlanPricePerNight: r.boardPlanPricePerNight ?? undefined,
      totalPrice: r.totalPrice,
    })),
    foodOrders: bill.foodOrders.map(f => ({
      id: f.id,
      name: f.name,
      price: f.price,
      quantity: f.quantity,
      totalPrice: f.totalPrice,
    })),
    amenityCharges: bill.amenityCharges.map(a => ({
      id: a.id,
      name: a.name,
      price: a.price,
      quantity: a.quantity,
      totalPrice: a.totalPrice,
    })),
    receiptId: bill.receiptId ?? undefined,
  };
}

export function mapReceipt(receipt: PrismaReceipt): SalesReceipt {
  return {
    id: receipt.id,
    invoiceNumber: receipt.invoiceNumber,
    timestamp: receipt.timestamp.toISOString(),
    billId: receipt.billId ?? undefined,
    billNumber: receipt.billNumber ?? undefined,
    customer: receipt.customer
      ? {
          name: receipt.customer.name,
          phone: receipt.customer.phone,
          email: receipt.customer.email ?? undefined,
          idNumber: receipt.customer.idNumber ?? undefined,
        }
      : undefined,
    roomCharges: receipt.roomCharges,
    foodCharges: receipt.foodCharges,
    amenityCharges: receipt.amenityCharges ?? undefined,
    subtotal: receipt.subtotal,
    roomDiscount: receipt.roomDiscount,
    tax: receipt.tax,
    foodServiceCharge: receipt.foodServiceCharge ?? undefined,
    total: receipt.total,
    cashReceived: receipt.cashReceived,
    cashChange: receipt.cashChange,
    rooms: receipt.rooms.map(r => ({
      name: r.name,
      roomNumber: r.roomNumber,
      nights: r.nights,
      pricePerNight: r.pricePerNight,
      discountAmount: r.discountAmount,
      boardPlan: r.boardPlan as SalesReceipt['rooms'][0]['boardPlan'],
      boardPlanPricePerNight: r.boardPlanPricePerNight ?? undefined,
    })),
    foods: receipt.foods.map(f => ({
      name: f.name,
      quantity: f.quantity,
      price: f.price,
    })),
    amenities: receipt.amenities.length
      ? receipt.amenities.map(a => ({
          name: a.name,
          quantity: a.quantity,
          price: a.price,
        }))
      : undefined,
  };
}

function mapPrinterType(type: string): TerminalSettings['printerType'] {
  const map: Record<string, TerminalSettings['printerType']> = {
    Thermal_80mm: 'Thermal 80mm',
    Thermal_58mm: 'Thermal 58mm',
    Laser_A4: 'Laser A4',
  };
  return map[type] ?? 'Thermal 80mm';
}

export function mapTerminalSettings(settings: PrismaTerminal): TerminalSettings {
  return {
    currency: settings.currency,
    taxRate: settings.taxRate,
    serviceChargeRate: settings.serviceChargeRate,
    printerType: mapPrinterType(settings.printerType),
    stationId: settings.stationId,
    operatorName: settings.operatorName,
    soundEnabled: settings.soundEnabled,
    dbType: 'mongodb',
  };
}

export function mapDiscountSettings(settings: PrismaDiscountSettings): DiscountSettings {
  return {
    autoRules: settings.autoRules.map(r => ({
      minNights: r.minNights,
      discountPercent: r.discountPercent,
    })),
    manualOptions: settings.manualOptions,
  };
}

export function mapUser(user: PrismaUser): StoredUser {
  return {
    id: user.id,
    username: user.username,
    passwordHash: user.passwordHash,
    role: user.role as UserRole,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
    createdBy: user.createdBy ?? undefined,
    active: user.active,
  };
}

export { toPrismaRoomType };

export function toPrismaPrinterType(
  type: TerminalSettings['printerType']
): PrismaTerminal['printerType'] {
  const map: Record<TerminalSettings['printerType'], PrismaTerminal['printerType']> = {
    'Thermal 80mm': 'Thermal_80mm',
    'Thermal 58mm': 'Thermal_58mm',
    'Laser A4': 'Laser_A4',
  };
  return map[type];
}
