'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Room, FoodItem, AmenityItem, RoomBookingItem, FoodOrderItem, AmenityChargeItem, SalesReceipt, Bill, Customer, CustomerSnapshot, TerminalSettings, CURRENCY_SYMBOLS, DiscountSettings, DEFAULT_DISCOUNT_SETTINGS } from '@/types';
import { api } from '@/lib/api';
import RoomSection from './RoomSection';
import FoodSection from './FoodSection';
import AmenitySection from './AmenitySection';
import GuestSection from './GuestSection';
import BillingSummary from './BillingSummary';
import DailySalesSummary from './DailySalesSummary';
import InvoiceModal from './InvoiceModal';
import LoginScreen from './LoginScreen';
import StaffManagementSection from './StaffManagementSection';
import DashboardSection from './DashboardSection';
import RevenueSection from './RevenueSection';
import { useAuth } from '@/context/AuthContext';
import { getRoleLabel } from '@/auth/permissions';
import type { StoredUser } from '@/auth/types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  FileText, 
  LogOut, 
  Utensils, 
  ShieldCheck,
  Settings,
  X,
  Volume2,
  VolumeX,
  Database,
  Sparkles,
  Users,
  UserCog,
  Percent,
  LayoutDashboard,
  LineChart
} from 'lucide-react';

type LeftTab = 'dashboard' | 'revenue' | 'guests' | 'rooms' | 'food' | 'amenities' | 'logs' | 'staff';

const DEFAULT_TERMINAL: TerminalSettings = {
  currency: 'USD',
  taxRate: 5,
  serviceChargeRate: 10,
  printerType: 'Thermal 80mm',
  stationId: 'FRONT-DESK-04',
  operatorName: 'Sarah Jenkins',
  soundEnabled: true,
  dbType: 'mongodb',
};

