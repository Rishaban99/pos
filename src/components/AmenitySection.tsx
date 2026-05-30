import React, { useState, useEffect } from 'react';
import { AmenityItem, AmenityCategory, AmenityChargeItem } from '../types';
import { Sparkles, Search, RotateCcw, Plus, Minus, Check, Pencil, Trash2, X, AlertCircle } from 'lucide-react';

interface AmenitySectionProps {
  amenityItems: AmenityItem[];
  onAddAmenityToBill: (item: AmenityItem) => void;
  onUpdateAmenityQuantity: (itemId: string, delta: number) => void;
  currentAmenityCharges: AmenityChargeItem[];
  hasActiveBill: boolean;
  activeBillCustomerName?: string;
  currencySymbol?: string;
  onEditAmenity: (amenityId: string, updatedFields: Partial<AmenityItem>) => void;
  onDeleteAmenity: (amenityId: string) => void;
  onAddAmenity: (newItem: AmenityItem) => void;
  canManageCatalog?: boolean;
}

export default function AmenitySection({
  amenityItems,
  onAddAmenityToBill,
  onUpdateAmenityQuantity,
  currentAmenityCharges,
  hasActiveBill,
  activeBillCustomerName,
  currencySymbol = '$',
  onEditAmenity,
  onDeleteAmenity,
  onAddAmenity,
  canManageCatalog = true
}: AmenitySectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<AmenityCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAmenity, setEditingAmenity] = useState<AmenityItem | null>(null);
  const [isAddingAmenity, setIsAddingAmenity] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState<AmenityCategory>('minibar');
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState<AmenityCategory>('minibar');

  useEffect(() => {
    if (editingAmenity) {
      setEditName(editingAmenity.name);
      setEditPrice(editingAmenity.price.toString());
      setEditCategory(editingAmenity.category);
    }
  }, [editingAmenity]);

  const filtered = amenityItems.filter(item => {
    const catMatch = selectedCategory === 'All' || item.category === selectedCategory;
    const searchMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  const categories: (AmenityCategory | 'All')[] = ['All', 'minibar', 'laundry', 'spa', 'services'];

  const getCategoryColor = (category: AmenityCategory) => {
    switch (category) {
      case 'minibar': return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'laundry': return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'spa': return 'bg-purple-50 text-purple-800 border-purple-100';
      case 'services': return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newPrice);
    if (!newName.trim() || isNaN(price) || price <= 0) return;
    onAddAmenity({ id: 'a-' + Date.now(), name: newName.trim(), price, category: newCategory, available: true });
    setNewName(''); setNewPrice(''); setNewCategory('minibar'); setIsAddingAmenity(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAmenity) return;
    const price = parseFloat(editPrice);
    if (!editName.trim() || isNaN(price) || price <= 0) return;
    onEditAmenity(editingAmenity.id, { name: editName.trim(), price, category: editCategory });
    setEditingAmenity(null);
  };

  return (
    <>
      <div className="space-y-4">
        {!hasActiveBill && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2 text-xs text-amber-800">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <p>Create or resume a bill from <strong>Guests</strong> to add amenity charges to a folio.</p>
          </div>
        )}

        {hasActiveBill && activeBillCustomerName && (
          <div className="bg-hotel-50 border border-hotel-200 rounded-xl p-3 text-xs text-hotel-800 font-medium">
            Adding charges to folio: <strong>{activeBillCustomerName}</strong>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-hotel-100 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-hotel-900 flex items-center gap-2">
              <Sparkles className="text-hotel-600 size-5" />
              Room Amenities
            </h2>
            <p className="text-xs text-brand-500">Minibar, laundry, spa, and hotel services</p>
          </div>
          {canManageCatalog && (
            <button
              onClick={() => setIsAddingAmenity(true)}
              className="flex items-center gap-1.5 bg-hotel-700 hover:bg-hotel-800 text-white font-bold px-3 py-1.5 rounded-lg text-[10.5px] uppercase"
            >
              <Plus className="size-3.5" /> New Item
            </button>
          )}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-brand-400" />
            <input
              type="text"
              placeholder="Search amenities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-50 border border-brand-200 rounded-xl py-2 pl-9 pr-4 text-sm outline-hidden focus:border-hotel-600"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1 bg-brand-100 p-1 rounded-lg">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase ${
                selectedCategory === cat ? 'bg-hotel-600 text-white' : 'text-brand-500 hover:text-brand-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-brand-100">
            <p className="text-brand-500 text-sm">No amenities match the filter.</p>
            <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} className="mt-3 text-xs text-hotel-700 hover:underline inline-flex items-center gap-1">
              <RotateCcw className="size-3" /> Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(item => {
              const cartItem = currentAmenityCharges.find(c => c.id === item.id);
              const isAdded = !!cartItem;
              return (
                <div key={item.id} className={`bg-white rounded-xl border p-4 shadow-3xs ${isAdded ? 'border-hotel-300 bg-hotel-50/10' : 'border-brand-100'}`}>
                  <div className="flex justify-between items-start gap-1 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getCategoryColor(item.category)}`}>{item.category}</span>
                    <div className="flex gap-1">
                      {isAdded && <span className="text-[10px] text-hotel-700 font-semibold bg-hotel-100 px-2 py-0.5 rounded-full flex items-center gap-0.5"><Check className="size-3" /> Added</span>}
                      {canManageCatalog && (
                        <>
                          <button onClick={() => setEditingAmenity(item)} className="p-1 text-slate-400 hover:text-indigo-600 rounded"><Pencil className="size-3.5" /></button>
                          <button onClick={() => { if (window.confirm(`Delete "${item.name}"?`)) onDeleteAmenity(item.id); }} className="p-1 text-slate-400 hover:text-rose-600 rounded"><Trash2 className="size-3.5" /></button>
                        </>
                      )}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-brand-800 min-h-[2.25rem]">{item.name}</h3>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-50">
                    <span className="text-base font-bold font-mono text-hotel-800">{currencySymbol}{item.price.toFixed(2)}</span>
                    {isAdded ? (
                      <div className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 rounded-lg p-1">
                        <button onClick={() => onUpdateAmenityQuantity(item.id, -1)} className="size-7 bg-white border border-brand-100 rounded-md flex items-center justify-center"><Minus className="size-3" /></button>
                        <span className="w-6 text-center text-xs font-mono font-bold">{cartItem.quantity}</span>
                        <button onClick={() => onUpdateAmenityQuantity(item.id, 1)} className="size-7 bg-white border border-brand-100 rounded-md flex items-center justify-center"><Plus className="size-3" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => hasActiveBill && onAddAmenityToBill(item)}
                        disabled={!hasActiveBill}
                        className={`font-medium text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 uppercase ${
                          hasActiveBill ? 'bg-brand-900 text-white hover:bg-hotel-700' : 'bg-brand-100 text-brand-400 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="size-3" /> Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isAddingAmenity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-hotel-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-sm font-bold">Register Amenity Item</h3>
              <button onClick={() => setIsAddingAmenity(false)} className="p-1 hover:bg-white/20 rounded"><X className="size-4" /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Name *</label>
                <input required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as AmenityCategory)} className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs uppercase">
                    <option value="minibar">Minibar</option>
                    <option value="laundry">Laundry</option>
                    <option value="spa">Spa</option>
                    <option value="services">Services</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Price ({currencySymbol})</label>
                  <input required type="number" min="0.1" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddingAmenity(false)} className="px-4 py-2 border rounded-lg text-[10px] font-bold uppercase">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-hotel-700 text-white rounded-lg text-[10px] font-bold uppercase">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingAmenity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-hotel-950 text-white p-4 flex justify-between items-center">
              <h3 className="text-sm font-bold">Edit Amenity</h3>
              <button onClick={() => setEditingAmenity(null)} className="p-1 hover:bg-white/20 rounded"><X className="size-4" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Name *</label>
                <input required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as AmenityCategory)} className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs uppercase">
                    <option value="minibar">Minibar</option>
                    <option value="laundry">Laundry</option>
                    <option value="spa">Spa</option>
                    <option value="services">Services</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Price ({currencySymbol})</label>
                  <input required type="number" min="0.1" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingAmenity(null)} className="px-4 py-2 border rounded-lg text-[10px] font-bold uppercase">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-hotel-700 text-white rounded-lg text-[10px] font-bold uppercase">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
