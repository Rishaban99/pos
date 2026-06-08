import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SalesReceipt, TerminalSettings } from '../types';
import { printThermalReceipt } from '../utils/thermalReceipt';
import { Printer, X, ShieldCheck } from 'lucide-react';
import logo from '../asset/logo x.jpg'


interface InvoiceModalProps {
  receipt: SalesReceipt | null;
  onClose: () => void;
  currencySymbol?: string;
  printerType?: TerminalSettings['printerType'];
  stationId?: string;
}

export default function InvoiceModal({
  receipt,
  onClose,
  currencySymbol = '$',
  printerType = 'Thermal 80mm',
  stationId
}: InvoiceModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!receipt || !mounted) return null;

  const handlePrint = () => {
    printThermalReceipt(receipt, currencySymbol, { printerType, stationId });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/60 backdrop-blur-xs transition-opacity animate-fade-in" id="invoice-modal-container">
      {/* Modal Card */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-brand-100 flex flex-col max-h-[90vh] animate-scale-up">
        {/* Success header */}
        <div className="no-print bg-emerald-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 shrink-0" />
            <h3 className="font-bold text-sm uppercase tracking-wider">CASH PAYMENT SUCCESSFUL</h3>
          </div>
          <button 
            id="close-invoice-btn"
            onClick={onClose}
            className="p-1 hover:bg-emerald-750 rounded-full transition-colors cursor-pointer"
            title="Dismiss and reset cart data"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Receipt Body (Thermal print standard visual style) */}
        <div className="thermal-receipt flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-[#fcfcf9]" id="printable-receipt-area">
          {/* Logo Heading Header */}
          <div className="flex items-center justify-center">
            <img alt="Mount Ash Villa" className="w-40 h-40 object-cover" src={logo.src} />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-extrabold  tracking-tight text-hotel-950  uppercase font-display">
            Mount Ash Villa
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest text-hotel-600">ROOMS &amp; RESTAURANT</p>
            <p className="text-[10px] text-brand-500 font-mono">
                No 295/k-1 bank house road , Hatton 
            </p>
            
            <p className="text-[10px] text-brand-500 font-mono">
              Tel: 0777210369
            </p>
          </div>

          <div className="border-t border-b border-dashed border-brand-350 py-3  text-xs font-mono text-brand-700">
            <div>INVOICE: <span className="font-bold font-sans text-brand-900">{receipt.invoiceNumber}</span></div>
            <div className={receipt.customer?.phone ? '' : ''}>MODE: <span className="font-bold text-emerald-700">CASH BILLING</span></div>
          </div>

          {/* ITEM FOLIO SUMMARY */}
          <div className="space-y-4">
            {/* Rooms charges */}
            {receipt.rooms.length > 0 && (
              <div className="space-y-2">
                <span className="text-[12px]  font-mono text-hotel-800 uppercase tracking-wider">ROOM LODGINGS</span>
                <div className="space-y-2">
                  {receipt.rooms.map((room, idx) => (
                    <div key={idx} className="text-xs flex justify-between items-start gap-3">
                      <div>
                        <div className="font-bold font-sans text-brand-900">Rm {room.roomNumber} - {room.name}</div>
                        <div className="text-brand-500 text-[11px] font-mono pl-2">
                          {room.nights} {room.nights === 1 ? 'night' : 'nights'} × {currencySymbol}{(room.pricePerNight + (room.boardPlanPricePerNight || 0)).toFixed(2)}
                          {room.boardPlan && room.boardPlan !== 'Room Only' && (
                            <span className="block text-indigo-600 font-semibold text-[10px] mt-0.5">
                              Boarding: {room.boardPlan}
                            </span>
                          )}
                        </div>
                        {room.discountAmount > 0 && (
                          <div className="text-emerald-600 text-[11px] font-semibold pl-2 flex items-center gap-0.5 font-mono">
                            * Room Promo/VIP reduction: -{currencySymbol}{room.discountAmount.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <span className="font-mono font-bold text-brand-850">
                        {currencySymbol}{(((room.pricePerNight + (room.boardPlanPricePerNight || 0)) * room.nights) - room.discountAmount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Food charges */}
            {receipt.foods.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-brand-100">
                <span className="text-[12px] font-mono text-brand-500 uppercase tracking-wider">RESTAURANT &amp; BEVERAGES</span>
                <div className="space-y-2">
                  {receipt.foods.map((food, idx) => (
                    <div key={idx} className="text-xs flex justify-between items-center gap-3 font-sans">
                      <div>
                        <div className="font-bold text-brand-900">{food.name}</div>
                        <div className="text-brand-500 text-[11px] font-mono pl-2">
                          Qty: {food.quantity} × {currencySymbol}{food.price.toFixed(2)}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-brand-850">
                        {currencySymbol}{(food.price * food.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities charges */}
            {receipt.amenities && receipt.amenities.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-brand-100">
                <span className="text-[12px] font-mono text-purple-600 uppercase tracking-wider">ROOM AMENITIES</span>
                <div className="space-y-2">
                  {receipt.amenities.map((amenity, idx) => (
                    <div key={idx} className="text-xs flex justify-between items-center gap-3 font-sans">
                      <div>
                        <div className="font-bold text-brand-900">{amenity.name}</div>
                        <div className="text-brand-500 text-[11px] font-mono pl-2">
                          Qty: {amenity.quantity} × {currencySymbol}{amenity.price.toFixed(2)}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-brand-850">
                        {currencySymbol}{(amenity.price * amenity.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TAX AND TOTAL RECIEPT SLIP */}
          <div className="border-t border-dashed border-brand-350 pt-4 space-y-1.5 text-xs text-brand-700">
            <div className="flex justify-between">
              <span>Rooms Base Charges:</span>
              <span className="font-mono">{currencySymbol}{receipt.rooms.reduce((s, r) => s + ((r.pricePerNight + (r.boardPlanPricePerNight || 0)) * r.nights), 0).toFixed(2)}</span>
            </div>
            {receipt.roomDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold font-mono">
                <span>Rooms Discount Subtractions:</span>
                <span>-{currencySymbol}{receipt.roomDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Food &amp; Bar Orders:</span>
              <span className="font-mono">{currencySymbol}{receipt.foodCharges.toFixed(2)}</span>
            </div>
            {(receipt.amenityCharges ?? 0) > 0 && (
              <div className="flex justify-between">
                <span>Room Amenities:</span>
                <span className="font-mono">{currencySymbol}{(receipt.amenityCharges ?? 0).toFixed(2)}</span>
              </div>
            )}
            {receipt.foodCharges > 0 && (
              <div className="flex justify-between font-medium text-brand-600 font-mono">
                <span>Food Service Charge:</span>
                <span>{currencySymbol}{(receipt.foodServiceCharge ?? (receipt.foodCharges * 0.10)).toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-brand-200 my-1"></div>

            <div className="flex justify-between text-base font-extrabold text-brand-950 pt-2">
              <span>FINAL CASH TOTAL:</span>
              <span className="font-mono text-lg text-hotel-900">{currencySymbol}{receipt.total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-emerald-700 font-semibold font-mono text-xs pt-1">
              <span>CASH TENDERED:</span>
              <span>{currencySymbol}{receipt.cashReceived.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-hotel-800 font-semibold font-mono text-xs">
              <span>CHANGE REFUNDED:</span>
              <span>{currencySymbol}{receipt.cashChange.toFixed(2)}</span>
            </div>
          </div>

          {/* Sincere message */}
          <div className="text-center pt-6 space-y-1.5 border-t border-dashed border-brand-350">
            <span className="inline-block text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/50 rounded-full px-4 py-1">
              PAID - CASH ONLY TENDER
            </span>
            <p className="text-xs text-brand-500 italic mt-2">
              We thank you for visiting us. Please look forward to welcoming you back!
            </p>
          </div>
        </div>

        {/* Footer actions for printing and close reset */}
        <div className="no-print bg-brand-50 p-4 border-t border-brand-100 flex gap-2">
          <button
            id="print-invoice-btn"
            onClick={handlePrint}
            className="flex-1 bg-brand-900 hover:bg-brand-950 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Printer className="size-4" /> Print Folio Receipt
          </button>
          
          <button
            id="new-transaction-btn"
            onClick={onClose}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl cursor-pointer text-center"
          >
            New Checkout
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
