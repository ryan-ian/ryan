"use client"

import Link from "next/link"
import { Calendar, Clock, MapPin, Building, CheckCircle, AlertCircle, XCircle, Eye, Trash2, UserPlus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Booking, Room } from "@/types"

export interface BookingCardProps {
  booking: Booking
  room?: Room | null
  onView?: () => void
  onInvite?: () => void
  onCancel?: () => void
  className?: string
  compact?: boolean
  showActions?: boolean
  showRoom?: boolean
  variant?: "default" | "minimal" | "dashboard"
}

export function BookingCard({
  booking,
  room,
  onView,
  onInvite,
  onCancel,
  className,
  compact = false,
  showActions = true,
  showRoom = true,
  variant = "default",
}: BookingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-success/10 text-success-foreground border-success/20"
      case "pending":
        return "bg-warning/10 text-warning-foreground border-warning/20"
      case "cancelled":
        return "bg-destructive/10 text-destructive-foreground border-destructive/20"
      default:
        return ""
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-3.5 w-3.5 text-success" />
      case "pending":
        return <AlertCircle className="h-3.5 w-3.5 text-warning" />
      case "cancelled":
        return <XCircle className="h-3.5 w-3.5 text-destructive" />
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (variant === "minimal") {
    return (
      <Link 
        href={`/conference-room-booking/bookings/${booking.id}`}
        className={cn(
          "block p-4 rounded-lg hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800/50 transition-colors border border-brand-navy-200 dark:border-brand-navy-700",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
              <span className="font-semibold text-brand-navy-900 dark:text-brand-navy-50">{room?.name || `Room ${booking.room_id}`}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-brand-navy-700 dark:text-brand-navy-300">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                <span>{formatDate(booking.start_time)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                <span>
                  {formatTime(booking.start_time)} - 
                  {formatTime(booking.end_time)}
                </span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className={cn("capitalize", getStatusColor(booking.status))}>
            <span className="flex items-center gap-1">
              {getStatusIcon(booking.status)}
              {booking.status}
            </span>
          </Badge>
        </div>
      </Link>
    )
  }

  if (variant === "dashboard") {
    return (
      <Card className={cn("hover:shadow-md transition-shadow border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800", className)}>
        <CardContent className={cn(compact ? "p-4" : "p-6")}>
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-brand-navy-900 dark:text-brand-navy-50">{booking.title || "Meeting"}</h3>
              <Badge className={cn("capitalize", getStatusColor(booking.status))} variant="secondary">
                <span className="flex items-center gap-1">
                  {getStatusIcon(booking.status)}
                  {booking.status}
                </span>
              </Badge>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm text-brand-navy-700 dark:text-brand-navy-300">
                <Calendar className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                <span>{formatDate(booking.start_time)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-brand-navy-700 dark:text-brand-navy-300">
                <Clock className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                <span>
                  {formatTime(booking.start_time)} - 
                  {formatTime(booking.end_time)}
                </span>
              </div>
              {showRoom && (
                <div className="flex items-center gap-1.5 text-sm text-brand-navy-700 dark:text-brand-navy-300">
                  <Building className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                  <span>{room?.name || `Room ${booking.room_id}`}</span>
                </div>
              )}
            </div>
            
            {showActions && (
              <div className="flex items-center gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700"
                  onClick={onView}
                  asChild={!onView}
                >
                  {onView ? (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </>
                  ) : (
                    <Link href={`/conference-room-booking/bookings/${booking.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={cn("hover:shadow-md transition-shadow border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800", className)}>
      <CardContent className={cn(compact ? "p-4" : "p-6")}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-brand-navy-900 dark:text-brand-navy-50">{booking.title || "Meeting"}</h3>
              <Badge className={cn("capitalize", getStatusColor(booking.status))} variant="secondary">
                <span className="flex items-center gap-1">
                  {getStatusIcon(booking.status)}
                  {booking.status}
                </span>
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-brand-navy-700 dark:text-brand-navy-300">
              {showRoom && (
                <>
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                    <span>{room?.name || `Room ${booking.room_id}`}</span>
                  </div>
                  {room?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                      <span>{room.location}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-brand-navy-700 dark:text-brand-navy-300">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                <span>{formatDate(booking.start_time)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                <span>
                  {formatTime(booking.start_time)} - 
                  {formatTime(booking.end_time)}
                </span>
              </div>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-2 ml-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onView}
                asChild={!onView}
                className="border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700"
              >
                {onView ? (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </>
                ) : (
                  <Link href={`/conference-room-booking/bookings/${booking.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                )}
              </Button>
              
              {booking.status === "confirmed" && onInvite && new Date(booking.end_time) > new Date() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onInvite}
                  className="border-brand-teal-200 dark:border-brand-teal-700 text-brand-teal-600 dark:text-brand-teal-400 hover:bg-brand-teal-50 dark:hover:bg-brand-teal-900/20"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Invite
                </Button>
              )}
              
              {(booking.status === "pending" || booking.status === "confirmed") && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onCancel}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 