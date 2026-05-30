import { Room, FoodItem, AmenityItem } from './types';

export const INITIAL_ROOMS: Room[] = [
  { id: 'r1', name: 'Standard Single Room', type: 'Single', pricePerNight: 80, status: 'available', roomNumber: '101' },
  { id: 'r2', name: 'Cozy Single Room', type: 'Single', pricePerNight: 85, status: 'available', roomNumber: '102' },
  { id: 'r3', name: 'Classic Double Room', type: 'Double', pricePerNight: 120, status: 'available', roomNumber: '103' },
  { id: 'r4', name: 'Deluxe Queen Room', type: 'Double', pricePerNight: 145, status: 'available', roomNumber: '104' },
  { id: 'r5', name: 'Executive Deluxe Suite', type: 'Deluxe', pricePerNight: 210, status: 'available', roomNumber: '201' },
  { id: 'r6', name: 'Panorama Deluxe Suite', type: 'Deluxe', pricePerNight: 240, status: 'available', roomNumber: '202' },
  { id: 'r7', name: 'Heritage Family Suite', type: 'Family Suite', pricePerNight: 320, status: 'available', roomNumber: '301' },
  { id: 'r8', name: 'Grand Mansion Family Suite', type: 'Family Suite', pricePerNight: 380, status: 'available', roomNumber: '302' },
];

export const INITIAL_FOOD_ITEMS: FoodItem[] = [
  // Breakfast
  { id: 'f1', name: 'Classic Buttermilk Pancakes', price: 8.50, category: 'breakfast', available: true },
  { id: 'f2', name: 'Avocado Sourdough Toast', price: 10.00, category: 'breakfast', available: true },
  { id: 'f3', name: 'Full English Breakfast', price: 12.50, category: 'breakfast', available: true },
  { id: 'f4', name: 'Smoked Salmon Benedict', price: 14.50, category: 'breakfast', available: true },
  
  // Lunch
  { id: 'f5', name: 'Signature Club Sandwich', price: 13.50, category: 'lunch', available: true },
  { id: 'f6', name: 'Classic Caesar Salad', price: 11.50, category: 'lunch', available: true },
  { id: 'f7', name: 'Gourmet Beef Burger', price: 15.00, category: 'lunch', available: true },
  { id: 'f8', name: 'Quinoa & Avocado Poke Bowl', price: 13.00, category: 'lunch', available: true },
  
  // Dinner
  { id: 'f9', name: 'Prime Aged Ribeye Steak', price: 28.50, category: 'dinner', available: true },
  { id: 'f10', name: 'Pan-Seared Pacific Salmon', price: 24.00, category: 'dinner', available: true },
  { id: 'f11', name: 'Wild Mushroom Truffle Pasta', price: 19.50, category: 'dinner', available: true },
  { id: 'f12', name: 'Slow-Cooked Chicken Tikka', price: 17.50, category: 'dinner', available: true },
  
  // Drinks
  { id: 'f13', name: 'Freshly Squeezed Orange Juice', price: 4.50, category: 'drinks', available: true },
  { id: 'f14', name: 'Double Espresso Macchiato', price: 3.50, category: 'drinks', available: true },
  { id: 'f15', name: 'Craft IPA Pint', price: 6.50, category: 'drinks', available: true },
  { id: 'f16', name: 'Chardonnay (Glass)', price: 8.50, category: 'drinks', available: true },
  { id: 'f17', name: 'Mineral Sparkling Water', price: 3.00, category: 'drinks', available: true }
];

export const INITIAL_AMENITY_ITEMS: AmenityItem[] = [
  { id: 'a1', name: 'Minibar Snack Pack', price: 12.00, category: 'minibar', available: true },
  { id: 'a2', name: 'Premium Minibar Wine', price: 28.00, category: 'minibar', available: true },
  { id: 'a3', name: 'Soft Drink (Minibar)', price: 4.50, category: 'minibar', available: true },
  { id: 'a4', name: 'Laundry - Shirt', price: 8.00, category: 'laundry', available: true },
  { id: 'a5', name: 'Laundry - Full Load', price: 25.00, category: 'laundry', available: true },
  { id: 'a6', name: 'Dry Cleaning - Suit', price: 18.00, category: 'laundry', available: true },
  { id: 'a7', name: 'Swedish Massage (60 min)', price: 85.00, category: 'spa', available: true },
  { id: 'a8', name: 'Aromatherapy Session', price: 65.00, category: 'spa', available: true },
  { id: 'a9', name: 'Late Checkout (until 2 PM)', price: 35.00, category: 'services', available: true },
  { id: 'a10', name: 'Extra Bed / Rollaway', price: 45.00, category: 'services', available: true },
  { id: 'a11', name: 'Airport Transfer', price: 55.00, category: 'services', available: true },
  { id: 'a12', name: 'Room Safe Rental', price: 5.00, category: 'services', available: true },
];
