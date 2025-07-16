"use client"

import Link from "next/link"
import { Calendar, Clock, MapPin, Building, CheckCircle, AlertCircle, XCircle, Eye, Edit, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Booking, Room } from "@/types"

export interface BookingCardProps {
  booking: Booking
  room?: Room | null
  onView?: () => void
  onEdit?: () => void
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
  onEdit,
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
        return "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border-yellow-500/20"
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-500/20"
      default:
        return ""
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-3.5 w-3.5" />
      case "pending":
        return <AlertCircle className="h-3.5 w-3.5" />
      case "cancelled":
        return <XCircle className="h-3.5 w-3.5" />
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
          "block p-4 rounded-lg hover:bg-muted/50 transition-colors border border-border/50",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">{room?.name || `Room ${booking.room_id}`}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(booking.start_time)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>
                  {formatTime(booking.start_time)} - 
                  {formatTime(booking.end_time)}
                </span>
              </div>
            </div>
          </div>
          <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className={cn("capitalize", getStatusColor(booking.status))}>
            {booking.status}
          </Badge>
        </div>
      </Link>
    )
  }

  if (variant === "dashboard") {
    return (
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardContent className={cn(compact ? "p-4" : "p-6")}>
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{booking.title || "Meeting"}</h3>
              <Badge className={cn("capitalize", getStatusColor(booking.status))} variant="secondary">
                <span className="flex items-center gap-1">
                  {getStatusIcon(booking.status)}
                  {booking.status}
                </span>
              </Badge>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(booking.start_time)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {formatTime(booking.start_time)} - 
                  {formatTime(booking.end_time)}
                </span>
              </div>
              {showRoom && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{room?.name || `Room ${booking.room_id}`}</span>
                </div>
              )}
            </div>
            
            {showActions && (
              <div className="flex items-center gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
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
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className={cn(compact ? "p-4" : "p-6")}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">{booking.title || "Meeting"}</h3>
              <Badge className={cn("capitalize", getStatusColor(booking.status))} variant="secondary">
                <span className="flex items-center gap-1">
                  {getStatusIcon(booking.status)}
                  {booking.status}
                </span>
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {showRoom && (
                <>
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span>{room?.name || `Room ${booking.room_id}`}</span>
                  </div>
                  {room?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{room.location}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(booking.start_time)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
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
              
              {booking.status === "pending" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onEdit}
                  asChild={!onEdit}
                >
                  {onEdit ? (
                    <>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </>
                  ) : (
                    <Link href={`/conference-room-booking/bookings/${booking.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  )}
                </Button>
              )}
              
              {(booking.status === "pending" || booking.status === "confirmed") && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onCancel}
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