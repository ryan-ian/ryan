"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Building, Users, MapPin, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import type { Room, Resource } from "@/types"
import { ResourceIcon } from "@/components/ui/resource-icon"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function RoomDetailPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const roomId = unwrappedParams.id;
  
  const router = useRouter()
  const { toast } = useToast()
  const [room, setRoom] = useState<Room | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/rooms?id=${roomId}`)
        
        if (!response.ok) {
          throw new Error("Room not found")
        }
        
        const roomData = await response.json()
        setRoom(roomData)

        // If room has resources, fetch them
        if (roomData.resources && roomData.resources.length > 0) {
          const token = localStorage.getItem("auth-token")
          const resourcesResponse = await fetch("/api/resources", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          
          if (resourcesResponse.ok) {
            const allResources = await resourcesResponse.json()
            // Filter to only the resources that are associated with this room
            const roomResources = allResources.filter((resource: Resource) => 
              roomData.resources.includes(resource.id)
            )
            setResources(roomResources)
          }
        }
      } catch (error) {
        console.error("Failed to fetch room:", error)
        toast({
          title: "Error",
          description: "Failed to load room data. Please try again.",
          variant: "destructive"
        })
        router.push("/admin/conference/rooms")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRoom()
  }, [roomId, router, toast])

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`/api/rooms?id=${roomId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete room")
      }
      
      toast({
        title: "Room Deleted",
        description: "The room has been deleted successfully."
      })
      
      router.push("/admin/conference/rooms")
    } catch (error) {
      console.error("Error deleting room:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete room. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
        <p className="text-muted-foreground">Loading room details...</p>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Building className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Room Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested room could not be found.</p>
        <Button asChild>
          <Link href="/admin/conference/rooms">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rooms
          </Link>
        </Button>
      </div>
    )
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "available":
        return "success"
      case "maintenance":
        return "destructive"
      case "reserved":
        return "warning"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" className="mr-2" asChild>
          <Link href="/admin/conference/rooms">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Rooms
          </Link>
        </Button>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{room.name}</h2>
          <p className="text-muted-foreground flex items-center">
            <MapPin className="h-4 w-4 mr-1" /> {room.location}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/conference/rooms/${roomId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Room
            </Link>
          </Button>
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Room
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the room and remove it from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Room Information</CardTitle>
            <CardDescription>Details about the conference room</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={getStatusBadgeVariant(room.status)} className="mt-1">
                  {room.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                <p className="flex items-center mt-1">
                  <Users className="h-4 w-4 mr-1" /> {room.capacity} people
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="mt-1">{room.description || "No description available"}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Features</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {room.features.length > 0 ? (
                  room.features.map((feature, index) => (
                    <Badge key={index} variant="outline">
                      {feature}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No features listed</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Resources</p>
              <div className="flex flex-wrap gap-3 mt-2">
                {resources.length > 0 ? (
                  resources.map((resource) => (
                    <div key={resource.id} className="flex items-center gap-2 border rounded-md p-2">
                      <ResourceIcon 
                        type={resource.type} 
                        name={resource.name}
                        image={resource.image}
                        size="md"
                      />
                      <div>
                        <p className="text-sm font-medium">{resource.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {resource.quantity > 1 ? `Quantity: ${resource.quantity}` : 'Quantity: 1'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No resources assigned</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Room Preview</CardTitle>
            <CardDescription>Visual representation of the room</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {room.image ? (
              <img 
                src={room.image} 
                alt={room.name} 
                className="rounded-md object-cover w-full max-h-[300px]" 
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-[300px] bg-muted rounded-md">
                <Building className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 