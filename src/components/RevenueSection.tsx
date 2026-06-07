import React, { useState, useMemo } from 'react';
import { SalesReceipt } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowDown, ArrowUp, Calendar as CalendarIcon } from 'lucide-react';
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RevenueSectionProps {
  receipts: SalesReceipt[];
  currencySymbol: string;
}

type SortKey = 'invoiceNumber' | 'timestamp' | 'customer' | 'roomCharges' | 'foodCharges' | 'amenityCharges' | 'total';
type SortDirection = 'asc' | 'desc';

export default function RevenueSection({ receipts, currencySymbol }: RevenueSectionProps) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'timestamp',
    direction: 'desc'
  });
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedReceipts = useMemo(() => {
    return [...receipts].sort((a, b) => {
      let aVal: string | number | undefined = a[sortConfig.key as keyof SalesReceipt] as string | number | undefined;
      let bVal: string | number | undefined = b[sortConfig.key as keyof SalesReceipt] as string | number | undefined;

      if (sortConfig.key === 'customer') {
        aVal = a.customer?.name || 'Walk-in';
        bVal = b.customer?.name || 'Walk-in';
      }

      if (sortConfig.key === 'timestamp') {
        aVal = new Date(a.timestamp).getTime();
        bVal = new Date(b.timestamp).getTime();
      }

      const finalA = aVal ?? 0;
      const finalB = bVal ?? 0;

      if (finalA < finalB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (finalA > finalB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [receipts, sortConfig]);

  const filteredReceipts = useMemo(() => {
    let filtered = sortedReceipts;
    if (dateRange?.from) {
      filtered = filtered.filter(r => {
        const d = new Date(r.timestamp).getTime();
        const from = new Date(dateRange.from!).setHours(0,0,0,0);
        const to = dateRange.to ? new Date(dateRange.to).setHours(23,59,59,999) : new Date(dateRange.from!).setHours(23,59,59,999);
        return d >= from && d <= to;
      });
    }
    return filtered;
  }, [sortedReceipts, dateRange]);

  const renderSortIcon = (columnKey: SortKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 text-slate-400" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4 text-indigo-600" />
      : <ArrowDown className="ml-2 h-4 w-4 text-indigo-600" />;
  };

  const totalFilteredRevenue = useMemo(() => {
    return filteredReceipts.reduce((sum, r) => sum + r.total, 0);
  }, [filteredReceipts]);

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2 pb-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Detailed Revenue</h2>
        <p className="text-slate-500">Comprehensive ledger of all completed transactions and generated revenue.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Transaction Ledger</CardTitle>
            <CardDescription>Click on column headers to sort the data.</CardDescription>
          </div>
          <div className="flex items-center gap-6">
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger render={
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-[260px] justify-start text-left font-normal border-slate-200 bg-white",
                      !dateRange && "text-slate-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Filter by date range</span>
                    )}
                  </Button>
                } />
                <PopoverContent className="w-auto p-0 border-slate-200 shadow-xl" align="end">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="bg-white rounded-lg"
                  />
                  {dateRange?.from && (
                    <div className="p-3 border-t border-slate-100 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)} className="text-xs">
                        Clear Filter
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500">Total Displayed</p>
              <p className="text-2xl font-bold text-indigo-600">{currencySymbol}{totalFilteredRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('invoiceNumber')}>
                    <div className="flex items-center">Invoice {renderSortIcon('invoiceNumber')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('timestamp')}>
                    <div className="flex items-center">Date & Time {renderSortIcon('timestamp')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('customer')}>
                    <div className="flex items-center">Customer {renderSortIcon('customer')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('roomCharges')}>
                    <div className="flex items-center justify-end">Rooms {renderSortIcon('roomCharges')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('foodCharges')}>
                    <div className="flex items-center justify-end">Food {renderSortIcon('foodCharges')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('amenityCharges')}>
                    <div className="flex items-center justify-end">Amenities {renderSortIcon('amenityCharges')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none text-right" onClick={() => handleSort('total')}>
                    <div className="flex items-center justify-end">Total {renderSortIcon('total')}</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.length > 0 ? (
                  filteredReceipts.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.invoiceNumber}</TableCell>
                      <TableCell>{new Date(r.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                      <TableCell>{r.customer?.name || 'Walk-in'}</TableCell>
                      <TableCell className="text-right">{currencySymbol}{(r.roomCharges || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{currencySymbol}{(r.foodCharges || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{currencySymbol}{(r.amenityCharges || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-slate-900">{currencySymbol}{r.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No receipts found for the selected criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
