import React, { useMemo } from 'react';
import { Room, SalesReceipt, Bill } from '@/types';
import type { StoredUser } from '@/auth/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Home, Receipt, TrendingUp, Calendar, UserCog, User } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DashboardSectionProps {
  rooms: Room[];
  receipts: SalesReceipt[];
  bills: Bill[];
  users?: StoredUser[];
  currencySymbol: string;
}

export default function DashboardSection({ rooms, receipts, bills, users = [], currencySymbol }: DashboardSectionProps) {
  // --- KPIs Calculation ---
  const { totalRevenue, todaysRevenue, monthlyRevenue, occupancyRate, activeFolios, activeSuperadmins, activeReceptionists } = useMemo(() => {
    let totalRev = 0;
    let todayRev = 0;
    let monthRev = 0;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7);

    receipts.forEach((r) => {
      totalRev += r.total;
      const rDateStr = new Date(r.timestamp).toISOString().split('T')[0];
      if (rDateStr === todayStr) {
        todayRev += r.total;
      }
      if (rDateStr.startsWith(currentMonthStr)) {
        monthRev += r.total;
      }
    });

    const bookedRooms = rooms.filter((r) => r.status === 'booked').length;
    const occRate = rooms.length > 0 ? (bookedRooms / rooms.length) * 100 : 0;

    const heldFolios = bills.filter((b) => b.status === 'held').length;
    
    const superadmins = users.filter(u => u.role === 'super_admin' && u.active).length;
    const receptionists = users.filter(u => u.role === 'receptionist' && u.active).length;

    return {
      totalRevenue: totalRev,
      todaysRevenue: todayRev,
      monthlyRevenue: monthRev,
      occupancyRate: occRate,
      activeFolios: heldFolios,
      activeSuperadmins: superadmins,
      activeReceptionists: receptionists
    };
  }, [receipts, rooms, bills, users]);

  // --- Reports Data ---
  const { todayReceipts, currentBills, summaryReceipts } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const todayR = receipts.filter(r => new Date(r.timestamp).toISOString().split('T')[0] === todayStr).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const cBills = bills.filter(b => b.status === 'held').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const sReceipts = [...receipts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10); // Last 10 closed bills

    return { todayReceipts: todayR, currentBills: cBills, summaryReceipts: sReceipts };
  }, [receipts, bills]);

  // --- Charts Data ---
  const revenueChartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dataMap[d.toLocaleDateString('en-US', { weekday: 'short' })] = 0;
    }

    receipts.forEach((r) => {
      const d = new Date(r.timestamp);
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays <= 7) {
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        if (dataMap[dayStr] !== undefined) {
          dataMap[dayStr] += r.total;
        }
      }
    });

    return Object.entries(dataMap).map(([day, revenue]) => ({ day, revenue }));
  }, [receipts]);

  const revenueChartConfig = {
    revenue: {
      label: 'Revenue',
      color: '#4f46e5', // Indigo 600
    },
  } satisfies ChartConfig;

  const breakdownChartData = useMemo(() => {
    let roomsRev = 0;
    let foodRev = 0;
    let amenitiesRev = 0;

    receipts.forEach((r) => {
      roomsRev += r.roomCharges || 0;
      foodRev += r.foodCharges || 0;
      amenitiesRev += r.amenityCharges || 0;
    });

    return [
      { name: 'Rooms', value: roomsRev, fill: 'var(--color-rooms)' },
      { name: 'Food', value: foodRev, fill: 'var(--color-food)' },
      { name: 'Amenities', value: amenitiesRev, fill: 'var(--color-amenities)' },
    ].filter(item => item.value > 0);
  }, [receipts]);

  const breakdownChartConfig = {
    value: { label: 'Amount' },
    rooms: { label: 'Rooms', color: '#4f46e5' }, // Indigo 600
    food: { label: 'Food', color: '#f59e0b' }, // Amber 500
    amenities: { label: 'Amenities', color: '#10b981' }, // Emerald 500
  } satisfies ChartConfig;

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2 pb-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
        <p className="text-slate-500">Comprehensive overview of hotel performance, operations, and personnel.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Row 1 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{todaysRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground text-slate-500 mt-1">Revenue from today&apos;s receipts</p>
          </CardContent>
        </Card>
        
        

       

    

        {/* Row 2 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Folios</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFolios}</div>
            <p className="text-xs text-muted-foreground text-slate-500 mt-1">Bills currently held open</p>
          </CardContent>
        </Card>
        
        {users.length > 0 && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Superadmins</CardTitle>
                <UserCog className="h-4 w-4 text-muted-foreground text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSuperadmins}</div>
                <p className="text-xs text-muted-foreground text-slate-500 mt-1">Active system administrators</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receptionists</CardTitle>
                <User className="h-4 w-4 text-muted-foreground text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeReceptionists}</div>
                <p className="text-xs text-muted-foreground text-slate-500 mt-1">Active front desk staff</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue (Last 7 Days)</CardTitle>
            <CardDescription>Daily total revenue across all categories.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={revenueChartConfig} className="min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} className="text-slate-500" />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} className="text-slate-500" tickFormatter={(value) => `${currencySymbol}${value}`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Distribution across operational areas.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-0">
            {breakdownChartData.length > 0 ? (
               <ChartContainer config={breakdownChartConfig} className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                     <Pie data={breakdownChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} strokeWidth={2} stroke="var(--background)">
                       {breakdownChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={`var(--color-${entry.name.toLowerCase()})`} />)}
                     </Pie>
                     <ChartLegend content={<ChartLegendContent />} className="flex-wrap justify-center gap-4 pt-4" />
                   </PieChart>
                 </ResponsiveContainer>
               </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">No revenue data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reports Tables Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Today Report Table */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Report</CardTitle>
            <CardDescription>All closed bills generated today.</CardDescription>
          </CardHeader>
          <CardContent>
            {todayReceipts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayReceipts.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.invoiceNumber}</TableCell>
                      <TableCell>{r.customer?.name || 'Walk-in'}</TableCell>
                      <TableCell>{new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                      <TableCell className="text-right font-bold text-indigo-600">{currencySymbol}{r.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No receipts generated today.</p>
            )}
          </CardContent>
        </Card>

        {/* Current Bills Table */}
        <Card>
          <CardHeader>
            <CardTitle>Current Bills (Active Folios)</CardTitle>
            <CardDescription>Bills that are currently held open.</CardDescription>
          </CardHeader>
          <CardContent>
            {currentBills.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Rooms</TableHead>
                    <TableHead className="text-right">Charges</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentBills.map(b => {
                    const totalCharges = 
                      b.roomBookings.reduce((sum, item) => sum + item.totalPrice, 0) +
                      b.foodOrders.reduce((sum, item) => sum + item.totalPrice, 0) +
                      b.amenityCharges.reduce((sum, item) => sum + item.totalPrice, 0);

                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.billNumber}</TableCell>
                        <TableCell>{b.customer.name}</TableCell>
                        <TableCell>{b.roomBookings.map(r => r.roomNumber).join(', ') || '-'}</TableCell>
                        <TableCell className="text-right font-bold text-amber-600">{currencySymbol}{totalCharges.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No active bills found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Bills (Recent)</CardTitle>
          <CardDescription>A summary of the 10 most recently closed bills across the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {summaryReceipts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rooms</TableHead>
                  <TableHead>Food</TableHead>
                  <TableHead>Amenities</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryReceipts.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.invoiceNumber}</TableCell>
                    <TableCell>{new Date(r.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</TableCell>
                    <TableCell>{r.customer?.name || 'Walk-in'}</TableCell>
                    <TableCell>{currencySymbol}{r.roomCharges.toFixed(2)}</TableCell>
                    <TableCell>{currencySymbol}{r.foodCharges.toFixed(2)}</TableCell>
                    <TableCell>{currencySymbol}{(r.amenityCharges || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold">{currencySymbol}{r.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No receipts available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
