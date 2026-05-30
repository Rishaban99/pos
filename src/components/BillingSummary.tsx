import React, { useState, useEffect } from 'react';
import { RoomBookingItem, FoodOrderItem } from '../types';
import { Receipt, Trash2, Tag, Percent, Banknote, Coins, AlertCircle, ShoppingBag, BedDouble, Cookie } from 'lucide-react';

interface BillingSummaryProps {
  roomBookings: RoomBookingItem[];
  foodOrders: FoodOrderItem[];
  onRemoveRoom: (roomId: string) => void;
  onRemoveFood: (foodId: string) => void;
  onUpdateFoodQuantity: (foodId: string, delta: number) => void;
  onCheckout: (cashReceived: number) => void;
  currencySymbol?: string;
  currencyCode?: string;
  serviceChargeRate?: number;
  taxRate?: number;
}

export default function BillingSummary({
  roomBookings,
  foodOrders,
  onRemoveRoom,
  onRemoveFood,
  onUpdateFoodQuantity,
  onCheckout,
  currencySymbol = '$',
  currencyCode = 'USD',
  serviceChargeRate = 10,
  taxRate = 5
}: BillingSummaryProps) {
  const [cashReceived, setCashReceived] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recalculating subtotals
  const roomChargesOriginal = roomBookings.reduce(
    (sum, item) => sum + ((item.pricePerNight + (item.boardPlanPricePerNight || 0)) * item.nights),
    0
  );
  const roomDiscountTotal = roomBookings.reduce((sum, item) => sum + item.discountAmount, 0);
  const roomChargesFinal = roomChargesOriginal - roomDiscountTotal;

  const foodCharges = foodOrders.reduce((sum, item) => sum + item.totalPrice, 0);
  const foodServiceCharge = foodCharges * (serviceChargeRate / 100);
  const taxSum = (roomChargesFinal + foodCharges) * (taxRate / 100);
  
  const subtotal = roomChargesOriginal + foodCharges;
  const finalTotal = roomChargesFinal + foodCharges + foodServiceCharge + taxSum;

  // Real-time cash validation
  const numericCash = parseFloat(cashReceived) || 0;
  const change = numericCash >= finalTotal ? numericCash - finalTotal : 0;
  const isSufficientCash = numericCash >= finalTotal;

  useEffect(() => {
    // Clear warnings when appropriate
    if (errorMessage && isSufficientCash) {
      setErrorMessage(null);
    }
  }, [cashReceived, finalTotal, isSufficientCash, errorMessage]);

  // Quick Cash Handlers
  const handleQuickCash = (amount: number) => {
    setCashReceived(amount.toString());
  };

  const handleExactChange = () => {
    setCashReceived(finalTotal.toFixed(2));
  };

  const handleClearCash = () => {
    setCashReceived('');
  };

  // Submit checkout
  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomBookings.length === 0 && foodOrders.length === 0) {
      setErrorMessage("The bill is empty. Please select rooms or food items.");
      return;
    }
    if (!cashReceived || isNaN(numericCash)) {
      setErrorMessage("Please enter a valid numeric cash amount received.");
      return;
    }
    if (!isSufficientCash) {
      setErrorMessage(`Insufficient Cash. Customer must pay at least ${currencySymbol}${finalTotal.toFixed(2)}.`);
      return;
    }
    
    // Clear error and proceed with checkout
    setErrorMessage(null);
    onCheckout(numericCash);
  };

  // Pre-calculate Quick Cash denominators based on final total
  const getDenominators = (currency: string) => {
    switch (currency) {
      case 'JPY': return [1000, 2000, 5000, 10000, 20000, 50000];
      case 'INR':
      case 'LKR': return [100, 200, 500, 1000, 2000, 5000];
      default: return [10, 20, 50, 100, 200, 500];
    }
  };

  const denominators = getDenominators(currencyCode);

  return (
    <div className="bg-white rounded-2xl border border-hotel-100 shadow-sm flex flex-col h-full overflow-hidden" id="billing-summary-panel">
      {/* Pane title */}
      <div className="bg-brand-950 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="text-hotel-200 size-5" />
          <h2 className="text-lg font-bold tracking-tight">Active Check Desk</h2>
        </div>
        <span className="text-xs font-mono font-medium px-2 py-0.5 bg-hotel-800 text-hotel-200 uppercase rounded-md tracking-widest border border-hotel-600/30">
          CASH ONLY
        </span>
      </div>

      {/* Cart Content Area (Scrollable space) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ROOM BOOKINGS SECTION */}
        <div>
          <h3 className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-1 border-b border-brand-100">
            <BedDouble className="size-3.5 text-hotel-600" />
            1. Room Bookings ({roomBookings.length})
          </h3>
          {roomBookings.length === 0 ? (
            <p className="text-xs text-brand-400 italic py-2 pl-2">No hotel suites in current bill...</p>
          ) : (
            <div className="space-y-2.5">
              {roomBookings.map(item => (
                <div 
                  key={item.id} 
                  id={`bill-room-${item.id}`}
                  className="bg-brand-50 hover:bg-brand-100/70 p-3 rounded-lg flex items-start justify-between border border-brand-100 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold bg-hotel-100 text-hotel-800 shrink-0 px-1.5 py-0.5 rounded leading-none border border-hotel-200/50">
                        {item.roomNumber}
                      </span>
                      <span className="text-xs font-semibold text-brand-800 leading-tight">{item.name}</span>
                    </div>
                    <div className="text-[11px] text-brand-500 font-medium">
                      {item.nights} {item.nights === 1 ? 'night' : 'nights'} × {currencySymbol}{(item.pricePerNight + (item.boardPlanPricePerNight || 0)).toFixed(2)}
                      {item.boardPlan && item.boardPlan !== 'Room Only' && (
                        <span className="block mt-0.5 text-indigo-600 font-semibold text-[10px]">
                          Meal: {item.boardPlan}
                        </span>
                      )}
                    </div>
                    {item.discountPercentage > 0 && (
                      <div className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 uppercase">
                        <Tag className="size-2.5" />
                        {item.discountPercentage}% Stay Off (-{currencySymbol}{item.discountAmount.toFixed(2)})
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5 ml-2">
                    <span className="text-xs font-bold font-mono text-brand-800">
                      {currencySymbol}{(item.totalPrice).toFixed(2)}
                    </span>
                    <button
                      id={`remove-room-bill-${item.id}`}
                      onClick={() => onRemoveRoom(item.id)}
                      className="text-brand-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-sm transition-all cursor-pointer"
                      title="Remove room booking"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOD & BEVERAGES SECTION */}
        <div>
          <h3 className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-1 border-b border-brand-100">
            <ShoppingBag className="size-3.5 text-brand-500" />
            2. Food Orders ({foodOrders.length})
          </h3>
          {foodOrders.length === 0 ? (
            <p className="text-xs text-brand-400 italic py-2 pl-2">No restaurant item orders added...</p>
          ) : (
            <div className="space-y-2.5">
              {foodOrders.map(item => (
                <div 
                  key={item.id} 
                  id={`bill-food-${item.id}`}
                  className="bg-brand-50 hover:bg-brand-100/70 p-2.5 rounded-lg flex items-center justify-between border border-brand-100 transition-colors"
                >
                  <div className="space-y-0.5 max-w-[60%]">
                    <span className="text-xs font-semibold text-brand-800 line-clamp-1">{item.name}</span>
                    <div className="text-[11px] text-brand-500 font-medium">
                      {currencySymbol}{item.price.toFixed(2)} each
                    </div>
                  </div>

                  {/* Tiny Quantity Incremeter inside Bill */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        id={`bill-food-dec-${item.id}`}
                        onClick={() => onUpdateFoodQuantity(item.id, -1)}
                        className="size-5 bg-white border border-brand-200 text-brand-500 text-xs flex items-center justify-center rounded cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-5 text-center text-xs font-mono font-semibold">{item.quantity}</span>
                      <button
                        id={`bill-food-inc-${item.id}`}
                        onClick={() => onUpdateFoodQuantity(item.id, 1)}
                        className="size-5 bg-white border border-brand-200 text-brand-500 text-xs flex items-center justify-center rounded cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right pl-1 shrink-0">
                      <div className="text-xs font-bold font-mono text-brand-800">{currencySymbol}{item.totalPrice.toFixed(2)}</div>
                      <button
                        id={`remove-food-bill-${item.id}`}
                        onClick={() => onRemoveFood(item.id)}
                        className="text-brand-300 hover:text-red-500 text-[10px] transition-colors leading-none cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subtotals, Tax and cash input area */}
      <div className="bg-brand-50 border-t border-brand-200 p-4 space-y-4">
        {/* Breakdown Calculation */}
        <div className="space-y-1.5 text-xs">
          {roomChargesOriginal > 0 && (
            <div className="flex items-center justify-between text-brand-700">
              <span>Room Charges Subtotal:</span>
              <span className="font-mono">{currencySymbol}{roomChargesOriginal.toFixed(2)}</span>
            </div>
          )}
          {roomDiscountTotal > 0 && (
            <div className="flex items-center justify-between text-emerald-600 font-semibold">
              <span className="flex items-center gap-1">
                <Percent className="size-3" />
                Applied Room Discount:
              </span>
              <span className="font-mono">-{currencySymbol}{roomDiscountTotal.toFixed(2)}</span>
            </div>
          )}
          {foodCharges > 0 && (
            <div className="flex items-center justify-between text-brand-700">
              <span>Food Orders Subtotal:</span>
              <span className="font-mono">{currencySymbol}{foodCharges.toFixed(2)}</span>
            </div>
          )}
          
          {foodCharges > 0 && (
            <div className="flex items-center justify-between text-brand-500 font-medium">
              <span>Food Service Charge ({serviceChargeRate}%):</span>
              <span className="font-mono">{currencySymbol}{foodServiceCharge.toFixed(2)}</span>
            </div>
          )}

          {taxRate > 0 && (
            <div className="flex items-center justify-between text-brand-500 font-medium">
              <span>Sales Tax ({taxRate}%):</span>
              <span className="font-mono">{currencySymbol}{taxSum.toFixed(2)}</span>
            </div>
          )}
          
          <div className="border-t border-brand-200 my-1"></div>

          <div className="flex items-center justify-between text-base font-bold text-brand-950 pt-1.5 border-t border-brand-200">
            <span>Total Bill:</span>
            <span className="font-mono text-lg text-hotel-700">{currencySymbol}{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* CASH INPUT & CHECKS */}
        {finalTotal > 0 && (
          <form onSubmit={handlePayment} className="space-y-3 bg-white p-3 rounded-xl border border-brand-200 shadow-3xs">
            {/* Enter Cash Received */}
            <div>
              <label htmlFor="cash-received-input" className="block text-xs font-bold text-brand-700 mb-1 flex items-center gap-1">
                <Banknote className="size-3.5 text-emerald-600" />
                CUSTOMER CASH RECEIVED ({currencySymbol})
              </label>
              
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-400 font-mono font-semibold">
                  {currencySymbol}
                </span>
                <input
                  id="cash-received-input"
                  type="text"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, ''); // numerical filter
                    setCashReceived(val);
                  }}
                  className="w-full bg-brand-50/50 border border-brand-200 focus:border-emerald-500 focus:bg-white text-lg font-bold font-mono rounded-lg py-1.5 pl-7 pr-3 text-brand-900 outline-hidden transition-all text-right"
                  required
                />
              </div>
            </div>

            {/* Change display */}
            <div className={`p-2 rounded-lg flex items-center justify-between text-xs font-semibold ${
              isSufficientCash ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
            }`}>
              <span className="flex items-center gap-1">
                <Coins className="size-3.5" />
                {isSufficientCash ? 'Return Change:' : 'Required Cash payment:'}
              </span>
              <span className="font-mono font-extrabold text-sm">
                {currencySymbol}{isSufficientCash ? change.toFixed(2) : (finalTotal - numericCash).toFixed(2)}
              </span>
            </div>

            {/* Quick cash click selectors */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">Quick tender:</span>
              <div className="grid grid-cols-4 gap-1">
                <button
                  id="quick-exact-change"
                  type="button"
                  onClick={handleExactChange}
                  className="text-[10.5px] font-medium py-1 px-1 bg-hotel-100 hover:bg-hotel-200 text-hotel-800 rounded border border-hotel-200 cursor-pointer text-center leading-tight truncate font-sans"
                  title={`Exact Amount (${currencySymbol}${finalTotal.toFixed(2)})`}
                >
                  Exact
                </button>
                {denominators.map(val => (
                  <button
                    key={val}
                    id={`quick-cash-${val}`}
                    type="button"
                    onClick={() => handleQuickCash(val)}
                    disabled={val < finalTotal}
                    className={`text-[10.5px] font-medium font-mono py-1 rounded transition-colors text-center cursor-pointer ${
                      val >= finalTotal 
                        ? 'bg-brand-100 hover:bg-brand-200 text-brand-700 border border-brand-200' 
                        : 'bg-brand-50 text-brand-300 opacity-50 cursor-not-allowed line-through'
                    }`}
                  >
                    {currencySymbol}{val}
                  </button>
                ))}
                <button
                  id="quick-clear"
                  type="button"
                  onClick={handleClearCash}
                  className="text-[10.5px] font-medium py-1 px-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Active Error displays */}
            {errorMessage && (
              <div className="p-2 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-start gap-1 pb-2">
                <AlertCircle className="size-4 shrink-0 text-red-500 mt-0.5" />
                <span className="text-xs leading-tight font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Core Action Button for checkout (Cash ONLY) */}
            <button
              id="pay-cash-checkout-btn"
              type="submit"
              disabled={!isSufficientCash}
              className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex justify-center items-center gap-2 shadow-md transition-all ${
                isSufficientCash
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-[99%]'
                  : 'bg-brand-200 text-brand-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Banknote className="size-4" />
              Place Order &amp; Pay Cash
            </button>
          </form>
        )}

        {finalTotal === 0 && (
          <div className="p-6 text-center text-brand-400 text-xs italic bg-brand-50 rounded-xl border border-dashed border-brand-200">
            Assign room suites or food items above to formulate active hotel billings.
          </div>
        )}
      </div>
    </div>
  );
}
