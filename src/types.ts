export type RoomType = 'Single' | 'Double' | 'Deluxe' | 'Family Suite';

export type BoardPlan = 'Room Only' | 'Bed & Breakfast (BB)' | 'Half Board (HB)' | 'Full Board (FB)';

export interface TerminalSettings {
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'LKR';
  taxRate: number;
  serviceChargeRate: number;
  printerType: 'Thermal 80mm' | 'Thermal 58mm' | 'Laser A4';
  stationId: string;
  operatorName: string;
  soundEnabled: boolean;
  dbType: 'ram' | 'localstorage';
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  INR: '₹',
  LKR: 'Rs'
};

export const BOARD_PLAN_PRICES: Record<BoardPlan, number> = {
  'Room Only': 0,
  'Bed & Breakfast (BB)': 18,
  'Half Board (HB)': 40,
  'Full Board (FB)': 75
};

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  pricePerNight: number;
  status: 'available' | 'booked';
  roomNumber: string;
}

export type FoodCategory = 'breakfast' | 'lunch' | 'dinner' | 'drinks';

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  category: FoodCategory;
  available: boolean;
}

export type AmenityCategory = 'minibar' | 'laundry' | 'spa' | 'services';

export interface AmenityItem {
  id: string;
  name: string;
  price: number;
  category: AmenityCategory;
  available: boolean;
}

export interface RoomBookingItem {
  id: string;
  name: string;
  roomNumber: string;
  pricePerNight: number;
  nights: number;
  discountPercentage: number;
  discountAmount: number;
  boardPlan?: BoardPlan;
  boardPlanPricePerNight?: number;
  totalPrice: number;
}

export interface FoodOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface AmenityChargeItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  idNumber?: string;
  createdAt: string;
}

export interface CustomerSnapshot {
  name: string;
  phone: string;
  email?: string;
  idNumber?: string;
}

export type BillStatus = 'held' | 'closed';

export interface Bill {
  id: string;
  billNumber: string;
  customerId: string;
  customer: CustomerSnapshot;
  status: BillStatus;
  createdAt: string;
  closedAt?: string;
  roomBookings: RoomBookingItem[];
  foodOrders: FoodOrderItem[];
  amenityCharges: AmenityChargeItem[];
  receiptId?: string;
}

export interface SalesReceipt {
  id: string;
  invoiceNumber: string;
  timestamp: string;
  billId?: string;
  billNumber?: string;
  customer?: CustomerSnapshot;
  roomCharges: number;
  foodCharges: number;
  amenityCharges?: number;
  subtotal: number;
  roomDiscount: number;
  tax: number;
  foodServiceCharge?: number;
  total: number;
  cashReceived: number;
  cashChange: number;
  rooms: {
    name: string;
    roomNumber: string;
    nights: number;
    pricePerNight: number;
    discountAmount: number;
    boardPlan?: BoardPlan;
    boardPlanPricePerNight?: number;
  }[];
  foods: {
    name: string;
    quantity: number;
    price: number;
  }[];
  amenities?: {
    name: string;
    quantity: number;
    price: number;
  }[];
}
