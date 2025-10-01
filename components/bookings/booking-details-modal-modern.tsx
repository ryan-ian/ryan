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
import type { Booking, BookingWithDetails, Room, MeetingInvitation } from "@/types"
import { MeetingInvitationModal } from "./meeting-invitation-modal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface BookingDetailsModalModernProps {
  booking: BookingWithDetails | null
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
  const [currentBooking, setCurrentBooking] = useState<BookingWithDetails | null>(null)
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
        "sm:max-w-xl max-w-[95vw] max-h-[85vh]",
        "rounded-lg border-0 shadow-xl",
        "bg-white dark:bg-gray-800",
        "p-0 overflow-hidden"
      )}>
        <DialogHeader className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Booking Details
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {statusConfig.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="px-4 pb-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Venue & Schedule */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">Venue & Schedule</h3>
                
                {/* Venue */}
                <div className="flex items-center gap-2 mb-3">
                  <Building className="h-3 w-3 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {room?.name || "Unknown Room"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {room?.capacity} people capacity
                    </p>
                  </div>
                </div>
                
                {/* Schedule */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {new Date(currentBooking.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(currentBooking.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {new Date(currentBooking.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Organizer */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">Organizer</h3>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {currentBooking.users?.name ? currentBooking.users.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {currentBooking.users?.name || "Unknown User"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {currentBooking.users?.email || "No email available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Attendees */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    Attendees ({meetingInvitations.length + 1})
                  </h3>
                  {currentBooking.status === 'confirmed' && new Date(currentBooking.end_time) > new Date() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsInvitationModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 text-xs px-2 py-1 h-6"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Invite
                    </Button>
                  )}
                </div>

                {loadingInvitations ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading attendees...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                    {/* Organizer as attendee */}
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600 rounded-lg">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {currentBooking.users?.name ? currentBooking.users.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-xs truncate">
                          {currentBooking.users?.name || "Unknown User"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {currentBooking.users?.email || "No email available"}
                        </p>
                      </div>
                    </div>

                    {/* Meeting Invitations */}
                    {meetingInvitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600 rounded-lg">
                        <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {invitation.invitee_name ? invitation.invitee_name.charAt(0).toUpperCase() : invitation.invitee_email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-xs truncate">
                            {invitation.invitee_name || invitation.invitee_email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {invitation.invitee_email}
                          </p>
                        </div>
                      </div>
                    ))}

                    {meetingInvitations.length === 0 && (
                      <div className="text-center py-3">
                        <UserPlus className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">
                          No additional attendees yet
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {currentBooking.description && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mt-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">Description</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {currentBooking.description}
              </p>
            </div>
          )}

          {/* Rejection Reason */}
          {currentBooking.status === "cancelled" && currentBooking.rejection_reason && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-3 w-3 text-red-600" />
                <h3 className="font-semibold text-red-800 dark:text-red-200 text-sm">Booking Rejected</h3>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300">
                <span className="font-medium">Reason:</span> {currentBooking.rejection_reason}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          {(currentBooking.status === "pending" || currentBooking.status === "confirmed") && (
            <Button
              variant="destructive"
              onClick={() => onCancel(currentBooking.id, currentBooking.status as "pending" | "confirmed")}
              disabled={!canCancel}
              title={!canCancel ? reason : `Delete this ${currentBooking.status} booking`}
              className="w-full sm:w-auto text-xs h-8"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {canCancel ? "Delete Booking" : "Cannot Delete"}
            </Button>
          )}
        </div>
      </DialogContent>

      {/* Meeting Invitation Modal */}
      <MeetingInvitationModal
        booking={currentBooking}
        room={room}
        organizer={{
          id: currentBooking.user_id,
          name: currentBooking.users?.name || "Unknown User",
          email: currentBooking.users?.email || "No email available"
        }}
        isOpen={isInvitationModalOpen}
        onClose={() => setIsInvitationModalOpen(false)}
        onInvitationsSent={handleInvitationsSent}
      />
    </Dialog>
  )
}
