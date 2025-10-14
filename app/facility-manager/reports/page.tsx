"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Users, 
  MapPin,
  Clock,
  Download,
  FileText,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { FacilityManagerSkeleton } from "@/app/components/skeletons/facility-manager-skeleton"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar 
} from 'recharts'

interface KPIMetric {
  current: number
  previous: number
  change: number
  changePercent: number
}

interface OperationalDashboardData {
  roomUtilizationRate: KPIMetric
  totalBookings: KPIMetric
  attendanceRate: KPIMetric
  noShowRate: KPIMetric
  peakHourUsage: KPIMetric
  averageMeetingDuration: KPIMetric
}

interface UtilizationData {
  overallUtilization: number
  utilizationByRoom: Array<{
    roomId: string
    roomName: string
    totalHours: number
    bookedHours: number
    utilizationRate: number
    bookingCount: number
  }>
  utilizationTimeline: Array<{
    date: string
    utilization: number
    bookings: number
  }>
  peakUtilizationHour: number
  averageBookingDuration: number
}

interface AttendanceData {
  totalMeetings: number
  checkInRate: number
  noShowRate: number
  punctualityRate: number
  averageDuration: number
  checkInPerformance: Array<{
    status: 'on-time' | 'grace-period' | 'late' | 'no-show'
    count: number
    percentage: number
  }>
  attendanceTrends: Array<{
    date: string
    checkIns: number
    noShows: number
    total: number
  }>
  popularMeetingTimes: Array<{
    hour: number
    count: number
    checkInRate: number
  }>
}

interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  metadata?: any
}

