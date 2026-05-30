import React, { useState } from 'react';
import CreateBillForm from './CreateBillForm';
import OngoingStaysList from './OngoingStaysList';
import PastStaysList from './PastStaysList';
import { Room, Customer, CustomerSnapshot, RoomBookingItem, Bill, SalesReceipt, DiscountSettings } from '../types';
import { Users, PlusCircle, Clock, History } from 'lucide-react';

type GuestSubTab = 'new' | 'ongoing' | 'past';

interface GuestSectionProps {
  rooms: Room[];
  customers: Customer[];
  bills: Bill[];
  receipts: SalesReceipt[];
  heldBillCount: number;
  onCreateBill: (customer: CustomerSnapshot, roomBookings: RoomBookingItem[], existingCustomerId?: string) => string | void;
  onSelectBill: (billId: string) => void;
  onSelectReceipt: (receipt: SalesReceipt) => void;
  currencySymbol?: string;
  serviceChargeRate?: number;
  taxRate?: number;
  discountSettings?: DiscountSettings;
}

export default function GuestSection({
  rooms,
  customers,
  bills,
  receipts,
  heldBillCount,
  onCreateBill,
  onSelectBill,
  onSelectReceipt,
  currencySymbol = '$',
  serviceChargeRate = 10,
  taxRate = 5,
  discountSettings
}: GuestSectionProps) {
  const [subTab, setSubTab] = useState<GuestSubTab>('new');

  const handleCreateBill = (
    customer: CustomerSnapshot,
    roomBookings: RoomBookingItem[],
    existingCustomerId?: string
  ) => {
    onCreateBill(customer, roomBookings, existingCustomerId);
    setSubTab('ongoing');
  };

  const subTabs: { id: GuestSubTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'new', label: 'New Bill', icon: <PlusCircle className="size-3.5" /> },
    { id: 'ongoing', label: 'Ongoing', icon: <Clock className="size-3.5" />, badge: heldBillCount },
    { id: 'past', label: 'Past Stays', icon: <History className="size-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-hotel-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-hotel-950 flex items-center gap-2">
            <Users className="text-hotel-600 size-5" />
            Guest Folios
          </h2>
          <p className="text-xs text-brand-500">Create bills, manage ongoing stays, and view history</p>
        </div>
      </div>

      <div className="flex gap-1 bg-brand-100 p-1 rounded-lg self-start">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`relative px-4 py-2 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              subTab === tab.id ? 'bg-white text-hotel-800 shadow-sm' : 'text-brand-500 hover:text-brand-800'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1 font-mono text-[9px] font-bold bg-amber-500 text-white size-4 flex items-center justify-center rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {subTab === 'new' && (
        <CreateBillForm
          rooms={rooms}
          customers={customers}
          onCreateBill={handleCreateBill}
          currencySymbol={currencySymbol}
          serviceChargeRate={serviceChargeRate}
          taxRate={taxRate}
          discountSettings={discountSettings}
        />
      )}

      {subTab === 'ongoing' && (
        <OngoingStaysList
          bills={bills}
          onSelectBill={onSelectBill}
          currencySymbol={currencySymbol}
          serviceChargeRate={serviceChargeRate}
          taxRate={taxRate}
        />
      )}

      {subTab === 'past' && (
        <PastStaysList
          bills={bills}
          receipts={receipts}
          onSelectReceipt={onSelectReceipt}
          currencySymbol={currencySymbol}
          serviceChargeRate={serviceChargeRate}
          taxRate={taxRate}
        />
      )}
    </div>
  );
}
