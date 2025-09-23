"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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
  ExternalLink,
  UserPlus,
  Eye,
  Loader2,
  TrendingUp,
  FileText,
  Bell,
  QrCode
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
import { getBookingById } from "@/lib/supabase-data"

interface BookingAnalytics {
  totalInvited: number
  totalAccepted: number
  totalDeclined: number
  totalAttended: number
  attendanceRate: number
  checkInRate: number
  averageCheckInTime: string
  paymentStatus: string
  totalAmount: number
  duration: number
  roomUtilization: number
}

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
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
      
      // Load booking details
      const bookingData = await getBookingById(bookingId)
      if (!bookingData) {
        setError("Booking not found")
        return
      }
      
      setBooking(bookingData)
      
      // Load meeting invitations
      await loadMeetingInvitations(bookingId)
      
      // Calculate analytics
      calculateAnalytics(bookingData, meetingInvitations)
      
    } catch (err) {
      console.error("Error loading booking details:", err)
      setError("Failed to load booking details")
    } finally {
      setIsLoading(false)
    }
  }

  const loadMeetingInvitations = async (bookingId: string) => {
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`/api/meeting-invitations?bookingId=${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const invitations = await response.json()
        setMeetingInvitations(invitations)
      }
    } catch (error) {
      console.error("Error loading meeting invitations:", error)
    }
  }

  const calculateAnalytics = (booking: BookingWithDetails, invitations: MeetingInvitation[]) => {
    const totalInvited = invitations.length
    const totalAccepted = invitations.filter(inv => inv.status === 'accepted').length
    const totalDeclined = invitations.filter(inv => inv.status === 'declined').length
    const totalAttended = invitations.filter(inv => inv.attendance_status === 'present').length
    
    const attendanceRate = totalInvited > 0 ? (totalAttended / totalInvited) * 100 : 0
    const checkInRate = totalAccepted > 0 ? (totalAttended / totalAccepted) * 100 : 0
    
    // Calculate duration in hours
    const startTime = new Date(booking.start_time)
    const endTime = new Date(booking.end_time)
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    
    const analyticsData: BookingAnalytics = {
      totalInvited,
      totalAccepted,
      totalDeclined,
      totalAttended,
      attendanceRate,
      checkInRate,
      averageCheckInTime: "2:05 PM", // TODO: Calculate from actual check-in times
      paymentStatus: booking.payment_status || 'pending',
      totalAmount: (booking as any).total_cost || 0,
      duration,
      roomUtilization: 85 // TODO: Calculate from actual usage
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

  const exportReport = () => {
    // TODO: Implement PDF export
    toast({
      title: "Export Report",
      description: "Generating PDF report...",
    })
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
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/facility-manager" className="hover:text-foreground">Dashboard</Link>
        <span>/</span>
        <Link href="/facility-manager/bookings" className="hover:text-foreground">Bookings</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">{booking.title}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{booking.title}</h1>
            <Badge className={cn("flex items-center gap-1.5", statusConfig.className)}>
              <StatusIcon className="h-3 w-3" />
              {statusConfig.text}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Booking ID: <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{booking.id}</span>
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={openQuickPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Quick Preview
          </Button>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" asChild>
            <Link href="/facility-manager/bookings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invited</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalInvited}</div>
              <p className="text-xs text-muted-foreground">Attendees invited</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.attendanceRate.toFixed(1)}%</div>
              <Progress value={analytics.attendanceRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GH₵{analytics.totalAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Payment {analytics.paymentStatus}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.duration.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">Meeting length</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Room Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Room Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{booking.rooms?.name || "Unknown Room"}</span>
                </div>
                {booking.rooms?.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{booking.rooms.location}</span>
                  </div>
                )}
                {booking.rooms?.capacity && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Capacity: {booking.rooms.capacity} people</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organizer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Organizer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{booking.users?.name || "Unknown User"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{booking.users?.email || "No email available"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-medium">
                    {format(new Date(booking.start_time), "EEEE, MMMM d, yyyy")}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Time</div>
                  <div className="font-medium">
                    {format(new Date(booking.start_time), "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {booking.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{booking.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Attendance Matrix
              </CardTitle>
              <CardDescription>
                Detailed breakdown of invitees vs. actual attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {meetingInvitations.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{analytics?.totalInvited || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Invited</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{analytics?.totalAccepted || 0}</div>
                      <div className="text-sm text-muted-foreground">Accepted</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{analytics?.totalAttended || 0}</div>
                      <div className="text-sm text-muted-foreground">Attended</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{analytics?.attendanceRate.toFixed(1) || 0}%</div>
                      <div className="text-sm text-muted-foreground">Attendance Rate</div>
                    </div>
                  </div>

                  {/* Attendance Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>RSVP Status</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead>Check-in Time</TableHead>
                        <TableHead>Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {meetingInvitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">
                            {invitation.invitee_name || "N/A"}
                          </TableCell>
                          <TableCell>{invitation.invitee_email}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={invitation.status === 'accepted' ? 'default' : 
                                     invitation.status === 'declined' ? 'destructive' : 'secondary'}
                            >
                              {invitation.status === 'pending' ? 'Invited' : 
                               invitation.status === 'accepted' ? 'Accepted' : 
                               invitation.status === 'declined' ? 'Declined' : invitation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={invitation.attendance_status === 'present' ? 'default' : 'secondary'}
                            >
                              {invitation.attendance_status === 'present' ? 'Present' : 'Not Present'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {invitation.attended_at ? 
                              format(new Date(invitation.attended_at), "h:mm a") : 
                              "—"
                            }
                          </TableCell>
                          <TableCell>
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
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Attendees</h3>
                  <p className="text-muted-foreground">No attendees were invited to this meeting.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="text-3xl font-bold text-green-600">
                    GH₵{analytics?.totalAmount.toFixed(2) || "0.00"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Payment Status</div>
                  <Badge 
                    variant={analytics?.paymentStatus === 'paid' ? 'default' : 'secondary'}
                    className="mt-2"
                  >
                    {analytics?.paymentStatus || 'pending'}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span>{booking.payment_method || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction Reference:</span>
                  <span className="font-mono text-sm">{booking.payment_reference || booking.paystack_reference || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Date:</span>
                  <span>{booking.payment_date ? format(new Date(booking.payment_date), "MMM d, yyyy 'at' h:mm a") : "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Booking Timeline
              </CardTitle>
              <CardDescription>
                Complete history of this booking from creation to completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Timeline items */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Booking Created</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(booking.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </div>
                
                {booking.status === "confirmed" && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Booking Confirmed</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(booking.updated_at), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  </div>
                )}
                
                {booking.checked_in_at && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Checked In</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(booking.checked_in_at), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  </div>
                )}
                
                {booking.payment_date && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Payment Completed</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(booking.payment_date), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reports & Analytics
              </CardTitle>
              <CardDescription>
                Generate detailed reports and export data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Download className="h-6 w-6" />
                  <span>Export PDF Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Export CSV Data</span>
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium">Quick Insights</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Room Utilization</div>
                    <div className="text-xl font-bold">{analytics?.roomUtilization || 0}%</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Average Check-in Time</div>
                    <div className="text-xl font-bold">{analytics?.averageCheckInTime || "N/A"}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


