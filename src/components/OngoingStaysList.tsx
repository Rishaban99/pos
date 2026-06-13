import React from 'react';
import { Bill } from '../types';
import { calculateBillTotals } from '../utils/billing';
import { Clock, User, BedDouble, PlayCircle } from 'lucide-react';

interface OngoingStaysListProps {
  bills: Bill[];
  onSelectBill: (billId: string) => void;
  currencySymbol?: string;
  serviceChargeRate?: number;
  taxRate?: number;
}

export default function OngoingStaysList({
  bills,
  onSelectBill,
  currencySymbol = '$',
  serviceChargeRate = 10,
  taxRate = 5
}: OngoingStaysListProps) {
 
  const heldBills = bills.filter(b => b.status === 'held');

  if (heldBills.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-dashed border-brand-200">
        <Clock className="size-8 text-brand-300 mx-auto mb-3" />
        <p className="text-sm text-brand-500 font-medium">No ongoing stays</p>
        <p className="text-xs text-brand-400 mt-1">Create a new bill from the New Bill tab to check in a guest.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {heldBills.map(bill => {
        const totals = calculateBillTotals(
          bill.roomBookings,
          bill.foodOrders,
          bill.amenityCharges ?? [],
          serviceChargeRate,
          taxRate
        );
        const roomNumbers = bill.roomBookings.map(r => r.roomNumber).join(', ');

        return (
          <div
            key={bill.id}
            className="bg-white rounded-xl border border-hotel-100 shadow-sm p-4 hover:border-hotel-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">Held</span>
                  <span className="text-[10px] font-mono text-brand-500">{bill.billNumber}</span>
                </div>
                <h4 className="text-sm font-bold text-brand-900 flex items-center gap-1.5">
                  <User className="size-3.5 text-hotel-600" />
                  {bill.customer.name}
                </h4>
                <p className="text-xs text-brand-500">{bill.customer.phone}</p>
                <div className="flex items-center gap-1.5 text-xs text-brand-600">
                  <BedDouble className="size-3.5 text-hotel-500" />
                  <span>Rooms: {roomNumbers || '—'}</span>
                </div>
                <p className="text-[11px] text-brand-400">
                  Check-in: {new Date(bill.createdAt).toLocaleDateString()} {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="flex gap-3 text-[11px] text-brand-500">
                  <span>{bill.foodOrders?.length ?? 0} food item{(bill.foodOrders?.length ?? 0) !== 1 ? 's' : ''}</span>
                  <span>{bill.amenityCharges?.length ?? 0} amenit{(bill.amenityCharges?.length ?? 0) !== 1 ? 'ies' : 'y'}</span>
                </div>
              </div>
              <div className="text-right shrink-0 space-y-2">
                <div>
                  <span className="text-[10px] text-brand-500 uppercase font-bold block">Balance</span>
                  <span className="text-lg font-bold font-mono text-hotel-800">{currencySymbol}{totals.total.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => onSelectBill(bill.id)}
                  className="flex items-center gap-1.5 bg-hotel-700 hover:bg-hotel-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <PlayCircle className="size-3.5" />
                  Resume
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
