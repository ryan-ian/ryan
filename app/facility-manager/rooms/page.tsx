"use client"

import { useState, useEffect } from "react"
import { Building, PlusCircle, Loader2, AlertCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { RoomForm } from "@/components/forms/room-form"
import { RoomCard, RoomCardSkeleton } from "@/components/cards/room-card"
import { Skeleton } from "@/components/ui/skeleton"
import { getRoomsByFacilityManager, createRoom, deleteRoom, getResourcesByFacility, getFacilitiesByManager } from "@/lib/supabase-data"
import { ApiClient } from "@/lib/api-client" 
import type { Room, Resource } from "@/types"
import { useToast } from "@/components/ui/use-toast"
import { FacilityManagerSkeleton } from "@/app/components/skeletons/facility-manager-skeleton"

export default function RoomManagementPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const apiClient = new ApiClient()
  const [rooms, setRooms] = useState<Room[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [facilityId, setFacilityId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const loadInitialData = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const facilities = await getFacilitiesByManager(user.id)
      if (facilities.length > 0) {
        const currentFacilityId = facilities[0].id
        setFacilityId(currentFacilityId)
        await loadRoomsAndResources(currentFacilityId)
      } else {
        setError("no_facility")
      }
    } catch (err) {
      console.error("Failed to load initial data", err)
      setError("Failed to load initial data.")
    } finally {
      setIsLoading(false)
    }
  }

  const loadRoomsAndResources = async (currentFacilityId: string) => {
    const [roomsData, resourcesData] = await Promise.all([
      getRoomsByFacilityManager(user!.id),
      getResourcesByFacility(currentFacilityId)
    ])
    
    const roomsWithResourceDetails = roomsData.map(room => ({
      ...room,
      resourceDetails: room.room_resources?.map(resourceId => 
        resourcesData.find(res => res.id === resourceId)
      ).filter(Boolean) as Resource[]
    }))
    
    setRooms(roomsWithResourceDetails)
    setResources(resourcesData)
  }

  useEffect(() => {
    loadInitialData()
  }, [user])

  const handleEdit = (room: Room) => {
    setSelectedRoom(room)
    setIsFormOpen(true)
  }

  const handleAddNew = () => {
    if (!facilityId) {
      toast({
        title: "Cannot Add Room",
        description: "You must be assigned to a facility to add a new room.",
        variant: "destructive"
      })
      return
    }
    setSelectedRoom(null)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    if (isSubmitting) return
    setIsFormOpen(false)
    setSelectedRoom(null)
  }

  const handleFormSubmit = async (formData: any) => {
    if (!user || !facilityId) return
    
    console.log('🔍 DEBUG - Form data received:', formData)
    console.log('🔍 DEBUG - User role:', user?.role)
    console.log('🔍 DEBUG - Selected room:', selectedRoom?.id)
    
    setIsSubmitting(true)
    const roomPayload = {
      ...formData,
      image: formData.image_url,
      facility_id: facilityId,
      room_resources: formData.resources || [],
      // Ensure pricing fields are properly mapped
      hourly_rate: formData.hourly_rate !== undefined ? Number(formData.hourly_rate) : 0,
      currency: formData.currency || 'GHS'
    }
    delete roomPayload.resources

    console.log('🔍 DEBUG - Room payload being sent:', roomPayload)

    try {
      if (selectedRoom) {
        const response = await apiClient.updateRoom(selectedRoom.id, roomPayload)
        if (response.error) {
          throw new Error(response.error)
        }
        console.log('✅ DEBUG - Room updated successfully via API:', response.data)
        toast({ title: "Success", description: "Room updated successfully." })
      } else {
        const newRoom = await createRoom(roomPayload)
        console.log('✅ DEBUG - Room created successfully:', newRoom)
        toast({ title: "Success", description: "Room created successfully." })
      }
      
      await loadRoomsAndResources(facilityId)
      handleFormClose()
    } catch (err) {
      console.error("❌ ERROR - Failed to save room:", err)
      toast({
        title: "Error",
        description: "Failed to save the room. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const openDeleteDialog = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteDialogOpen(true);
  }

  const handleDelete = async () => {
    if (!selectedRoom || !facilityId) return;

    setIsSubmitting(true)
    try {
      await deleteRoom(selectedRoom.id)
      toast({ title: "Success", description: "Room deleted successfully." })
      await loadRoomsAndResources(facilityId)
      setIsDeleteDialogOpen(false)
      setSelectedRoom(null)
    } catch (err) {
      console.error("Failed to delete room", err)
      toast({
        title: "Error",
        description: "Failed to delete room. Make sure there are no active bookings.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (isLoading) return <FacilityManagerSkeleton />
  if (error) {
    if (error === "no_facility") {
      return (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Building className="h-6 w-6 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium mb-1">No Facility Assigned</h3>
          <p className="text-muted-foreground mb-4">
            You need to create a facility before you can manage rooms.
          </p>
          <Link href="/facility-manager/facilities">
            <Button className="gap-2">
              <Building className="h-4 w-4" />
              Create Facility
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )
    }
    
    return (
      <div className="text-center py-10 text-destructive flex flex-col items-center gap-4">
        <AlertCircle className="h-8 w-8" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Room Management</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Room
        </Button>
      </div>

      {rooms.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard 
              key={room.id}
              room={room}
              href={`/facility-manager/rooms/${room.id}`}
              resourceDetails={room.resourceDetails}
              showBookButton={false}
              actionLabel="Manage"
              onEdit={() => handleEdit(room)}
              onDelete={() => openDeleteDialog(room)}
              isAdminView={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <Building className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Rooms Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Get started by adding a new room to your facility.</p>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
          </DialogHeader>
          <RoomForm 
            initialData={selectedRoom || undefined} 
            resources={resources}
            onSubmit={handleFormSubmit}
            onCancel={handleFormClose}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the <strong>{selectedRoom?.name}</strong> room and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
