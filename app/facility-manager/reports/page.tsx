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

interface KPIMetric {
  current: number
  previous: number
  change: number
  changePercent: number
}

interface DashboardData {
  totalRevenue: KPIMetric
  activeBookings: KPIMetric
  roomUtilization: KPIMetric
  meetingCompletionRate: KPIMetric
  averageGuestCount: KPIMetric
  paymentCollectionRate: KPIMetric
}

interface RevenueData {
  totalRevenue: number
  revenueByRoom: Array<{
    roomId: string
    roomName: string
    revenue: number
    bookingCount: number
  }>
  paymentMethodDistribution: Array<{
    method: string
    amount: number
    count: number
  }>
  revenueTimeline: Array<{
    date: string
    revenue: number
    bookings: number
  }>
  averageBookingValue: number
  collectionEfficiency: number
}

interface MeetingData {
  totalMeetings: number
  checkInRate: number
  punctualityRate: number
  averageDuration: number
  guestInvitationStats: {
    totalInvitations: number
    acceptanceRate: number
    responseRate: number
    averageResponseTime: number
  }
  checkInPerformance: Array<{
    status: string
    count: number
    percentage: number
  }>
  popularMeetingTimes: Array<{
    hour: number
    count: number
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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null)
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
        setRevenueData(result.data.revenue)
        setMeetingData(result.data.meetings)
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

  const formatCurrency = (amount: number) => {
    return `GH₵ ${amount.toFixed(2)}`
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
            <div className="h-1.5 bg-green-500 w-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData.totalRevenue.current)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">From last period</p>
                {formatChange(dashboardData.totalRevenue.change, dashboardData.totalRevenue.changePercent)}
              </div>
              </CardContent>
            </Card>
            
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-blue-500 w-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.activeBookings.current}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">Confirmed bookings</p>
                {formatChange(dashboardData.activeBookings.change, dashboardData.activeBookings.changePercent)}
              </div>
              </CardContent>
            </Card>
            
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-purple-500 w-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Room Utilization</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(dashboardData.roomUtilization.current)}
                </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">Average across rooms</p>
                {formatChange(dashboardData.roomUtilization.change, dashboardData.roomUtilization.changePercent)}
                </div>
              </CardContent>
            </Card>
            
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-orange-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meeting Success</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(dashboardData.meetingCompletionRate.current)}
                          </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">Completion rate</p>
                {formatChange(dashboardData.meetingCompletionRate.change, dashboardData.meetingCompletionRate.changePercent)}
                </div>
              </CardContent>
            </Card>

          <Card className="overflow-hidden">
            <div className="h-1.5 bg-teal-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Guests</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.averageGuestCount.current.toFixed(1)}
                    </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">Per meeting</p>
                {formatChange(dashboardData.averageGuestCount.change, dashboardData.averageGuestCount.changePercent)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-amber-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(dashboardData.paymentCollectionRate.current)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">Payment success</p>
                {formatChange(dashboardData.paymentCollectionRate.change, dashboardData.paymentCollectionRate.changePercent)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        
      {/* Charts and Analytics Sections */}
          <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Analytics */}
        <Card>
              <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Overview
            </CardTitle>
            <CardDescription>Revenue and payment analytics for your facility</CardDescription>
              </CardHeader>
              <CardContent>
            {revenueData ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(revenueData.totalRevenue)}
                        </div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(revenueData.averageBookingValue)}
                    </div>
                    <p className="text-xs text-muted-foreground">Avg Booking Value</p>
                          </div>
                  <div>
                    <div className="text-lg font-semibold">
                      {formatPercentage(revenueData.collectionEfficiency)}
                        </div>
                    <p className="text-xs text-muted-foreground">Collection Rate</p>
                  </div>
                </div>

                {/* Top Performing Rooms */}
                {revenueData.revenueByRoom.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Top Performing Rooms</h4>
                    {revenueData.revenueByRoom.slice(0, 3).map((room) => (
                      <div key={room.roomId} className="flex justify-between items-center">
                        <span className="text-sm">{room.roomName}</span>
                        <span className="text-sm font-medium">
                          {formatCurrency(room.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                  </div>
                ) : (
              <div className="text-center text-muted-foreground">
                No revenue data available
                  </div>
                )}
              </CardContent>
            </Card>

        {/* Meeting Analytics */}
        <Card>
              <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Meeting Performance
            </CardTitle>
            <CardDescription>Meeting and guest analytics</CardDescription>
              </CardHeader>
              <CardContent>
            {meetingData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{meetingData.totalMeetings}</div>
                    <p className="text-xs text-muted-foreground">Total Meetings</p>
                    </div>
                    <div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPercentage(meetingData.checkInRate)}
                      </div>
                    <p className="text-xs text-muted-foreground">Check-in Rate</p>
                    </div>
                  </div>
                  
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold">
                      {formatPercentage(meetingData.punctualityRate)}
                    </div>
                    <p className="text-xs text-muted-foreground">Punctuality</p>
                    </div>
                    <div>
                    <div className="text-lg font-semibold">
                      {meetingData.averageDuration.toFixed(0)} min
                      </div>
                    <p className="text-xs text-muted-foreground">Avg Duration</p>
                    </div>
                  </div>
                  
                {/* Guest Stats */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-2">Guest Engagement</h4>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="font-semibold">
                        {meetingData.guestInvitationStats.totalInvitations}
                      </div>
                      <p className="text-xs text-muted-foreground">Invitations Sent</p>
                    </div>
                    <div>
                      <div className="font-semibold text-green-600">
                        {formatPercentage(meetingData.guestInvitationStats.acceptanceRate)}
                      </div>
                      <p className="text-xs text-muted-foreground">Acceptance Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                No meeting data available
              </div>
            )}
              </CardContent>
            </Card>
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