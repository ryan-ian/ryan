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
  onCancel: (bookingId: string) => void;
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
        <Alert className="mt-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-600 dark:text-amber-400">Pending Approval</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            This booking is waiting for administrator approval. You will be notified when it's approved or rejected.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  const renderBookingInfo = () => {
    return (
      <Alert className="mt-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-600 dark:text-blue-400">Booking Restrictions</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>You can only book one room per day</li>
            <li>Bookings must be made at least 24 hours in advance</li>
            <li>All bookings require administrator approval</li>
            <li>You can cancel pending bookings anytime</li>
          </ul>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span>{currentBooking.title || "Meeting"}</span>
              <Badge className={getStatusColor(currentBooking.status)}>
                {currentBooking.status}
              </Badge>
            </DialogTitle>
            {/* <DialogClose className="h-6 w-6 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose> */}
          </div>
          <DialogDescription>
            Booking details for {formatDate(currentBooking.start_time)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[60vh] overflow-auto pr-2">
          {/* Room Info */}
          <div className="bg-muted p-4 rounded-md">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Room Details
            </h4>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Room:</span> {room?.name || `Room ${currentBooking.room_id}`}
              </p>
              {room && (
                <>
                  <p className="text-sm">
                    <span className="font-medium">Location:</span> {room.location}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Capacity:</span> {room.capacity} people
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Time Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Date:</span> {formatDate(currentBooking.start_time)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Time:</span> {formatTime(currentBooking.start_time)} - {formatTime(currentBooking.end_time)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Duration:</span> {getDuration()}
            </div>
          </div>

          {/* Attendees */}
          {currentBooking.attendees && currentBooking.attendees.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Attendees:</span>
              </div>
              <div className="pl-6">
                <ul className="list-disc pl-4 space-y-1">
                  {currentBooking.attendees.map((attendee, index) => (
                    <li key={index} className="text-sm">
                      {attendee}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Description */}
          {currentBooking.description && (
            <div className="space-y-2">
              <h4 className="font-medium">Description:</h4>
              <p className="text-sm">{currentBooking.description}</p>
            </div>
          )}

          {/* Resources */}
          {currentBooking.resources && currentBooking.resources.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Resources:</h4>
              <div className="flex flex-wrap gap-2">
                {currentBooking.resources.map((resource, index) => (
                  <Badge key={index} variant="outline">
                    {resource}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Created/Updated Info */}
          <div className="border-t pt-4 text-xs text-muted-foreground">
            <p>Created: {new Date(currentBooking.created_at).toLocaleString()}</p>
            <p>Last updated: {new Date(currentBooking.updated_at).toLocaleString()}</p>
          </div>

          {renderBookingRestrictions()}
          {renderBookingInfo()}
        </div>

        <DialogFooter className="flex sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {currentBooking.status !== "cancelled" && (
            <Button 
              variant="destructive" 
              onClick={() => onCancel(currentBooking.id)}
            >
              Cancel Booking
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 