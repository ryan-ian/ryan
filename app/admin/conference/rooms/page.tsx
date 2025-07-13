"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Building, Users, MapPin, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { Room } from "@/types"
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

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
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

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    const filtered = rooms.filter(
      (room) =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.features.some((feature) => feature.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredRooms(filtered)
  }, [searchTerm, rooms])

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Room Management</h2>
            <p className="text-muted-foreground">Manage conference rooms and their availability</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Room Management</h2>
          <p className="text-muted-foreground">Manage conference rooms and their availability</p>
        </div>
        <Button asChild>
          <Link href="/admin/conference/rooms/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Room
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.length}</div>
            <p className="text-xs text-muted-foreground">Conference rooms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.filter((r) => r.status === "available").length}</div>
            <p className="text-xs text-muted-foreground">Ready for booking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.filter((r) => r.status === "maintenance").length}</div>
            <p className="text-xs text-muted-foreground">Under maintenance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rooms.length > 0 ? Math.round(rooms.reduce((sum, room) => sum + room.capacity, 0) / rooms.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">People per room</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Rooms</CardTitle>
          <CardDescription>Manage all conference rooms in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms by name, location, or features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <Card key={room.id} className="hover:shadow-md transition-shadow">
                <Link href={`/admin/conference/rooms/${room.id}`} className="block">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <Badge variant={getStatusBadgeVariant(room.status)}>{room.status}</Badge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {room.location}
                    </div>
                  </CardHeader>
                </Link>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{room.capacity} people</span>
                    </div>
                  </div>

                  {room.description && <p className="text-sm text-muted-foreground line-clamp-2">{room.description}</p>}

                  <div className="flex justify-between items-center mt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/conference/rooms/${room.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {room.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {room.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{room.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/conference/rooms/${room.id}/edit`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive"
                      onClick={() => handleDeleteClick(room)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRooms.length === 0 && (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No rooms found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Room
            </AlertDialogTitle>
            <AlertDialogDescription>
              {roomToDelete && (
                <>
                  Are you sure you want to delete <strong>{roomToDelete.name}</strong>? This action cannot be undone.
                  <br /><br />
                  Note: Rooms with existing bookings cannot be deleted.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
