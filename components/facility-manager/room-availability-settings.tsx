"use client"

import { useState, useEffect } from "react"
import { Clock, Settings, Save, RotateCcw, Calendar, Shield, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { getRoomAvailability, updateRoomAvailability } from "@/lib/room-availability"
import type { RoomAvailability, DayOperatingHours } from "@/types"

interface RoomAvailabilitySettingsProps {
  roomId: string
  roomName: string
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
] as const

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? '00' : '30'
  const time = `${hour.toString().padStart(2, '0')}:${minute}`
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const ampm = hour < 12 ? 'AM' : 'PM'
  return {
    value: time,
    label: `${displayHour}:${minute} ${ampm}`
  }
})

export function RoomAvailabilitySettings({ roomId, roomName }: RoomAvailabilitySettingsProps) {
  const [availability, setAvailability] = useState<RoomAvailability | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadAvailability()
  }, [roomId])

  const loadAvailability = async () => {
    try {
      setIsLoading(true)
      const data = await getRoomAvailability(roomId)
      setAvailability(data)
    } catch (error) {
      console.error('Failed to load room availability:', error)
      toast({
        title: "Error",
        description: "Failed to load room availability settings.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!availability) return

    try {
      setIsSaving(true)
      await updateRoomAvailability(roomId, availability)
      toast({
        title: "Settings saved",
        description: "Room availability settings have been updated successfully."
      })
    } catch (error) {
      console.error('Failed to save room availability:', error)
      toast({
        title: "Error",
        description: "Failed to save room availability settings.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateOperatingHours = (day: string, hours: Partial<DayOperatingHours>) => {
    if (!availability) return
    
    setAvailability({
      ...availability,
      operating_hours: {
        ...availability.operating_hours,
        [day]: {
          ...availability.operating_hours[day as keyof typeof availability.operating_hours],
          ...hours
        }
      }
    })
  }

  const copyHoursToAllDays = (sourceDay: string) => {
    if (!availability) return
    
    const sourceHours = availability.operating_hours[sourceDay as keyof typeof availability.operating_hours]
    const newOperatingHours = { ...availability.operating_hours }
    
    DAYS_OF_WEEK.forEach(({ key }) => {
      newOperatingHours[key as keyof typeof newOperatingHours] = { ...sourceHours }
    })
    
    setAvailability({
      ...availability,
      operating_hours: newOperatingHours
    })
    
    toast({
      title: "Hours copied",
      description: `${sourceDay} hours have been applied to all days.`
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Availability Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-8 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!availability) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Availability Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load availability settings.</p>
          <Button onClick={loadAvailability} className="mt-4">
            <RotateCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Availability Settings - {roomName}
          </CardTitle>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="operating-hours" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="operating-hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hours
            </TabsTrigger>
            <TabsTrigger value="booking-rules" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Booking Rules
            </TabsTrigger>
            <TabsTrigger value="user-limits" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Limits
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="operating-hours" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Operating Hours</h3>
                <p className="text-sm text-muted-foreground">
                  Set when this room is available for booking
                </p>
              </div>
              
              <div className="space-y-4">
                {DAYS_OF_WEEK.map(({ key, label }) => {
                  const dayHours = availability.operating_hours[key as keyof typeof availability.operating_hours]
                  
                  return (
                    <div key={key} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-24">
                        <Label className="font-medium">{label}</Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={dayHours.enabled}
                          onCheckedChange={(enabled) => updateOperatingHours(key, { enabled })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {dayHours.enabled ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      
                      {dayHours.enabled && (
                        <>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">From:</Label>
                            <Select
                              value={dayHours.start}
                              onValueChange={(start) => updateOperatingHours(key, { start })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OPTIONS.map(({ value, label }) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">To:</Label>
                            <Select
                              value={dayHours.end}
                              onValueChange={(end) => updateOperatingHours(key, { end })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OPTIONS.map(({ value, label }) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyHoursToAllDays(key)}
                          >
                            Copy to All
                          </Button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="booking-rules" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Booking Duration Rules</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Duration (minutes)</Label>
                    <Input
                      type="number"
                      min="15"
                      max="480"
                      step="15"
                      value={availability.min_booking_duration}
                      onChange={(e) => setAvailability({
                        ...availability,
                        min_booking_duration: parseInt(e.target.value) || 30
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Maximum Duration (minutes)</Label>
                    <Input
                      type="number"
                      min="30"
                      max="1440"
                      step="30"
                      value={availability.max_booking_duration}
                      onChange={(e) => setAvailability({
                        ...availability,
                        max_booking_duration: parseInt(e.target.value) || 480
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Buffer Time (minutes)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="60"
                      step="5"
                      value={availability.buffer_time}
                      onChange={(e) => setAvailability({
                        ...availability,
                        buffer_time: parseInt(e.target.value) || 15
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Time between bookings for cleaning/setup
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Booking Timing Rules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Advance Booking Limit (days)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={availability.advance_booking_days}
                      onChange={(e) => setAvailability({
                        ...availability,
                        advance_booking_days: parseInt(e.target.value) || 30
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      How far in advance users can book
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={availability.same_day_booking_enabled}
                        onCheckedChange={(same_day_booking_enabled) => setAvailability({
                          ...availability,
                          same_day_booking_enabled
                        })}
                      />
                      <Label>Allow Same-Day Booking</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Whether users can book rooms on the same day
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="user-limits" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">User Booking Limits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Bookings Per User Per Day</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={availability.max_bookings_per_user_per_day}
                      onChange={(e) => setAvailability({
                        ...availability,
                        max_bookings_per_user_per_day: parseInt(e.target.value) || 1
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max Bookings Per User Per Week</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={availability.max_bookings_per_user_per_week}
                      onChange={(e) => setAvailability({
                        ...availability,
                        max_bookings_per_user_per_week: parseInt(e.target.value) || 5
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Advanced Settings</h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Quick Presets</h4>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const businessHours = { enabled: true, start: '09:00', end: '17:00' }
                          const closedHours = { enabled: false, start: '09:00', end: '17:00' }
                          setAvailability({
                            ...availability,
                            operating_hours: {
                              monday: businessHours,
                              tuesday: businessHours,
                              wednesday: businessHours,
                              thursday: businessHours,
                              friday: businessHours,
                              saturday: closedHours,
                              sunday: closedHours
                            }
                          })
                        }}
                      >
                        Business Hours (9-5, Mon-Fri)
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allDayHours = { enabled: true, start: '00:00', end: '23:59' }
                          setAvailability({
                            ...availability,
                            operating_hours: {
                              monday: allDayHours,
                              tuesday: allDayHours,
                              wednesday: allDayHours,
                              thursday: allDayHours,
                              friday: allDayHours,
                              saturday: allDayHours,
                              sunday: allDayHours
                            }
                          })
                        }}
                      >
                        24/7 Availability
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
