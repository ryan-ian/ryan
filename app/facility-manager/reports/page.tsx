"use client"

import { useState } from "react"
import { format } from "date-fns"
import { AlertCircle, Calendar, Download, BarChart3, PieChart, Clock, Users, Building } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { FacilityManagerSkeleton } from "@/app/components/skeletons/facility-manager-skeleton"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useFacilityManagerReports, DateRangeOption } from "@/hooks/useFacilityManagerReports"

export default function ReportsPage() {
  const { 
    isLoading, 
    error, 
    reportData, 
    dateRange, 
    setDateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    facility
  } = useFacilityManagerReports()
  
  const [activeTab, setActiveTab] = useState("overview")
  
  // Function to export data as CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return
    
    // Convert data to CSV format
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(item => Object.values(item).join(','))
    const csvContent = [headers, ...rows].join('\n')
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return <FacilityManagerSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold text-destructive">An error occurred</h2>
        <p className="mt-2 text-brand-navy-700 dark:text-brand-navy-300">{error}</p>
      </div>
    )
  }

  if (!reportData || !facility) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
        <h2 className="mt-4 text-xl font-semibold">No data available</h2>
        <p className="mt-2 text-brand-navy-700 dark:text-brand-navy-300">
          There is no report data available for your facility. This could be because there are no bookings yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy-900 dark:text-brand-navy-50">
            {facility.name} Reports
          </h1>
          <p className="text-brand-navy-700 dark:text-brand-navy-300">
            Analytics and insights for your facility
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangeOption)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last Quarter</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          {dateRange === 'custom' && (
            <div className="flex gap-2">
              <DatePicker
                date={customStartDate || undefined}
                setDate={(date) => setCustomStartDate(date || null)}
              />
              <DatePicker
                date={customEndDate || undefined}
                setDate={(date) => setCustomEndDate(date || null)}
              />
            </div>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rooms">Room Utilization</TabsTrigger>
          <TabsTrigger value="bookings">Booking Trends</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
              <div className="h-1 bg-blue-500 w-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">Total Bookings</CardTitle>
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-brand-navy-900 dark:text-brand-navy-50">{reportData.totalBookings}</div>
                <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Confirmed bookings</p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
              <div className="h-1 bg-green-500 w-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">Utilization Rate</CardTitle>
                <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2">
                  <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-brand-navy-900 dark:text-brand-navy-50">{reportData.utilizationRate}%</div>
                <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Overall room utilization</p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
              <div className="h-1 bg-amber-500 w-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">Avg. Duration</CardTitle>
                <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-2">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-brand-navy-900 dark:text-brand-navy-50">
                  {reportData.averageBookingDuration} min
                </div>
                <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Average booking length</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
              <CardHeader>
                <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">Peak Usage Times</CardTitle>
                <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">
                  When your facility is most active
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-navy-900 dark:text-brand-navy-50 font-medium">Busiest Day</span>
                    <span className="text-brand-navy-700 dark:text-brand-navy-300">
                      {reportData.busiestDay || 'No data'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-navy-900 dark:text-brand-navy-50 font-medium">Peak Hour</span>
                    <span className="text-brand-navy-700 dark:text-brand-navy-300">
                      {reportData.peakHour || 'No data'}
                    </span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-2 text-brand-navy-900 dark:text-brand-navy-50">Booking Lead Time</h4>
                  <div className="space-y-2">
                    {reportData.bookingLeadTimes.map((item: {range: string; count: number}, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-brand-navy-700 dark:text-brand-navy-300">{item.range}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-brand-navy-900 dark:text-brand-navy-50 font-medium">{item.count}</span>
                          <span className="text-brand-navy-700 dark:text-brand-navy-300 text-xs">
                            ({reportData.totalBookings > 0 ? Math.round((item.count / reportData.totalBookings) * 100) : 0}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
              <CardHeader>
                <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">Top Users</CardTitle>
                <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">
                  Most frequent room bookers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.topUsers.length > 0 ? (
                    reportData.topUsers.map((user: {userId: string; userName: string; bookingCount: number}, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-brand-navy-100 dark:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 w-8 h-8 rounded-full flex items-center justify-center font-medium">
                            {user.userName.charAt(0)}
                          </div>
                          <span className="text-brand-navy-900 dark:text-brand-navy-50">{user.userName}</span>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                          {user.bookingCount} bookings
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-brand-navy-700 dark:text-brand-navy-300">No booking data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Room Utilization Tab */}
        <TabsContent value="rooms" className="space-y-6">
          <Card className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
            <CardHeader>
              <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">Room Utilization</CardTitle>
              <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">
                Comparison of room usage across your facility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {reportData.roomUtilization.map((room: {roomId: string; roomName: string; totalBookings: number; totalHours: number; utilization: number}, index: number) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">{room.roomName}</span>
                      <span className="text-sm text-brand-navy-700 dark:text-brand-navy-300">{room.utilization}% utilized</span>
                    </div>
                    <Progress value={room.utilization} className="h-2" />
                    <div className="flex justify-between text-xs text-brand-navy-700 dark:text-brand-navy-300">
                      <span>{room.totalBookings} bookings</span>
                      <span>{room.totalHours} hours booked</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => exportToCSV(reportData.roomUtilization, 'room-utilization')}
              >
                <Download className="mr-2 h-4 w-4" /> Export Room Data
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
            <CardHeader>
              <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">Bookings by Room</CardTitle>
              <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">
                Detailed breakdown of room usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room Name</TableHead>
                    <TableHead className="text-right">Total Bookings</TableHead>
                    <TableHead className="text-right">Hours Booked</TableHead>
                    <TableHead className="text-right">Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.roomUtilization.map((room: {roomId: string; roomName: string; totalBookings: number; totalHours: number; utilization: number}, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{room.roomName}</TableCell>
                      <TableCell className="text-right">{room.totalBookings}</TableCell>
                      <TableCell className="text-right">{room.totalHours}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={room.utilization > 70 ? "default" : room.utilization > 30 ? "secondary" : "outline"} 
                          className={room.utilization > 70 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : ""}>
                          {room.utilization}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Booking Trends Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
              <CardHeader>
                <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">Booking Volume</CardTitle>
                <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">
                  Number of bookings over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-end justify-between gap-2">
                  {reportData.bookingsByDay.map((day: {day: string; count: number}, index: number) => {
                    const maxCount = Math.max(...reportData.bookingsByDay.map((d: {day: string; count: number}) => d.count));
                    const heightPercentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex flex-col items-center flex-1 min-w-0">
                        <div 
                          className="w-full bg-blue-500 dark:bg-blue-600 rounded-t-sm" 
                          style={{ height: `${heightPercentage}%`, minHeight: day.count > 0 ? '10px' : '0' }}
                        />
                        <div className="mt-2 text-xs text-brand-navy-700 dark:text-brand-navy-300 truncate w-full text-center">
                          {day.day}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => exportToCSV(reportData.bookingsByDay, 'booking-volume')}
                >
                  <Download className="mr-2 h-4 w-4" /> Export Booking Data
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
              <CardHeader>
                <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">Bookings by Department</CardTitle>
                <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">
                  Distribution across departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.bookingsByDepartment.length > 0 ? (
                  <div className="space-y-4">
                    {reportData.bookingsByDepartment.map((dept: {department: string; count: number}, index: number) => {
                      const percentage = reportData.totalBookings > 0 
                        ? Math.round((dept.count / reportData.totalBookings) * 100) 
                        : 0;
                      
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">
                              {dept.department}
                            </span>
                            <span className="text-sm text-brand-navy-700 dark:text-brand-navy-300">
                              {dept.count} ({percentage}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-brand-navy-700 dark:text-brand-navy-300">No department data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
              <CardHeader>
                <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">Resource Demand</CardTitle>
                <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">
                  Most requested resources in bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.resourceDemand.length > 0 ? (
                  <div className="space-y-4">
                    {reportData.resourceDemand.map((resource: {resourceId: string; resourceName: string; count: number}, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-brand-navy-900 dark:text-brand-navy-50">{resource.resourceName}</span>
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                          {resource.count} bookings
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px]">
                    <p className="text-brand-navy-700 dark:text-brand-navy-300">No resource usage data available</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => exportToCSV(reportData.resourceDemand, 'resource-demand')}
                >
                  <Download className="mr-2 h-4 w-4" /> Export Resource Data
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
              <CardHeader>
                <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">Resource Status</CardTitle>
                <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">
                  Current status of facility resources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
                      <Building className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-brand-navy-900 dark:text-brand-navy-50">
                        {reportData.resourceStatus.available}
                      </div>
                      <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Available</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-brand-navy-900 dark:text-brand-navy-50">
                        {reportData.resourceStatus.inUse}
                      </div>
                      <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">In Use</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-brand-navy-900 dark:text-brand-navy-50">
                        {reportData.resourceStatus.maintenance}
                      </div>
                      <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Maintenance</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
