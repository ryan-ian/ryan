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
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Building,
  AlertCircle,
  Info,
  X,
  Trash2,
  CheckCircle,
  XCircle,
  User,
  Mail,
  UserPlus
} from "lucide-react"
import type { Booking, Room, MeetingInvitation } from "@/types"
import { MeetingInvitationModal } from "./meeting-invitation-modal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface BookingDetailsModalModernProps {
  booking: Booking | null
  room: Room | null
  isOpen: boolean
  onClose: () => void
  onCancel: (bookingId: string, status: "pending" | "confirmed") => void
}

export function BookingDetailsModalModern({
  booking,
  room,
  isOpen,
  onClose,
  onCancel,
}: BookingDetailsModalModernProps) {
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null)
  const [meetingInvitations, setMeetingInvitations] = useState<MeetingInvitation[]>([])
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false)
  const [loadingInvitations, setLoadingInvitations] = useState(false)
  
  // Update the current booking whenever the booking prop changes
  useEffect(() => {
    if (booking) {
      setCurrentBooking(booking)
      // Load meeting invitations if booking is confirmed
      if (booking.status === 'confirmed') {
        loadMeetingInvitations(booking.id)
      }
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

  const handleInvitationsSent = (newInvitations: MeetingInvitation[]) => {
    // Refresh the entire invitation list to ensure we have the latest data
    if (currentBooking) {
      loadMeetingInvitations(currentBooking.id)
    }
  }

  // Helper function to get invitation statistics
  const getInvitationStats = () => {
    const pending = meetingInvitations.filter(inv => inv.status === 'pending').length
    const accepted = meetingInvitations.filter(inv => inv.status === 'accepted').length
    const declined = meetingInvitations.filter(inv => inv.status === 'declined').length
    return { pending, accepted, declined, total: meetingInvitations.length }
  }
  
  if (!currentBooking) return null

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          icon: CheckCircle,
          className: "bg-success/10 text-success ring-1 ring-success/20",
          text: "Confirmed",
          description: "This booking has been approved by the facility manager."
        }
      case "pending":
        return {
          icon: AlertCircle,
          className: "bg-warning/10 text-warning ring-1 ring-warning/20",
          text: "Pending",
          description: "This booking is awaiting facility manager approval."
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

  const statusConfig = getStatusConfig(currentBooking.status)
  const StatusIcon = statusConfig.icon

  // Calculate cancellation eligibility
  const getCancellationInfo = () => {
    const now = new Date()
    const startTime = new Date(currentBooking.start_time)
    const hoursUntilMeeting = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (currentBooking.status === "pending") {
      return { canCancel: true, reason: "" }
    } else if (currentBooking.status === "confirmed") {
      const canCancel = hoursUntilMeeting >= 24
      const reason = hoursUntilMeeting < 0 
        ? "Cannot cancel booking after it has started"
        : "Cannot cancel confirmed booking less than 24 hours before start time"
      return { canCancel, reason }
    }
    
    return { canCancel: false, reason: "Booking cannot be cancelled" }
  }

  const { canCancel, reason } = getCancellationInfo()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose()
    }}>
      <DialogContent className={cn(
        "sm:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto",
        "rounded-xl border backdrop-blur-md",
        "border-brand-navy-200 dark:border-brand-navy-700",
        "bg-white/95 dark:bg-brand-navy-800/95"
      )}>
        <DialogHeader className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-semibold text-brand-navy-900 dark:text-brand-navy-50">
                {currentBooking.title || "Meeting"}
              </DialogTitle>
              <Badge className={cn("flex items-center gap-1.5", statusConfig.className)}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig.text}
              </Badge>
            </div>
            <DialogDescription className="text-brand-navy-600 dark:text-brand-navy-400">
              Booking details and information
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Status Alert */}
          {statusConfig.description && (
            <Alert className={cn(
              "border-brand-navy-200 dark:border-brand-navy-700",
              currentBooking.status === "confirmed" && "border-success/50 bg-success/5",
              currentBooking.status === "pending" && "border-warning/50 bg-warning/5",
              currentBooking.status === "cancelled" && "border-destructive/50 bg-destructive/5"
            )}>
              <StatusIcon className="h-4 w-4" />
              <AlertDescription className="text-brand-navy-700 dark:text-brand-navy-300">
                {statusConfig.description}
              </AlertDescription>
            </Alert>
          )}

          {/* Rejection Reason - Prominently displayed for cancelled bookings */}
          {currentBooking.status === "cancelled" && currentBooking.rejection_reason && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <AlertTitle className="text-red-800 dark:text-red-200 font-semibold">
                Booking Rejected
              </AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-300 mt-2">
                <div className="font-medium">Reason for rejection:</div>
                <div className="mt-1 p-3 bg-red-100 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800">
                  "{currentBooking.rejection_reason}"
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
                    {room?.name || "Unknown Room"}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-brand-navy-600 dark:text-brand-navy-400 mt-1">
                    {room?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{room.location}</span>
                      </div>
                    )}
                    {room?.capacity && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>Up to {room.capacity} people</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details */}
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
                    {new Date(currentBooking.start_time).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-brand-navy-600 dark:text-brand-navy-400">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(currentBooking.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {new Date(currentBooking.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                    {currentBooking.users?.name || "Unknown User"}
                  </p>
                  <p className="text-sm text-brand-navy-600 dark:text-brand-navy-400">
                    {currentBooking.users?.email || "No email available"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {currentBooking.description && (
            <Card className="border-brand-navy-200 dark:border-brand-navy-700">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-brand-navy-500 dark:text-brand-navy-400" />
                  <span className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Description</span>
                </div>
                <p className="text-brand-navy-900 dark:text-brand-navy-50 leading-relaxed">
                  {currentBooking.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Meeting Invitations - Only show for confirmed bookings */}
          {currentBooking.status === 'confirmed' && new Date(currentBooking.end_time) > new Date() && (
            <Card className="border-brand-navy-200 dark:border-brand-navy-700">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-brand-navy-500 dark:text-brand-navy-400" />
                    <span className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">
                      Meeting Invitations
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsInvitationModalOpen(true)}
                    className="text-brand-teal-600 border-brand-teal-200 hover:bg-brand-teal-50"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Invite Members
                  </Button>
                </div>

                {loadingInvitations ? (
                  <div className="flex items-center gap-2 text-sm text-brand-navy-500 dark:text-brand-navy-400">
                    <div className="w-4 h-4 border-2 border-brand-teal-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading invitations...
                  </div>
                ) : meetingInvitations.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-brand-navy-600 dark:text-brand-navy-300">
                        Meeting Attendees ({meetingInvitations.length})
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
                          <div className="font-medium text-blue-600 dark:text-blue-400">{getInvitationStats().pending}</div>
                          <div className="text-brand-navy-500 dark:text-brand-navy-400">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600 dark:text-green-400">{getInvitationStats().accepted}</div>
                          <div className="text-brand-navy-500 dark:text-brand-navy-400">Accepted</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-600 dark:text-red-400">{getInvitationStats().declined}</div>
                          <div className="text-brand-navy-500 dark:text-brand-navy-400">Declined</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <UserPlus className="w-8 h-8 text-brand-navy-300 dark:text-brand-navy-600 mx-auto mb-2" />
                    <p className="text-sm text-brand-navy-500 dark:text-brand-navy-400">
                      No invitations sent yet
                    </p>
                    <p className="text-xs text-brand-navy-400 dark:text-brand-navy-500 mt-1">
                      Click "Invite Members" to add attendees
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Booking ID */}
          <div className="text-center">
            <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
              Booking ID: <span className="font-mono bg-brand-navy-100 dark:bg-brand-navy-700 px-2 py-1 rounded">{currentBooking.id}</span>
            </p>
          </div>
        </div>

        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          {(currentBooking.status === "pending" || currentBooking.status === "confirmed") && (
            <Button
              variant="destructive"
              onClick={() => onCancel(currentBooking.id, currentBooking.status as "pending" | "confirmed")}
              disabled={!canCancel}
              title={!canCancel ? reason : `Delete this ${currentBooking.status} booking`}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {canCancel ? "Delete Booking" : "Cannot Delete"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Meeting Invitation Modal */}
      <MeetingInvitationModal
        booking={currentBooking}
        room={room}
        isOpen={isInvitationModalOpen}
        onClose={() => setIsInvitationModalOpen(false)}
        onInvitationsSent={handleInvitationsSent}
      />
    </Dialog>
  )
}
