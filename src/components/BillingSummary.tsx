import React, { useState, useEffect, useRef } from 'react';
import { Bill, CustomerSnapshot, RoomBookingItem, BoardPlan } from '../types';
import { calculateBillTotals, BOARD_PLAN_PRICES } from '../utils/billing';
import { Receipt, Tag, Percent, Banknote, Coins, AlertCircle, ShoppingBag, BedDouble, Sparkles, User, Phone, ArrowLeftRight, Trash2, Pencil } from 'lucide-react';

interface BillingSummaryProps {
  activeBill: Bill | null;
  onRemoveFood: (foodId: string) => void;
  onUpdateFoodQuantity: (foodId: string, delta: number) => void;
  onRemoveAmenity: (amenityId: string) => void;
  onUpdateAmenityQuantity: (amenityId: string, delta: number) => void;
  onRemoveRoom: (roomId: string) => void;
  onUpdateCustomer: (customer: CustomerSnapshot) => void;
  onUpdateRoom: (roomId: string, updatedRoom: Partial<RoomBookingItem>) => void;
  onCloseBill: (cashReceived: number) => void;
  onDeleteBill?: (billId: string) => void;
  onEditBill?: () => void;
  onSwitchBill?: () => void;
  currencySymbol?: string;
  currencyCode?: string;
  serviceChargeRate?: number;
  taxRate?: number;
}

