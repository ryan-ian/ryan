"use client"

import Link from "next/link"
import { Building, MapPin, Users, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResourceIcon } from "@/components/ui/resource-icon"
import { cn } from "@/lib/utils"
import type { Room, Resource } from "@/types"

export interface RoomCardProps {
  room: Room
  resourceDetails?: Resource[]
  selectable?: boolean
  selected?: boolean
  onSelect?: () => void
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
  compact?: boolean
  showBookButton?: boolean
}

export function RoomCard({
  room,
  resourceDetails,
  selectable = false,
  selected = false,
  onSelect,
  actionLabel = "Book Now",
  actionHref,
  onAction,
  className,
  compact = false,
  showBookButton = true,
}: RoomCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="default" className="bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300 border-green-500/20">Available</Badge>
      case "occupied":
        return <Badge variant="destructive" className="bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-500/20">Occupied</Badge>
      case "maintenance":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border-yellow-500/20">Maintenance</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleCardClick = () => {
    if (selectable && onSelect) {
      onSelect()
    }
  }

  return (
    <Card 
      className={cn(
        "overflow-hidden bg-card border-border/50 hover:shadow-xl transition-shadow duration-300 flex flex-col",
        selectable && "cursor-pointer",
        selected && "border-primary ring-2 ring-primary/30",
        className
      )}
      onClick={handleCardClick}
    >
      <Link href={selectable ? "#" : `/conference-room-booking/rooms/${room.id}`} className="block">
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
      </Link>
      
      <div className={cn("flex-grow flex flex-col", compact ? "p-4" : "p-6")}>
        <CardHeader className={cn("p-0", compact ? "mb-2" : "mb-4")}>
          <Link href={selectable ? "#" : `/conference-room-booking/rooms/${room.id}`}>
            <CardTitle className={cn(compact ? "text-lg" : "text-xl", "font-bold text-foreground hover:text-primary transition-colors")}>
              {room.name}
            </CardTitle>
          </Link>
          <CardDescription className="flex items-center gap-2 pt-1">
            <MapPin className="h-4 w-4" />
            {room.location}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0 flex-grow space-y-4">
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="font-medium">{room.capacity}</span>
            </div>
          </div>
          
          {resourceDetails && resourceDetails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {resourceDetails.map((resource) => (
                <Badge key={resource.id} variant="secondary" className="flex items-center gap-1">
                  <ResourceIcon type={resource.type} className="h-3 w-3" />
                  {resource.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        
        {showBookButton && (
          <div className={cn(compact ? "mt-4" : "mt-6")}>
            {actionHref ? (
              <Button asChild className="w-full">
                <Link href={actionHref}>
                  {actionLabel}
                </Link>
              </Button>
            ) : onAction ? (
              <Button onClick={onAction} className="w-full">
                {actionLabel}
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link href={`/conference-room-booking/bookings/new?roomId=${room.id}`}>
                  {actionLabel}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
} 