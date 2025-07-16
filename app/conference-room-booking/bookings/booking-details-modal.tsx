import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, Building } from "lucide-react";
import type { Booking, Room } from "@/types";

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
  if (!booking) return null;

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
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{booking.title || "Meeting"}</span>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Booking details for {formatDate(booking.start_time)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Info */}
          <div className="bg-muted p-4 rounded-md">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Room Details
            </h4>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Room:</span> {room?.name || `Room ${booking.room_id}`}
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
              <span className="font-medium">Date:</span> {formatDate(booking.start_time)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Time:</span> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Duration:</span> {getDuration()}
            </div>
          </div>

          {/* Attendees */}
          {booking.attendees && booking.attendees.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Attendees:</span>
              </div>
              <div className="pl-6">
                <ul className="list-disc pl-4 space-y-1">
                  {booking.attendees.map((attendee, index) => (
                    <li key={index} className="text-sm">
                      {attendee}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Description */}
          {booking.description && (
            <div className="space-y-2">
              <h4 className="font-medium">Description:</h4>
              <p className="text-sm">{booking.description}</p>
            </div>
          )}

          {/* Resources */}
          {booking.resources && booking.resources.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Resources:</h4>
              <div className="flex flex-wrap gap-2">
                {booking.resources.map((resource, index) => (
                  <Badge key={index} variant="outline">
                    {resource}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Created/Updated Info */}
          <div className="border-t pt-4 text-xs text-muted-foreground">
            <p>Created: {new Date(booking.created_at).toLocaleString()}</p>
            <p>Last updated: {new Date(booking.updated_at).toLocaleString()}</p>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {booking.status !== "cancelled" && (
            <Button 
              variant="destructive" 
              onClick={() => onCancel(booking.id)}
            >
              Cancel Booking
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 