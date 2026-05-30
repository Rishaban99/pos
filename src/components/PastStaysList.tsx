import React from 'react';
import { Bill, SalesReceipt } from '../types';
import { calculateBillTotals } from '../utils/billing';
import { History, User, BedDouble, Receipt } from 'lucide-react';

interface PastStaysListProps {
  bills: Bill[];
  receipts: SalesReceipt[];
  onSelectReceipt: (receipt: SalesReceipt) => void;
  currencySymbol?: string;
  serviceChargeRate?: number;
  taxRate?: number;
}

export default function PastStaysList({
  bills,
  receipts,
  onSelectReceipt,
  currencySymbol = '$',
  serviceChargeRate = 10,
  taxRate = 5
}: PastStaysListProps) {
  const closedBills = bills
    .filter(b => b.status === 'closed')
    .sort((a, b) => new Date(b.closedAt || b.createdAt).getTime() - new Date(a.closedAt || a.createdAt).getTime());

  if (closedBills.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-dashed border-brand-200">
        <History className="size-8 text-brand-300 mx-auto mb-3" />
        <p className="text-sm text-brand-500 font-medium">No past stays yet</p>
        <p className="text-xs text-brand-400 mt-1">Closed bills will appear here after guests check out.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {closedBills.map(bill => {
        const receipt = receipts.find(r => r.id === bill.receiptId);
        const totals = receipt
          ? { total: receipt.total }
          : calculateBillTotals(bill.roomBookings, bill.foodOrders, bill.amenityCharges, serviceChargeRate, taxRate);
        const roomNumbers = bill.roomBookings.map(r => r.roomNumber).join(', ');

        return (
          <div
            key={bill.id}
            className="bg-white rounded-xl border border-brand-100 shadow-sm p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase">Closed</span>
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
                  Checked out: {bill.closedAt ? new Date(bill.closedAt).toLocaleString() : '—'}
                </p>
              </div>
              <div className="text-right shrink-0 space-y-2">
                <div>
                  <span className="text-[10px] text-brand-500 uppercase font-bold block">Total Paid</span>
                  <span className="text-lg font-bold font-mono text-emerald-700">{currencySymbol}{totals.total.toFixed(2)}</span>
                </div>
                {receipt && (
                  <button
                    onClick={() => onSelectReceipt(receipt)}
                    className="flex items-center gap-1.5 bg-brand-900 hover:bg-brand-950 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ml-auto"
                  >
                    <Receipt className="size-3.5" />
                    View Receipt
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
