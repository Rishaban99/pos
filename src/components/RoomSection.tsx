import React, { useState, useEffect } from 'react';
import { Room, RoomType, Bill } from '../types';
import { Bed, ShieldCheck, ShieldAlert, Plus, RefreshCw, Pencil, Trash2, X, User } from 'lucide-react';

interface RoomSectionProps {
  rooms: Room[];
  bills: Bill[];
  onToggleRoomStatus: (roomId: string) => void;
  currencySymbol?: string;
  onEditRoom: (roomId: string, updatedFields: Partial<Room>) => void;
  onDeleteRoom: (roomId: string) => void;
  onAddRoom: (newRoom: Room) => void;
}

function getRoomGuest(bills: Bill[], roomId: string): string | null {
  const held = bills.find(b => b.status === 'held' && b.roomBookings.some(r => r.id === roomId));
  return held ? held.customer.name : null;
}

export default function RoomSection({
  rooms,
  bills,
  onToggleRoomStatus,
  currencySymbol = '$',
  onEditRoom,
  onDeleteRoom,
  onAddRoom
}: RoomSectionProps) {
  const [selectedType, setSelectedType] = useState<RoomType | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'available' | 'booked'>('All');

  // Modals / Editor States
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);

  // States for form inputs (Add Room)
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<RoomType>('Single');
  const [newPricePerNight, setNewPricePerNight] = useState('');

  // States for form inputs (Edit Room)
  const [editRoomNumber, setEditRoomNumber] = useState('');
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomType, setEditRoomType] = useState<RoomType>('Single');
  const [editPricePerNight, setEditPricePerNight] = useState('');

  // Sync edit form fields when editingRoom changes
  useEffect(() => {
    if (editingRoom) {
      setEditRoomNumber(editingRoom.roomNumber);
      setEditRoomName(editingRoom.name);
      setEditRoomType(editingRoom.type);
      setEditPricePerNight(editingRoom.pricePerNight.toString());
    }
  }, [editingRoom]);

  const handleCreateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim() || !newRoomName.trim() || !newPricePerNight.trim()) {
      alert("All fields are required.");
      return;
    }
    const price = parseFloat(newPricePerNight);
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price/night rate.");
      return;
    }
    onAddRoom({
      id: 'r-' + Date.now(),
      roomNumber: newRoomNumber.trim(),
      name: newRoomName.trim(),
      type: newRoomType,
      pricePerNight: price,
      status: 'available'
    });
    // Reset form
    setNewRoomNumber('');
    setNewRoomName('');
    setNewRoomType('Single');
    setNewPricePerNight('');
    setIsAddingRoom(false);
  };

  const handleSaveEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    if (!editRoomNumber.trim() || !editRoomName.trim() || !editPricePerNight.trim()) {
      alert("All fields are required.");
      return;
    }
    const price = parseFloat(editPricePerNight);
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price/night rate.");
      return;
    }
    onEditRoom(editingRoom.id, {
      roomNumber: editRoomNumber.trim(),
      name: editRoomName.trim(),
      type: editRoomType,
      pricePerNight: price
    });
    setEditingRoom(null);
  };

  // Filters
  const filteredRooms = rooms.filter(room => {
    const typeMatch = selectedType === 'All' || room.type === selectedType;
    const statusMatch = statusFilter === 'All' || room.status === statusFilter;
    return typeMatch && statusMatch;
  });

  const categories: (RoomType | 'All')[] = ['All', 'Single', 'Double', 'Deluxe', 'Family Suite'];

  return (
    <>
      <div className="space-y-4" id="room-section-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-hotel-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-hotel-950 flex items-center gap-2">
            <Bed className="text-hotel-600 size-5" />
            Luxe Haven Room Suites
          </h2>
          <p className="text-xs text-brand-500">Room inventory and occupancy status</p>
        </div>
        
        {/* Availability Statistics */}
        <div className="flex items-center gap-3 text-xs">
          <button
            id="add-room-btn-icon"
            onClick={() => setIsAddingRoom(true)}
            className="flex items-center gap-1.5 bg-hotel-700 hover:bg-hotel-800 text-white font-bold px-3 py-1.5 rounded-lg shadow-3xs cursor-pointer transition-all uppercase tracking-wider text-[10.5px]"
          >
            <Plus className="size-3.5" />
            New Room
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{rooms.filter(r => r.status === 'available').length} Available</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
            <span className="size-2 rounded-full bg-amber-500"></span>
            <span>{rooms.filter(r => r.status === 'booked').length} Occupied</span>
          </div>
        </div>
      </div>

      {/* Row Filtering Controls */}
      <div className="flex flex-col md:flex-row gap-2 justify-between items-start md:items-center">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1 bg-brand-100 p-1 rounded-lg">
          {categories.map(cat => (
            <button
              key={cat}
              id={`room-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => setSelectedType(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all ${
                selectedType === cat
                  ? 'bg-hotel-600 text-white shadow-sm'
                  : 'text-brand-500 hover:text-brand-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Filter buttons */}
        <div className="flex gap-1 bg-brand-100 p-1 rounded-lg text-xs self-stretch md:self-auto">
          {(['All', 'available', 'booked'] as const).map(f => (
            <button
              key={f}
              id={`room-status-filter-${f}`}
              onClick={() => setStatusFilter(f)}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-md font-medium cursor-pointer transition-all ${
                statusFilter === f
                  ? 'bg-white text-brand-800 shadow-xs border border-brand-100'
                  : 'text-brand-500 hover:text-brand-800'
              }`}
            >
              {f === 'All' ? 'All Status' : f === 'available' ? 'Available' : 'Occupied'}
            </button>
          ))}
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-brand-100 shadow-sm">
          <p className="text-brand-500 text-sm">No rooms match the active filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRooms.map(room => {
            const guestName = getRoomGuest(bills, room.id);

            return (
              <div
                key={room.id}
                id={`room-card-${room.id}`}
                className={`relative flex flex-col justify-between bg-white rounded-2xl border transition-all duration-300 p-4 shadow-xs hover:shadow-md ${
                  room.status === 'booked'
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-brand-100'
                }`}
              >
                {/* Room status header badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-mono text-brand-500 tracking-wider">ROOM {room.roomNumber}</span>
                    <h3 className="text-base font-semibold text-brand-800 flex items-center gap-1.5 leading-tight">
                      {room.name}
                    </h3>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {room.status === 'available' ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold uppercase rounded-full tracking-wider select-none">
                        <ShieldCheck className="size-3" />
                        Available
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-semibold uppercase rounded-full tracking-wider select-none">
                        <ShieldAlert className="size-3" />
                        Occupied
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        id={`edit-room-btn-${room.id}`}
                        onClick={() => setEditingRoom(room)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Room Details"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        id={`delete-room-btn-${room.id}`}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete Room ${room.roomNumber} (${room.name}) from the POS registry?`)) {
                            onDeleteRoom(room.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Delete Room"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Body metadata */}
                <div className="space-y-2.5 my-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-brand-500">Base rate:</span>
                    <span className="text-lg font-bold text-hotel-700 font-mono">
                      {currencySymbol}{room.pricePerNight} <span className="text-xs font-medium text-brand-500">/ night</span>
                    </span>
                  </div>

                  {room.status === 'booked' && guestName && (
                    <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-lg text-center text-xs text-amber-800 font-medium flex items-center justify-center gap-1.5">
                      <User className="size-3.5" />
                      Guest: {guestName}
                    </div>
                  )}

                  {room.status === 'booked' && !guestName && (
                    <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-lg text-center text-xs text-amber-800 font-medium">
                      Currently occupied
                    </div>
                  )}
                </div>

                {/* Card footer CTA buttons */}
                <div className="pt-2 border-t border-brand-50 flex items-center gap-2">
                  <button
                    id={`toggle-room-${room.id}`}
                    onClick={() => onToggleRoomStatus(room.id)}
                    title="Toggle occupied/available status"
                    className="flex-1 p-1 px-2.5 text-[11px] font-medium border border-brand-200 rounded-lg text-brand-600 hover:bg-brand-50 hover:text-brand-800 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="size-3" />
                    {room.status === 'booked' ? 'Release Room' : 'Mark Booked'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

      {/* ADD ROOM MODAL OVERLAY */}
      {isAddingRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col" id="add-room-modal">
            <div className="bg-hotel-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bed className="size-5 text-hotel-400" />
                <div>
                  <h3 className="text-sm font-bold">Register New Room Suite</h3>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Lodging inventory unit</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingRoom(false)}
                className="bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoomSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Room Number *</label>
                <input
                  id="new-room-number"
                  type="text"
                  placeholder="e.g. 105"
                  required
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-hotel-600 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-900 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Suite Display Name *</label>
                <input
                  id="new-room-name"
                  type="text"
                  placeholder="e.g. Deluxe Sea-View Room"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-hotel-600 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-900 outline-hidden transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Room Category *</label>
                  <select
                    id="new-room-type"
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value as RoomType)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-hotel-600 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-800 outline-hidden transition-all"
                  >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Family Suite">Family Suite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Base Price / Night ({currencySymbol}) *</label>
                  <input
                    id="new-room-price"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="80.00"
                    required
                    value={newPricePerNight}
                    onChange={(e) => setNewPricePerNight(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-hotel-600 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-900 outline-hidden transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRoom(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold uppercase text-[10px] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-create-room-btn"
                  type="submit"
                  className="px-4 py-2 bg-hotel-700 hover:bg-hotel-800 text-white font-bold uppercase text-[10px] rounded-lg transition-colors cursor-pointer shadow-3xs"
                >
                  Add Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROOM MODAL OVERLAY */}
      {editingRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col" id="edit-room-modal">
            <div className="bg-hotel-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="size-5 text-hotel-400" />
                <div>
                  <h3 className="text-sm font-bold">Edit Room Details</h3>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Room Number: {editingRoom.roomNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Room Number *</label>
                <input
                  id="edit-room-number"
                  type="text"
                  required
                  value={editRoomNumber}
                  onChange={(e) => setEditRoomNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-hotel-600 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-900 outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Suite Display Name *</label>
                <input
                  id="edit-room-name"
                  type="text"
                  required
                  value={editRoomName}
                  onChange={(e) => setEditRoomName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-hotel-600 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-900 outline-hidden transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Room Category *</label>
                  <select
                    id="edit-room-type"
                    value={editRoomType}
                    onChange={(e) => setEditRoomType(e.target.value as RoomType)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-hotel-600 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-800 outline-hidden transition-all"
                  >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Family Suite">Family Suite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Base Price / Night ({currencySymbol}) *</label>
                  <input
                    id="edit-room-price"
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={editPricePerNight}
                    onChange={(e) => setEditPricePerNight(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-hotel-600 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-900 outline-hidden transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold uppercase text-[10px] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-edit-room-btn"
                  type="submit"
                  className="px-4 py-2 bg-hotel-700 hover:bg-hotel-800 text-white font-bold uppercase text-[10px] rounded-lg transition-colors cursor-pointer shadow-3xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
