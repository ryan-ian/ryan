import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, Building, AlertCircle, Info, X } from "lucide-react";
import type { Booking, Room } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BookingDetailsModalProps {
  booking: Booking | null;
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onCancel: (bookingId: string, status: "pending" | "confirmed") => void;
}

export function BookingDetailsModal({
  booking,
  room,
  isOpen,
  onClose,
  onCancel,
}: BookingDetailsModalProps) {
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  
  // Update the current booking whenever the booking prop changes
  useEffect(() => {
    if (booking) {
      setCurrentBooking(booking);
    }
  }, [booking]);
  
  if (!currentBooking) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getDuration = () => {
    const start = new Date(currentBooking.start_time);
    const end = new Date(currentBooking.end_time);
    const diffMs = end.getTime() - start.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs === 0) {
      return `${diffMins} minutes`;
    } else if (diffMins === 0) {
      return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''}`;
    } else {
      return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ${diffMins} minutes`;
    }
  };

  const renderBookingRestrictions = () => {
    if (!booking) return null;
    
    // Check if the booking is pending and show approval info
    if (booking.status === "pending") {
      return (
        <Alert className="mt-3 sm:mt-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">Pending Approval</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
            This booking is waiting for administrator approval. You will be notified when it's approved or rejected.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  const renderBookingInfo = () => {
    return (
      <Alert className="mt-3 sm:mt-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Booking Rules</AlertTitle>
        <AlertDescription className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
          <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 mt-1 sm:mt-2">
            <li>You can only book one room per day</li>
            <li>Bookings must be made at least 24 hours in advance</li>
            <li>All bookings require administrator approval</li>
            <li><strong>Pending bookings</strong> can be deleted at any time</li>
            <li><strong>Confirmed bookings</strong> can only be deleted up to 24 hours before the meeting time</li>
          </ul>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl max-h-[80vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-3 sm:pb-4 border-b">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="flex items-center gap-2 flex-wrap text-base sm:text-lg">
                <span className="truncate">{currentBooking.title || "Meeting"}</span>
                <Badge className={getStatusColor(currentBooking.status)}>
                  {currentBooking.status}
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1 sm:mt-2 text-xs sm:text-sm">
                Booking details for {formatDate(currentBooking.start_time)}
              </DialogDescription>
            </div>
            <DialogClose className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer flex items-center justify-center border">
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 py-3 sm:py-4 pr-1 sm:pr-2 min-h-0 scrollbar-thin">
          {/* Room Info */}
          <div className="bg-muted p-3 sm:p-4 rounded-md">
            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
              <Building className="h-3 w-3 sm:h-4 sm:w-4" />
              Room Details
            </h4>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-xs sm:text-sm">
                <span className="font-medium">Room:</span> {room?.name || `Room ${currentBooking.room_id}`}
              </p>
              {room && (
                <>
                  <p className="text-xs sm:text-sm">
                    <span className="font-medium">Location:</span> {room.location}
                  </p>
                  <p className="text-xs sm:text-sm">
                    <span className="font-medium">Capacity:</span> {room.capacity} people
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Time Info */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="font-medium text-xs sm:text-sm">Date:</span> 
              <span className="text-xs sm:text-sm">{formatDate(currentBooking.start_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="font-medium text-xs sm:text-sm">Time:</span> 
              <span className="text-xs sm:text-sm">{formatTime(currentBooking.start_time)} - {formatTime(currentBooking.end_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="font-medium text-xs sm:text-sm">Duration:</span> 
              <span className="text-xs sm:text-sm">{getDuration()}</span>
            </div>
          </div>

          {/* Attendees */}
          {currentBooking.attendees && currentBooking.attendees.length > 0 && (
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <span className="font-medium text-xs sm:text-sm">Attendees:</span>
              </div>
              <div className="pl-5 sm:pl-6">
                <ul className="list-disc pl-3 sm:pl-4 space-y-0.5 sm:space-y-1">
                  {currentBooking.attendees.map((attendee, index) => (
                    <li key={index} className="text-xs sm:text-sm">
                      {attendee}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Description */}
          {currentBooking.description && (
            <div className="space-y-1 sm:space-y-2">
              <h4 className="font-medium text-xs sm:text-sm">Description:</h4>
              <p className="text-xs sm:text-sm">{currentBooking.description}</p>
            </div>
          )}

          {/* Resources */}
          {currentBooking.resources && currentBooking.resources.length > 0 && (
            <div className="space-y-1 sm:space-y-2">
              <h4 className="font-medium text-xs sm:text-sm">Resources:</h4>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {currentBooking.resources.map((resource, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {resource}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Created/Updated Info */}
          <div className="border-t pt-3 sm:pt-4 text-xs text-muted-foreground">
            <p className="text-[10px] sm:text-xs">Created: {new Date(currentBooking.created_at).toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs">Last updated: {new Date(currentBooking.updated_at).toLocaleString()}</p>
          </div>

          {renderBookingRestrictions()}
          {renderBookingInfo()}
        </div>

        <DialogFooter className="flex-shrink-0 flex flex-col sm:flex-row gap-2 sm:justify-between pt-3 sm:pt-4 border-t mt-3 sm:mt-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="order-2 sm:order-1 text-xs sm:text-sm h-8 sm:h-9"
          >
            Close
          </Button>
          {(currentBooking.status === "pending" || currentBooking.status === "confirmed") && (
            (() => {
              const now = new Date()
              const startTime = new Date(currentBooking.start_time)
              const hoursUntilMeeting = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
              
              let canCancel = false
              let disabledReason = ""
              
              if (currentBooking.status === "pending") {
                // Pending bookings can always be cancelled
                canCancel = true
              } else if (currentBooking.status === "confirmed") {
                // Confirmed bookings can be cancelled up to 24 hours before
                canCancel = hoursUntilMeeting >= 24
                disabledReason = hoursUntilMeeting < 0 
                  ? "Cannot delete booking after it has started"
                  : "Cannot delete confirmed booking less than 24 hours before start time"
              }
              
              return (
                <Button 
                  variant="destructive" 
                  onClick={() => onCancel(currentBooking.id, currentBooking.status as "pending" | "confirmed")}
                  className="order-1 sm:order-2 text-xs sm:text-sm h-8 sm:h-9"
                  disabled={!canCancel}
                  title={!canCancel ? disabledReason : `Delete this ${currentBooking.status} booking`}
                >
                  {canCancel ? "Delete Booking" : "Cannot Delete"}
                </Button>
              )
            })()
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 