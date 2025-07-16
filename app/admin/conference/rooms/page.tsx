"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertCircle, ArrowUpDown, Building, Plus, Edit, Trash2, Filter, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Room, Resource } from "@/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { ResourceIcon } from "@/components/ui/resource-icon"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const { toast } = useToast()

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms")
      const data = await response.json()
      setRooms(data)
      setFilteredRooms(data)
    } catch (error) {
      console.error("Failed to fetch rooms:", error)
      toast({
        title: "Error",
        description: "Failed to fetch rooms. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch("/api/resources", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const resourcesData = await response.json()
        setResources(resourcesData)
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error)
    }
  }

  useEffect(() => {
    fetchRooms()
    fetchResources()
  }, [])

  useEffect(() => {
    filterRooms()
  }, [searchTerm, rooms, selectedResources])

  const filterRooms = () => {
    let filtered = rooms;

    // Text search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (room) =>
          room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (room.description && room.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Resource filter
    if (selectedResources.length > 0) {
      filtered = filtered.filter(room => {
        // Check if room has all selected resources
        const hasAllResources = selectedResources.every(resourceId => {
          // Check room_resources array directly
          if (room.room_resources && room.room_resources.length > 0) {
            return room.room_resources.includes(resourceId);
          }
          return false;
        });
        
        return hasAllResources;
      });
    }

    setFilteredRooms(filtered)
  }

  const handleResourceCheckboxChange = (resourceId: string, checked: boolean) => {
    setSelectedResources(prev => {
      if (checked) {
        return [...prev, resourceId];
      } else {
        return prev.filter(id => id !== resourceId);
      }
    });
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "available":
        return "default"
      case "maintenance":
        return "destructive"
      case "reserved":
        return "secondary"
      default:
        return "outline"
    }
  }

  const handleDeleteClick = (room: Room) => {
    setRoomToDelete(room)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`/api/rooms?id=${roomToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete room")
      }

      toast({
        title: "Room Deleted",
        description: `${roomToDelete.name} has been deleted successfully.`,
      })
      
      // Refresh the rooms list
      fetchRooms()
    } catch (error) {
      console.error("Error deleting room:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete room. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setRoomToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded-lg w-64 animate-pulse" />
            <div className="h-4 bg-muted rounded-lg w-48 animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-muted rounded-md animate-pulse" />
        </div>
        
        <div className="h-12 bg-muted rounded-lg w-full animate-pulse" />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const availableRooms = rooms.filter(room => room.status === "available").length;
  const maintenanceRooms = rooms.filter(room => room.status === "maintenance").length;
  const reservedRooms = rooms.filter(room => room.status === "reserved").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Room Management</h2>
          <p className="text-muted-foreground">Manage conference rooms and their availability</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/admin/conference/rooms/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Room
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white dark:bg-slate-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.length}</div>
            <p className="text-xs text-muted-foreground">Conference rooms</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableRooms}</div>
            <p className="text-xs text-muted-foreground">Ready for booking</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserved</CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservedRooms}</div>
            <p className="text-xs text-muted-foreground">Currently booked</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceRooms}</div>
            <p className="text-xs text-muted-foreground">Under maintenance</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white dark:bg-slate-950 border rounded-lg p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 bg-white dark:bg-slate-950"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <Collapsible open={showFilters}>
          <CollapsibleContent className="pt-4 border-t">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Filter by Resources</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {resources.map((resource) => (
                  <div key={resource.id} className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-md">
                    <Checkbox
                      id={resource.id}
                      checked={selectedResources.includes(resource.id)}
                      onCheckedChange={(checked) => handleResourceCheckboxChange(resource.id, checked === true)}
                    />
                    <label
                      htmlFor={resource.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                    >
                      <ResourceIcon type={resource.type} className="h-4 w-4" />
                      {resource.name}
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedResources([])}
                  className="text-xs h-8"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {filteredRooms.length === 0 ? (
        <div className="bg-white dark:bg-slate-950 border rounded-lg p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Building className="h-6 w-6 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium mb-1">No Rooms Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedResources.length > 0
              ? "No rooms match your current filters. Try adjusting your search criteria."
              : "No rooms have been added yet. Create your first room to get started."}
          </p>
          <Button asChild>
            <Link href="/admin/conference/rooms/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Room
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => (
            <Card key={room.id} className="overflow-hidden bg-white dark:bg-slate-950 hover:shadow-md transition-shadow">
              <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {room.image ? (
                  <Image
                    src={room.image}
                    alt={room.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                  </div>
                )}
                <Badge
                  variant={getStatusBadgeVariant(room.status)}
                  className="absolute top-3 right-3 capitalize"
                >
                  {room.status}
                </Badge>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{room.name}</CardTitle>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {room.location}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Capacity: <strong>{room.capacity}</strong></span>
                  </div>
                </div>
                
                {room.room_resources && room.room_resources.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Available Resources:</p>
                    <div className="flex flex-wrap gap-1">
                      {room.room_resources.map((resourceId) => {
                        const resource = resources.find((r) => r.id === resourceId);
                        return resource ? (
                          <Badge key={resourceId} variant="outline" className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900">
                            <ResourceIcon type={resource.type} className="h-3 w-3" />
                            {resource.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between pt-0">
                <Button asChild variant="outline" size="sm" className="w-full bg-white dark:bg-slate-950">
                  <Link href={`/admin/conference/rooms/${room.id}`}>View Details</Link>
                </Button>
                <div className="flex gap-2">
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                    <Link href={`/admin/conference/rooms/${room.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => handleDeleteClick(room)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this room?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the room and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteConfirm()
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Room"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
