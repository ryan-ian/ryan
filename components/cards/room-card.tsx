"use client"

import { useState } from "react"
import NextLink from "next/link"
import { Building, MapPin, Users, Check, Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResourceIcon } from "@/components/ui/resource-icon"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, slugify } from "@/lib/utils"
import { BookingCreationModal } from "@/app/conference-room-booking/bookings/booking-creation-modal"
import type { Room, Resource } from "@/types"

export interface RoomCardProps {
  room: Room
  href?: string // Add href for navigation
  resourceDetails?: Resource[]
  selectable?: boolean
  selected?: boolean
  onSelect?: () => void
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
  compact?: boolean
  showBookButton?: boolean
  onBookRoom?: (roomId: string, data: any) => Promise<void>
  children?: React.ReactNode
  facilities?: { id: string; name: string }[]
  isAdminView?: boolean // Flag to determine if this is an admin view
}

export function RoomCard({
  room,
  href,
  resourceDetails,
  selectable = false,
  selected = false,
  onSelect,
  actionLabel = "Book Now",
  actionHref,
  onAction,
  onEdit,
  onDelete,
  className,
  compact = false,
  showBookButton = true,
  onBookRoom,
  children,
  facilities,
  isAdminView = false,
}: RoomCardProps) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  // Generate the appropriate href based on whether it's an admin view or user view
  const generateHref = () => {
    if (href) {
      // If href is explicitly provided, use it
      return href;
    } 
    
    if (isAdminView) {
      // Admin view - use the original URL structure
      return `/admin/conference/rooms/${room.id}`;
    } 
    
    // User view - use the new URL structure with slug and query parameter
    const slug = slugify(room.name);
    return `/conference-room-booking/${slug}?id=${room.id}`;
  };

  const cardHref = generateHref();

  const handleActionClick = (e: React.MouseEvent, action?: () => void) => {
    e.stopPropagation() // Prevent card click from firing
    action?.()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="default" className="bg-success text-success-foreground font-semibold">Available</Badge>
      case "occupied":
        return <Badge variant="destructive" className="bg-destructive text-destructive-foreground font-semibold">Occupied</Badge>
      case "maintenance":
        return <Badge variant="secondary" className="bg-warning text-warning-foreground font-semibold">Maintenance</Badge>
      default:
        return <Badge variant="outline" className="font-semibold">{status}</Badge>
    }
  }

  const handleCardClick = () => {
    if (selectable && onSelect) {
      onSelect()
    }
  }

  const handleBookNow = (e: React.MouseEvent) => {
    if (onBookRoom && room.status === "available") {
      e.preventDefault()
      e.stopPropagation()
      setIsBookingModalOpen(true)
    }
  }

  // Check if room is bookable
  const isBookable = room.status === "available"

  const handleBookingSubmit = async (data: any) => {
    if (onBookRoom) {
      await onBookRoom(room.id, data)
    }
  }

  // Look up facility name using facility_id from facilities prop
  let facilityName = "Unknown facility"
  let facilityDetails = null
  
  // First check if room has direct facility_name
  if (room.facility_name) {
    facilityName = room.facility_name;
    facilityDetails = { 
      id: room.facility_id, 
      name: room.facility_name, 
      location: room.facility?.location || 'Unknown Location'
    };
  }
  // Then check if room has a facility object with a name
  else if (room.facility && room.facility.name) {
    facilityName = room.facility.name
    facilityDetails = room.facility
  } 
  // Otherwise, try to look it up from facilities prop
  else if (facilities && room.facility_id) {
    const found = facilities.find(f => f.id === room.facility_id)
    if (found) {
      facilityName = found.name
      facilityDetails = found
    }
  }

  const CardContentWrapper = ({ children }: { children: React.ReactNode }) => {
    const cardProps = {
      className: cn(
        "overflow-hidden bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700 hover:shadow-xl transition-all duration-300 flex flex-col group",
        selectable && "cursor-pointer",
        selected && "border-brand-teal-500 ring-2 ring-brand-teal-500/30",
        !isBookable && "opacity-80",
        className
      ),
      onClick: selectable ? onSelect : undefined,
    }

    if (cardHref) {
      return (
        <NextLink href={cardHref} className="no-underline">
          <Card {...cardProps}>{children}</Card>
        </NextLink>
      )
    }
    return <Card {...cardProps}>{children}</Card>
  }
  
  return (
    <>
      <CardContentWrapper>
        <div className="relative">
          <div className={cn("relative w-full", compact ? "h-32" : "h-48")}>
            {room.image ? (
              <img 
                src={room.image} 
                alt={room.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Building className={cn(compact ? "w-8 h-8" : "w-12 h-12", "text-muted-foreground")} />
              </div>
            )}
            <div className="absolute top-3 right-3">
              {getStatusBadge(room.status)}
            </div>
            {selected && (
              <div className="absolute top-3 left-3 bg-primary text-primary-foreground rounded-full p-1.5">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>

          {(onEdit || onDelete) && (
            <div className="absolute top-2 left-2 flex gap-1">
              {onEdit && (
                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={(e) => handleActionClick(e, onEdit)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={(e) => handleActionClick(e, onDelete)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className={cn("flex-grow flex flex-col", compact ? "p-4" : "p-6")}>
          <CardHeader className={cn("p-0", compact ? "mb-2" : "mb-4")}>
            <CardTitle className={cn(compact ? "text-lg" : "text-xl", "font-bold text-brand-navy-900 dark:text-brand-navy-50 group-hover:text-brand-teal-600 dark:group-hover:text-brand-teal-400 transition-colors")}>
              {room.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 pt-1 text-brand-navy-700 dark:text-brand-navy-300">
              {room.location && (
                <>
                  <MapPin className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                  {room.location}
                  <span className="mx-1">·</span>
                </>
              )}
              <Building className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
              <span className={facilityName === "Unknown facility" ? "text-brand-navy-500 dark:text-brand-navy-500 italic" : ""}>
                {facilityName}
              </span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0 flex-grow space-y-4">
            <div className="flex items-center gap-4 text-brand-navy-700 dark:text-brand-navy-300">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-navy-600 dark:text-brand-navy-400" />
                <span className="font-medium">{room.capacity}</span>
              </div>
            </div>
            
            {resourceDetails && resourceDetails.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {resourceDetails.map((resource) => (
                  <Badge 
                    key={resource.id} 
                    variant="secondary" 
                    className="flex items-center gap-1 bg-brand-teal-100 text-brand-teal-800 dark:bg-brand-teal-900/30 dark:text-brand-teal-300 border-brand-teal-200 dark:border-brand-teal-800"
                  >
                    <ResourceIcon type={resource.type} name={resource.name} />
                    {resource.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
          
          {children ? (
            <CardFooter className="p-0 pt-4">{children}</CardFooter>
          ) : showBookButton && (
            <div className={cn(compact ? "mt-4" : "mt-6")}> 
              {isAdminView ? (
                // Admin/manager: preserve existing behavior
                actionHref && !onBookRoom ? (
                  <Button asChild className="w-full" disabled={!isBookable}>
                    <NextLink href={actionHref}>
                      {actionLabel}
                    </NextLink>
                  </Button>
                ) : onAction ? (
                  <Button onClick={(e) => handleActionClick(e, onAction)} className="w-full" disabled={!isBookable}>
                    {actionLabel}
                  </Button>
                ) : onBookRoom ? (
                  <Button onClick={(e) => handleActionClick(e, () => setIsBookingModalOpen(true))} className="w-full" disabled={!isBookable}>
                    {isBookable ? actionLabel : room.status === "maintenance" ? "Under Maintenance" : "Currently Occupied"}
                  </Button>
                ) : (
                  <Button asChild className="w-full" disabled={!isBookable}>
                    <NextLink href={cardHref || `/conference-room-booking/bookings/new?roomId=${room.id}`}>
                      {isBookable ? actionLabel : room.status === "maintenance" ? "Under Maintenance" : "Currently Occupied"}
                    </NextLink>
                  </Button>
                )
              ) : (
                // User: Book Now only opens modal, never navigates
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsBookingModalOpen(true);
                  }} 
                  className={cn(
                    "w-full",
                    isBookable 
                      ? "bg-brand-teal-500 hover:bg-brand-teal-600 text-white" 
                      : room.status === "maintenance"
                        ? "bg-warning text-warning-foreground hover:bg-warning/90"
                        : "bg-destructive/80 text-destructive-foreground hover:bg-destructive/70"
                  )}
                  disabled={!isBookable}
                >
                  {isBookable ? actionLabel : room.status === "maintenance" ? "Under Maintenance" : "Currently Occupied"}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContentWrapper>

      {onBookRoom && (
        <BookingCreationModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          room={room}
          onSubmit={handleBookingSubmit}
        />
      )}
    </>
  )
}

export function RoomCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-6">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full mt-6" />
      </div>
    </Card>
  )
} 