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

export interface RoomBookingItem {
  id: string; // matches room id
  name: string;
  roomNumber: string;
  pricePerNight: number;
  nights: number;
  discountPercentage: number; // 10% for > 3 nights, 15% for > 5 nights
  discountAmount: number;
  boardPlan?: BoardPlan;
  boardPlanPricePerNight?: number;
  totalPrice: number;
}

export interface FoodOrderItem {
  id: string; // matches food item id
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface SalesReceipt {
  id: string;
  invoiceNumber: string;
  timestamp: string;
  roomCharges: number;
  foodCharges: number;
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
}
