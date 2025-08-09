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
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  User
} from "lucide-react"
import type { Booking, Room } from "@/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  
  // Update the current booking whenever the booking prop changes
  useEffect(() => {
    if (booking) {
      setCurrentBooking(booking)
    }
  }, [booking])
  
  if (!currentBooking) return null

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          icon: CheckCircle,
          className: "bg-success/10 text-success ring-1 ring-success/20",
          text: "Confirmed",
          description: "This booking has been approved by an administrator."
        }
      case "pending":
        return {
          icon: AlertCircle,
          className: "bg-warning/10 text-warning ring-1 ring-warning/20",
          text: "Pending",
          description: "This booking is awaiting administrator approval."
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
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-brand-navy-500 hover:text-brand-navy-700 dark:text-brand-navy-400 dark:hover:text-brand-navy-200"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
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

          {/* Booking ID */}
          <div className="text-center">
            <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
              Booking ID: <span className="font-mono bg-brand-navy-100 dark:bg-brand-navy-700 px-2 py-1 rounded">{currentBooking.id}</span>
            </p>
          </div>
        </div>

        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-brand-navy-200 dark:border-brand-navy-700"
          >
            Close
          </Button>
          
          {currentBooking.status === "pending" && (
            <Button variant="outline" asChild>
              <Link href={`/conference-room-booking/bookings/${currentBooking.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Booking
              </Link>
            </Button>
          )}
          
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
    </Dialog>
  )
}
