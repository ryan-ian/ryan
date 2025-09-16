"use client"

import React, { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Building,
  AlertCircle,
  Info,
  X,
  CheckCircle,
  XCircle,
  User,
  Mail,
  UserPlus,
  DollarSign,
  CreditCard,
  Check
} from "lucide-react"
import type { BookingWithDetails, MeetingInvitation } from "@/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface FacilityManagerBookingDetailsModalProps {
  booking: BookingWithDetails | null
  isOpen: boolean
  onClose: () => void
  onApprove?: (bookingId: string) => void
  onReject?: (bookingId: string, reason: string) => void
}

export function FacilityManagerBookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: FacilityManagerBookingDetailsModalProps) {
  const [meetingInvitations, setMeetingInvitations] = useState<MeetingInvitation[]>([])
  const [loadingInvitations, setLoadingInvitations] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (booking) {
      // Load meeting invitations for any booking (not just confirmed ones)
      loadMeetingInvitations(booking.id)
    }
  }, [booking])

  const loadMeetingInvitations = async (bookingId: string) => {
    setLoadingInvitations(true)
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
      } else {
        console.error("Failed to load meeting invitations:", response.status)
      }
    } catch (error) {
      console.error("Error loading meeting invitations:", error)
    } finally {
      setLoadingInvitations(false)
    }
  }

  const handleApprove = () => {
    setConfirmDialogOpen(true)
  }

  const handleReject = () => {
    setRejectionReason("")
    setRejectDialogOpen(true)
  }

  const confirmApprove = async () => {
    if (!booking || !onApprove) return
    setProcessing(true)
    try {
      await onApprove(booking.id)
      setConfirmDialogOpen(false)
      onClose()
      toast({
        title: "Booking Approved",
        description: "The booking has been successfully approved.",
        variant: "default"
      })
    } catch (error) {
      console.error("Error approving booking:", error)
      toast({
        title: "Error",
        description: "Failed to approve the booking. Please try again.",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const confirmReject = async () => {
    if (!booking || !onReject || !rejectionReason.trim()) return
    setProcessing(true)
    try {
      await onReject(booking.id, rejectionReason.trim())
      setRejectDialogOpen(false)
      onClose()
      toast({
        title: "Booking Rejected",
        description: "The booking has been rejected.",
        variant: "default"
      })
    } catch (error) {
      console.error("Error rejecting booking:", error)
      toast({
        title: "Error",
        description: "Failed to reject the booking. Please try again.",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  if (!booking) return null

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          icon: CheckCircle,
          className: "bg-success/10 text-success ring-1 ring-success/20",
          text: "Confirmed",
          description: "This booking has been approved."
        }
      case "pending":
        return {
          icon: AlertCircle,
          className: "bg-warning/10 text-warning ring-1 ring-warning/20",
          text: "Pending",
          description: "This booking is awaiting your approval."
        }
      case "cancelled":
        return {
          icon: XCircle,
          className: "bg-destructive/10 text-destructive ring-1 ring-destructive/20",
          text: "Cancelled",
          description: "This booking has been cancelled or rejected."
        }
      default:
        return {
          icon: AlertCircle,
          className: "bg-muted/10 text-muted-foreground ring-1 ring-muted/20",
          text: status,
          description: ""
        }
    }
  }

  const statusConfig = getStatusConfig(booking.status)
  const StatusIcon = statusConfig.icon

  // Get payment information
  const getPaymentInfo = () => {
    const totalCost = (booking as any).total_cost
    if (totalCost && totalCost > 0) {
      return {
        amount: totalCost,
        status: booking.payment_status || 'pending',
        method: booking.payment_method || 'Unknown',
        reference: booking.payment_reference || booking.paystack_reference || 'N/A'
      }
    }
    return null
  }

  const paymentInfo = getPaymentInfo()

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) onClose()
      }}>
        <DialogContent className={cn(
          "sm:max-w-3xl max-w-[95vw] max-h-[90vh] overflow-y-auto",
          "rounded-xl border backdrop-blur-md",
          "border-brand-navy-200 dark:border-brand-navy-700",
          "bg-white/95 dark:bg-brand-navy-800/95"
        )}>
          <DialogHeader className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-xl font-semibold text-brand-navy-900 dark:text-brand-navy-50">
                  {booking.title || "Meeting"}
                </DialogTitle>
                <Badge className={cn("flex items-center gap-1.5", statusConfig.className)}>
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.text}
                </Badge>
              </div>
              <DialogDescription className="text-brand-navy-600 dark:text-brand-navy-400">
                Facility Manager View - Booking details and approval actions
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Status Alert */}
            {statusConfig.description && (
              <Alert className={cn(
                "border-brand-navy-200 dark:border-brand-navy-700",
                booking.status === "confirmed" && "border-success/50 bg-success/5",
                booking.status === "pending" && "border-warning/50 bg-warning/5",
                booking.status === "cancelled" && "border-destructive/50 bg-destructive/5"
              )}>
                <StatusIcon className="h-4 w-4" />
                <AlertDescription className="text-brand-navy-700 dark:text-brand-navy-300">
                  {statusConfig.description}
                </AlertDescription>
              </Alert>
            )}

            {/* Rejection Reason - Prominently displayed for cancelled bookings */}
            {booking.status === "cancelled" && booking.rejection_reason && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <AlertTitle className="text-red-800 dark:text-red-200 font-semibold">
                  Booking Rejected
                </AlertTitle>
                <AlertDescription className="text-red-700 dark:text-red-300 mt-2">
                  <div className="font-medium">Reason for rejection:</div>
                  <div className="mt-1 p-3 bg-red-100 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800">
                    "{booking.rejection_reason}"
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Room Information */}
            <Card className="border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50/50 dark:bg-brand-navy-900/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-brand-navy-100 to-brand-navy-50 dark:from-brand-navy-700 dark:to-brand-navy-800">
                    <Building className="h-5 w-5 text-brand-navy-600 dark:text-brand-navy-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-brand-navy-900 dark:text-brand-navy-50">
                      {booking.rooms?.name || "Unknown Room"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-brand-navy-600 dark:text-brand-navy-400 mt-1">
                      {booking.rooms?.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{booking.rooms.location}</span>
                        </div>
                      )}
                      {booking.rooms?.capacity && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>Up to {booking.rooms.capacity} people</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Date & Time */}
              <Card className="border-brand-navy-200 dark:border-brand-navy-700">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand-navy-500 dark:text-brand-navy-400" />
                    <span className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Date & Time</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-brand-navy-900 dark:text-brand-navy-50 font-medium">
                      {new Date(booking.start_time).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-brand-navy-600 dark:text-brand-navy-400">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(booking.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(booking.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Organizer */}
              <Card className="border-brand-navy-200 dark:border-brand-navy-700">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-brand-navy-500 dark:text-brand-navy-400" />
                    <span className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Organizer</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-brand-navy-900 dark:text-brand-navy-50 font-medium">
                      {booking.users?.name || "Unknown User"}
                    </p>
                    <p className="text-sm text-brand-navy-600 dark:text-brand-navy-400">
                      {booking.users?.email || "No email available"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Information */}
            {paymentInfo && (
              <Card className="border-brand-navy-200 dark:border-brand-navy-700 bg-green-50/50 dark:bg-green-950/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Payment Information</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                        GH₵ {paymentInfo.amount.toFixed(2)}
                      </div>
                      <div className="text-sm text-brand-navy-600 dark:text-brand-navy-400">
                        Total Amount Paid
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-brand-navy-500 dark:text-brand-navy-400">Status:</span>
                        <Badge variant={paymentInfo.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                          {paymentInfo.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
                        Method: {paymentInfo.method}
                      </div>
                      <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
                        Ref: {paymentInfo.reference}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {booking.description && (
              <Card className="border-brand-navy-200 dark:border-brand-navy-700">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-brand-navy-500 dark:text-brand-navy-400" />
                    <span className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Description</span>
                  </div>
                  <p className="text-brand-navy-900 dark:text-brand-navy-50 leading-relaxed">
                    {booking.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Meeting Invitations/Attendees */}
            <Card className="border-brand-navy-200 dark:border-brand-navy-700">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-brand-navy-500 dark:text-brand-navy-400" />
                  <span className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">
                    Invited Attendees
                  </span>
                </div>

                {loadingInvitations ? (
                  <div className="flex items-center gap-2 text-sm text-brand-navy-500 dark:text-brand-navy-400">
                    <div className="w-4 h-4 border-2 border-brand-teal-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading attendees...
                  </div>
                ) : meetingInvitations.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-brand-navy-600 dark:text-brand-navy-300">
                        Total Attendees: {meetingInvitations.length}
                      </p>
                    </div>
                    
                    {/* Attendees List */}
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {meetingInvitations.map((invitation) => (
                        <div key={invitation.id} className="flex items-center justify-between p-2 bg-brand-navy-50 dark:bg-brand-navy-800 rounded-lg">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-brand-teal-100 dark:bg-brand-teal-800 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-brand-teal-600 dark:text-brand-teal-300" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {invitation.invitee_name ? (
                                  <>
                                    <p className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-100 truncate">
                                      {invitation.invitee_name}
                                    </p>
                                    <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 truncate">
                                      {invitation.invitee_email}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300 truncate">
                                    {invitation.invitee_email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <Badge 
                              variant={invitation.status === 'accepted' ? 'default' : invitation.status === 'declined' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {invitation.status === 'pending' ? 'Invited' : 
                               invitation.status === 'accepted' ? 'Accepted' : 
                               invitation.status === 'declined' ? 'Declined' : invitation.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Summary */}
                    <div className="pt-2 border-t border-brand-navy-200 dark:border-brand-navy-700">
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-blue-600 dark:text-blue-400">
                            {meetingInvitations.filter(inv => inv.status === 'pending').length}
                          </div>
                          <div className="text-brand-navy-500 dark:text-brand-navy-400">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600 dark:text-green-400">
                            {meetingInvitations.filter(inv => inv.status === 'accepted').length}
                          </div>
                          <div className="text-brand-navy-500 dark:text-brand-navy-400">Accepted</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-600 dark:text-red-400">
                            {meetingInvitations.filter(inv => inv.status === 'declined').length}
                          </div>
                          <div className="text-brand-navy-500 dark:text-brand-navy-400">Declined</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <UserPlus className="w-8 h-8 text-brand-navy-300 dark:text-brand-navy-600 mx-auto mb-2" />
                    <p className="text-sm text-brand-navy-500 dark:text-brand-navy-400">
                      No attendees invited
                    </p>
                    <p className="text-xs text-brand-navy-400 dark:text-brand-navy-500 mt-1">
                      This is a solo meeting or no invitations were sent
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking ID */}
            <div className="text-center">
              <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
                Booking ID: <span className="font-mono bg-brand-navy-100 dark:bg-brand-navy-700 px-2 py-1 rounded">{booking.id}</span>
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
            {booking.status === "pending" && onApprove && onReject && (
              <>
                <Button
                  variant="outline"
                  onClick={handleReject}
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this booking for "{booking?.title}"? 
              This action will confirm the reservation and notify the organizer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmApprove}
              disabled={processing}
              className="bg-success hover:bg-success/90"
            >
              {processing ? "Approving..." : "Approve Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this booking. This message will be sent to the organizer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-20"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmReject}
              disabled={processing || !rejectionReason.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {processing ? "Rejecting..." : "Reject Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
