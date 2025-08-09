"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Loader2, 
  X, 
  AlertCircle, 
  Building, 
  MapPin, 
  Users,
  Save,
  Info
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/components/ui/use-toast"
import type { Booking, Room } from "@/types"
import { cn } from "@/lib/utils"

// Form validation schema
const editBookingFormSchema = z.object({
  title: z.string().min(1, "Meeting title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
})

type EditBookingFormValues = z.infer<typeof editBookingFormSchema>

interface BookingEditModalModernProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking | null
  room: Room | null
  onSubmit: (data: EditBookingFormValues) => Promise<void>
}

export function BookingEditModalModern({
  isOpen,
  onClose,
  booking,
  room,
  onSubmit
}: BookingEditModalModernProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const form = useForm<EditBookingFormValues>({
    resolver: zodResolver(editBookingFormSchema),
    defaultValues: {
      title: "",
      description: "",
    }
  })

  // Update form when booking changes
  useEffect(() => {
    if (booking && isOpen) {
      form.reset({
        title: booking.title || "",
        description: booking.description || "",
      })
      setError('')
    }
  }, [booking, isOpen, form])

  // Clear form when modal closes
  useEffect(() => {
    if (!isOpen) {
      form.reset()
      setError('')
    }
  }, [isOpen, form])

  const handleSubmit = async (values: EditBookingFormValues) => {
    if (!booking) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      await onSubmit(values)
      
      toast({
        title: "Booking updated",
        description: "Your booking has been updated successfully.",
      })
      
      onClose()
    } catch (error: any) {
      console.error("Error updating booking:", error)
      
      let errorMessage = 'Failed to update booking. Please try again.'
      if (error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!booking || !room) return null

  // Only allow editing pending bookings
  if (booking.status !== "pending") {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) onClose()
      }}>
        <DialogContent className={cn(
          "sm:max-w-md max-w-[95vw]",
          "rounded-xl border backdrop-blur-md",
          "border-brand-navy-200 dark:border-brand-navy-700",
          "bg-white/95 dark:bg-brand-navy-800/95"
        )}>
          <DialogHeader>
            <DialogTitle className="text-brand-navy-900 dark:text-brand-navy-50">
              Cannot Edit Booking
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Alert className="border-warning/50 bg-warning/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-warning">
                Only pending bookings can be edited. This booking has a status of "{booking.status}".
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button onClick={onClose} className="bg-brand-navy-600 hover:bg-brand-navy-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose()
    }}>
      <DialogContent className={cn(
        "sm:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto",
        "rounded-xl border backdrop-blur-md",
        "border-brand-navy-200 dark:border-brand-navy-700",
        "bg-white/95 dark:bg-brand-navy-800/95"
      )}>
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-xl font-semibold text-brand-navy-900 dark:text-brand-navy-50">
                  Edit Booking
                </DialogTitle>
                <Badge className="bg-warning/10 text-warning ring-1 ring-warning/20">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              </div>
              <DialogDescription className="text-brand-navy-600 dark:text-brand-navy-400">
                Update your booking details. Changes require administrator approval.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-brand-navy-500 hover:text-brand-navy-700 dark:text-brand-navy-400 dark:hover:text-brand-navy-200"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Room Info Card */}
          <Card className="border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50/50 dark:bg-brand-navy-900/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-brand-navy-100 to-brand-navy-50 dark:from-brand-navy-700 dark:to-brand-navy-800">
                  <Building className="h-5 w-5 text-brand-navy-600 dark:text-brand-navy-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-brand-navy-900 dark:text-brand-navy-50">{room.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-brand-navy-600 dark:text-brand-navy-400 mt-1">
                    {room.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{room.location}</span>
                      </div>
                    )}
                    {room.capacity && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>Up to {room.capacity} people</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date/Time Info (Read-only) */}
          <Card className="border-brand-navy-200 dark:border-brand-navy-700">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-brand-navy-500 dark:text-brand-navy-400" />
                <span className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Scheduled Time</span>
              </div>
              <div className="space-y-1">
                <p className="text-brand-navy-900 dark:text-brand-navy-50 font-medium">
                  {new Date(booking.start_time).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <div className="flex items-center gap-1 text-sm text-brand-navy-600 dark:text-brand-navy-400">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(booking.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" - "}
                    {new Date(booking.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
              <Alert className="border-info/50 bg-info/5">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-info text-sm">
                  To change the date or time, please cancel this booking and create a new one.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">
                Meeting Title *
              </label>
              <Input
                id="title"
                placeholder="Weekly Team Meeting"
                {...form.register("title")}
                className="border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 focus:ring-brand-navy-500"
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">
                Description (Optional)
              </label>
              <Textarea
                id="description"
                placeholder="Meeting agenda and details..."
                className="resize-none h-20 border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 focus:ring-brand-navy-500"
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            {error && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-destructive">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
                className="border-brand-navy-200 dark:border-brand-navy-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-navy-600 hover:bg-brand-navy-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Booking
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
