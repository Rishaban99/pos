import React, { useState, useEffect } from 'react';
import { FoodItem, FoodCategory, FoodOrderItem } from '../types';
import { Utensils, Search, RotateCcw, Plus, Minus, Check, Pencil, Trash2, X, AlertCircle } from 'lucide-react';

interface FoodSectionProps {
  foodItems: FoodItem[];
  onAddFoodToBill: (item: FoodItem) => void;
  onUpdateFoodQuantity: (itemId: string, delta: number) => void;
  currentFoodOrders: FoodOrderItem[];
  hasActiveBill: boolean;
  activeBillCustomerName?: string;
  currencySymbol?: string;
  onEditFood: (foodId: string, updatedFields: Partial<FoodItem>) => void;
  onDeleteFood: (foodId: string) => void;
  onAddFood: (newItem: FoodItem) => void;
}

export default function FoodSection({
  foodItems,
  onAddFoodToBill,
  onUpdateFoodQuantity,
  currentFoodOrders,
  hasActiveBill,
  activeBillCustomerName,
  currencySymbol = '$',
  onEditFood,
  onDeleteFood,
  onAddFood
}: FoodSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Editor States
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [isAddingFood, setIsAddingFood] = useState(false);

  // States for form inputs (Add Food)
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodPrice, setNewFoodPrice] = useState('');
  const [newFoodCategory, setNewFoodCategory] = useState<FoodCategory>('breakfast');

  // States for form inputs (Edit Food)
  const [editFoodName, setEditFoodName] = useState('');
  const [editFoodPrice, setEditFoodPrice] = useState('');
  const [editFoodCategory, setEditFoodCategory] = useState<FoodCategory>('breakfast');

  // Sync edit form fields when editingFood changes
  useEffect(() => {
    if (editingFood) {
      setEditFoodName(editingFood.name);
      setEditFoodPrice(editingFood.price.toString());
      setEditFoodCategory(editingFood.category);
    }
  }, [editingFood]);

  const handleCreateFoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodName.trim() || !newFoodPrice.trim()) {
      alert("All fields are required.");
      return;
    }
    const price = parseFloat(newFoodPrice);
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price.");
      return;
    }
    onAddFood({
      id: 'f-' + Date.now(),
      name: newFoodName.trim(),
      price: price,
      category: newFoodCategory,
      available: true
    });
    // Reset form
    setNewFoodName('');
    setNewFoodPrice('');
    setNewFoodCategory('breakfast');
    setIsAddingFood(false);
  };

  const handleSaveEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFood) return;
    if (!editFoodName.trim() || !editFoodPrice.trim()) {
      alert("All fields are required.");
      return;
    }
    const price = parseFloat(editFoodPrice);
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price/rate.");
      return;
    }
    onEditFood(editingFood.id, {
      name: editFoodName.trim(),
      price: price,
      category: editFoodCategory
    });
    setEditingFood(null);
  };

  // Filtering Logic
  const filteredFood = foodItems.filter(item => {
    const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory;
    const searchMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const getCategoryColor = (category: FoodCategory) => {
    switch (category) {
      case 'breakfast': return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'lunch': return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'dinner': return 'bg-purple-50 text-purple-800 border-purple-100';
      case 'drinks': return 'bg-rose-50 text-rose-800 border-rose-100';
    }
  };

  const categories: (FoodCategory | 'All')[] = ['All', 'breakfast', 'lunch', 'dinner', 'drinks'];

  return (
    <>
      <div className="space-y-4" id="food-section-container">
      {!hasActiveBill && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2 text-xs text-amber-800">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <p>Create or resume a bill from <strong>Guests</strong> to add food charges to a folio.</p>
        </div>
      )}

      {hasActiveBill && activeBillCustomerName && (
        <div className="bg-hotel-50 border border-hotel-200 rounded-xl p-3 text-xs text-hotel-800 font-medium">
          Adding charges to folio: <strong>{activeBillCustomerName}</strong>
        </div>
      )}

      {/* Search and Title Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-hotel-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-hotel-900 flex items-center gap-2">
            <Utensils className="text-hotel-600 size-5" />
            Kitchen & Bar Service
          </h2>
          <p className="text-xs text-brand-500">Order refreshments and gourmet hotel diners</p>
        </div>

        <button
          id="add-food-btn-icon"
          onClick={() => setIsAddingFood(true)}
          className="md:order-last flex items-center gap-1.5 bg-hotel-700 hover:bg-hotel-800 text-white font-bold px-3 py-1.5 rounded-lg shadow-3xs cursor-pointer transition-all uppercase tracking-wider text-[10.5px] whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="size-3.5" />
          New Item
        </button>

        {/* Dynamic Search Input with icon */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-400">
            <Search className="size-4" />
          </span>
          <input
            id="food-search-input"
            type="text"
            placeholder="Search food & beverage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-50 border border-brand-200 focus:border-hotel-600 focus:bg-white text-sm rounded-xl py-2 pl-9 pr-4 text-brand-800 placeholder-brand-400 outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Row Filtering Controls */}
      <div className="flex flex-wrap gap-1 bg-brand-100 p-1 rounded-lg self-start">
        {categories.map(cat => (
          <button
            key={cat}
            id={`food-cat-${cat}`}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all uppercase tracking-wider ${
              selectedCategory === cat
                ? 'bg-hotel-600 text-white shadow-sm'
                : 'text-brand-500 hover:text-brand-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Food items Grid layout */}
      {filteredFood.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-brand-100 shadow-sm">
          <p className="text-brand-500 text-sm">No food items match the filter keywords.</p>
          <button 
            id="reset-food-search"
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
            className="mt-3 text-xs text-hotel-700 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="size-3" /> Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4" id="food-items-grid">
          {filteredFood.map(item => {
            const cartItem = currentFoodOrders.find(ci => ci.id === item.id);
            const isAdded = !!cartItem;
            
            return (
              <div
                key={item.id}
                id={`food-card-${item.id}`}
                className={`flex flex-col justify-between bg-white rounded-xl border p-4 shadow-3xs transition-all duration-300 hover:shadow-md ${
                  isAdded ? 'border-hotel-300 bg-hotel-50/10' : 'border-brand-100'
                }`}
              >
                {/* Header Info */}
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wider ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      {isAdded && (
                        <span className="flex items-center gap-0.5 text-[10px] text-hotel-700 font-semibold bg-hotel-100 border border-hotel-200/50 rounded-full py-0.5 px-2">
                          <Check className="size-3" /> Selected
                        </span>
                      )}

                      <button
                        id={`edit-food-btn-${item.id}`}
                        onClick={() => setEditingFood(item)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Item Details"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        id={`delete-food-btn-${item.id}`}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${item.name}" from the POS menu?`)) {
                            onDeleteFood(item.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-brand-800 mt-2 leading-tight min-h-[2.25rem] flex items-center">
                    {item.name}
                  </h3>
                </div>

                {/* Pricing & Cart Action Row */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-50">
                  <span className="text-base font-bold text-hotel-800 font-mono">
                    {currencySymbol}{item.price.toFixed(2)}
                  </span>

                  {isAdded ? (
                    <div className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 rounded-lg p-1">
                      <button
                        id={`food-${item.id}-dec`}
                        onClick={() => onUpdateFoodQuantity(item.id, -1)}
                        className="size-7 bg-white active:bg-brand-100 active:scale-95 text-brand-700 flex items-center justify-center rounded-md font-bold transition-all border border-brand-100 cursor-pointer"
                        title="Reduce quantity"
                      >
                        <Minus className="size-3" />
                      </button>
                      
                      <span id={`food-${item.id}-qty`} className="w-6 text-center text-xs font-mono font-bold text-brand-800">
                        {cartItem.quantity}
                      </span>
                      
                      <button
                        id={`food-${item.id}-inc`}
                        onClick={() => onUpdateFoodQuantity(item.id, 1)}
                        className="size-7 bg-white active:bg-brand-100 active:scale-95 text-brand-700 flex items-center justify-center rounded-md font-bold transition-all border border-brand-100 cursor-pointer"
                        title="Increase quantity"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      id={`add-food-btn-${item.id}`}
                      onClick={() => hasActiveBill && onAddFoodToBill(item)}
                      disabled={!hasActiveBill}
                      className={`font-medium text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors uppercase ${
                        hasActiveBill
                          ? 'bg-brand-900 text-white hover:bg-hotel-700 cursor-pointer'
                          : 'bg-brand-100 text-brand-400 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="size-3" /> Insert
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

      {/* ADD FOOD MODAL OVERLAY */}
      {isAddingFood && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col" id="add-food-modal">
            <div className="bg-hotel-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="size-5 text-hotel-400" />
                <div>
                  <h3 className="text-sm font-bold">Register New Menu Item</h3>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Kitchen & service inventory</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingFood(false)}
                className="bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFoodSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Item Name *</label>
                <input
                  id="new-food-name"
                  type="text"
                  placeholder="e.g. Avocado Toast Deluxe"
                  required
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-hotel-600 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-900 outline-hidden transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Menu Category *</label>
                  <select
                    id="new-food-category"
                    value={newFoodCategory}
                    onChange={(e) => setNewFoodCategory(e.target.value as FoodCategory)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-hotel-600 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-800 outline-hidden transition-all uppercase"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="drinks">Drinks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Price per Portion ({currencySymbol}) *</label>
                  <input
                    id="new-food-price"
                    type="number"
                    min="0.1"
                    step="0.01"
                    placeholder="12.50"
                    required
                    value={newFoodPrice}
                    onChange={(e) => setNewFoodPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-hotel-600 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-900 outline-hidden transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingFood(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold uppercase text-[10px] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-create-food-btn"
                  type="submit"
                  className="px-4 py-2 bg-hotel-700 hover:bg-hotel-800 text-white font-bold uppercase text-[10px] rounded-lg transition-all cursor-pointer shadow-3xs"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FOOD MODAL OVERLAY */}
      {editingFood && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col" id="edit-food-modal">
            <div className="bg-hotel-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="size-5 text-hotel-400" />
                <div>
                  <h3 className="text-sm font-bold">Edit MenuItem Details</h3>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Name: {editingFood.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingFood(null)}
                className="bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Item Name *</label>
                <input
                  id="edit-food-name"
                  type="text"
                  required
                  value={editFoodName}
                  onChange={(e) => setEditFoodName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-hotel-600 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-900 outline-hidden transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Menu Category *</label>
                  <select
                    id="edit-food-category"
                    value={editFoodCategory}
                    onChange={(e) => setEditFoodCategory(e.target.value as FoodCategory)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-hotel-600 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-800 outline-hidden transition-all uppercase"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="drinks">Drinks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Price per Portion ({currencySymbol}) *</label>
                  <input
                    id="edit-food-price"
                    type="number"
                    min="0.1"
                    step="0.01"
                    required
                    value={editFoodPrice}
                    onChange={(e) => setEditFoodPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-hotel-600 focus:bg-white text-xs font-semibold rounded-lg px-3 py-2 text-slate-900 outline-hidden transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFood(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold uppercase text-[10px] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-edit-food-btn"
                  type="submit"
                  className="px-4 py-2 bg-hotel-700 hover:bg-hotel-800 text-white font-bold uppercase text-[10px] rounded-lg transition-all cursor-pointer shadow-3xs"
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