export default function BillingSummary({
  activeBill,
  onRemoveFood,
  onUpdateFoodQuantity,
  onRemoveAmenity,
  onUpdateAmenityQuantity,
  onRemoveRoom,
  onUpdateCustomer,
  onUpdateRoom,
  onCloseBill,
  onDeleteBill,
  onEditBill,
  onSwitchBill,
  currencySymbol = '$',
  currencyCode = 'USD',
  serviceChargeRate = 10,
  taxRate = 5
}: BillingSummaryProps) {
  const [cashReceived, setCashReceived] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerDraft, setCustomerDraft] = useState<CustomerSnapshot>({ name: '', phone: '' });
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomEditDraft, setRoomEditDraft] = useState<{
    nights: number;
    boardPlan: BoardPlan;
    discountReason: string;
  } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCashReceived('');
    setShowPayment(false);
    setShowDeleteModal(false);
    setErrorMessage(null);
    setEditingCustomer(false);
    setCustomerDraft(activeBill?.customer ?? { name: '', phone: '' });
    setEditingRoomId(null);
    setRoomEditDraft(null);
  }, [activeBill?.id]);

  useEffect(() => {
    if (showPayment && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [showPayment]);

  if (!activeBill) {
    return (
      <div className="bg-white rounded-2xl border border-hotel-100 shadow-sm flex flex-col h-full overflow-hidden">
        <div className="bg-brand-950 text-white p-4 flex items-center gap-2">
          <Receipt className="text-hotel-200 size-5" />
          <h2 className="text-lg font-bold tracking-tight">Guest Folio</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <Receipt className="size-10 text-brand-300 mx-auto" />
            <p className="text-sm font-medium text-brand-600">No active bill</p>
            <p className="text-xs text-brand-400">Create a new bill or resume an ongoing stay from the Guests tab.</p>
          </div>
        </div>
      </div>
    );
  }

  const { roomBookings, foodOrders, amenityCharges, customer, billNumber } = activeBill;
  const totals = calculateBillTotals(roomBookings, foodOrders, amenityCharges, serviceChargeRate, taxRate);
  const { roomChargesOriginal, roomDiscountTotal, foodCharges, amenityCharges: amenityTotal, foodServiceCharge, tax: taxSum, total: finalTotal } = totals;

  const numericCash = parseFloat(cashReceived) || 0;
  const change = numericCash >= finalTotal ? numericCash - finalTotal : 0;
  const isSufficientCash = numericCash >= finalTotal;

  const getDenominators = (currency: string) => {
    switch (currency) {
      case 'JPY': return [1000, 2000, 5000, 10000, 20000, 50000];
      case 'INR':
      case 'LKR': return [100, 200, 500, 1000, 2000, 5000];
      default: return [10, 20, 50, 100, 200, 500];
    }
  };

  const denominators = getDenominators(currencyCode);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashReceived || isNaN(numericCash)) {
      setErrorMessage('Please enter a valid numeric cash amount received.');
      return;
    }
    if (!isSufficientCash) {
      setErrorMessage(`Insufficient cash. Customer must pay at least ${currencySymbol}${finalTotal.toFixed(2)}.`);
      return;
    }
    setErrorMessage(null);
    onCloseBill(numericCash);
  };

  return (
    <div className="bg-white rounded-2xl border border-hotel-100 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="bg-brand-950 text-white p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="text-hotel-200 size-5" />
            <h2 className="text-lg font-bold tracking-tight">Guest Folio</h2>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500/20 text-amber-200 uppercase rounded-md border border-amber-500/30">
            Held
          </span>
        </div>
        <div className="text-xs space-y-0.5">
          <p className="font-mono text-hotel-300">{billNumber}</p>
          <p className="font-semibold flex items-center gap-1"><User className="size-3" /> {customer.name}</p>
          <p className="text-brand-300 flex items-center gap-1"><Phone className="size-3" /> {customer.phone}</p>
        </div>
        <div className="flex gap-2">
          {onSwitchBill && (
            <button type="button" onClick={onSwitchBill} className="text-[10px] text-hotel-300 hover:text-white flex items-center gap-1 underline">
              <ArrowLeftRight className="size-3" /> Switch bill
            </button>
          )}
          <button type="button" onClick={() => setEditingCustomer(prev => !prev)} className="text-[10px] text-brand-100 hover:text-white flex items-center gap-1 underline">
            <Pencil className="size-3" /> {editingCustomer ? 'Cancel edit' : 'Edit guest'}
          </button>
          {onDeleteBill && (
            <button type="button" onClick={() => setShowDeleteModal(true)} className="text-[10px] text-red-300 hover:text-red-100 flex items-center gap-1 underline ml-auto">
              <Trash2 className="size-3" /> Delete bill
            </button>
          )}
        </div>
      </div>

      {editingCustomer && (
        <div className="bg-white p-4 border-t border-brand-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-brand-500">Full Name</label>
              <input
                type="text"
                value={customerDraft.name}
                onChange={(e) => setCustomerDraft(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-brand-50 border border-brand-200 rounded-lg py-2 px-3 text-xs outline-hidden focus:border-hotel-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-brand-500">Phone</label>
              <input
                type="text"
                value={customerDraft.phone}
                onChange={(e) => setCustomerDraft(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-brand-50 border border-brand-200 rounded-lg py-2 px-3 text-xs outline-hidden focus:border-hotel-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-brand-500">Email</label>
              <input
                type="email"
                value={customerDraft.email ?? ''}
                onChange={(e) => setCustomerDraft(prev => ({ ...prev, email: e.target.value || undefined }))}
                className="w-full bg-brand-50 border border-brand-200 rounded-lg py-2 px-3 text-xs outline-hidden focus:border-hotel-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-brand-500">ID / Passport</label>
              <input
                type="text"
                value={customerDraft.idNumber ?? ''}
                onChange={(e) => setCustomerDraft(prev => ({ ...prev, idNumber: e.target.value || undefined }))}
                className="w-full bg-brand-50 border border-brand-200 rounded-lg py-2 px-3 text-xs outline-hidden focus:border-hotel-600"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => {
                if (!customerDraft.name.trim() || !customerDraft.phone.trim()) return;
                onUpdateCustomer(customerDraft);
                setEditingCustomer(false);
              }}
              className="px-3 py-2 bg-hotel-700 hover:bg-hotel-800 text-white text-[10px] uppercase rounded-lg"
            >
              Save guest
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingCustomer(false);
                setCustomerDraft(customer);
              }}
              className="px-3 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-[10px] uppercase rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-5">
        <div>
          <h3 className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-1 border-b border-brand-100">
            <BedDouble className="size-3.5 text-hotel-600" />
            Room Bookings ({roomBookings.length})
          </h3>
          {roomBookings.length === 0 ? (
            <p className="text-xs text-brand-400 italic py-2">No rooms on bill.</p>
          ) : (
            <div className="space-y-2.5">
              {roomBookings.map(item => (
                <div key={item.id} className="bg-brand-50 p-3 rounded-lg border border-brand-100 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold bg-hotel-100 text-hotel-800 px-1.5 py-0.5 rounded mr-1.5">{item.roomNumber}</span>
                      <span className="font-semibold text-brand-800">{item.name}</span>
                      <p className="text-[11px] text-brand-500 mt-1">
                        {item.nights} night{item.nights > 1 ? 's' : ''} × {currencySymbol}{(item.pricePerNight + (item.boardPlanPricePerNight || 0)).toFixed(2)}
                      </p>
                      {item.discountAmount > 0 && (
                        <p className="text-[9px] font-bold text-emerald-600 uppercase flex items-center gap-0.5 mt-0.5">
                          <Tag className="size-2.5" /> {item.discountPercentage.toFixed(1)}% off (-{currencySymbol}{item.discountAmount.toFixed(2)})
                          {item.discountReason ? ` - ${item.discountReason}` : ''}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-bold">{currencySymbol}{item.totalPrice.toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRoomId(prev => (prev === item.id ? null : item.id));
                          setRoomEditDraft({
                            nights: item.nights,
                            boardPlan: item.boardPlan ?? 'Room Only',
                            discountReason: item.discountReason ?? '',
                          });
                        }}
                        className="text-[10px] text-brand-100 hover:text-white flex items-center gap-1 underline"
                      >
                        <Pencil className="size-3" /> Edit
                      </button>
                      <button type="button" onClick={() => onRemoveRoom(item.id)} className="text-[10px] text-brand-300 hover:text-red-500 flex items-center gap-1">
                        <Trash2 className="size-3" /> Delete
                      </button>
                    </div>
                  </div>
                  {editingRoomId === item.id && roomEditDraft && (
                    <div className="mt-3 space-y-3 bg-white p-3 rounded-lg border border-brand-100 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-brand-500 mb-1">Nights</label>
                          <input
                            type="number"
                            min={1}
                            value={roomEditDraft.nights}
                            onChange={(e) => setRoomEditDraft(prev => prev ? ({ ...prev, nights: Math.max(1, Number(e.target.value) || 1) }) : null)}
                            className="w-full bg-brand-50 border border-brand-200 rounded-lg py-2 px-3 text-xs outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-brand-500 mb-1">Board plan</label>
                          <select
                            value={roomEditDraft.boardPlan}
                            onChange={(e) => setRoomEditDraft(prev => prev ? ({ ...prev, boardPlan: e.target.value as BoardPlan }) : null)}
                            className="w-full bg-brand-50 border border-brand-200 rounded-lg py-2 px-3 text-xs outline-hidden"
                          >
                            <option value="Room Only">Room Only</option>
                            <option value="Bed & Breakfast (BB)">Bed & Breakfast</option>
                            <option value="Half Board (HB)">Half Board</option>
                            <option value="Full Board (FB)">Full Board</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-brand-500 mb-1">Discount note</label>
                          <input
                            type="text"
                            value={roomEditDraft.discountReason}
                            onChange={(e) => setRoomEditDraft(prev => prev ? ({ ...prev, discountReason: e.target.value }) : null)}
                            className="w-full bg-brand-50 border border-brand-200 rounded-lg py-2 px-3 text-xs outline-hidden"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!roomEditDraft) return;
                            const boardPlanPrice = BOARD_PLAN_PRICES[roomEditDraft.boardPlan];
                            const basePrice = (item.pricePerNight + boardPlanPrice) * roomEditDraft.nights;
                            const discountAmount = basePrice * (item.discountPercentage / 100);
                            onUpdateRoom(item.id, {
                              nights: roomEditDraft.nights,
                              boardPlan: roomEditDraft.boardPlan,
                              boardPlanPricePerNight: boardPlanPrice,
                              discountReason: roomEditDraft.discountReason,
                              discountAmount,
                              totalPrice: Math.max(0, basePrice - discountAmount),
                            });
                            setEditingRoomId(null);
                            setRoomEditDraft(null);
                          }}
                          className="px-3 py-2 bg-hotel-700 hover:bg-hotel-800 text-white text-[10px] uppercase rounded-lg"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRoomId(null);
                            setRoomEditDraft(null);
                          }}
                          className="px-3 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-[10px] uppercase rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-1 border-b border-brand-100">
            <ShoppingBag className="size-3.5" />
            Food Orders ({foodOrders.length})
          </h3>
          {foodOrders.length === 0 ? (
            <p className="text-xs text-brand-400 italic py-2">No food charges yet.</p>
          ) : (
            <div className="space-y-2.5">
              {foodOrders.map(item => (
                <div key={item.id} className="bg-brand-50 p-2.5 rounded-lg border border-brand-100 flex items-center justify-between text-xs">
                  <div className="max-w-[55%]">
                    <span className="font-semibold text-brand-800 line-clamp-1">{item.name}</span>
                    <p className="text-[11px] text-brand-500">{currencySymbol}{item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onUpdateFoodQuantity(item.id, -1)} className="size-5 bg-white border rounded text-brand-500">-</button>
                      <span className="w-5 text-center font-mono font-semibold">{item.quantity}</span>
                      <button onClick={() => onUpdateFoodQuantity(item.id, 1)} className="size-5 bg-white border rounded text-brand-500">+</button>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">{currencySymbol}{item.totalPrice.toFixed(2)}</div>
                        <button type="button" onClick={() => onRemoveFood(item.id)} className="text-[10px] text-brand-300 hover:text-red-500">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-1 border-b border-brand-100">
            <Sparkles className="size-3.5 text-purple-500" />
            Amenities ({amenityCharges.length})
          </h3>
          {amenityCharges.length === 0 ? (
            <p className="text-xs text-brand-400 italic py-2">No amenity charges yet.</p>
          ) : (
            <div className="space-y-2.5">
              {amenityCharges.map(item => (
                <div key={item.id} className="bg-brand-50 p-2.5 rounded-lg border border-brand-100 flex items-center justify-between text-xs">
                  <div className="max-w-[55%]">
                    <span className="font-semibold text-brand-800 line-clamp-1">{item.name}</span>
                    <p className="text-[11px] text-brand-500">{currencySymbol}{item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onUpdateAmenityQuantity(item.id, -1)} className="size-5 bg-white border rounded text-brand-500">-</button>
                      <span className="w-5 text-center font-mono font-semibold">{item.quantity}</span>
                      <button onClick={() => onUpdateAmenityQuantity(item.id, 1)} className="size-5 bg-white border rounded text-brand-500">+</button>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">{currencySymbol}{item.totalPrice.toFixed(2)}</div>
                      <button type="button" onClick={() => onRemoveAmenity(item.id)} className="text-[10px] text-brand-300 hover:text-red-500">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>

        <div className="bg-brand-50 border-t border-brand-200 p-4 space-y-4">
        <div className="space-y-1.5 text-xs">
          {roomChargesOriginal > 0 && (
            <div className="flex justify-between text-brand-700">
              <span>Room Charges:</span>
              <span className="font-mono">{currencySymbol}{roomChargesOriginal.toFixed(2)}</span>
            </div>
          )}
          {roomDiscountTotal > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span className="flex items-center gap-1"><Percent className="size-3" /> Room Discount:</span>
              <span className="font-mono">-{currencySymbol}{roomDiscountTotal.toFixed(2)}</span>
            </div>
          )}
          {foodCharges > 0 && (
            <div className="flex justify-between text-brand-700">
              <span>Food Subtotal:</span>
              <span className="font-mono">{currencySymbol}{foodCharges.toFixed(2)}</span>
            </div>
          )}
          {amenityTotal > 0 && (
            <div className="flex justify-between text-brand-700">
              <span>Amenities:</span>
              <span className="font-mono">{currencySymbol}{amenityTotal.toFixed(2)}</span>
            </div>
          )}
          {foodCharges > 0 && (
            <div className="flex justify-between text-brand-500">
              <span>Food Service Charge ({serviceChargeRate}%):</span>
              <span className="font-mono">{currencySymbol}{foodServiceCharge.toFixed(2)}</span>
            </div>
          )}
          {taxRate > 0 && (
            <div className="flex justify-between text-brand-500">
              <span>Sales Tax ({taxRate}%):</span>
              <span className="font-mono">{currencySymbol}{taxSum.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-brand-950 pt-1.5 border-t border-brand-200">
            <span>Running Balance:</span>
            <span className="font-mono text-lg text-hotel-700">{currencySymbol}{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {!showPayment ? (
          <button
            onClick={() => setShowPayment(true)}
            className="w-full py-3 bg-hotel-700 hover:bg-hotel-800 text-white font-bold uppercase text-xs rounded-xl flex items-center justify-center gap-2 shadow-md"
          >
            <Banknote className="size-4" />
            Close Bill &amp; Collect Payment
          </button>
        ) : (
          <form onSubmit={handlePayment} className="space-y-3 bg-white p-3 rounded-xl border border-brand-200 shadow-3xs">
            <div>
              <label className="block text-xs font-bold text-brand-700 mb-1 flex items-center gap-1">
                <Banknote className="size-3.5 text-emerald-600" />
                CASH RECEIVED ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-400 font-mono font-semibold">{currencySymbol}</span>
                <input
                  type="text"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="w-full bg-brand-50/50 border border-brand-200 focus:border-emerald-500 text-lg font-bold font-mono rounded-lg py-1.5 pl-7 pr-3 text-right outline-hidden"
                  required
                />
              </div>
            </div>

            <div className={`p-2 rounded-lg flex justify-between text-xs font-semibold ${isSufficientCash ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
              <span className="flex items-center gap-1"><Coins className="size-3.5" />{isSufficientCash ? 'Change:' : 'Amount due:'}</span>
              <span className="font-mono font-extrabold text-sm">
                {currencySymbol}{isSufficientCash ? change.toFixed(2) : (finalTotal - numericCash).toFixed(2)}
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-brand-400">Quick tender:</span>
              <div className="grid grid-cols-4 gap-1">
                <button type="button" onClick={() => setCashReceived(finalTotal.toFixed(2))} className="text-[10.5px] font-medium py-1 bg-hotel-100 hover:bg-hotel-200 text-hotel-800 rounded border">Exact</button>
                {denominators.map(val => (
                  <button key={val} type="button" onClick={() => setCashReceived(val.toString())} disabled={val < finalTotal}
                    className={`text-[10.5px] font-mono py-1 rounded ${val >= finalTotal ? 'bg-brand-100 hover:bg-brand-200 text-brand-700 border' : 'bg-brand-50 text-brand-300 opacity-50 line-through'}`}>
                    {currencySymbol}{val}
                  </button>
                ))}
                <button type="button" onClick={() => setCashReceived('')} className="text-[10.5px] py-1 bg-red-50 text-red-700 border border-red-100 rounded">Clear</button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-start gap-1 text-xs">
                <AlertCircle className="size-4 shrink-0" />{errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPayment(false)}
                className="w-full py-2.5 border border-brand-200 text-brand-600 hover:bg-brand-50 font-semibold uppercase text-[10px] tracking-wide rounded-xl min-h-[40px]"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!isSufficientCash}
                className={`w-full py-3 px-3 rounded-xl font-bold uppercase text-[11px] tracking-wide flex items-center justify-center gap-2 min-h-[44px] ${
                  isSufficientCash
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    : 'bg-brand-200 text-brand-400 cursor-not-allowed'
                }`}
              >
                <Banknote className="size-4 shrink-0" />
                <span>Finalize &amp; Print Receipt</span>
              </button>
            </div>
          </form>
        )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Delete Bill?</h3>
            <p className="text-sm text-slate-500">Are you sure you want to delete this bill? This action cannot be undone and booked rooms will be released.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm">Cancel</button>
              <button onClick={() => { setShowDeleteModal(false); onDeleteBill?.(activeBill.id); }} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
