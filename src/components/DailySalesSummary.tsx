import React from 'react';
import { SalesReceipt } from '../types';
import { TrendingUp, FileText, DollarSign, Bed, Utensils, Percent, ShieldCheck, RefreshCcw } from 'lucide-react';

interface DailySalesSummaryProps {
  receipts: SalesReceipt[];
  onSelectReceipt: (receipt: SalesReceipt) => void;
  onClearReceipts: () => void;
  currencySymbol?: string;
  taxRate?: number;
}

export default function DailySalesSummary({
  receipts,
  onSelectReceipt,
  onClearReceipts,
  currencySymbol = '$',
  taxRate = 5
}: DailySalesSummaryProps) {
  // Aggregate sales figures
  const totalTransactions = receipts.length;
  const totalRevenue = receipts.reduce((sum, r) => sum + r.total, 0);
  const totalRoomsRev = receipts.reduce((sum, r) => sum + (r.roomCharges - r.roomDiscount), 0);
  const totalFoodsRev = receipts.reduce((sum, r) => sum + r.foodCharges, 0);
  const totalTaxes = receipts.reduce((sum, r) => sum + r.tax, 0);

  return (
    <div className="bg-white rounded-2xl border border-hotel-100 shadow-sm p-5 space-y-6" id="sales-summary-container">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-brand-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-hotel-950 flex items-center gap-2">
            <TrendingUp className="text-hotel-700 size-5" />
            End-Of-Day Audit Logs
          </h2>
          <p className="text-xs text-brand-500">Operational performance and cash drawer tracking</p>
        </div>

        {totalTransactions > 0 && (
          <button
            id="clear-logs-btn"
            onClick={onClearReceipts}
            className="text-[10px] uppercase font-bold tracking-wider text-red-650 hover:bg-red-50 hover:text-red-700 px-3 py-1.5 border border-red-100 rounded-md cursor-pointer transition-colors"
          >
            Reset Logs
          </button>
        )}
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#fcfbf9] border border-hotel-150 p-4 rounded-xl flex items-center gap-3 shadow-3xs">
          <div className="p-2.5 bg-hotel-100 rounded-lg text-hotel-800">
            <DollarSign className="size-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block">Total Sales</span>
            <span className="text-lg font-bold font-mono text-brand-900">{currencySymbol}{totalRevenue.toFixed(2)}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-emerald-50/20 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 shadow-3xs">
          <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block">Transactions</span>
            <span className="text-lg font-bold font-mono text-brand-900">{totalTransactions} paid</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#fcfbf9] border border-hotel-150 p-4 rounded-xl flex items-center gap-3 shadow-3xs">
          <div className="p-2.5 bg-hotel-50 text-hotel-700 rounded-lg">
            <Bed className="size-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block">Room Lodging</span>
            <span className="text-lg font-bold font-mono text-brand-900">{currencySymbol}{totalRoomsRev.toFixed(2)}</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#fcfbf9] border border-hotel-150 p-4 rounded-xl flex items-center gap-3 shadow-3xs">
          <div className="p-2.5 bg-hotel-50 text-hotel-700 rounded-lg">
            <Utensils className="size-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block">Restaurant</span>
            <span className="text-lg font-bold font-mono text-brand-900">{currencySymbol}{totalFoodsRev.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Recent Receipts List Table */}
      <div>
        <h3 className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 pl-1">
          <FileText className="size-4 text-hotel-600" />
          Audit Ledger ({totalTransactions} Receipts)
        </h3>

        {totalTransactions === 0 ? (
          <div className="p-8 text-center text-xs text-brand-400 bg-brand-50 rounded-xl border border-dashed border-brand-200">
            No active cash sales registered under current station shift.
          </div>
        ) : (
          <div className="overflow-x-auto border border-brand-100 rounded-xl bg-brand-50/50">
            <table className="w-full text-xs text-left text-brand-800" id="receipts-ledger-table">
              <thead className="bg-brand-100 text-brand-600 font-bold uppercase text-[10px] tracking-wider border-b border-brand-200">
                <tr>
                   <th className="px-4 py-3">Receipt No</th>
                   <th className="px-4 py-3">Time Done</th>
                   <th className="px-4 py-3 text-right">Lodging</th>
                   <th className="px-4 py-3 text-right">Kitchen</th>
                   <th className="px-4 py-3 text-right">Taxes ({taxRate}%)</th>
                   <th className="px-4 py-3 text-right">Grand Total</th>
                   <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {receipts.map((r, index) => (
                  <tr 
                    key={r.id} 
                    id={`ledger-tr-${r.id}`}
                    className="hover:bg-white transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono font-bold text-brand-900">{r.invoiceNumber}</td>
                    <td className="px-4 py-2.5 text-brand-500">
                      {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-brand-650">
                      {currencySymbol}{(r.roomCharges - r.roomDiscount).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-brand-650">
                      {currencySymbol}{r.foodCharges.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-brand-400">
                      {currencySymbol}{r.tax.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-hotel-750">
                      {currencySymbol}{r.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        id={`reprint-receipt-btn-${r.id}`}
                        onClick={() => onSelectReceipt(r)}
                        className="text-xs text-hotel-700 hover:text-hotel-900 hover:underline font-semibold cursor-pointer py-1 px-2.5 bg-white border border-brand-200 rounded shadow-3xs"
                      >
                        Reprint
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Helpful cash drawer balancing notes */}
      <div className="bg-hotel-50/50 border border-hotel-150 p-3 rounded-xl flex items-start gap-2.5 text-xs text-hotel-800">
        <Percent className="size-4 shrink-0 text-hotel-600 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">Drawer Balance Statement:</span>
          <p className="text-brand-500 text-[11px] leading-relaxed">
            This POS interface runs purely on physical currency transactions. Please cross-verify the cash box tally balance physically matching the Grand Total revenue of <span className="font-mono font-bold text-hotel-800">{currencySymbol}{totalRevenue.toFixed(2)}</span> before ending the morning/evening shift.
          </p>
        </div>
      </div>
    </div>
  );
}
