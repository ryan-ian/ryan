"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Building, MapPin, Users, Tag, Info, Package, Edit, ArrowLeft, Loader2, AlertCircle } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { getRoomById, getResourcesByFacility, getFacilitiesByManager } from "@/lib/supabase-data"
import { ApiClient } from "@/lib/api-client"
import type { Room, Resource } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoomForm } from "@/components/forms/room-form"
import { ResourceIcon } from "@/components/ui/resource-icon"
import { useToast } from "@/components/ui/use-toast"
import { RoomAvailabilitySettings } from "@/components/facility-manager/room-availability-settings"
import { RoomBlackoutManagement } from "@/components/facility-manager/room-blackout-management"
import { RoomCalendarView } from "@/components/facility-manager/room-calendar-view"
import { formatCurrency } from "@/lib/utils"

export default function RoomDetailsPage() {
  const { id: roomId } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const apiClient = new ApiClient()

  const [room, setRoom] = useState<Room | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const loadRoomData = async () => {
    if (!user || !roomId) return
    try {
      setIsLoading(true)
      const roomData = await getRoomById(Array.isArray(roomId) ? roomId[0] : roomId)
      if (roomData) {
        setRoom(roomData)
        // Load resources for the form
        const facilities = await getFacilitiesByManager(user.id)
        if (facilities.length > 0) {
          const facilityResources = await getResourcesByFacility(facilities[0].id)
          setResources(facilityResources)
        }
      } else {
        setError("Room not found.")
      }
    } catch (err) {
      console.error("Failed to load room data", err)
      setError("Failed to load room details.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRoomData()
  }, [roomId, user])

  const handleStatusChange = async (newStatus: "available" | "maintenance" | "reserved") => {
    if (!room) return
    setIsUpdatingStatus(true)
    try {
      const response = await apiClient.updateRoom(room.id, { status: newStatus })
      if (response.error) {
        throw new Error(response.error)
      }
      setRoom(response.data)
      toast({ title: "Success", description: "Room status updated successfully." })
    } catch (err) {
      toast({ title: "Error", description: "Failed to update room status.", variant: "destructive" })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleFormSubmit = async (formData: any) => {
    if (!room) return
    
    console.log('🔍 DEBUG - Form data received:', formData)
    console.log('🔍 DEBUG - User role:', user?.role)
    console.log('🔍 DEBUG - Room ID:', room.id)
    
    const roomPayload = {
      ...formData,
      id: room.id, // Include room ID for API
      image: formData.image_url,
      facility_id: room.facility_id,
      room_resources: formData.resources || [],
      // Ensure pricing fields are properly mapped
      hourly_rate: formData.hourly_rate !== undefined ? Number(formData.hourly_rate) : 0,
      currency: formData.currency || 'GHS'
    }
    delete roomPayload.resources

    console.log('🔍 DEBUG - Room payload being sent:', roomPayload)

    try {
      console.log('🚀 DEBUG - About to call API endpoint...')
      console.log('🚀 DEBUG - Calling API with params:', { id: room.id, payload: roomPayload })
      
      const response = await apiClient.updateRoom(room.id, roomPayload)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      console.log('✅ DEBUG - Room updated successfully via API:', response.data)
      console.log('✅ DEBUG - Updated room pricing:', {
        hourly_rate: response.data?.hourly_rate,
        currency: response.data?.currency
      })
      
      setRoom(response.data)
      toast({ title: "Success", description: "Room updated successfully." })
      setIsEditing(false)
    } catch (err) {
      console.error('❌ ERROR - Failed to update room:', err)
      console.error('❌ ERROR - Error type:', typeof err)
      console.error('❌ ERROR - Error details:', err)
      toast({ title: "Error", description: "Failed to update the room.", variant: "destructive" })
    }
  }
  
  if (isLoading) return null // Handled by loading.tsx

  if (error) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold text-destructive">An error occurred</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    )
  }

  if (!room) return null

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/facility-manager/rooms">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Rooms
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{room.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4" /> {room.location}
          </p>
        </div>
        <Button onClick={() => setIsEditing(true)}>
          <Edit className="mr-2 h-4 w-4" /> Edit Room
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="blackouts">Blackouts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-0">
                  {room.image ? (
                    <img src={room.image} alt={room.name} className="w-full h-80 object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-80 bg-muted flex items-center justify-center rounded-lg">
                      <Building className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{room.description || "No description provided."}</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" /> Status & Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status</span>
                    <Select value={room.status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
                      <SelectTrigger className="w-[180px]">
                        {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Capacity</span>
                    <Badge variant="secondary" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {room.capacity} people
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Hourly Rate</span>
                    <div className="flex items-center gap-2">
                      {room.hourly_rate !== undefined && room.hourly_rate !== null ? (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-2 bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
                        >
                          <span className="text-sm font-semibold">
                            {Number(room.hourly_rate) === 0 ? "Free" : formatCurrency(room.hourly_rate, room.currency || 'GHS')}
                          </span>
                          {Number(room.hourly_rate) > 0 && <span className="text-xs opacity-75">/hour</span>}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground">
                          Not set
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  {room.resourceDetails && room.resourceDetails.length > 0 ? (
                    <ul className="space-y-3">
                      {room.resourceDetails.map(resource => (
                        <li key={resource.id} className="flex items-center gap-2">
                          <ResourceIcon type={resource.type} name={resource.name} />
                          <span className="font-medium">{resource.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm">No resources assigned to this room.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <RoomCalendarView roomId={room.id} roomName={room.name} />
        </TabsContent>

        <TabsContent value="availability">
          <RoomAvailabilitySettings roomId={room.id} roomName={room.name} />
        </TabsContent>

        <TabsContent value="blackouts">
          <RoomBlackoutManagement roomId={room.id} roomName={room.name} />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Room Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analytics and reporting features will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
          </DialogHeader>
          <RoomForm
            initialData={room}
            resources={resources}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 