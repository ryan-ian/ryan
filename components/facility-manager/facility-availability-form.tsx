"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import type { FacilityAvailability } from "@/types"
import { getFacilityAvailability, updateFacilityAvailability, createDefaultFacilityAvailability } from "@/lib/facility-availability"

interface Props {
  facilityId: string
}

export function FacilityAvailabilityForm({ facilityId }: Props) {
  const [availability, setAvailability] = useState<FacilityAvailability | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        setIsLoading(true)
        const data = await getFacilityAvailability(facilityId)
        if (!ignore) setAvailability(data)
      } catch (e) {
        console.error(e)
        toast({ title: "Error", description: "Failed to load facility availability", variant: "destructive" })
        // Try to create defaults
        try {
          const created = await createDefaultFacilityAvailability(facilityId)
          if (!ignore) setAvailability(created)
        } catch (e2) {
          console.error(e2)
        }
      } finally {
        setIsLoading(false)
      }
    }
    if (facilityId) load()
    return () => { ignore = true }
  }, [facilityId, toast])

  const updateField = (path: string, value: any) => {
    if (!availability) return
    const next = { ...availability } as any
    const segments = path.split(".")
    let ref = next
    for (let i = 0; i < segments.length - 1; i++) ref = ref[segments[i]]
    ref[segments[segments.length - 1]] = value
    setAvailability(next)
  }

  const save = async () => {
    if (!availability) return
    try {
      setIsSaving(true)
      // Basic validation
      if (availability.min_booking_duration <= 0 || availability.max_booking_duration <= 0) {
        toast({ title: "Invalid durations", description: "Durations must be positive.", variant: "destructive" })
        return
      }
      if (availability.min_booking_duration > availability.max_booking_duration) {
        toast({ title: "Invalid durations", description: "Min cannot exceed Max.", variant: "destructive" })
        return
      }
      const updated = await updateFacilityAvailability(availability.facility_id, {
        operating_hours: availability.operating_hours,
        min_booking_duration: availability.min_booking_duration,
        max_booking_duration: availability.max_booking_duration,
        buffer_time: availability.buffer_time,
        advance_booking_days: availability.advance_booking_days,
        same_day_booking_enabled: availability.same_day_booking_enabled,
        max_bookings_per_user_per_day: availability.max_bookings_per_user_per_day,
        max_bookings_per_user_per_week: availability.max_bookings_per_user_per_week,
      })
      setAvailability(updated)
      toast({ title: "Saved", description: "Facility defaults updated" })
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "Failed to save", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !availability) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Global Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 rounded bg-muted animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  const days: Array<keyof FacilityAvailability["operating_hours"]> = [
    "monday","tuesday","wednesday","thursday","friday","saturday","sunday"
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Durations (minutes)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="min">Min</Label>
                <Input id="min" type="number" value={availability.min_booking_duration} onChange={e=>updateField("min_booking_duration", Number(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="max">Max</Label>
                <Input id="max" type="number" value={availability.max_booking_duration} onChange={e=>updateField("max_booking_duration", Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="buffer">Buffer</Label>
                <Input id="buffer" type="number" value={availability.buffer_time} onChange={e=>updateField("buffer_time", Number(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="advance">Advance days</Label>
                <Input id="advance" type="number" value={availability.advance_booking_days} onChange={e=>updateField("advance_booking_days", Number(e.target.value))} />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Switch checked={availability.same_day_booking_enabled} onCheckedChange={v=>updateField("same_day_booking_enabled", v)} />
                <Label>Same-day booking</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="perday">Max per user/day</Label>
                <Input id="perday" type="number" value={availability.max_bookings_per_user_per_day} onChange={e=>updateField("max_bookings_per_user_per_day", Number(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="perweek">Max per user/week</Label>
                <Input id="perweek" type="number" value={availability.max_bookings_per_user_per_week} onChange={e=>updateField("max_bookings_per_user_per_week", Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Operating Hours</Label>
            <div className="space-y-2">
              {days.map((d)=> (
                <div key={d} className="flex items-center gap-3">
                  <Switch checked={availability.operating_hours[d].enabled} onCheckedChange={v=>updateField(`operating_hours.${d}.enabled`, v)} />
                  <div className="w-24 capitalize">{d}</div>
                  <Input className="w-28" type="time" value={availability.operating_hours[d].start} onChange={e=>updateField(`operating_hours.${d}.start`, e.target.value)} />
                  <span>to</span>
                  <Input className="w-28" type="time" value={availability.operating_hours[d].end} onChange={e=>updateField(`operating_hours.${d}.end`, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={isSaving}>{isSaving ? "Saving..." : "Save Defaults"}</Button>
        </div>
      </CardContent>
    </Card>
  )
}

