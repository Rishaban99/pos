import React, { useState } from 'react';
import { Room, RoomType, RoomBookingItem, BoardPlan, BOARD_PLAN_PRICES, Customer, CustomerSnapshot } from '../types';
import { buildRoomBookingItem, calculateBillTotals } from '../utils/billing';
import { Bed, CalendarDays, Percent, Coffee, Plus, Trash2, User, Phone, Mail, CreditCard, Search } from 'lucide-react';

interface CreateBillFormProps {
  rooms: Room[];
  customers: Customer[];
  onCreateBill: (customer: CustomerSnapshot, roomBookings: RoomBookingItem[], existingCustomerId?: string) => void;
  currencySymbol?: string;
  serviceChargeRate?: number;
  taxRate?: number;
}

export default function CreateBillForm({
  rooms,
  customers,
  onCreateBill,
  currencySymbol = '$',
  serviceChargeRate = 10,
  taxRate = 5
}: CreateBillFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [draftRooms, setDraftRooms] = useState<RoomBookingItem[]>([]);
  const [selectedType, setSelectedType] = useState<RoomType | 'All'>('All');
  const [nightsInput, setNightsInput] = useState<Record<string, number>>({});
  const [selectedDiscounts, setSelectedDiscounts] = useState<Record<string, string>>({});
  const [selectedBoardPlans, setSelectedBoardPlans] = useState<Record<string, BoardPlan>>({});
  const [error, setError] = useState<string | null>(null);

  const availableRooms = rooms.filter(r => r.status === 'available' && !draftRooms.some(d => d.id === r.id));

  const filteredRooms = availableRooms.filter(room =>
    selectedType === 'All' || room.type === selectedType
  );

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const totals = calculateBillTotals(draftRooms, [], [], serviceChargeRate, taxRate);

  const getNights = (roomId: string) => nightsInput[roomId] || 1;
  const getSelectedDiscount = (roomId: string) => selectedDiscounts[roomId] || 'auto';
  const getSelectedBoardPlan = (roomId: string): BoardPlan => selectedBoardPlans[roomId] || 'Room Only';

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setName(customer.name);
    setPhone(customer.phone);
    setEmail(customer.email || '');
    setIdNumber(customer.idNumber || '');
    setCustomerSearch('');
  };

  const handleAddRoom = (room: Room) => {
    const nights = getNights(room.id);
    const choice = getSelectedDiscount(room.id);
    const override = choice === 'auto' ? undefined : parseInt(choice, 10);
    const bChoice = getSelectedBoardPlan(room.id);
    const bPrice = BOARD_PLAN_PRICES[bChoice];
    const item = buildRoomBookingItem(room, nights, override, bChoice, bPrice);
    setDraftRooms(prev => [...prev, item]);
  };

  const handleRemoveDraftRoom = (roomId: string) => {
    setDraftRooms(prev => prev.filter(r => r.id !== roomId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Customer name and phone are required.');
      return;
    }
    if (draftRooms.length === 0) {
      setError('Add at least one room to the bill.');
      return;
    }
    setError(null);
    onCreateBill(
      { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, idNumber: idNumber.trim() || undefined },
      draftRooms,
      selectedCustomerId || undefined
    );
    setName('');
    setPhone('');
    setEmail('');
    setIdNumber('');
    setSelectedCustomerId(null);
    setDraftRooms([]);
  };

  const categories: (RoomType | 'All')[] = ['All', 'Single', 'Double', 'Deluxe', 'Family Suite'];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Customer details */}
      <div className="bg-white rounded-xl border border-hotel-100 shadow-sm p-4 space-y-4">
        <h3 className="text-sm font-bold text-hotel-900 flex items-center gap-2">
          <User className="size-4 text-hotel-600" />
          Guest Details
        </h3>

        {customers.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-brand-400" />
            <input
              type="text"
              placeholder="Search returning guests by name or phone..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full bg-brand-50 border border-brand-200 rounded-lg py-2 pl-9 pr-3 text-xs text-brand-800 outline-hidden focus:border-hotel-600"
            />
            {customerSearch && filteredCustomers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-brand-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {filteredCustomers.slice(0, 5).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className="w-full text-left px-3 py-2 hover:bg-hotel-50 text-xs border-b border-brand-50 last:border-0"
                  >
                    <span className="font-semibold text-brand-900">{c.name}</span>
                    <span className="text-brand-500 ml-2">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-brand-500 uppercase mb-1">Full Name *</label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-brand-400" />
              <input
                required
                value={name}
                onChange={(e) => { setName(e.target.value); setSelectedCustomerId(null); }}
                className="w-full bg-brand-50 border border-brand-200 rounded-lg py-2 pl-8 pr-3 text-xs font-semibold outline-hidden focus:border-hotel-600"
                placeholder="John Smith"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-brand-500 uppercase mb-1">Phone *</label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-brand-400" />
              <input
                required
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setSelectedCustomerId(null); }}
                className="w-full bg-brand-50 border border-brand-200 rounded-lg py-2 pl-8 pr-3 text-xs font-semibold outline-hidden focus:border-hotel-600"
                placeholder="+1 555 0100"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-brand-500 uppercase mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-brand-400" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-50 border border-brand-200 rounded-lg py-2 pl-8 pr-3 text-xs outline-hidden focus:border-hotel-600"
                placeholder="guest@email.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-brand-500 uppercase mb-1">ID / Passport</label>
            <div className="relative">
              <CreditCard className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-brand-400" />
              <input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full bg-brand-50 border border-brand-200 rounded-lg py-2 pl-8 pr-3 text-xs outline-hidden focus:border-hotel-600"
                placeholder="Optional"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selected rooms on bill */}
      {draftRooms.length > 0 && (
        <div className="bg-hotel-50 rounded-xl border border-hotel-200 p-4 space-y-2">
          <h4 className="text-xs font-bold text-hotel-800 uppercase">Rooms on Bill ({draftRooms.length})</h4>
          {draftRooms.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-hotel-100 text-xs">
              <div>
                <span className="font-mono font-bold text-hotel-700 mr-2">{item.roomNumber}</span>
                <span className="font-semibold text-brand-800">{item.name}</span>
                <span className="text-brand-500 ml-2">{item.nights} night{item.nights > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold">{currencySymbol}{item.totalPrice.toFixed(2)}</span>
                <button type="button" onClick={() => handleRemoveDraftRoom(item.id)} className="text-brand-400 hover:text-red-500 p-1">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
          <div className="text-xs text-right font-bold text-hotel-800 pt-1 border-t border-hotel-200">
            Room subtotal: {currencySymbol}{totals.roomChargesFinal.toFixed(2)}
          </div>
        </div>
      )}

      {/* Room picker */}
      <div className="bg-white rounded-xl border border-hotel-100 shadow-sm p-4 space-y-3">
        <h3 className="text-sm font-bold text-hotel-900 flex items-center gap-2">
          <Bed className="size-4 text-hotel-600" />
          Add Rooms
        </h3>

        <div className="flex flex-wrap gap-1 bg-brand-100 p-1 rounded-lg">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedType(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedType === cat ? 'bg-hotel-600 text-white' : 'text-brand-500 hover:text-brand-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filteredRooms.length === 0 ? (
          <p className="text-xs text-brand-400 italic py-4 text-center">No available rooms match the filter.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
            {filteredRooms.map(room => {
              const nights = getNights(room.id);
              const discountChoice = getSelectedDiscount(room.id);
              return (
                <div key={room.id} className="border border-brand-100 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-brand-500">ROOM {room.roomNumber}</span>
                      <h4 className="text-xs font-semibold text-brand-800">{room.name}</h4>
                    </div>
                    <span className="text-sm font-bold font-mono text-hotel-700">{currencySymbol}{room.pricePerNight}/nt</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-brand-600 flex items-center gap-1"><CalendarDays className="size-3" /> Nights:</span>
                    <input
                      type="number" min="1" max="30" value={nights}
                      onChange={(e) => setNightsInput(prev => ({ ...prev, [room.id]: Math.max(1, Math.min(30, parseInt(e.target.value) || 1)) }))}
                      className="w-12 text-center font-mono border border-brand-200 rounded px-1 py-0.5"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-brand-600 flex items-center gap-1"><Coffee className="size-3" /> Board:</span>
                    <select
                      value={getSelectedBoardPlan(room.id)}
                      onChange={(e) => setSelectedBoardPlans(prev => ({ ...prev, [room.id]: e.target.value as BoardPlan }))}
                      className="text-[10px] border border-brand-200 rounded px-1 py-0.5 max-w-[120px]"
                    >
                      <option value="Room Only">Room Only</option>
                      <option value="Bed & Breakfast (BB)">BB (+{currencySymbol}18)</option>
                      <option value="Half Board (HB)">HB (+{currencySymbol}40)</option>
                      <option value="Full Board (FB)">FB (+{currencySymbol}75)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-brand-600 flex items-center gap-1"><Percent className="size-3" /> Discount:</span>
                    <select
                      value={discountChoice}
                      onChange={(e) => setSelectedDiscounts(prev => ({ ...prev, [room.id]: e.target.value }))}
                      className="text-[10px] border border-brand-200 rounded px-1 py-0.5 max-w-[120px]"
                    >
                      <option value="auto">Auto</option>
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="10">10%</option>
                      <option value="15">15%</option>
                      <option value="20">20%</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddRoom(room)}
                    className="w-full bg-hotel-700 hover:bg-hotel-800 text-white text-xs font-medium py-1.5 rounded-lg flex items-center justify-center gap-1"
                  >
                    <Plus className="size-3.5" /> Add to Bill
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-medium">{error}</div>
      )}

      <button
        type="submit"
        disabled={draftRooms.length === 0 || !name.trim() || !phone.trim()}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-brand-200 disabled:text-brand-400 text-white font-bold uppercase text-xs rounded-xl shadow-md transition-all"
      >
        Create &amp; Hold Bill
      </button>
    </form>
  );
}
