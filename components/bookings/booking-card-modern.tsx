"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Building, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { cn } from "@/lib/utils"
import type { Booking, Room } from "@/types"

interface BookingCardModernProps {
  booking: Booking
  room: Room | null
  onView: (booking: Booking) => void
  onEdit?: (booking: Booking) => void
  onCancel: (bookingId: string, status: "pending" | "confirmed") => void
}

export function BookingCardModern({ booking, room, onView, onEdit, onCancel }: BookingCardModernProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          variant: "default" as const,
          icon: CheckCircle,
          className: "bg-success/10 text-success ring-1 ring-success/20",
          text: "Confirmed"
        }
      case "pending":
        return {
          variant: "secondary" as const,
          icon: AlertCircle,
          className: "bg-warning/10 text-warning ring-1 ring-warning/20",
          text: "Pending"
        }
      case "cancelled":
        return {
          variant: "destructive" as const,
          icon: XCircle,
          className: "bg-destructive/10 text-destructive ring-1 ring-destructive/20",
          text: "Cancelled"
        }
      default:
        return {
          variant: "outline" as const,
          icon: AlertCircle,
          className: "bg-muted/10 text-muted-foreground ring-1 ring-muted/20",
          text: status
        }
    }
  }

  const statusConfig = getStatusConfig(booking.status)
  const StatusIcon = statusConfig.icon

  // Calculate cancellation eligibility
  const getCancellationInfo = () => {
    const now = new Date()
    const startTime = new Date(booking.start_time)
    const hoursUntilMeeting = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (booking.status === "pending") {
      return { canCancel: true, reason: "" }
    } else if (booking.status === "confirmed") {
      const canCancel = hoursUntilMeeting >= 24
      const reason = hoursUntilMeeting < 0 
        ? "Cannot cancel booking after it has started"
        : "Cannot cancel confirmed booking less than 24 hours before start time"
      return { canCancel, reason }
    }
    
    return { canCancel: false, reason: "Booking cannot be cancelled" }
  }

  const { canCancel, reason } = getCancellationInfo()

  // Check if booking is upcoming/ongoing for progress indicator
  const now = new Date()
  const startTime = new Date(booking.start_time)
  const endTime = new Date(booking.end_time)
  const isUpcoming = startTime > now && booking.status === "confirmed"
  const isOngoing = startTime <= now && endTime > now && booking.status === "confirmed"

  return (
    <Card className={cn(
      "rounded-xl border backdrop-blur-[2px] transition-all duration-200",
      "hover:translate-y-[-1px] hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]",
      "border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800",
      "group relative overflow-hidden"
    )}>
      {/* Progress indicator for upcoming/ongoing bookings */}
      {(isUpcoming || isOngoing) && (
        <div className={cn(
          "absolute top-0 left-0 right-0 h-0.5",
          isOngoing ? "bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" : "bg-gradient-to-r from-emerald-500 to-teal-500"
        )} />
      )}
      
      <CardContent className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-brand-navy-900 dark:text-brand-navy-50 truncate">
              {booking.title}
            </h3>
          </div>
          <Badge className={cn("ml-3 flex items-center gap-1.5", statusConfig.className)}>
            <StatusIcon className="h-3 w-3" aria-hidden="true" />
            {statusConfig.text}
          </Badge>
        </div>

        {/* Meta information */}
        <div className="space-y-3 mb-4">
          {/* Room and Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-brand-navy-700 dark:text-brand-navy-300">
              <Building className="h-4 w-4 text-brand-navy-500 dark:text-brand-navy-400 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{room?.name || "Unknown Room"}</span>
            </div>
            {room?.location && (
              <div className="flex items-center gap-2 text-brand-navy-700 dark:text-brand-navy-300">
                <MapPin className="h-4 w-4 text-brand-navy-500 dark:text-brand-navy-400 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{room.location}</span>
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-brand-navy-700 dark:text-brand-navy-300">
              <Calendar className="h-4 w-4 text-brand-navy-500 dark:text-brand-navy-400 flex-shrink-0" aria-hidden="true" />
              <span>{new Date(booking.start_time).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-brand-navy-700 dark:text-brand-navy-300">
              <Clock className="h-4 w-4 text-brand-navy-500 dark:text-brand-navy-400 flex-shrink-0" aria-hidden="true" />
              <span>
                {new Date(booking.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {" - "}
                {new Date(booking.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {booking.description && (
          <p className="text-sm text-brand-navy-600 dark:text-brand-navy-400 line-clamp-2 mb-4">
            {booking.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Primary View button */}
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onView(booking)}
            className="flex-1 sm:flex-none"
          >
            <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
            View Details
          </Button>

          {/* Desktop: Show all actions */}
          <div className="hidden md:flex items-center gap-2">
            {booking.status === "pending" && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(booking)}
              >
                <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                Edit
              </Button>
            )}
            
            {(booking.status === "pending" || booking.status === "confirmed") && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onCancel(booking.id, booking.status as "pending" | "confirmed")}
                disabled={!canCancel}
                title={!canCancel ? reason : `Delete this ${booking.status} booking`}
              >
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                {canCancel ? "Delete" : "Cannot Delete"}
              </Button>
            )}
          </div>

          {/* Mobile: Dropdown menu for secondary actions */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {booking.status === "pending" && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(booking)}>
                    <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                    Edit Booking
                  </DropdownMenuItem>
                )}
                
                {(booking.status === "pending" || booking.status === "confirmed") && (
                  <DropdownMenuItem 
                    onClick={() => onCancel(booking.id, booking.status as "pending" | "confirmed")}
                    disabled={!canCancel}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    {canCancel ? "Delete Booking" : "Cannot Delete"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
