"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Building,
  User,
  Mail,
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  ArrowLeft,
  UserPlus,
  Eye,
  Loader2,
  TrendingUp,
  FileText,
  QrCode,
  X
} from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

import type { BookingWithDetails, MeetingInvitation } from "@/types"
import {
  getBookingByIdWithDetails,
  calculateAverageCheckInTime
} from "@/lib/supabase-data"
// Removed client-side PDF generation - now using server-side API

interface BookingAnalytics {
  totalInvited: number
  totalAccepted: number
  totalDeclined: number
  totalAttended: number
  checkInRate: number
  averageCheckInTime: string
  paymentStatus: string
  totalAmount: number
  duration: number
}

export default function BookingDetailsPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [meetingInvitations, setMeetingInvitations] = useState<MeetingInvitation[]>([])
  const [analytics, setAnalytics] = useState<BookingAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  const bookingId = params.bookingId as string

  useEffect(() => {
    if (!user || !bookingId) return
    
    loadBookingDetails()
  }, [user, bookingId])

  const loadBookingDetails = async () => {
    try {
      setIsLoading(true)

      // Load booking details with comprehensive data
      const bookingData = await getBookingByIdWithDetails(bookingId)
      if (!bookingData) {
        setError("Booking not found")
        return
      }

      setBooking(bookingData)

      // Load meeting invitations and get the data directly
      const invitationsData = await loadMeetingInvitationsAndReturn(bookingId)

      // Calculate analytics with real data using the fresh invitations data
      await calculateAnalyticsWithRealData(bookingData, invitationsData)

    } catch (err) {
      console.error("Error loading booking details:", err)
      setError("Failed to load booking details")
    } finally {
      setIsLoading(false)
    }
  }

  const loadMeetingInvitations = async (bookingId: string): Promise<MeetingInvitation[]> => {
    try {
      // Use the authenticatedFetch utility which handles token refresh automatically
      const { authenticatedFetch } = await import('@/lib/auth-utils')

      const response = await authenticatedFetch(`/api/meeting-invitations?bookingId=${bookingId}`)

      if (response.ok) {
        const invitations = await response.json()
        setMeetingInvitations(invitations)
        return invitations
      } else {
        const errorText = await response.text()
        console.error("Failed to load meeting invitations:", response.status, errorText)

        // If it's a 401, the token might be invalid
        if (response.status === 401) {
          console.log("Received 401, token may be expired or invalid")
        }
      }
      return []
    } catch (error) {
      console.error("Error loading meeting invitations:", error)

      // If authenticatedFetch fails due to no token, log it
      if (error instanceof Error && error.message.includes("No valid authentication token")) {
        console.error("Authentication token issue:", error.message)
      }
      return []
    }
  }

  const loadMeetingInvitationsAndReturn = async (bookingId: string): Promise<MeetingInvitation[]> => {
    return await loadMeetingInvitations(bookingId)
  }

  const calculateAnalyticsWithRealData = async (booking: BookingWithDetails, invitations: MeetingInvitation[]) => {
    const totalInvited = invitations.length
    const totalAccepted = invitations.filter(inv => inv.status === 'accepted').length
    const totalDeclined = invitations.filter(inv => inv.status === 'declined').length
    const totalAttended = invitations.filter(inv => inv.attendance_status === 'present').length

    // Calculate check-in rate based on total invited (not just accepted)
    const checkInRate = totalInvited > 0 ? (totalAttended / totalInvited) * 100 : 0

    // Calculate duration in hours
    const startTime = new Date(booking.start_time)
    const endTime = new Date(booking.end_time)
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

    // Calculate real average check-in time
    const averageCheckInTime = await calculateAverageCheckInTime(booking.id)

    // Get real payment data
    const totalAmount = booking.payments?.amount || booking.total_cost || 0
    const paymentStatus = booking.payments?.status || booking.payment_status || 'pending'

    const analyticsData: BookingAnalytics = {
      totalInvited,
      totalAccepted,
      totalDeclined,
      totalAttended,
      checkInRate,
      averageCheckInTime: averageCheckInTime || "No check-ins yet",
      paymentStatus,
      totalAmount,
      duration
    }

    setAnalytics(analyticsData)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          text: "Confirmed"
        }
      case "pending":
        return {
          icon: AlertCircle,
          className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          text: "Pending"
        }
      case "cancelled":
        return {
          icon: XCircle,
          className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
          text: "Cancelled"
        }
      default:
        return {
          icon: AlertCircle,
          className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
          text: status
        }
    }
  }

  const openQuickPreview = () => {
    // TODO: Implement quick preview modal
    toast({
      title: "Quick Preview",
      description: "Opening quick preview modal...",
    })
  }

  const exportReport = async () => {
    if (!booking) {
      toast({
        title: "Error",
        description: "Booking data not available for export.",
        variant: "destructive"
      })
      return
    }

    try {
      toast({
        title: "Generating Report",
        description: "Creating PDF report...",
      })

      const token = localStorage.getItem("auth-token")
      if (!token) {
        throw new Error("No authentication token")
      }

      const response = await fetch(`/api/facility-manager/bookings/${booking.id}/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
      
      // Generate filename
      const safeRoomName = (booking.rooms?.name || 'Unknown_Room').replace(/[^a-zA-Z0-9]/g, '_')
      const safeDate = new Date(booking.start_time).toISOString().split('T')[0]
      a.download = `booking-report-${safeRoomName}-${safeDate}-${booking.id.slice(0, 8)}.pdf`
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Report Generated",
        description: "PDF report has been downloaded successfully.",
      })
    } catch (error: any) {
      console.error('Error generating PDF report:', error)
      toast({
        title: "Export Failed",
        description: error.message || "Failed to generate PDF report. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Booking Not Found</h2>
          <p className="text-muted-foreground mb-4">{error || "The requested booking could not be found."}</p>
          <Button asChild>
            <Link href="/facility-manager/bookings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(booking.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-0">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-brand-navy-700 dark:text-brand-navy-300">
        <Link href="/facility-manager" className="hover:text-brand-navy-900 dark:hover:text-brand-navy-50 transition-colors">
          <span className="hidden sm:inline">Dashboard</span>
          <span className="sm:hidden">←</span>
        </Link>
        <span className="hidden sm:inline">/</span>
        <Link href="/facility-manager/bookings" className="hover:text-brand-navy-900 dark:hover:text-brand-navy-50 transition-colors hidden sm:inline">
          Bookings
        </Link>
        <span className="hidden sm:inline">/</span>
        <span className="text-brand-navy-900 dark:text-brand-navy-50 font-medium truncate max-w-[200px] sm:max-w-none">{booking.title}</span>
      </nav>

      {/* Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-brand-navy-50 to-blue-50 dark:from-brand-navy-900 dark:to-blue-950 border border-brand-navy-200 dark:border-brand-navy-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-navy-900 dark:text-brand-navy-50">{booking.title}</h1>
                <Badge className={cn("flex items-center gap-1.5 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium shadow-sm", statusConfig.className)}>
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.text}
                </Badge>
              </div>
              <p className="text-sm sm:text-base text-brand-navy-700 dark:text-brand-navy-300">
                Booking ID: <span className="font-mono text-xs sm:text-sm bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-900 dark:text-brand-navy-100 px-2 py-1 rounded border border-brand-navy-200 dark:border-brand-navy-600">{booking.id}</span>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={openQuickPreview}
                className="border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-600 transition-all duration-200 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] active:scale-[0.98]"
              >
                <Eye className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Quick Preview</span>
                <span className="sm:hidden">Preview</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={exportReport}
                className="border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-600 transition-all duration-200 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] active:scale-[0.98]"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export Report</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button 
                variant="outline" 
                asChild
                className="border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-600 transition-all duration-200 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] active:scale-[0.98]"
              >
                <Link href="/facility-manager/bookings">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back to Bookings</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      {analytics && (
        <div className="grid gap-2 sm:gap-4 lg:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-200">
            <div className="h-1 bg-blue-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2 pt-2 sm:px-3 sm:pt-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">Total Invited</CardTitle>
              <div className="p-1 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="pb-2 px-2 sm:px-3">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-brand-navy-900 dark:text-brand-navy-50">{analytics.totalInvited}</div>
              <p className="text-xs text-brand-navy-700 dark:text-brand-navy-300">Attendees invited</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-200">
            <div className="h-1 bg-green-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2 pt-2 sm:px-3 sm:pt-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">Total Amount</CardTitle>
              <div className="p-1 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="pb-2 px-2 sm:px-3">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-brand-navy-900 dark:text-brand-navy-50">
                {booking.payments?.currency || booking.rooms?.currency || 'GHS'} {analytics.totalAmount.toFixed(2)}
              </div>
              <p className="text-xs text-brand-navy-700 dark:text-brand-navy-300">Payment {analytics.paymentStatus}</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-200">
            <div className="h-1 bg-purple-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2 pt-2 sm:px-3 sm:pt-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">Duration</CardTitle>
              <div className="p-1 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="pb-2 px-2 sm:px-3">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-brand-navy-900 dark:text-brand-navy-50">{analytics.duration.toFixed(1)}h</div>
              <p className="text-xs text-brand-navy-700 dark:text-brand-navy-300">Meeting length</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-200">
            <div className="h-1 bg-amber-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2 pt-2 sm:px-3 sm:pt-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">Check-in Rate</CardTitle>
              <div className="p-1 sm:p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="pb-2 px-2 sm:px-3">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-brand-navy-900 dark:text-brand-navy-50">{analytics.checkInRate.toFixed(0)}%</div>
              <p className="text-xs text-brand-navy-700 dark:text-brand-navy-300">Attendance rate</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-200 col-span-2 sm:col-span-1">
            <div className="h-1 bg-indigo-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2 pt-2 sm:px-3 sm:pt-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">Attended</CardTitle>
              <div className="p-1 sm:p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </CardHeader>
            <CardContent className="pb-2 px-2 sm:px-3">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-brand-navy-900 dark:text-brand-navy-50">{analytics.totalAttended}</div>
              <p className="text-xs text-brand-navy-700 dark:text-brand-navy-300">Actually attended</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-brand-navy-100 dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 h-auto">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-white data-[state=active]:text-brand-navy-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-brand-navy-700 dark:data-[state=active]:text-brand-navy-50 transition-all duration-200 text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4"
          >
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Details</span>
          </TabsTrigger>
          <TabsTrigger 
            value="attendance" 
            className="data-[state=active]:bg-white data-[state=active]:text-brand-navy-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-brand-navy-700 dark:data-[state=active]:text-brand-navy-50 transition-all duration-200 text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4"
          >
            <span className="hidden sm:inline">Attendance</span>
            <span className="sm:hidden">People</span>
          </TabsTrigger>
          <TabsTrigger 
            value="financial" 
            className="data-[state=active]:bg-white data-[state=active]:text-brand-navy-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-brand-navy-700 dark:data-[state=active]:text-brand-navy-50 transition-all duration-200 text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4"
          >
            <span className="hidden sm:inline">Financial</span>
            <span className="sm:hidden">Money</span>
          </TabsTrigger>
          <TabsTrigger 
            value="timeline" 
            className="data-[state=active]:bg-white data-[state=active]:text-brand-navy-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-brand-navy-700 dark:data-[state=active]:text-brand-navy-50 transition-all duration-200 text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4"
          >
            <span className="hidden sm:inline">Timeline</span>
            <span className="sm:hidden">History</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Room Information */}
            <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-200">
              <div className="h-1 bg-blue-500 w-full" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-navy-900 dark:text-brand-navy-50">
                  <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Room Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-navy-900 dark:text-brand-navy-50">{booking.rooms?.name || "Unknown Room"}</span>
                </div>
                {booking.rooms?.location && (
                  <div className="flex items-center gap-2 text-sm text-brand-navy-700 dark:text-brand-navy-300">
                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>{booking.rooms.location}</span>
                  </div>
                )}
                {booking.rooms?.facilities && (
                  <div className="flex items-center gap-2 text-sm text-brand-navy-700 dark:text-brand-navy-300">
                    <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Facility: {booking.rooms.facilities.name}</span>
                  </div>
                )}
                {booking.rooms?.capacity && (
                  <div className="flex items-center gap-2 text-sm text-brand-navy-700 dark:text-brand-navy-300">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Capacity: {booking.rooms.capacity} people</span>
                  </div>
                )}
                {booking.rooms?.hourly_rate && (
                  <div className="flex items-center gap-2 text-sm text-brand-navy-700 dark:text-brand-navy-300">
                    <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Rate: {booking.rooms.currency || 'GHS'} {booking.rooms.hourly_rate}/hour</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organizer Information */}
            <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-200">
              <div className="h-1 bg-green-500 w-full" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-navy-900 dark:text-brand-navy-50">
                  <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Organizer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-navy-900 dark:text-brand-navy-50">{booking.users?.name || "Unknown User"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-brand-navy-700 dark:text-brand-navy-300">
                  <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>{booking.users?.email || "No email available"}</span>
                </div>
                {booking.users?.organization && (
                  <div className="flex items-center gap-2 text-sm text-brand-navy-700 dark:text-brand-navy-300">
                    <Building className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>{booking.users.organization}</span>
                  </div>
                )}
                {booking.users?.position && (
                  <div className="flex items-center gap-2 text-sm text-brand-navy-700 dark:text-brand-navy-300">
                    <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>{booking.users.position}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Date & Time */}
          <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-200">
            <div className="h-1 bg-purple-500 w-full" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-navy-900 dark:text-brand-navy-50">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Date</div>
                  <div className="font-semibold text-brand-navy-900 dark:text-brand-navy-50">
                    {format(new Date(booking.start_time), "EEEE, MMMM d, yyyy")}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Time</div>
                  <div className="font-semibold text-brand-navy-900 dark:text-brand-navy-50">
                    {format(new Date(booking.start_time), "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Check-in Status */}
          {booking.check_in_required && (
            <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-200">
              <div className="h-1 bg-amber-500 w-full" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-navy-900 dark:text-brand-navy-50">
                  <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  Check-in Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Status</div>
                    <div className="font-semibold">
                      {booking.checked_in_at ? (
                        <span className="text-green-600 dark:text-green-400">Checked In</span>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400">Not Checked In</span>
                      )}
                    </div>
                  </div>
                  {booking.checked_in_at && (
                    <div className="space-y-2">
                      <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Check-in Time</div>
                      <div className="font-semibold text-brand-navy-900 dark:text-brand-navy-50">
                        {format(new Date(booking.checked_in_at), "h:mm a")}
                      </div>
                    </div>
                  )}
                </div>
                {booking.auto_release_at && !booking.checked_in_at && (
                  <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300">
                    Auto-release scheduled: {format(new Date(booking.auto_release_at), "h:mm a")}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {booking.description && (
            <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-200">
              <div className="h-1 bg-slate-500 w-full" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-navy-900 dark:text-brand-navy-50">
                  <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brand-navy-700 dark:text-brand-navy-300 leading-relaxed">{booking.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-200">
            <div className="h-1 bg-indigo-500 w-full" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-navy-900 dark:text-brand-navy-50">
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Attendance Matrix
              </CardTitle>
              <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">
                Detailed breakdown of invitees vs. actual attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {meetingInvitations.length > 0 ? (
                <div className="space-y-6">
                  {/* Visual Progress Indicators */}
                  <div className="grid gap-2 sm:gap-4 md:grid-cols-3">
                    <div className="text-center p-3 sm:p-4 md:p-6 border border-brand-navy-200 dark:border-brand-navy-700 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3">
                        <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-blue-200 dark:text-blue-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-blue-600 dark:text-blue-400"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${(analytics?.totalInvited || 0) * 100 / Math.max(analytics?.totalInvited || 1, 1)}, 100`}
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">{analytics?.totalInvited || 0}</span>
                        </div>
                      </div>
                      <div className="text-sm sm:text-lg font-bold text-blue-600 dark:text-blue-400">{analytics?.totalInvited || 0}</div>
                      <div className="text-xs sm:text-sm text-brand-navy-700 dark:text-brand-navy-300">Total Invited</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 md:p-6 border border-brand-navy-200 dark:border-brand-navy-700 rounded-lg bg-green-50 dark:bg-green-950/20">
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3">
                        <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-green-200 dark:text-green-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-green-600 dark:text-green-400"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${(analytics?.totalAccepted || 0) * 100 / Math.max(analytics?.totalInvited || 1, 1)}, 100`}
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">{analytics?.totalAccepted || 0}</span>
                        </div>
                      </div>
                      <div className="text-sm sm:text-lg font-bold text-green-600 dark:text-green-400">{analytics?.totalAccepted || 0}</div>
                      <div className="text-xs sm:text-sm text-brand-navy-700 dark:text-brand-navy-300">Accepted RSVP</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 md:p-6 border border-brand-navy-200 dark:border-brand-navy-700 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3">
                        <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-orange-200 dark:text-orange-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-orange-600 dark:text-orange-400"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${(analytics?.totalAttended || 0) * 100 / Math.max(analytics?.totalInvited || 1, 1)}, 100`}
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs sm:text-sm font-bold text-orange-600 dark:text-orange-400">{analytics?.totalAttended || 0}</span>
                        </div>
                      </div>
                      <div className="text-sm sm:text-lg font-bold text-orange-600 dark:text-orange-400">{analytics?.totalAttended || 0}</div>
                      <div className="text-xs sm:text-sm text-brand-navy-700 dark:text-brand-navy-300">Actually Attended</div>
                    </div>
                  </div>

                  {/* Attendance Rate Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">Overall Attendance Rate</span>
                      <span className="text-sm font-bold text-brand-navy-900 dark:text-brand-navy-50">{analytics?.checkInRate.toFixed(1) || 0}%</span>
                    </div>
                    <div className="w-full bg-brand-navy-200 dark:bg-brand-navy-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${analytics?.checkInRate || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Invitation & Attendance Table */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-brand-navy-900 dark:text-brand-navy-50">Complete Invitation List</h4>
                    
                    {/* Desktop Table View */}
                    <div className="hidden md:block rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-brand-navy-50 dark:bg-brand-navy-900/50">
                          <TableRow>
                            <TableHead className="text-brand-navy-900 dark:text-brand-navy-50">Invitee</TableHead>
                            <TableHead className="text-brand-navy-900 dark:text-brand-navy-50">Email</TableHead>
                            <TableHead className="text-brand-navy-900 dark:text-brand-navy-50">RSVP Status</TableHead>
                            <TableHead className="text-brand-navy-900 dark:text-brand-navy-50">Attendance Status</TableHead>
                            <TableHead className="text-brand-navy-900 dark:text-brand-navy-50">Check-in Time</TableHead>
                            <TableHead className="text-brand-navy-900 dark:text-brand-navy-50">Check-in Method</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {meetingInvitations.map((invitation) => (
                            <TableRow key={invitation.id} className="hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800/50 transition-colors">
                              <TableCell className="font-medium text-brand-navy-900 dark:text-brand-navy-50">
                                {invitation.invitee_name || "N/A"}
                              </TableCell>
                              <TableCell className="text-brand-navy-700 dark:text-brand-navy-300">{invitation.invitee_email}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={invitation.status === 'accepted' ? 'default' : 
                                         invitation.status === 'declined' ? 'destructive' : 'secondary'}
                                  className="shadow-sm"
                                >
                                  {invitation.status === 'pending' ? 'Invited' : 
                                   invitation.status === 'accepted' ? 'Accepted' : 
                                   invitation.status === 'declined' ? 'Declined' : invitation.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {invitation.attendance_status === 'present' ? (
                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Present
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 shadow-sm">
                                      <X className="h-3 w-3 mr-1" />
                                      Absent
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-brand-navy-700 dark:text-brand-navy-300">
                                {invitation.attended_at ? 
                                  format(new Date(invitation.attended_at), "h:mm a") : 
                                  "—"
                                }
                              </TableCell>
                              <TableCell className="text-brand-navy-700 dark:text-brand-navy-300">
                                {invitation.check_in_method ? (
                                  <div className="flex items-center gap-1">
                                    {invitation.check_in_method === 'self_qr' ? (
                                      <QrCode className="h-4 w-4" />
                                    ) : (
                                      <User className="h-4 w-4" />
                                    )}
                                    <span className="text-sm capitalize">
                                      {invitation.check_in_method.replace('_', ' ')}
                                    </span>
                                  </div>
                                ) : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {meetingInvitations.map((invitation) => (
                        <Card key={invitation.id} className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="font-semibold text-brand-navy-900 dark:text-brand-navy-50">
                                  {invitation.invitee_name || "N/A"}
                                </div>
                                <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300">
                                  {invitation.invitee_email}
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <Badge 
                                  variant={invitation.status === 'accepted' ? 'default' : 
                                         invitation.status === 'declined' ? 'destructive' : 'secondary'}
                                  className="text-xs shadow-sm"
                                >
                                  {invitation.status === 'pending' ? 'Invited' : 
                                   invitation.status === 'accepted' ? 'Accepted' : 
                                   invitation.status === 'declined' ? 'Declined' : invitation.status}
                                </Badge>
                                {invitation.attendance_status === 'present' ? (
                                  <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white shadow-sm text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Present
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 shadow-sm text-xs">
                                    <X className="h-3 w-3 mr-1" />
                                    Absent
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <div className="text-brand-navy-700 dark:text-brand-navy-300">Check-in Time:</div>
                                <div className="font-medium text-brand-navy-900 dark:text-brand-navy-50">
                                  {invitation.attended_at ? 
                                    format(new Date(invitation.attended_at), "h:mm a") : 
                                    "—"
                                  }
                                </div>
                              </div>
                              <div>
                                <div className="text-brand-navy-700 dark:text-brand-navy-300">Method:</div>
                                <div className="font-medium text-brand-navy-900 dark:text-brand-navy-50">
                                  {invitation.check_in_method ? (
                                    <div className="flex items-center gap-1">
                                      {invitation.check_in_method === 'self_qr' ? (
                                        <QrCode className="h-4 w-4" />
                                      ) : (
                                        <User className="h-4 w-4" />
                                      )}
                                      <span className="capitalize">
                                        {invitation.check_in_method.replace('_', ' ')}
                                      </span>
                                    </div>
                                  ) : "—"}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-brand-navy-500 dark:text-brand-navy-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-brand-navy-900 dark:text-brand-navy-50">No Attendees</h3>
                  <p className="text-brand-navy-700 dark:text-brand-navy-300">No attendees were invited to this meeting.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-200">
            <div className="h-1 bg-green-500 w-full" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-navy-900 dark:text-brand-navy-50">
                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Status Visualization */}
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Payment Status</div>
                    <Badge
                      variant={analytics?.paymentStatus === 'paid' ? 'default' : 'secondary'}
                      className={`mt-2 shadow-sm ${
                        analytics?.paymentStatus === 'paid' 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30'
                      }`}
                    >
                      {analytics?.paymentStatus === 'paid' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          {analytics?.paymentStatus || 'Pending'}
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Total Amount</div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {booking.payments?.currency || booking.rooms?.currency || 'GHS'} {analytics?.totalAmount.toFixed(2) || "0.00"}
                    </div>
                  </div>
                </div>
                
                {/* Payment Progress Bar */}
                <div className="w-full bg-brand-navy-200 dark:bg-brand-navy-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                      analytics?.paymentStatus === 'paid' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-amber-500 to-amber-600'
                    }`}
                    style={{ width: analytics?.paymentStatus === 'paid' ? '100%' : '60%' }}
                  ></div>
                </div>
              </div>

              <Separator className="bg-brand-navy-200 dark:bg-brand-navy-700" />

              <div className="space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Payment Method:</div>
                    <div className="font-medium text-brand-navy-900 dark:text-brand-navy-50">{booking.payments?.payment_method || booking.payment_method || "N/A"}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Transaction Reference:</div>
                    <div className="font-mono text-xs sm:text-sm text-brand-navy-900 dark:text-brand-navy-50 bg-brand-navy-100 dark:bg-brand-navy-800 px-2 py-1 rounded border border-brand-navy-200 dark:border-brand-navy-600 break-all">
                      {booking.payments?.paystack_reference || booking.payment_reference || booking.paystack_reference || "N/A"}
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Payment Date:</div>
                    <div className="font-medium text-brand-navy-900 dark:text-brand-navy-50">{
                      (booking.payments?.paid_at || booking.payment_date)
                        ? format(new Date(booking.payments?.paid_at || booking.payment_date!), "MMM d, yyyy 'at' h:mm a")
                        : "N/A"
                    }</div>
                  </div>
                  {booking.payments?.created_at && (
                    <div className="space-y-2">
                      <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Payment Created:</div>
                      <div className="font-medium text-brand-navy-900 dark:text-brand-navy-50">{format(new Date(booking.payments.created_at), "MMM d, yyyy 'at' h:mm a")}</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-200">
            <div className="h-1 bg-amber-500 w-full" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-navy-900 dark:text-brand-navy-50">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Booking Timeline
              </CardTitle>
              <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">
                Complete history of this booking from creation to completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-green-500 to-purple-500"></div>
                
                <div className="space-y-6 sm:space-y-8">
                  {/* Timeline items */}
                  <div className="relative flex gap-3 sm:gap-4 lg:gap-6 items-start">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg ring-2 sm:ring-4 ring-blue-100 dark:ring-blue-900/30">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                    </div>
                    <div className="flex-1 pt-1 sm:pt-2">
                      <div className="font-semibold text-brand-navy-900 dark:text-brand-navy-50 text-base sm:text-lg">Booking Created</div>
                      <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300 mt-1">
                        {format(new Date(booking.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                      <div className="mt-2 text-sm text-brand-navy-600 dark:text-brand-navy-400">
                        Initial booking request was submitted
                      </div>
                    </div>
                  </div>
                  
                  {booking.status === "confirmed" && (
                    <div className="relative flex gap-3 sm:gap-4 lg:gap-6 items-start">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg ring-2 sm:ring-4 ring-green-100 dark:ring-green-900/30">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                      <div className="flex-1 pt-1 sm:pt-2">
                        <div className="font-semibold text-brand-navy-900 dark:text-brand-navy-50 text-base sm:text-lg">Booking Confirmed</div>
                        <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300 mt-1">
                          {format(new Date(booking.updated_at), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                        <div className="mt-2 text-sm text-brand-navy-600 dark:text-brand-navy-400">
                          Booking was approved and confirmed by facility manager
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {booking.checked_in_at && (
                    <div className="relative flex gap-3 sm:gap-4 lg:gap-6 items-start">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-500 rounded-full flex items-center justify-center shadow-lg ring-2 sm:ring-4 ring-purple-100 dark:ring-purple-900/30">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                      <div className="flex-1 pt-1 sm:pt-2">
                        <div className="font-semibold text-brand-navy-900 dark:text-brand-navy-50 text-base sm:text-lg">Checked In</div>
                        <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300 mt-1">
                          {format(new Date(booking.checked_in_at), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                        <div className="mt-2 text-sm text-brand-navy-600 dark:text-brand-navy-400">
                          Organizer checked in for the meeting
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {booking.payment_date && (
                    <div className="relative flex gap-3 sm:gap-4 lg:gap-6 items-start">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg ring-2 sm:ring-4 ring-emerald-100 dark:ring-emerald-900/30">
                        <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                      <div className="flex-1 pt-1 sm:pt-2">
                        <div className="font-semibold text-brand-navy-900 dark:text-brand-navy-50 text-base sm:text-lg">Payment Completed</div>
                        <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300 mt-1">
                          {format(new Date(booking.payment_date), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                        <div className="mt-2 text-sm text-brand-navy-600 dark:text-brand-navy-400">
                          Payment was successfully processed
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  )
}



