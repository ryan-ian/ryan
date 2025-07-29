'use client';

import { useState, useEffect } from 'react';
import { useReports } from '@/hooks/use-reports';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Download, BarChart, PieChart, Building } from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

// Define chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

// Helper function to download CSV
function downloadCsv(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('room-utilization');
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('week');
  
  // Initialize reports hooks
  const roomUtilization = useReports({
    reportType: 'room-utilization',
    initialParams: {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    },
  });
  
  const bookingTrends = useReports({
    reportType: 'booking-trends',
    initialParams: {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      interval,
    },
  });
  
  const departmentUsage = useReports({
    reportType: 'department-usage',
    initialParams: {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    },
  });
  
  // Update report parameters when date range changes
  useEffect(() => {
    if (startDate && endDate) {
      const dateParams = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      
      roomUtilization.setParams({
        ...roomUtilization.params,
        ...dateParams,
      });
      
      bookingTrends.setParams({
        ...bookingTrends.params,
        ...dateParams,
        interval,
      });
      
      departmentUsage.setParams({
        ...departmentUsage.params,
        ...dateParams,
      });
    }
  }, [startDate, endDate, interval]);
  
  // Fetch data when tab changes or parameters update
  useEffect(() => {
    if (activeTab === 'room-utilization') {
      roomUtilization.fetchReport();
    } else if (activeTab === 'booking-trends') {
      bookingTrends.fetchReport();
    } else if (activeTab === 'department-usage') {
      departmentUsage.fetchReport();
    }
  }, [activeTab, roomUtilization.params, bookingTrends.params, departmentUsage.params]);
  
  // Handle export for the active report
  const handleExport = async () => {
    let csvData: string | null = null;
    let fileName = '';
    
    if (activeTab === 'room-utilization') {
      csvData = await roomUtilization.exportAsCsv();
      fileName = `room-utilization-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    } else if (activeTab === 'booking-trends') {
      csvData = await bookingTrends.exportAsCsv();
      fileName = `booking-trends-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    } else if (activeTab === 'department-usage') {
      csvData = await departmentUsage.exportAsCsv();
      fileName = `department-usage-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    }
    
    if (csvData) {
      downloadCsv(csvData, fileName);
    }
  };
  
  // Format data for pie chart (department usage)
  const formatDepartmentData = () => {
    return departmentUsage.data.map((item: any) => ({
      name: item.users?.department || 'Unknown',
      value: parseInt(item.booking_count),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <Button onClick={handleExport} disabled={
          (activeTab === 'room-utilization' && roomUtilization.isLoading) ||
          (activeTab === 'booking-trends' && bookingTrends.isLoading) ||
          (activeTab === 'department-usage' && departmentUsage.isLoading)
        }>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex gap-2 items-center">
          <div>
            <p className="text-sm font-medium mb-1">Start Date</p>
            <DatePicker
              date={startDate}
              setDate={setStartDate}
              disabled={
                (activeTab === 'room-utilization' && roomUtilization.isLoading) ||
                (activeTab === 'booking-trends' && bookingTrends.isLoading) ||
                (activeTab === 'department-usage' && departmentUsage.isLoading)
              }
            />
          </div>
        <div>
            <p className="text-sm font-medium mb-1">End Date</p>
            <DatePicker
              date={endDate}
              setDate={setEndDate}
              disabled={
                (activeTab === 'room-utilization' && roomUtilization.isLoading) ||
                (activeTab === 'booking-trends' && bookingTrends.isLoading) ||
                (activeTab === 'department-usage' && departmentUsage.isLoading)
              }
            />
          </div>
        </div>
        
        {activeTab === 'booking-trends' && (
          <div>
            <p className="text-sm font-medium mb-1">Interval</p>
            <Select
              value={interval}
              onValueChange={(value: 'day' | 'week' | 'month') => setInterval(value)}
              disabled={bookingTrends.isLoading}
            >
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="room-utilization">
            <Building className="mr-2 h-4 w-4" />
            Room Utilization
          </TabsTrigger>
          <TabsTrigger value="booking-trends">
            <BarChart className="mr-2 h-4 w-4" />
            Booking Trends
          </TabsTrigger>
          <TabsTrigger value="department-usage">
            <PieChart className="mr-2 h-4 w-4" />
            Department Usage
          </TabsTrigger>
        </TabsList>
        
        {/* Room Utilization Tab */}
        <TabsContent value="room-utilization">
        <Card>
            <CardHeader>
              <CardTitle>Room Utilization Report</CardTitle>
              <CardDescription>
                View which rooms are most frequently used and their total booking hours.
              </CardDescription>
          </CardHeader>
          <CardContent>
              {roomUtilization.isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : roomUtilization.error ? (
                <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                  {roomUtilization.error}
                </div>
              ) : roomUtilization.data.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No room utilization data available for the selected period.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={roomUtilization.data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="rooms.name" 
                          angle={-45} 
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value: any) => [`${value.toFixed(1)} hours`, 'Usage']} />
                        <Legend />
                        <Bar 
                          dataKey="total_hours" 
                          name="Hours Used" 
                          fill="#0088FE" 
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Room Name</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Number of Bookings</TableHead>
                          <TableHead>Total Hours</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roomUtilization.data.map((room: any, index: number) => (
                          <TableRow key={room.room_id}>
                            <TableCell className="font-medium">{room.rooms?.name}</TableCell>
                            <TableCell>{room.rooms?.capacity}</TableCell>
                            <TableCell>{room.count}</TableCell>
                            <TableCell>{parseFloat(room.total_hours).toFixed(1)} hours</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
        </TabsContent>
        
        {/* Booking Trends Tab */}
        <TabsContent value="booking-trends">
        <Card>
          <CardHeader>
              <CardTitle>Booking Trends Report</CardTitle>
              <CardDescription>
                View booking patterns over time, broken down by status.
              </CardDescription>
          </CardHeader>
          <CardContent>
              {bookingTrends.isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : bookingTrends.error ? (
                <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                  {bookingTrends.error}
                </div>
              ) : bookingTrends.data.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No booking trend data available for the selected period.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={bookingTrends.data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="confirmed" name="Confirmed" fill="#00C49F" stackId="a" />
                        <Bar dataKey="pending" name="Pending" fill="#FFBB28" stackId="a" />
                        <Bar dataKey="cancelled" name="Cancelled" fill="#FF8042" stackId="a" />
                      </RechartsBarChart>
              </ResponsiveContainer>
                  </div>
                  
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Total Bookings</TableHead>
                          <TableHead>Confirmed</TableHead>
                          <TableHead>Pending</TableHead>
                          <TableHead>Cancelled</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookingTrends.data.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.date}</TableCell>
                            <TableCell>{item.count}</TableCell>
                            <TableCell>{item.confirmed}</TableCell>
                            <TableCell>{item.pending}</TableCell>
                            <TableCell>{item.cancelled}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
        </TabsContent>

        {/* Department Usage Tab */}
        <TabsContent value="department-usage">
        <Card>
          <CardHeader>
              <CardTitle>Department Usage Report</CardTitle>
              <CardDescription>
                View which departments are booking rooms most frequently.
              </CardDescription>
          </CardHeader>
          <CardContent>
              {departmentUsage.isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : departmentUsage.error ? (
                <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                  {departmentUsage.error}
                </div>
              ) : departmentUsage.data.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No department usage data available for the selected period.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="h-[400px] flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                  <Pie
                          data={formatDepartmentData()}
                    cx="50%"
                    cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                          {formatDepartmentData().map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                        <Tooltip formatter={(value, name) => [`${value} bookings`, name]} />
                        <Legend />
                      </RechartsPieChart>
              </ResponsiveContainer>
            </div>
                  
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Department</TableHead>
                          <TableHead>Number of Bookings</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departmentUsage.data.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.users?.department || 'Unknown'}</TableCell>
                            <TableCell>{item.booking_count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
            </div>
            </div>
              )}
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
