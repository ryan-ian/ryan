"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar, Trash2, Edit, Clock, AlertTriangle, Repeat } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { getRoomBlackouts, createRoomBlackout, updateRoomBlackout, deleteRoomBlackout } from "@/lib/room-availability"
import type { RoomBlackout } from "@/types"

interface RoomBlackoutManagementProps {
  roomId: string
  roomName: string
}

const BLACKOUT_TYPES = [
  { value: 'maintenance', label: 'Maintenance', color: 'bg-orange-100 text-orange-800' },
  { value: 'cleaning', label: 'Cleaning', color: 'bg-blue-100 text-blue-800' },
  { value: 'event', label: 'Special Event', color: 'bg-purple-100 text-purple-800' },
  { value: 'holiday', label: 'Holiday', color: 'bg-green-100 text-green-800' },
  { value: 'repair', label: 'Repair', color: 'bg-red-100 text-red-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
]

export function RoomBlackoutManagement({ roomId, roomName }: RoomBlackoutManagementProps) {
  const [blackouts, setBlackouts] = useState<RoomBlackout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBlackout, setEditingBlackout] = useState<RoomBlackout | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    blackout_type: 'maintenance' as const,
    is_recurring: false
  })

  useEffect(() => {
    loadBlackouts()
  }, [roomId])

  const loadBlackouts = async () => {
    try {
      setIsLoading(true)
      const data = await getRoomBlackouts(roomId)
      setBlackouts(data)
    } catch (error) {
      console.error('Failed to load blackouts:', error)
      toast({
        title: "Error",
        description: "Failed to load room blackouts.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      blackout_type: 'maintenance',
      is_recurring: false
    })
    setEditingBlackout(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (blackout: RoomBlackout) => {
    setFormData({
      title: blackout.title,
      description: blackout.description || '',
      start_time: format(parseISO(blackout.start_time), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(parseISO(blackout.end_time), "yyyy-MM-dd'T'HH:mm"),
      blackout_type: blackout.blackout_type,
      is_recurring: blackout.is_recurring
    })
    setEditingBlackout(blackout)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.start_time || !formData.end_time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    const startTime = new Date(formData.start_time)
    const endTime = new Date(formData.end_time)

    if (endTime <= startTime) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)

      const blackoutData = {
        room_id: roomId,
        title: formData.title,
        description: formData.description || undefined,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        blackout_type: formData.blackout_type,
        is_recurring: formData.is_recurring,
        is_active: true
      }

      if (editingBlackout) {
        await updateRoomBlackout(editingBlackout.id, blackoutData)
        toast({
          title: "Blackout updated",
          description: "The blackout period has been updated successfully."
        })
      } else {
        await createRoomBlackout(blackoutData)
        toast({
          title: "Blackout created",
          description: "The blackout period has been created successfully."
        })
      }

      await loadBlackouts()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save blackout:', error)
      toast({
        title: "Error",
        description: "Failed to save blackout period.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (blackoutId: string) => {
    if (!confirm('Are you sure you want to delete this blackout period?')) {
      return
    }

    try {
      await deleteRoomBlackout(blackoutId)
      toast({
        title: "Blackout deleted",
        description: "The blackout period has been deleted successfully."
      })
      await loadBlackouts()
    } catch (error) {
      console.error('Failed to delete blackout:', error)
      toast({
        title: "Error",
        description: "Failed to delete blackout period.",
        variant: "destructive"
      })
    }
  }

  const getBlackoutTypeInfo = (type: string) => {
    return BLACKOUT_TYPES.find(t => t.value === type) || BLACKOUT_TYPES[0]
  }

  const formatDateTime = (dateTime: string) => {
    return format(parseISO(dateTime), "MMM d, yyyy 'at' h:mm a")
  }

  const isUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date()
  }

  const isActive = (startTime: string, endTime: string) => {
    const now = new Date()
    return new Date(startTime) <= now && now <= new Date(endTime)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Blackout Periods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-muted rounded animate-pulse" />
            <div className="h-16 bg-muted rounded animate-pulse" />
            <div className="h-16 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Blackout Periods - {roomName}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Blackout
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingBlackout ? 'Edit Blackout Period' : 'Create Blackout Period'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Weekly Maintenance"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time *</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blackout_type">Type</Label>
                  <Select
                    value={formData.blackout_type}
                    onValueChange={(value: any) => setFormData({ ...formData, blackout_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLACKOUT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                  />
                  <Label htmlFor="is_recurring" className="flex items-center gap-2">
                    <Repeat className="h-4 w-4" />
                    Recurring blackout
                  </Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : editingBlackout ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {blackouts.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Blackout Periods</h3>
            <p className="text-muted-foreground mb-4">
              Create blackout periods to block room availability for maintenance, events, or other purposes.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Blackout
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {blackouts.map((blackout) => {
              const typeInfo = getBlackoutTypeInfo(blackout.blackout_type)
              const upcoming = isUpcoming(blackout.start_time)
              const active = isActive(blackout.start_time, blackout.end_time)
              
              return (
                <div
                  key={blackout.id}
                  className={`p-4 border rounded-lg ${
                    active ? 'border-red-200 bg-red-50' : upcoming ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{blackout.title}</h4>
                        <Badge className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                        {blackout.is_recurring && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Repeat className="h-3 w-3" />
                            Recurring
                          </Badge>
                        )}
                        {active && (
                          <Badge variant="destructive">
                            Active Now
                          </Badge>
                        )}
                        {upcoming && !active && (
                          <Badge variant="secondary">
                            Upcoming
                          </Badge>
                        )}
                      </div>
                      
                      {blackout.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {blackout.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDateTime(blackout.start_time)}
                        </div>
                        <span>→</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDateTime(blackout.end_time)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(blackout)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(blackout.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
