import React, { useState, useEffect, useMemo } from 'react';
import { Room, FoodItem, AmenityItem, RoomBookingItem, FoodOrderItem, AmenityChargeItem, SalesReceipt, Bill, Customer, CustomerSnapshot, TerminalSettings, CURRENCY_SYMBOLS } from './types';
import { INITIAL_ROOMS, INITIAL_FOOD_ITEMS, INITIAL_AMENITY_ITEMS } from './data';
import { calculateBillTotals, generateBillNumber, generateInvoiceNumber, normalizeBill, getHeldRoomIds } from './utils/billing';
import RoomSection from './components/RoomSection';
import FoodSection from './components/FoodSection';
import AmenitySection from './components/AmenitySection';
import GuestSection from './components/GuestSection';
import BillingSummary from './components/BillingSummary';
import DailySalesSummary from './components/DailySalesSummary';
import InvoiceModal from './components/InvoiceModal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  CalendarDays, 
  Clock, 
  FileText, 
  LogOut, 
  TrendingUp, 
  Utensils, 
  User, 
  LayoutDashboard,
  ShieldCheck,
  AlertCircle,
  Settings,
  X,
  Volume2,
  VolumeX,
  Database,
  Printer,
  Sparkles,
  DollarSign,
  Users
} from 'lucide-react';

