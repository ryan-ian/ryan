"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getFacilitiesByManager, getRoomsByFacilityManager } from "@/lib/supabase-data"
import { getRoomAvailability, updateRoomAvailability, getRoomBlackouts, createRoomBlackout, updateRoomBlackout, deleteRoomBlackout } from "@/lib/room-availability"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FacilityAvailabilityForm } from "@/components/facility-manager/facility-availability-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import type { Room, RoomAvailability, RoomBlackout } from "@/types"

export default function FacilitySettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [facilityId, setFacilityId] = useState<string | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [search, setSearch] = useState("")
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [roomAvailability, setRoomAvailability] = useState<RoomAvailability | null>(null)
  const [isSavingRoom, setIsSavingRoom] = useState(false)

  useEffect(() => {
    async function init() {
      if (!user) return
      try {
        const facilities = await getFacilitiesByManager(user.id)
        if (facilities && facilities.length > 0) {
          setFacilityId(facilities[0].id)
          const rms = await getRoomsByFacilityManager(user.id)
          setRooms(rms)
        }
      } catch (e) {
        console.error(e)
      }
    }
    init()
  }, [user])

  const filteredRooms = useMemo(() => rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase())), [rooms, search])

  const loadRoomAvailability = async (roomId: string) => {
    try {
      const data = await getRoomAvailability(roomId)
      if (data) setRoomAvailability(data)
      setSelectedRoomId(roomId)
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "Failed to load room availability", variant: "destructive" })
    }
  }

  const saveRoomAvailability = async () => {
    if (!selectedRoomId || !roomAvailability) return
    try {
      setIsSavingRoom(true)
      const updated = await updateRoomAvailability(selectedRoomId, {
        operating_hours: roomAvailability.operating_hours,
        min_booking_duration: roomAvailability.min_booking_duration,
        max_booking_duration: roomAvailability.max_booking_duration,
        buffer_time: roomAvailability.buffer_time,
        advance_booking_days: roomAvailability.advance_booking_days,
        same_day_booking_enabled: roomAvailability.same_day_booking_enabled,
        max_bookings_per_user_per_day: roomAvailability.max_bookings_per_user_per_day,
        max_bookings_per_user_per_week: roomAvailability.max_bookings_per_user_per_week,
      })
      setRoomAvailability(updated)
      toast({ title: "Saved", description: "Room availability updated" })
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "Failed to save room availability", variant: "destructive" })
    } finally {
      setIsSavingRoom(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Facility Settings</h1>
      </div>

      {!facilityId ? (
        <Card>
          <CardHeader><CardTitle>Loading...</CardTitle></CardHeader>
          <CardContent>
            <div className="h-40 rounded bg-muted animate-pulse" />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="global" className="space-y-6">
          <TabsList>
            <TabsTrigger value="global">Global Availability</TabsTrigger>
            <TabsTrigger value="rooms">Room Availability</TabsTrigger>
            <TabsTrigger value="blackouts">Blackouts</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Apply</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-4">
            <FacilityAvailabilityForm facilityId={facilityId} />
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rooms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Input placeholder="Search rooms..." value={search} onChange={e=>setSearch(e.target.value)} />
                  <Select onValueChange={(val)=> loadRoomAvailability(val)}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select room to edit" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredRooms.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRoomId && roomAvailability && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Min Duration</Label>
                        <Input type="number" value={roomAvailability.min_booking_duration} onChange={e=>setRoomAvailability({ ...roomAvailability, min_booking_duration: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Max Duration</Label>
                        <Input type="number" value={roomAvailability.max_booking_duration} onChange={e=>setRoomAvailability({ ...roomAvailability, max_booking_duration: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Buffer (min)</Label>
                        <Input type="number" value={roomAvailability.buffer_time} onChange={e=>setRoomAvailability({ ...roomAvailability, buffer_time: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Advance days</Label>
                        <Input type="number" value={roomAvailability.advance_booking_days} onChange={e=>setRoomAvailability({ ...roomAvailability, advance_booking_days: Number(e.target.value) })} />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={saveRoomAvailability} disabled={isSavingRoom}>{isSavingRoom ? "Saving..." : "Save"}</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blackouts">
            <Card>
              <CardHeader>
                <CardTitle>Blackouts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Use per-room pages to manage detailed blackouts. A centralized blackout list UI can be added here next.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Apply</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Select rooms and apply facility defaults. (Implementation stub)</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

