"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getRoomsByFacilityManager } from "@/lib/supabase-data"
import { getBookingsForRoomsDateRange } from "@/lib/multi-room-bookings"
import type { Room, Booking } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { addDays, endOfDay, endOfMonth, endOfWeek, format, startOfDay, startOfMonth, startOfWeek } from "date-fns"

export default function FacilityCalendarPage() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [view, setView] = useState<"month" | "week" | "day">("week")
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function init() {
      if (!user) return
      const rms = await getRoomsByFacilityManager(user.id)
      setRooms(rms)
      setSelectedRoomIds(rms.map(r => r.id))
    }
    init()
  }, [user])

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === "day") return { rangeStart: startOfDay(currentDate), rangeEnd: endOfDay(currentDate) }
    if (view === "week") return { rangeStart: startOfWeek(currentDate), rangeEnd: endOfWeek(currentDate) }
    return { rangeStart: startOfMonth(currentDate), rangeEnd: endOfMonth(currentDate) }
  }, [view, currentDate])

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      if (!selectedRoomIds.length) return
      try {
        setIsLoading(true)
        const data = await getBookingsForRoomsDateRange(selectedRoomIds, rangeStart.toISOString(), rangeEnd.toISOString())
        setBookings(data)
      } finally {
        setIsLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [selectedRoomIds, rangeStart, rangeEnd])

  const toggleRoom = (id: string) => {
    setSelectedRoomIds(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  const changeDate = (delta: number) => {
    const step = view === "day" ? 1 : view === "week" ? 7 : 30
    setCurrentDate(addDays(currentDate, delta * step))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant={view==='month'? 'default':'outline'} onClick={()=>setView('month')}>Month</Button>
          <Button variant={view==='week'? 'default':'outline'} onClick={()=>setView('week')}>Week</Button>
          <Button variant={view==='day'? 'default':'outline'} onClick={()=>setView('day')}>Day</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">Rooms</div>
              <div className="space-y-2 max-h-64 overflow-auto pr-2">
                {rooms.map(r => (
                  <label key={r.id} className="flex items-center gap-2">
                    <Checkbox checked={selectedRoomIds.includes(r.id)} onCheckedChange={()=>toggleRoom(r.id)} />
                    <span>{r.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={()=>changeDate(-1)}>Prev</Button>
              <div>{format(currentDate, 'PPPP')}</div>
              <Button variant="outline" onClick={()=>changeDate(1)}>Next</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{view.toUpperCase()} view</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-96 rounded bg-muted animate-pulse" />
            ) : (
              <div className="space-y-2">
                {bookings.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No bookings in selected range.</div>
                ) : (
                  bookings.map(b => (
                    <div key={b.id} className="p-3 rounded border flex items-center justify-between">
                      <div>
                        <div className="font-medium">{b.title}</div>
                        <div className="text-sm text-muted-foreground">{format(new Date(b.start_time), 'PP p')} - {format(new Date(b.end_time), 'p')}</div>
                      </div>
                      <div className="text-sm">{rooms.find(r=>r.id===b.room_id)?.name}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