export default function App() {
  // 1. Core State
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('hotel_pos_rooms');
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });
  
  const [foodItems, setFoodItems] = useState<FoodItem[]>(() => {
    const saved = localStorage.getItem('hotel_pos_food');
    return saved ? JSON.parse(saved) : INITIAL_FOOD_ITEMS;
  });
  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem('hotel_pos_bills');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map((b: Bill) => normalizeBill(b)) : [];
    } catch {
      return [];
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('hotel_pos_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [amenityItems, setAmenityItems] = useState<AmenityItem[]>(() => {
    const saved = localStorage.getItem('hotel_pos_amenities');
    return saved ? JSON.parse(saved) : INITIAL_AMENITY_ITEMS;
  });

  const [activeBillId, setActiveBillId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('hotel_pos_active_bill_id');
    } catch {
      return null;
    }
  });

  const [receipts, setReceipts] = useState<SalesReceipt[]>(() => {
    const saved = localStorage.getItem('hotel_pos_receipts');
    return saved ? JSON.parse(saved) : [];
  });

  const [terminalSettings, setTerminalSettings] = useState<TerminalSettings>(() => {
    const saved = localStorage.getItem('hotel_pos_terminal_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use fallback
      }
    }
    return {
      currency: 'USD',
      taxRate: 5,
      serviceChargeRate: 10,
      printerType: 'Thermal 80mm',
      stationId: 'FRONT-DESK-04',
      operatorName: 'Sarah Jenkins',
      soundEnabled: true,
      dbType: 'localstorage'
    };
  });

  // Settings Modal open trigger
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active view on the Left Pane
  const [activeLeftTab, setActiveLeftTab] = useState<'guests' | 'rooms' | 'food' | 'amenities' | 'logs'>('guests');

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
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    } catch (e) {
      // safe bypass
    }
  };

  // 2. LocalStorage syncing
  useEffect(() => {
    localStorage.setItem('hotel_pos_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('hotel_pos_food', JSON.stringify(foodItems));
  }, [foodItems]);

  useEffect(() => {
    localStorage.setItem('hotel_pos_receipts', JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem('hotel_pos_bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    try {
      if (activeBillId) {
        sessionStorage.setItem('hotel_pos_active_bill_id', activeBillId);
      } else {
        sessionStorage.removeItem('hotel_pos_active_bill_id');
      }
    } catch {
      // sessionStorage unavailable
    }
  }, [activeBillId]);

  // Keep room occupancy in sync with held bills
  useEffect(() => {
    const heldRoomIds = getHeldRoomIds(bills);
    setRooms(prev => prev.map(room => {
      const shouldBeBooked = heldRoomIds.has(room.id);
      if (shouldBeBooked && room.status !== 'booked') {
        return { ...room, status: 'booked' as const };
      }
      if (!shouldBeBooked && room.status === 'booked') {
        return { ...room, status: 'available' as const };
      }
      return room;
    }));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('hotel_pos_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('hotel_pos_amenities', JSON.stringify(amenityItems));
  }, [amenityItems]);

  useEffect(() => {
    localStorage.setItem('hotel_pos_terminal_settings', JSON.stringify(terminalSettings));
  }, [terminalSettings]);

  // Clock ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Actions / Operations

  const updateActiveBill = (updater: (bill: Bill) => Bill) => {
    if (!activeBillId) return;
    setBills(prev => prev.map(b => {
      if (b.id !== activeBillId || b.status !== 'held') return b;
      return updater(b);
    }));
  };

  const getActiveHeldBill = (): Bill | null => {
    if (!activeBillId) return null;
    return bills.find(b => b.id === activeBillId && b.status === 'held') ?? null;
  };

  const updateAllBillsRoomBooking = (roomId: string, updater: (item: RoomBookingItem) => RoomBookingItem) => {
    setBills(prev => prev.map(bill => ({
      ...bill,
      roomBookings: bill.roomBookings.map(rb => rb.id === roomId ? updater(rb) : rb)
    })));
  };

  // Room Management CRUD handlers
  const handleEditRoom = (roomId: string, updatedFields: Partial<Room>) => {
    setRooms(prev => prev.map(room => room.id === roomId ? { ...room, ...updatedFields } : room));

    updateAllBillsRoomBooking(roomId, booking => {
      const pricePerNight = updatedFields.pricePerNight !== undefined ? updatedFields.pricePerNight : booking.pricePerNight;
      const name = updatedFields.name !== undefined ? updatedFields.name : booking.name;
      const roomNumber = updatedFields.roomNumber !== undefined ? updatedFields.roomNumber : booking.roomNumber;
      const boardPriceRate = booking.boardPlanPricePerNight || 0;
      const totalRatePerNight = pricePerNight + boardPriceRate;
      const basePrice = totalRatePerNight * booking.nights;
      const discountAmt = basePrice * (booking.discountPercentage / 100);
      return { ...booking, name, roomNumber, pricePerNight, discountAmount: discountAmt, totalPrice: basePrice - discountAmt };
    });

    playBeep(620, 0.08);
    setCheckoutNotice("Room details updated successfully.");
    setTimeout(() => setCheckoutNotice(null), 3000);
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
    playBeep(350, 0.1);
    setCheckoutNotice("Room removed from active registry.");
    setTimeout(() => setCheckoutNotice(null), 3000);
  };

  const handleAddRoom = (newRoom: Room) => {
    setRooms(prev => [...prev, newRoom]);
    playBeep(720, 0.1);
    setCheckoutNotice(`Created new Room ${newRoom.roomNumber} successfully.`);
    setTimeout(() => setCheckoutNotice(null), 3000);
  };

  // Food Management CRUD handlers
  const handleEditFood = (foodId: string, updatedFields: Partial<FoodItem>) => {
    setFoodItems(prev => prev.map(item => item.id === foodId ? { ...item, ...updatedFields } : item));

    setBills(prev => prev.map(bill => ({
      ...bill,
      foodOrders: bill.foodOrders.map(order => {
        if (order.id !== foodId) return order;
        const nextPrice = updatedFields.price !== undefined ? updatedFields.price : order.price;
        const name = updatedFields.name !== undefined ? updatedFields.name : order.name;
        return { ...order, name, price: nextPrice, totalPrice: order.quantity * nextPrice };
      })
    })));

    playBeep(620, 0.08);
    setCheckoutNotice("Food item details updated successfully.");
    setTimeout(() => setCheckoutNotice(null), 3000);
  };

  const handleDeleteFood = (foodId: string) => {
    setFoodItems(prev => prev.filter(item => item.id !== foodId));
    setBills(prev => prev.map(bill => ({
      ...bill,
      foodOrders: bill.foodOrders.filter(order => order.id !== foodId)
    })));
    playBeep(350, 0.1);
    setCheckoutNotice("Menu item removed successfully.");
    setTimeout(() => setCheckoutNotice(null), 3000);
  };

  const handleAddFood = (newItem: FoodItem) => {
    setFoodItems(prev => [...prev, newItem]);
    playBeep(720, 0.1);
    setCheckoutNotice(`Menu item "${newItem.name}" added successfully.`);
    setTimeout(() => setCheckoutNotice(null), 3000);
  };

  // Amenity CRUD handlers
  const handleEditAmenity = (amenityId: string, updatedFields: Partial<AmenityItem>) => {
    setAmenityItems(prev => prev.map(item => item.id === amenityId ? { ...item, ...updatedFields } : item));
    setBills(prev => prev.map(bill => ({
      ...bill,
      amenityCharges: bill.amenityCharges.map(charge => {
        if (charge.id !== amenityId) return charge;
        const nextPrice = updatedFields.price !== undefined ? updatedFields.price : charge.price;
        const name = updatedFields.name !== undefined ? updatedFields.name : charge.name;
        return { ...charge, name, price: nextPrice, totalPrice: charge.quantity * nextPrice };
      })
    })));
    playBeep(620, 0.08);
  };

  const handleDeleteAmenity = (amenityId: string) => {
    setAmenityItems(prev => prev.filter(item => item.id !== amenityId));
    setBills(prev => prev.map(bill => ({
      ...bill,
      amenityCharges: bill.amenityCharges.filter(c => c.id !== amenityId)
    })));
    playBeep(350, 0.1);
  };

  const handleAddAmenity = (newItem: AmenityItem) => {
    setAmenityItems(prev => [...prev, newItem]);
    playBeep(720, 0.1);
  };

  // Bill lifecycle handlers
  const handleCreateBill = (
    customerSnapshot: CustomerSnapshot,
    roomBookings: RoomBookingItem[],
    existingCustomerId?: string
  ) => {
    let customerId = existingCustomerId;
    if (!customerId) {
      const newCustomer: Customer = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        ...customerSnapshot,
        createdAt: new Date().toISOString()
      };
      customerId = newCustomer.id;
      setCustomers(prev => [...prev, newCustomer]);
    } else {
      setCustomers(prev => prev.map(c =>
        c.id === customerId ? { ...c, ...customerSnapshot } : c
      ));
    }

    const billId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
    const newBill: Bill = {
      id: billId,
      billNumber: generateBillNumber(bills.length),
      customerId: customerId!,
      customer: customerSnapshot,
      status: 'held',
      createdAt: new Date().toISOString(),
      roomBookings,
      foodOrders: [],
      amenityCharges: []
    };

    const roomIds = roomBookings.map(r => r.id);
    setBills(prev => [newBill, ...prev]);
    setActiveBillId(billId);
    setRooms(prev => prev.map(r => roomIds.includes(r.id) ? { ...r, status: 'booked' as const } : r));

    playBeep(520, 0.08);
    setCheckoutNotice(`Bill ${newBill.billNumber} created for ${customerSnapshot.name}.`);
    setTimeout(() => setCheckoutNotice(null), 4000);

    return billId;
  };

  const handleSelectBill = (billId: string) => {
    setActiveBillId(billId);
    playBeep(650, 0.05);
  };

  const handleAddFoodToBill = (item: FoodItem) => {
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

  const handleRemoveFood = (foodId: string) => {
    if (!activeBillId) return;
    updateActiveBill(bill => ({ ...bill, foodOrders: bill.foodOrders.filter(item => item.id !== foodId) }));
    playBeep(400, 0.06);
  };

  const handleUpdateAmenityQuantity = (itemId: string, delta: number) => {
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
    if (!activeBillId) return;
    updateActiveBill(bill => ({ ...bill, amenityCharges: bill.amenityCharges.filter(item => item.id !== amenityId) }));
    playBeep(400, 0.06);
  };

  const handleCloseBill = (cashReceived: number) => {
    const bill = getActiveHeldBill();
    if (!bill) return;

    const totals = calculateBillTotals(
      bill.roomBookings,
      bill.foodOrders,
      bill.amenityCharges,
      terminalSettings.serviceChargeRate,
      terminalSettings.taxRate
    );

    const change = cashReceived - totals.total;
    const invoiceNum = generateInvoiceNumber(receipts.length);
    const receiptId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);

    const receipt: SalesReceipt = {
      id: receiptId,
      invoiceNumber: invoiceNum,
      timestamp: new Date().toISOString(),
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
      cashChange: change,
      rooms: bill.roomBookings.map(r => ({
        name: r.name,
        roomNumber: r.roomNumber,
        nights: r.nights,
        pricePerNight: r.pricePerNight,
        discountAmount: r.discountAmount,
        boardPlan: r.boardPlan,
        boardPlanPricePerNight: r.boardPlanPricePerNight
      })),
      foods: bill.foodOrders.map(f => ({ name: f.name, quantity: f.quantity, price: f.price })),
      amenities: bill.amenityCharges.map(a => ({ name: a.name, quantity: a.quantity, price: a.price }))
    };

    const roomIds = bill.roomBookings.map(r => r.id);
    setRooms(prev => prev.map(r => roomIds.includes(r.id) ? { ...r, status: 'available' as const } : r));

    setBills(prev => prev.map(b =>
      b.id === bill.id
        ? { ...b, status: 'closed' as const, closedAt: new Date().toISOString(), receiptId }
        : b
    ));

    setReceipts(prev => [receipt, ...prev]);
    setSelectedReceiptForInvoice(receipt);
    setActiveBillId(null);

    playBeep(880, 0.1);
    setTimeout(() => playBeep(1100, 0.12), 100);
    setCheckoutNotice(`Bill closed! Receipt ${invoiceNum} generated.`);
    setTimeout(() => setCheckoutNotice(null), 4000);
  };

  // Toggle Room occupancy status inside database registry (occupied/available)
  const handleToggleRoomStatus = (roomId: string) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        const nextStatus = room.status === 'booked' ? 'available' : 'booked';
        playBeep(nextStatus === 'booked' ? 440 : 660, 0.1);
        return {
          ...room,
          status: nextStatus
        };
      }
      return room;
    }));
  };

  // Pay Cash Checkout transaction completion — removed; use handleCloseBill

  // Clear shift receipts history logs
  const handleClearShiftReceipts = () => {
    if (window.confirm("Perform final drawer clearance? This will erase current shift audit trails permanently.")) {
      setReceipts([]);
      localStorage.removeItem('hotel_pos_receipts');
      
      // Optionally also release all hotel rooms back to available
      if (window.confirm("Release all occupied hotel rooms back to 'Available' status?")) {
        setRooms(INITIAL_ROOMS);
        localStorage.removeItem('hotel_pos_rooms');
      }
    }
  };

  const currencySymbol = CURRENCY_SYMBOLS[terminalSettings.currency] || '$';

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
                {terminalSettings.currency === 'USD' ? 'Luxe Haven POS' : `Luxe POS (${terminalSettings.currency})`}
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Front Desk &amp; Dining Terminal</p>
            </div>
          </div>

          {/* Time and Shift Metadata HUD */}
          <div className="flex items-center gap-4 sm:gap-6 text-sm">
            {/* Settings button trigger */}
            <button
              id="terminal-settings-toggle-btn"
              onClick={() => { setIsSettingsOpen(true); playBeep(700, 0.08); }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold leading-none flex items-center gap-1.5 transition-all shadow-3xs hover:shadow-2xs cursor-pointer border border-slate-200"
            >
              <Settings className="size-3.5 text-indigo-600" />
              Terminal Setup
            </button>

            {/* Shift Agent info */}
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-slate-800">{terminalSettings.operatorName}</p>
              <p className="text-xs text-slate-400">Terminal #{terminalSettings.stationId}</p>
            </div>
            
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
          </div>

          {/* ACTIVE ASSIGNED COMPONENT CONTAINER PANE WITH FADE SEAMLESS DESIGN */}
          <div className="flex-1">
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
              />
            )}

            {activeLeftTab === 'rooms' && (
              <RoomSection
                rooms={rooms}
                bills={bills}
                onToggleRoomStatus={handleToggleRoomStatus}
                onEditRoom={handleEditRoom}
                onDeleteRoom={handleDeleteRoom}
                onAddRoom={handleAddRoom}
                currencySymbol={currencySymbol}
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
              />
            )}

            {activeLeftTab === 'logs' && (
              <DailySalesSummary
                receipts={receipts}
                onSelectReceipt={(r) => { setSelectedReceiptForInvoice(r); playBeep(750, 0.08); }}
                onClearReceipts={handleClearShiftReceipts}
                currencySymbol={currencySymbol}
                taxRate={terminalSettings.taxRate}
              />
            )}
          </div>
        </div>

        {/* RIGHT VIEW: 4-COLS STICKY FIXED ACTIVE BILLING SUMMARY PANE */}
        <div className="lg:col-span-4 h-[calc(100vh-160px)] sticky top-[88px]">
          <BillingSummary
            activeBill={activeBill}
            onRemoveFood={handleRemoveFood}
            onUpdateFoodQuantity={handleUpdateFoodQuantity}
            onRemoveAmenity={handleRemoveAmenity}
            onUpdateAmenityQuantity={handleUpdateAmenityQuantity}
            onCloseBill={handleCloseBill}
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
          />
        )}
      </AnimatePresence>

      {/* TERMINAL SETTINGS OVERLAY MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
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
                        onClick={() => { setTerminalSettings(prev => ({ ...prev, currency: cur as any })); playBeep(650, 0.05); }}
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
                      onChange={(e) => setTerminalSettings(prev => ({ ...prev, printerType: e.target.value as any }))}
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
                              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                              const osc = audioCtx.createOscillator();
                              const gain = audioCtx.createGain();
                              osc.type = 'sine';
                              osc.frequency.setValueAtTime(600, audioCtx.currentTime);
                              gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
                              osc.connect(gain);
                              gain.connect(audioCtx.destination);
                              osc.start();
                              osc.stop(audioCtx.currentTime + 0.1);
                            } catch (err) {}
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

                {/* Database Initialization Reset */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-rose-950 flex items-center gap-1">
                        <Database className="size-3.5" /> Station Initialization
                      </span>
                      <p className="text-[10px] text-rose-500 leading-tight">Clear all sales history, bookings, and restore rooms back to default registry.</p>
                    </div>
                    <button
                      id="reset-database-btn"
                      type="button"
                      onClick={() => {
                        if (window.confirm("Perform initial shift startup initialization? This wipes lodging ledger, restaurant orders and logs for the station.")) {
                          setReceipts([]);
                          setBills([]);
                          setCustomers([]);
                          setActiveBillId(null);
                          setRooms(INITIAL_ROOMS);
                          setFoodItems(INITIAL_FOOD_ITEMS);
                          setAmenityItems(INITIAL_AMENITY_ITEMS);
                          localStorage.clear();
                          try { sessionStorage.removeItem('hotel_pos_active_bill_id'); } catch { /* ignore */ }
                          setIsSettingsOpen(false);
                          setCheckoutNotice("POS database synchronized and restarted.");
                          setTimeout(() => setCheckoutNotice(null), 3000);
                        }
                      }}
                      className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase text-[9.5px] px-3 py-1.5 rounded border border-rose-700 cursor-pointer transition-colors shadow-3xs"
                    >
                      Reset POS
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end">
                <button
                  id="save-settings-btn"
                  onClick={() => setIsSettingsOpen(false)}
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