export default function FacilityManagerReportsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState("30")
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>()
  const [isExporting, setIsExporting] = useState(false)
  
  // Analytics data
  const [dashboardData, setDashboardData] = useState<OperationalDashboardData | null>(null)
  const [utilizationData, setUtilizationData] = useState<UtilizationData | null>(null)
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [activityData, setActivityData] = useState<ActivityItem[]>([])

  useEffect(() => {
    if (user) {
      loadAnalyticsData()
    }
  }, [user, selectedPeriod, customDateRange])

  const loadAnalyticsData = async () => {
    if (!user) {
      console.log('❌ [Reports] No user found')
      return
    }

    console.log('📊 [Reports] Loading analytics for user:', user)

    try {
      setIsLoading(true)
      setError(null)

      const token = localStorage.getItem("auth-token")
      if (!token) {
        throw new Error("No authentication token")
      }

      // Build query parameters
      const params = new URLSearchParams({
        type: 'all',
        period: selectedPeriod
      })

      if (customDateRange?.from && customDateRange?.to) {
        params.set('startDate', customDateRange.from.toISOString())
        params.set('endDate', customDateRange.to.toISOString())
      }

      console.log('📊 [Reports] Fetching analytics with params:', params.toString())

      const response = await fetch(`/api/facility-manager/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📊 [Reports] API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ [Reports] API error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch analytics data')
      }

      const result = await response.json()
      console.log('📊 [Reports] API result:', result)
      
      if (result.success) {
        console.log('✅ [Reports] Analytics data loaded successfully')
        console.log(result)
        setDashboardData(result.data.dashboard)
        setUtilizationData(result.data.utilization)
        setAttendanceData(result.data.attendance)
        setActivityData(result.data.activity)
      } else {
        throw new Error(result.error || 'Failed to load analytics')
      }

    } catch (err: any) {
      console.error('❌ [Reports] Error loading analytics:', err)
      setError(err.message || 'Failed to load reports data')
      toast({
        title: "Error",
        description: "Failed to load reports data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportReport = async () => {
    setIsExporting(true)
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) {
        throw new Error("No authentication token")
      }

      // Build export payload
      const exportData: any = {
        period: selectedPeriod,
        reportType: 'comprehensive'
      }

      if (customDateRange?.from && customDateRange?.to) {
        exportData.startDate = customDateRange.from.toISOString()
        exportData.endDate = customDateRange.to.toISOString()
      }

      const response = await fetch('/api/facility-manager/reports/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate report')
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `facility-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: "Your facility report has been downloaded successfully.",
      })
    } catch (error: any) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: error.message || "Failed to generate report. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`
  }
  
  const formatTime = (hour: number) => {
    if (hour === 0) return "12 AM"
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return "12 PM"
    return `${hour - 12} PM`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0
    const Icon = isPositive ? TrendingUp : TrendingDown
    const colorClass = isPositive ? "text-green-600" : "text-red-600"
    
    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">
          {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
        </span>
      </div>
    )
  }

  const getPeriodLabel = () => {
    if (customDateRange?.from && customDateRange?.to) {
      return "Custom Range"
    }
    
    switch (selectedPeriod) {
      case "7": return "Last 7 Days"
      case "30": return "Last 30 Days"
      case "90": return "Last 3 Months"
      case "180": return "Last 6 Months"
      case "365": return "Last 12 Months"
      default: return "Last 30 Days"
    }
  }

  if (isLoading) {
    return <FacilityManagerSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium">Failed to Load Reports</h3>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button onClick={loadAnalyticsData} className="mt-4">
            Try Again
            </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Facility Reports</h2>
          <p className="text-muted-foreground mt-1">
            Analytics and insights for your facility operations
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-xs">
            {getPeriodLabel()}
          </Badge>
          <Button onClick={handleExportReport} disabled={isExporting} className="gap-2">
            <Download className="h-4 w-4" />
            {isExporting ? "Generating..." : "Export PDF"}
            </Button>
        </div>
          </div>

      {/* Period Selection */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="space-y-1">
          <label className="text-sm font-medium">Time Period</label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 3 Months</SelectItem>
              <SelectItem value="180">Last 6 Months</SelectItem>
              <SelectItem value="365">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium">Custom Range</label>
          <DatePickerWithRange
            date={customDateRange}
            onDateChange={setCustomDateRange}
            className="w-60"
          />
        </div>
      </div>
      
          {/* KPI Cards */}
      {dashboardData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-purple-500 w-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Room Utilization Rate</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(dashboardData.roomUtilizationRate.current)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">Average across rooms</p>
                {formatChange(dashboardData.roomUtilizationRate.change, dashboardData.roomUtilizationRate.changePercent)}
              </div>
              </CardContent>
            </Card>
            
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-blue-500 w-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.totalBookings.current}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">Confirmed bookings</p>
                {formatChange(dashboardData.totalBookings.change, dashboardData.totalBookings.changePercent)}
              </div>
              </CardContent>
            </Card>
            
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-green-500 w-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(dashboardData.attendanceRate.current)}
                </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">Check-in percentage</p>
                {formatChange(dashboardData.attendanceRate.change, dashboardData.attendanceRate.changePercent)}
                </div>
              </CardContent>
            </Card>
            
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-red-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(dashboardData.noShowRate.current)}
                          </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">Missed meetings</p>
                {formatChange(dashboardData.noShowRate.change, dashboardData.noShowRate.changePercent)}
                </div>
              </CardContent>
            </Card>

          <Card className="overflow-hidden">
            <div className="h-1.5 bg-orange-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Hour Usage</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTime(dashboardData.peakHourUsage.current)}
                    </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">Most popular time</p>
                {formatChange(dashboardData.peakHourUsage.change, dashboardData.peakHourUsage.changePercent)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-teal-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Meeting Duration</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatHours(dashboardData.averageMeetingDuration.current)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">Typical length</p>
                {formatChange(dashboardData.averageMeetingDuration.change, dashboardData.averageMeetingDuration.changePercent)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        
      {/* Charts and Analytics Sections */}
          <div className="grid gap-6 lg:grid-cols-2">
        {/* Room Utilization Analytics */}
        <Card>
              <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Room Utilization Breakdown
            </CardTitle>
            <CardDescription>Individual room performance and usage statistics</CardDescription>
              </CardHeader>
              <CardContent>
            {utilizationData ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {formatPercentage(utilizationData.overallUtilization)}
                        </div>
                  <p className="text-sm text-muted-foreground">Overall Utilization</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold">
                      {formatHours(utilizationData.averageBookingDuration)}
                    </div>
                    <p className="text-xs text-muted-foreground">Avg Booking Duration</p>
                          </div>
                  <div>
                    <div className="text-lg font-semibold">
                      {formatTime(utilizationData.peakUtilizationHour)}
                        </div>
                    <p className="text-xs text-muted-foreground">Peak Hour</p>
                  </div>
                </div>

                {/* Top Utilized Rooms */}
                {utilizationData.utilizationByRoom.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Room Utilization</h4>
                    {utilizationData.utilizationByRoom.slice(0, 3).map((room) => (
                      <div key={room.roomId} className="flex justify-between items-center">
                        <span className="text-sm">{room.roomName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatPercentage(room.utilizationRate)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({room.bookingCount} bookings)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                  </div>
                ) : (
              <div className="text-center text-muted-foreground">
                No utilization data available
                  </div>
                )}
              </CardContent>
            </Card>

        {/* Attendance Analytics */}
        <Card>
              <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attendance Analysis
            </CardTitle>
            <CardDescription>Check-in rates, punctuality, and no-show analysis</CardDescription>
              </CardHeader>
              <CardContent>
            {attendanceData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{attendanceData.totalMeetings}</div>
                    <p className="text-xs text-muted-foreground">Total Meetings</p>
                    </div>
                    <div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPercentage(attendanceData.checkInRate)}
                      </div>
                    <p className="text-xs text-muted-foreground">Check-in Rate</p>
                    </div>
                  </div>
                  
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-red-600">
                      {formatPercentage(attendanceData.noShowRate)}
                    </div>
                    <p className="text-xs text-muted-foreground">No-Show Rate</p>
                    </div>
                    <div>
                    <div className="text-lg font-semibold text-blue-600">
                      {formatPercentage(attendanceData.punctualityRate)}
                      </div>
                    <p className="text-xs text-muted-foreground">Punctuality Rate</p>
                    </div>
                  </div>
                  
                {/* Check-in Performance Breakdown */}
                {attendanceData.checkInPerformance.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-sm mb-2">Check-in Performance</h4>
                    <div className="space-y-2">
                      {attendanceData.checkInPerformance.map((perf) => (
                        <div key={perf.status} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{perf.status.replace('-', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {perf.count}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({formatPercentage(perf.percentage)})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                No attendance data available
              </div>
            )}
              </CardContent>
            </Card>
          </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Peak Booking Times Line Chart */}
        {attendanceData && attendanceData.popularMeetingTimes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Peak Booking Times
              </CardTitle>
              <CardDescription>Blue line shows total bookings per hour, green dashed line shows percentage of attendees who checked in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={attendanceData.popularMeetingTimes.map(time => ({
                      hour: formatTime(time.hour),
                      bookings: time.count,
                      attendanceRate: time.checkInRate
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="bookings"
                      stroke="#3b82f6"
                      fontSize={12}
                      label={{ value: 'Bookings Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    />
                    <YAxis 
                      yAxisId="attendance"
                      orientation="right"
                      stroke="#10b981"
                      fontSize={12}
                      label={{ value: 'Check-in Rate (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'Total Bookings' ? `${value} total bookings` : `${value.toFixed(1)}% checked in`,
                        name === 'Total Bookings' ? 'Total Bookings' : 'Check-in Rate'
                      ]}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="bookings"
                      type="monotone"
                      dataKey="bookings"
                      stroke="#2563eb"
                      strokeWidth={3}
                      strokeDasharray="0"
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, stroke: '#2563eb', strokeWidth: 2, fill: '#ffffff' }}
                      name="Total Bookings"
                    />
                    <Line
                      yAxisId="attendance"
                      type="monotone"
                      dataKey="attendanceRate"
                      stroke="#059669"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: '#059669', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, stroke: '#059669', strokeWidth: 2, fill: '#ffffff' }}
                      name="Check-in Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bookings per Room Bar Chart */}
        {utilizationData && utilizationData.utilizationByRoom.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Bookings per Room
              </CardTitle>
              <CardDescription>Room-by-room booking volume and utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={utilizationData.utilizationByRoom
                      .sort((a, b) => b.bookingCount - a.bookingCount)
                      .slice(0, 8)
                      .map(room => ({
                        roomName: room.roomName.length > 15 
                          ? room.roomName.substring(0, 15) + '...' 
                          : room.roomName,
                        fullRoomName: room.roomName,
                        bookings: room.bookingCount,
                        utilization: room.utilizationRate
                      }))
                    }
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="roomName" 
                      stroke="#6b7280"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'bookings' ? `${value} bookings` : `${value.toFixed(1)}%`,
                        name === 'bookings' ? 'Total Bookings' : 'Utilization Rate'
                      ]}
                      labelFormatter={(label: string, payload: any) => 
                        payload?.[0]?.payload?.fullRoomName || label
                      }
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar 
                      dataKey="bookings" 
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      name="bookings"
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Room Details Table */}
              <div className="mt-6">
                <h4 className="font-medium text-sm mb-3">Room Performance Details</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {utilizationData.utilizationByRoom
                    .sort((a, b) => b.bookingCount - a.bookingCount)
                    .slice(0, 5)
                    .map((room) => (
                      <div key={room.roomId} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{room.roomName}</span>
                        <div className="flex items-center gap-4">
                          <span>{room.bookingCount} bookings</span>
                          <span className="text-muted-foreground">
                            {formatPercentage(room.utilizationRate)} utilized
                          </span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest activity in your facility</CardDescription>
        </CardHeader>
        <CardContent>
          {activityData.length > 0 ? (
            <div className="space-y-4">
              {activityData.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}