export default function App() {
  const { session, isReady, logout, hasPermission } = useAuth();

  const canManageRooms = hasPermission('rooms:manage');
  const canManageFood = hasPermission('food:manage');
  const canManageAmenities = hasPermission('amenities:manage');
  const canViewLedger = hasPermission('ledger:view');
  const canManageSettings = hasPermission('settings:manage');
  const canManageUsers = hasPermission('users:manage');
  const canManageDiscounts = hasPermission('discounts:manage');

  const [rooms, setRooms] = useState<Room[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [amenityItems, setAmenityItems] = useState<AmenityItem[]>([]);
  const [activeBillId, setActiveBillId] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<SalesReceipt[]>([]);
  const [terminalSettings, setTerminalSettings] = useState<TerminalSettings>(DEFAULT_TERMINAL);
  const [discountSettings, setDiscountSettings] = useState<DiscountSettings>(DEFAULT_DISCOUNT_SETTINGS);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Settings Modal open trigger
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active view on the Left Pane
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>('dashboard');

  const visibleTabs = useMemo(() => {
    const tabs: LeftTab[] = ['dashboard', 'guests'];
    if (canManageRooms) tabs.push('rooms');
    tabs.push('food', 'amenities');
    if (canViewLedger) tabs.push('revenue', 'logs');
    if (canManageUsers) tabs.push('staff');
    return tabs;
  }, [canManageRooms, canViewLedger, canManageUsers]);

  const activeBill = useMemo(
    () => bills.find(b => b.id === activeBillId && b.status === 'held') ?? null,
    [bills, activeBillId]
  );

  const heldBillCount = useMemo(() => bills.filter(b => b.status === 'held').length, [bills]);
  
  // Real-time clock state simulating front desk system time
  const [systemTime, setSystemTime] = useState(new Date());

  // Invoice view / Receipt Print Modal focus
  const [selectedReceiptForInvoice, setSelectedReceiptForInvoice] = useState<SalesReceipt | null>(null);

  // Success alert ribbon auto-clearing
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);

  // Sound play handler
  const playBeep = (freq = 600, duration = 0.08) => {
    if (!terminalSettings.soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext
        || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // safe bypass
    }
  };

  useEffect(() => {
    if (!session) {
      setIsDataLoading(false);
      return;
    }

    let cancelled = false;

    async function loadData() {
      setIsDataLoading(true);
      try {
        const [
          roomsData,
          foodData,
          amenityData,
          billsData,
          customersData,
          receiptsData,
          terminalData,
          discountData,
          usersData,
        ] = await Promise.all([
          api.rooms.list(),
          api.food.list(),
          api.amenities.list(),
          api.bills.list(),
          api.customers.list(),
          api.receipts.list().catch(() => []),
          api.settings.getTerminal(),
          api.settings.getDiscounts(),
          api.users.list().catch(() => []),
        ]);

        if (cancelled) return;
        setRooms(roomsData);
        setFoodItems(foodData);
        setAmenityItems(amenityData);
        setBills(billsData);
        setCustomers(customersData);
        setReceipts(receiptsData);
        setTerminalSettings(terminalData);
        setDiscountSettings(discountData);
        setUsers(usersData);

        const heldBill = billsData.find(b => b.status === 'held');
        setActiveBillId(prev => {
          if (prev && billsData.some(b => b.id === prev && b.status === 'held')) return prev;
          return heldBill?.id ?? null;
        });
      } catch (error) {
        console.error('Failed to load POS data', error);
        setCheckoutNotice('Failed to load data from server.');
      } finally {
        if (!cancelled) setIsDataLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [session, canViewLedger, canManageUsers]);

  useEffect(() => {
    if (!visibleTabs.includes(activeLeftTab)) {
      setActiveLeftTab('dashboard');
    }
  }, [visibleTabs, activeLeftTab]);

  // Clock ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Actions / Operations

  const persistBill = async (billId: string, bill: Bill) => {
    const updated = await api.bills.update(billId, {
      customer: bill.customer,
      roomBookings: bill.roomBookings,
      foodOrders: bill.foodOrders,
      amenityCharges: bill.amenityCharges,
    });
    setBills(prev => prev.map(b => (b.id === billId ? updated : b)));
    return updated;
  };

  const updateActiveBill = (updater: (bill: Bill) => Bill) => {
    if (!activeBillId) return;
    const current = bills.find(b => b.id === activeBillId && b.status === 'held');
    if (!current) return;
    const next = updater(current);
    setBills(prev => prev.map(b => (b.id === activeBillId ? next : b)));
    void persistBill(activeBillId, next).catch(() => {
      setCheckoutNotice('Failed to save bill changes.');
    });
  };

  const getActiveHeldBill = (): Bill | null => {
    if (!activeBillId) return null;
    return bills.find(b => b.id === activeBillId && b.status === 'held') ?? null;
  };

  const updateAllBillsRoomBooking = async (
    roomId: string,
    updater: (item: RoomBookingItem) => RoomBookingItem
  ) => {
    const affected = bills.filter(b =>
      b.roomBookings.some(rb => rb.id === roomId)
    );
    await Promise.all(
      affected.map(async bill => {
        const next = {
          ...bill,
          roomBookings: bill.roomBookings.map(rb =>
            rb.id === roomId ? updater(rb) : rb
          ),
        };
        const updated = await api.bills.update(bill.id, {
          roomBookings: next.roomBookings,
        });
        setBills(prev => prev.map(b => (b.id === bill.id ? updated : b)));
      })
    );
  };

  const handleEditRoom = async (roomId: string, updatedFields: Partial<Room>) => {
    if (!hasPermission('rooms:manage')) return;
    try {
      const updated = await api.rooms.update(roomId, updatedFields);
      setRooms(prev => prev.map(room => (room.id === roomId ? updated : room)));

      await updateAllBillsRoomBooking(roomId, booking => {
        const pricePerNight =
          updatedFields.pricePerNight !== undefined
            ? updatedFields.pricePerNight
            : booking.pricePerNight;
        const name = updatedFields.name !== undefined ? updatedFields.name : booking.name;
        const roomNumber =
          updatedFields.roomNumber !== undefined
            ? updatedFields.roomNumber
            : booking.roomNumber;
        const boardPriceRate = booking.boardPlanPricePerNight || 0;
        const totalRatePerNight = pricePerNight + boardPriceRate;
        const basePrice = totalRatePerNight * booking.nights;
        const discountAmt = basePrice * (booking.discountPercentage / 100);
        return {
          ...booking,
          name,
          roomNumber,
          pricePerNight,
          discountAmount: discountAmt,
          totalPrice: basePrice - discountAmt,
        };
      });

      playBeep(620, 0.08);
      setCheckoutNotice('Room details updated successfully.');
      setTimeout(() => setCheckoutNotice(null), 3000);
    } catch {
      setCheckoutNotice('Failed to update room.');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!hasPermission('rooms:manage')) return;
    try {
      await api.rooms.delete(roomId);
      setRooms(prev => prev.filter(room => room.id !== roomId));
      playBeep(350, 0.1);
      setCheckoutNotice('Room removed from active registry.');
      setTimeout(() => setCheckoutNotice(null), 3000);
    } catch {
      setCheckoutNotice('Failed to delete room.');
    }
  };

  const handleAddRoom = async (newRoom: Room) => {
    if (!hasPermission('rooms:manage')) return;
    try {
      const { name, type, pricePerNight, status, roomNumber } = newRoom;
      const created = await api.rooms.create({ name, type, pricePerNight, status, roomNumber });
      setRooms(prev => [...prev, created]);
      playBeep(720, 0.1);
      setCheckoutNotice(`Created new Room ${created.roomNumber} successfully.`);
      setTimeout(() => setCheckoutNotice(null), 3000);
    } catch {
      setCheckoutNotice('Failed to create room.');
    }
  };

  const syncBillsAfterCatalogChange = async (
    updater: (bill: Bill) => Bill,
    patchKey: 'foodOrders' | 'amenityCharges'
  ) => {
    const affected = bills.filter(b =>
      patchKey === 'foodOrders'
        ? b.foodOrders.length > 0
        : b.amenityCharges.length > 0
    );
    await Promise.all(
      affected.map(async bill => {
        const next = updater(bill);
        const updated = await api.bills.update(bill.id, {
          [patchKey]: next[patchKey],
        });
        setBills(prev => prev.map(b => (b.id === bill.id ? updated : b)));
      })
    );
  };

  const handleEditFood = async (foodId: string, updatedFields: Partial<FoodItem>) => {
    if (!hasPermission('food:manage')) return;
    try {
      const updated = await api.food.update(foodId, updatedFields);
      setFoodItems(prev => prev.map(item => (item.id === foodId ? updated : item)));

      await syncBillsAfterCatalogChange(
        bill => ({
          ...bill,
          foodOrders: bill.foodOrders.map(order => {
            if (order.id !== foodId) return order;
            const nextPrice =
              updatedFields.price !== undefined ? updatedFields.price : order.price;
            const name = updatedFields.name !== undefined ? updatedFields.name : order.name;
            return {
              ...order,
              name,
              price: nextPrice,
              totalPrice: order.quantity * nextPrice,
            };
          }),
        }),
        'foodOrders'
      );

      playBeep(620, 0.08);
      setCheckoutNotice('Food item details updated successfully.');
      setTimeout(() => setCheckoutNotice(null), 3000);
    } catch {
      setCheckoutNotice('Failed to update food item.');
    }
  };

  const handleDeleteFood = async (foodId: string) => {
    if (!hasPermission('food:manage')) return;
    try {
      await api.food.delete(foodId);
      setFoodItems(prev => prev.filter(item => item.id !== foodId));
      await syncBillsAfterCatalogChange(
        bill => ({
          ...bill,
          foodOrders: bill.foodOrders.filter(order => order.id !== foodId),
        }),
        'foodOrders'
      );
      playBeep(350, 0.1);
      setCheckoutNotice('Menu item removed successfully.');
      setTimeout(() => setCheckoutNotice(null), 3000);
    } catch {
      setCheckoutNotice('Failed to delete food item.');
    }
  };

  const handleAddFood = async (newItem: FoodItem) => {
    if (!hasPermission('food:manage')) return;
    try {
      const { name, price, category, available } = newItem;
      const created = await api.food.create({ name, price, category, available });
      setFoodItems(prev => [...prev, created]);
      playBeep(720, 0.1);
      setCheckoutNotice(`Menu item "${created.name}" added successfully.`);
      setTimeout(() => setCheckoutNotice(null), 3000);
    } catch {
      setCheckoutNotice('Failed to add food item.');
    }
  };

  const handleEditAmenity = async (amenityId: string, updatedFields: Partial<AmenityItem>) => {
    if (!hasPermission('amenities:manage')) return;
    try {
      const updated = await api.amenities.update(amenityId, updatedFields);
      setAmenityItems(prev => prev.map(item => (item.id === amenityId ? updated : item)));
      await syncBillsAfterCatalogChange(
        bill => ({
          ...bill,
          amenityCharges: bill.amenityCharges.map(charge => {
            if (charge.id !== amenityId) return charge;
            const nextPrice =
              updatedFields.price !== undefined ? updatedFields.price : charge.price;
            const name = updatedFields.name !== undefined ? updatedFields.name : charge.name;
            return {
              ...charge,
              name,
              price: nextPrice,
              totalPrice: charge.quantity * nextPrice,
            };
          }),
        }),
        'amenityCharges'
      );
      playBeep(620, 0.08);
    } catch {
      setCheckoutNotice('Failed to update amenity.');
    }
  };

  const handleDeleteAmenity = async (amenityId: string) => {
    if (!hasPermission('amenities:manage')) return;
    try {
      await api.amenities.delete(amenityId);
      setAmenityItems(prev => prev.filter(item => item.id !== amenityId));
      await syncBillsAfterCatalogChange(
        bill => ({
          ...bill,
          amenityCharges: bill.amenityCharges.filter(c => c.id !== amenityId),
        }),
        'amenityCharges'
      );
      playBeep(350, 0.1);
    } catch {
      setCheckoutNotice('Failed to delete amenity.');
    }
  };

  const handleAddAmenity = async (newItem: AmenityItem) => {
    if (!hasPermission('amenities:manage')) return;
    try {
      const { name, price, category, available } = newItem;
      const created = await api.amenities.create({ name, price, category, available });
      setAmenityItems(prev => [...prev, created]);
      playBeep(720, 0.1);
    } catch {
      setCheckoutNotice('Failed to add amenity.');
    }
  };

  const handleCreateBill = async (
    customerSnapshot: CustomerSnapshot,
    roomBookings: RoomBookingItem[],
    existingCustomerId?: string
  ) => {
    if (!hasPermission('bills:create')) return;
    try {
      const newBill = await api.bills.create({
        customer: customerSnapshot,
        roomBookings,
        existingCustomerId,
      });

      setBills(prev => [newBill, ...prev]);
      setActiveBillId(newBill.id);

      const roomIds = roomBookings.map(r => r.id);
      setRooms(prev =>
        prev.map(r =>
          roomIds.includes(r.id) ? { ...r, status: 'booked' as const } : r
        )
      );

      if (!existingCustomerId) {
        setCustomers(prev => [
          {
            id: newBill.customerId,
            ...customerSnapshot,
            createdAt: newBill.createdAt,
          },
          ...prev,
        ]);
      } else {
        setCustomers(prev =>
          prev.map(c =>
            c.id === existingCustomerId ? { ...c, ...customerSnapshot } : c
          )
        );
      }

      playBeep(520, 0.08);
      setCheckoutNotice(`Bill ${newBill.billNumber} created for ${customerSnapshot.name}.`);
      setTimeout(() => setCheckoutNotice(null), 4000);
      return newBill.id;
    } catch {
      setCheckoutNotice('Failed to create bill.');
      return undefined;
    }
  };

  const handleSelectBill = (billId: string) => {
    setActiveBillId(billId);
    playBeep(650, 0.05);
  };

  const handleAddFoodToBill = (item: FoodItem) => {
    if (!hasPermission('bills:update')) return;
    if (!activeBillId) return;
    updateActiveBill(bill => ({
      ...bill,
      foodOrders: (() => {
        const existing = bill.foodOrders.find(oi => oi.id === item.id);
        if (existing) {
          return bill.foodOrders.map(oi =>
            oi.id === item.id
              ? { ...oi, quantity: oi.quantity + 1, totalPrice: (oi.quantity + 1) * oi.price }
              : oi
          );
        }
        return [...bill.foodOrders, { id: item.id, name: item.name, price: item.price, quantity: 1, totalPrice: item.price }];
      })()
    }));
    playBeep(580, 0.08);
    setCheckoutNotice(`Added ${item.name} to folio.`);
    setTimeout(() => setCheckoutNotice(null), 3000);
  };

  const handleAddAmenityToBill = (item: AmenityItem) => {
    if (!hasPermission('bills:update')) return;
    if (!activeBillId) return;
    updateActiveBill(bill => ({
      ...bill,
      amenityCharges: (() => {
        const existing = bill.amenityCharges.find(c => c.id === item.id);
        if (existing) {
          return bill.amenityCharges.map(c =>
            c.id === item.id
              ? { ...c, quantity: c.quantity + 1, totalPrice: (c.quantity + 1) * c.price }
              : c
          );
        }
        return [...bill.amenityCharges, { id: item.id, name: item.name, price: item.price, quantity: 1, totalPrice: item.price }];
      })()
    }));
    playBeep(580, 0.08);
    setCheckoutNotice(`Added ${item.name} to folio.`);
    setTimeout(() => setCheckoutNotice(null), 3000);
  };

  const handleUpdateFoodQuantity = (itemId: string, delta: number) => {
    if (!hasPermission('bills:update')) return;
    if (!activeBillId) return;
    updateActiveBill(bill => ({
      ...bill,
      foodOrders: bill.foodOrders.map(oi => {
        if (oi.id !== itemId) return oi;
        const nextQty = oi.quantity + delta;
        if (nextQty <= 0) return null;
        return { ...oi, quantity: nextQty, totalPrice: nextQty * oi.price };
      }).filter((item): item is FoodOrderItem => item !== null)
    }));
    playBeep(550, 0.06);
  };

  const handleRemoveRoom = async (roomId: string) => {
    if (!hasPermission('bills:update')) return;
    if (!activeBillId) return;

    updateActiveBill(bill => ({ ...bill, roomBookings: bill.roomBookings.filter(item => item.id !== roomId) }));
    playBeep(400, 0.06);

    try {
      await api.rooms.update(roomId, { status: 'available' });
      setRooms(prev => prev.map(room => (room.id === roomId ? { ...room, status: 'available' } : room)));
      setCheckoutNotice('Room removed from bill and marked available.');
    } catch {
      setCheckoutNotice('Room removed from bill, but failed to update room availability.');
    }
    setTimeout(() => setCheckoutNotice(null), 3000);
  };

  const handleEditBill = () => {
    if (!hasPermission('bills:update')) return;
    setActiveLeftTab('guests');
    playBeep(650, 0.05);
    setCheckoutNotice('Navigated to bill edit view.');
    setTimeout(() => setCheckoutNotice(null), 3000);
  };

  const handleRemoveFood = (foodId: string) => {
    if (!hasPermission('bills:update')) return;
    if (!activeBillId) return;
    updateActiveBill(bill => ({ ...bill, foodOrders: bill.foodOrders.filter(item => item.id !== foodId) }));
    playBeep(400, 0.06);
  };

  const handleUpdateAmenityQuantity = (itemId: string, delta: number) => {
    if (!hasPermission('bills:update')) return;
    if (!activeBillId) return;
    updateActiveBill(bill => ({
      ...bill,
      amenityCharges: bill.amenityCharges.map(c => {
        if (c.id !== itemId) return c;
        const nextQty = c.quantity + delta;
        if (nextQty <= 0) return null;
        return { ...c, quantity: nextQty, totalPrice: nextQty * c.price };
      }).filter((item): item is AmenityChargeItem => item !== null)
    }));
    playBeep(550, 0.06);
  };

  const handleRemoveAmenity = (amenityId: string) => {
    if (!hasPermission('bills:update')) return;
    if (!activeBillId) return;
    updateActiveBill(bill => ({ ...bill, amenityCharges: bill.amenityCharges.filter(item => item.id !== amenityId) }));
    playBeep(400, 0.06);
  };

  const handleCloseBill = async (cashReceived: number) => {
    if (!hasPermission('bills:complete')) return;
    const bill = getActiveHeldBill();
    if (!bill) return;

    try {
      const { bill: closedBill, receipt } = await api.bills.close(bill.id, cashReceived);

      const roomIds = bill.roomBookings.map(r => r.id);
      setRooms(prev =>
        prev.map(r =>
          roomIds.includes(r.id) ? { ...r, status: 'available' as const } : r
        )
      );

      setBills(prev => prev.map(b => (b.id === closedBill.id ? closedBill : b)));
      setReceipts(prev => [receipt, ...prev]);
      setSelectedReceiptForInvoice(receipt);
      setActiveBillId(null);

      playBeep(880, 0.1);
      setTimeout(() => playBeep(1100, 0.12), 100);
      setCheckoutNotice(`Bill closed! Receipt ${receipt.invoiceNumber} generated.`);
      setTimeout(() => setCheckoutNotice(null), 4000);
    } catch {
      setCheckoutNotice('Failed to close bill.');
    }
  };
  const handleDeleteBill = async (billId: string) => {
    if (!hasPermission('bills:complete')) return;
    try {
      const response = await api.bills.delete(billId);
      if (response.roomIds && response.roomIds.length > 0) {
        setRooms(prev =>
          prev.map(r =>
            response.roomIds.includes(r.id) ? { ...r, status: 'available' as const } : r
          )
        );
      }
      setBills(prev => prev.filter(b => b.id !== billId));
      if (activeBillId === billId) {
        setActiveBillId(null);
      }
      playBeep(400, 0.1);
      setCheckoutNotice('Ongoing bill deleted successfully.');
      setTimeout(() => setCheckoutNotice(null), 3000);
    } catch {
      setCheckoutNotice('Failed to delete bill.');
    }
  };

  const handleToggleRoomStatus = async (roomId: string) => {
    if (!hasPermission('rooms:manage')) return;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const nextStatus = room.status === 'booked' ? 'available' : 'booked';
    try {
      const updated = await api.rooms.update(roomId, { status: nextStatus });
      setRooms(prev => prev.map(r => (r.id === roomId ? updated : r)));
      playBeep(nextStatus === 'booked' ? 440 : 660, 0.1);
    } catch {
      setCheckoutNotice('Failed to update room status.');
    }
  };

  const handleClearShiftReceipts = async () => {
    if (!hasPermission('ledger:clear')) return;
    if (
      !window.confirm(
        'Perform final drawer clearance? This will erase current shift audit trails permanently.'
      )
    ) {
      return;
    }

    try {
      await api.receipts.clear();
      setReceipts([]);
      setCheckoutNotice('Shift receipts cleared.');
      setTimeout(() => setCheckoutNotice(null), 3000);
    } catch {
      setCheckoutNotice('Failed to clear receipts.');
    }
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    try {
      await api.receipts.delete(receiptId);
      setReceipts(prev =>
        prev.filter(receipt => receipt.id !== receiptId)
      );
      playBeep(400, 0.1);
      setCheckoutNotice('Receipt deleted from database.');
      setTimeout(() => setCheckoutNotice(null), 3000);
    } catch {
      setCheckoutNotice('Failed to delete receipt.');
      setTimeout(() => setCheckoutNotice(null), 3000);
    }
  };

  const saveSettings = async () => {
    try {
      const [terminal, discounts] = await Promise.all([
        api.settings.updateTerminal(terminalSettings),
        canManageDiscounts
          ? api.settings.updateDiscounts(discountSettings)
          : Promise.resolve(discountSettings),
      ]);
      setTerminalSettings(terminal);
      setDiscountSettings(discounts);
      setIsSettingsOpen(false);
      setCheckoutNotice('Settings saved.');
      setTimeout(() => setCheckoutNotice(null), 3000);
    } catch {
      setCheckoutNotice('Failed to save settings.');
    }
  };

  const currencySymbol = CURRENCY_SYMBOLS[terminalSettings.currency] || '$';

  if (!isReady || (session && isDataLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-500 font-medium">Loading terminal...</div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* PROFESSIONAL FLIGHT DESK SYSTEM HEADER */}
      <header className="h-16 bg-white border-b border-brand-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Building className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none uppercase">
                {terminalSettings.currency === 'USD' ? 'Mount Ash Villa' : `Mount Ash Villa (${terminalSettings.currency})`}
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Villa &amp;Resturent</p>
            </div>
          </div>

          {/* Time and Shift Metadata HUD */}
          <div className="flex items-center gap-4 sm:gap-6 text-sm">
            {canManageSettings && (
              <button
                id="terminal-settings-toggle-btn"
                onClick={() => { setIsSettingsOpen(true); playBeep(700, 0.08); }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold leading-none flex items-center gap-1.5 transition-all shadow-3xs hover:shadow-2xs cursor-pointer border border-slate-200"
              >
                <Settings className="size-3.5 text-indigo-600" />
                Terminal Setup
              </button>
            )}

            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-slate-800">{session.displayName}</p>
              <p className="text-xs text-slate-400 flex items-center justify-end gap-1.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase">
                  {getRoleLabel(session.role)}
                </span>
                Terminal #{terminalSettings.stationId}
              </p>
            </div>

            <button
              id="logout-btn"
              onClick={() => { logout(); playBeep(400, 0.08); }}
              className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold leading-none flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
              title="Sign out"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
            
            <div className="hidden sm:block h-10 w-px bg-slate-200"></div>

            {/* Current Terminal Time */}
            <div className="text-indigo-600 font-mono text-lg font-bold shrink-0">
              {systemTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

        </div>
      </header>

      {/* DYNAMIC SHIELD / CHECKOUT STATUS RIBBON NOTIFICATION */}
      {checkoutNotice && (
        <div className="bg-indigo-600 text-white py-2 text-center text-xs font-semibold flex items-center justify-center gap-1.5 transition-all z-10">
          <ShieldCheck className="size-4 animate-bounce" />
          <span>{checkoutNotice}</span>
        </div>
      )}

      {/* CORE POS LAYOUT GRAPHICS BODY- GRID */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col lg:grid lg:grid-cols-12 gap-6 overflow-hidden">
        
        {/* LEFT VIEW: 8-COLS GRID FOR ROOMS, FOOD, LOGS */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Main Module Tabs Nav Selectors */}
          <div className="flex flex-wrap bg-slate-200/50 p-1 rounded-xl gap-1 self-start select-none">
            <button
              id="tab-btn-dashboard"
              onClick={() => { setActiveLeftTab('dashboard'); playBeep(650, 0.05); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeLeftTab === 'dashboard'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-slate-250/30'
              }`}
            >
              <LayoutDashboard className="size-4" />
              Dashboard
            </button>

            {canViewLedger && (
              <button
                id="tab-btn-revenue"
                onClick={() => { setActiveLeftTab('revenue'); playBeep(650, 0.05); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  activeLeftTab === 'revenue'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-250/30'
                }`}
              >
                <LineChart className="size-4" />
                Revenue
              </button>
            )}

            <button
              id="tab-btn-guests"
              onClick={() => { setActiveLeftTab('guests'); playBeep(650, 0.05); }}
              className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeLeftTab === 'guests'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-slate-250/30'
              }`}
            >
              <Users className="size-4" />
              Guests
              {heldBillCount > 0 && (
                <span className="font-mono text-[9px] font-bold bg-amber-500 text-white size-4 flex items-center justify-center rounded-full leading-none">
                  {heldBillCount}
                </span>
              )}
            </button>

            {canManageRooms && (
            <button
              id="tab-btn-rooms"
              onClick={() => { setActiveLeftTab('rooms'); playBeep(650, 0.05); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeLeftTab === 'rooms'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-slate-250/30'
              }`}
            >
              <Building className="size-4" />
              Rooms
            </button>
            )}
            
            <button
              id="tab-btn-food"
              onClick={() => { setActiveLeftTab('food'); playBeep(650, 0.05); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeLeftTab === 'food'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-slate-250/30'
              }`}
            >
              <Utensils className="size-4" />
              Restaurant
            </button>

            <button
              id="tab-btn-amenities"
              onClick={() => { setActiveLeftTab('amenities'); playBeep(650, 0.05); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeLeftTab === 'amenities'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-slate-250/30'
              }`}
            >
              <Sparkles className="size-4" />
              Amenities
            </button>

            {canViewLedger && (
            <button
              id="tab-btn-logs"
              onClick={() => { setActiveLeftTab('logs'); playBeep(650, 0.05); }}
              className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeLeftTab === 'logs'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-slate-250/30'
              }`}
            >
              <FileText className="size-4" />
              Ledger
              {receipts.length > 0 && (
                <span className="absolute -top-1 -right-1 font-mono text-[9px] font-bold bg-indigo-600 text-white size-4 flex items-center justify-center rounded-full leading-none">
                  {receipts.length}
                </span>
              )}
            </button>
            )}

            {canManageUsers && (
            <button
              id="tab-btn-staff"
              onClick={() => { setActiveLeftTab('staff'); playBeep(650, 0.05); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeLeftTab === 'staff'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-slate-250/30'
              }`}
            >
              <UserCog className="size-4" />
              Staff
            </button>
            )}
          </div>

          {/* ACTIVE ASSIGNED COMPONENT CONTAINER PANE WITH FADE SEAMLESS DESIGN */}
          <div className="flex-1">
            {activeLeftTab === 'dashboard' && (
              <DashboardSection
                rooms={rooms}
                receipts={receipts}
                bills={bills}
                currencySymbol={currencySymbol}
                users={users}
              />
            )}

            {activeLeftTab === 'revenue' && canViewLedger && (
              <RevenueSection
                receipts={receipts}
                currencySymbol={currencySymbol}
              />
            )}

            {activeLeftTab === 'guests' && (
              <GuestSection
                rooms={rooms}
                customers={customers}
                bills={bills}
                receipts={receipts}
                heldBillCount={heldBillCount}
                onCreateBill={handleCreateBill}
                onSelectBill={(id) => { handleSelectBill(id); }}
                onSelectReceipt={(r) => { setSelectedReceiptForInvoice(r); playBeep(750, 0.08); }}
                currencySymbol={currencySymbol}
                serviceChargeRate={terminalSettings.serviceChargeRate}
                taxRate={terminalSettings.taxRate}
                discountSettings={discountSettings}
              />
            )}

            {activeLeftTab === 'rooms' && canManageRooms && (
              <RoomSection
                rooms={rooms}
                bills={bills}
                onToggleRoomStatus={handleToggleRoomStatus}
                onEditRoom={handleEditRoom}
                onDeleteRoom={handleDeleteRoom}
                onAddRoom={handleAddRoom}
                currencySymbol={currencySymbol}
                canManageCatalog={canManageRooms}
              />
            )}

            {activeLeftTab === 'food' && (
              <FoodSection
                foodItems={foodItems}
                currentFoodOrders={activeBill?.foodOrders ?? []}
                hasActiveBill={!!activeBill}
                activeBillCustomerName={activeBill?.customer.name}
                onAddFoodToBill={handleAddFoodToBill}
                onUpdateFoodQuantity={handleUpdateFoodQuantity}
                onEditFood={handleEditFood}
                onDeleteFood={handleDeleteFood}
                onAddFood={handleAddFood}
                currencySymbol={currencySymbol}
                canManageCatalog={canManageFood}
              />
            )}

            {activeLeftTab === 'amenities' && (
              <AmenitySection
                amenityItems={amenityItems}
                currentAmenityCharges={activeBill?.amenityCharges ?? []}
                hasActiveBill={!!activeBill}
                activeBillCustomerName={activeBill?.customer.name}
                onAddAmenityToBill={handleAddAmenityToBill}
                onUpdateAmenityQuantity={handleUpdateAmenityQuantity}
                onEditAmenity={handleEditAmenity}
                onDeleteAmenity={handleDeleteAmenity}
                onAddAmenity={handleAddAmenity}
                currencySymbol={currencySymbol}
                canManageCatalog={canManageAmenities}
              />
            )}

            {activeLeftTab === 'logs' && canViewLedger && (
              <DailySalesSummary
                receipts={receipts}
                onSelectReceipt={(r) => { setSelectedReceiptForInvoice(r); playBeep(750, 0.08); }}
                onClearReceipts={handleClearShiftReceipts}
                onDeleteReceipt={handleDeleteReceipt}
                currencySymbol={currencySymbol}
                canClearLogs={hasPermission('ledger:clear')}
              />
            )}

            {activeLeftTab === 'staff' && canManageUsers && (
              <StaffManagementSection />
            )}
          </div>
        </div>

        {/* RIGHT VIEW: 4-COLS STICKY FIXED ACTIVE BILLING SUMMARY PANE */}
        <div className="lg:col-span-4 h-[calc(100vh-160px)] sticky top-[88px]">
          <BillingSummary
            activeBill={activeBill}
            onRemoveFood={handleRemoveFood}
            onRemoveRoom={handleRemoveRoom}
            onUpdateFoodQuantity={handleUpdateFoodQuantity}
            onRemoveAmenity={handleRemoveAmenity}
            onUpdateAmenityQuantity={handleUpdateAmenityQuantity}
            onCloseBill={handleCloseBill}
            onDeleteBill={handleDeleteBill}
            onEditBill={handleEditBill}
            onSwitchBill={() => setActiveLeftTab('guests')}
            currencySymbol={currencySymbol}
            currencyCode={terminalSettings.currency}
            serviceChargeRate={terminalSettings.serviceChargeRate}
            taxRate={terminalSettings.taxRate}
          />
        </div>

      </main>

      {/* MODAL PRINT INVOICE SLIP (THERMAL SIMULATIVE DIALOG STATE) */}
      <AnimatePresence>
        {selectedReceiptForInvoice && (
          <InvoiceModal
            receipt={selectedReceiptForInvoice}
            onClose={() => { setSelectedReceiptForInvoice(null); playBeep(600, 0.06); }}
            currencySymbol={currencySymbol}
            printerType={terminalSettings.printerType}
            stationId={terminalSettings.stationId}
          />
        )}
      </AnimatePresence>

      {/* TERMINAL SETTINGS OVERLAY MODAL */}
      <AnimatePresence>
        {isSettingsOpen && canManageSettings && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
              id="terminal-settings-modal"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="size-5 text-indigo-400 animate-spin-slow" />
                  <div>
                    <h2 className="text-base font-bold">Terminal Configuration Desk</h2>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-semibold">Desktop Core Settings</p>
                  </div>
                </div>
                <button
                  id="close-settings-btn"
                  onClick={() => setIsSettingsOpen(false)}
                  className="bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Operator and ID Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cashier Operator</label>
                    <input
                      id="operator-input"
                      type="text"
                      value={terminalSettings.operatorName}
                      onChange={(e) => setTerminalSettings(prev => ({ ...prev, operatorName: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-900 outline-hidden transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Terminal Station ID</label>
                    <input
                      id="station-id-input"
                      type="text"
                      value={terminalSettings.stationId}
                      onChange={(e) => setTerminalSettings(prev => ({ ...prev, stationId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-900 outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Currency Selection Grid */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Base Terminal Currency</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(Object.keys(CURRENCY_SYMBOLS) as Array<string>).map((cur) => (
                      <button
                        key={cur}
                        id={`currency-select-${cur}`}
                        type="button"
                        onClick={() => { setTerminalSettings(prev => ({ ...prev, currency: cur as TerminalSettings['currency'] })); playBeep(650, 0.05); }}
                        className={`py-2 rounded-xl text-xs font-black font-mono border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          terminalSettings.currency === cur
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm ring-2 ring-indigo-100'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="text-sm">{CURRENCY_SYMBOLS[cur]}</span>
                        <span className="text-[10px] font-sans font-bold uppercase">{cur}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tax & Service rates sliders */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Shift Sales Tax: {terminalSettings.taxRate}%
                    </label>
                    <input
                      id="tax-rate-range"
                      type="range"
                      min="0"
                      max="25"
                      step="1"
                      value={terminalSettings.taxRate}
                      onChange={(e) => setTerminalSettings(prev => ({ ...prev, taxRate: parseInt(e.target.value) || 0 }))}
                      className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Service Charge Rate: {terminalSettings.serviceChargeRate}%
                    </label>
                    <input
                      id="service-charge-range"
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={terminalSettings.serviceChargeRate}
                      onChange={(e) => setTerminalSettings(prev => ({ ...prev, serviceChargeRate: parseInt(e.target.value) || 0 }))}
                      className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                    />
                  </div>
                </div>

                {/* Thermal Printer Type */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-sans">Printer Slip Width</label>
                    <select
                      id="printer-type-select"
                      value={terminalSettings.printerType}
                      onChange={(e) => setTerminalSettings(prev => ({ ...prev, printerType: e.target.value as TerminalSettings['printerType'] }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-800 outline-hidden transition-all"
                    >
                      <option value="Thermal 80mm">Thermal Ticket (80mm Width)</option>
                      <option value="Thermal 58mm">Compact Ticket (58mm Width)</option>
                      <option value="Laser A4">Full Page Layout (Laser A4)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cashbox Beeps</label>
                    <button
                      id="sound-alert-toggle"
                      type="button"
                      onClick={() => {
                        setTerminalSettings(prev => {
                          const nextVal = !prev.soundEnabled;
                          // Play a test tone if next value is true
                          if (nextVal) {
                            try {
                              const AudioContextClass = window.AudioContext
                                || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                              if (AudioContextClass) {
                                const audioCtx = new AudioContextClass();
                                const osc = audioCtx.createOscillator();
                                const gain = audioCtx.createGain();
                                osc.type = 'sine';
                                osc.frequency.setValueAtTime(600, audioCtx.currentTime);
                                gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
                                osc.connect(gain);
                                gain.connect(audioCtx.destination);
                                osc.start();
                                osc.stop(audioCtx.currentTime + 0.1);
                              }
                            } catch {
                              // safe bypass
                            }
                          }
                          return { ...prev, soundEnabled: nextVal };
                        });
                      }}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        terminalSettings.soundEnabled
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {terminalSettings.soundEnabled ? <Volume2 className="size-4 text-emerald-600" /> : <VolumeX className="size-4" />}
                      {terminalSettings.soundEnabled ? 'Beep Tone On' : 'Silent Mode'}
                    </button>
                    
                  </div>
                </div>

                {canManageDiscounts && (
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Percent className="size-3.5" /> Discount Rules
                    </label>
                    <p className="text-[10px] text-slate-500">Auto rules apply when &quot;Auto&quot; is selected at check-in. Highest matching min nights wins.</p>
                    <div className="space-y-2">
                      {discountSettings.autoRules.map((rule, index) => (
                        <div key={index} className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase">Min nights</label>
                            <input
                              type="number"
                              min="1"
                              value={rule.minNights}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 1;
                                setDiscountSettings(prev => ({
                                  ...prev,
                                  autoRules: prev.autoRules.map((r, i) =>
                                    i === index ? { ...r, minNights: val } : r
                                  ),
                                }));
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase">Discount %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={rule.discountPercent}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setDiscountSettings(prev => ({
                                  ...prev,
                                  autoRules: prev.autoRules.map((r, i) =>
                                    i === index ? { ...r, discountPercent: val } : r
                                  ),
                                }));
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">Manual options (comma-separated %)</label>
                      <input
                        type="text"
                        value={discountSettings.manualOptions.join(', ')}
                        onChange={(e) => {
                          const options = e.target.value
                            .split(',')
                            .map(s => parseInt(s.trim(), 10))
                            .filter(n => !Number.isNaN(n) && n >= 0 && n <= 100);
                          if (options.length > 0) {
                            setDiscountSettings(prev => ({ ...prev, manualOptions: options }));
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold mt-1"
                        placeholder="0, 5, 10, 15, 20"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Database className="size-3.5" /> MongoDB Atlas
                    </span>
                    <p className="text-[10px] text-slate-500 leading-tight mt-1">
                      Data is persisted in MongoDB. Use `npm run db:seed` to reinitialize catalog data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end">
                <button
                  id="save-settings-btn"
                  onClick={saveSettings}
                  className="bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 font-bold uppercase tracking-wider text-[10.5px] px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Save settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BENIGN BOTTOM STATUS BAR FROM PROFESSIONALLY POLISHED DESIGN */}
      <footer className="h-8 bg-indigo-900 text-indigo-300 px-6 flex items-center justify-between text-[10px] shrink-0 font-medium select-none z-10">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> 
            SYSTEM ONLINE
          </span>
          <span>SHIFT: SJ-294</span>
        </div>
        <div className="flex gap-6 font-mono">
          <span>SHIFT SALES: {currencySymbol}{receipts.reduce((sum, r) => sum + r.total, 0).toFixed(2)}</span>
          <span>STATION: {terminalSettings.stationId}</span>
        </div>
      </footer>
    </div>
  );
}
