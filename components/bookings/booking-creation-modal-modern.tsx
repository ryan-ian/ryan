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
import { format, addDays, isBefore, isToday, parseISO } from "date-fns"
import { Calendar as CalendarIcon, Clock, ArrowRight, Loader2, Plus, X, AlertCircle, Info, Building, MapPin, Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import type { Room } from "@/types"
import { cn } from "@/lib/utils"

// Form validation schema
const bookingFormSchema = z.object({
  title: z.string().min(1, "Meeting title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
})

type BookingFormValues = z.infer<typeof bookingFormSchema>

// Define a type for a single booking date/time
interface BookingDateTime {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
}

interface BookingCreationModalModernProps {
  isOpen: boolean
  onClose: () => void
  room: Room | null
  onSubmit: (data: BookingFormValues & { room_id: string, bookings: BookingDateTime[] }) => Promise<void>
}

export function BookingCreationModalModern({
  isOpen,
  onClose,
  room,
  onSubmit
}: BookingCreationModalModernProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [selectedBookings, setSelectedBookings] = useState<BookingDateTime[]>([])
  const [currentSelectedDate, setCurrentSelectedDate] = useState<Date | null>(null)
  const [currentStartTime, setCurrentStartTime] = useState('')
  const [currentEndTime, setCurrentEndTime] = useState('')
  const [error, setError] = useState('')
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false)
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([])
  const [userBookingsOnDate, setUserBookingsOnDate] = useState<{date: string, room: string} | null>(null)
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false)
  const [bookingsForDay, setBookingsForDay] = useState<any[]>([])
  
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      title: "",
      description: "",
    }
  })

  // Clear the form and selected bookings when the modal is closed
  useEffect(() => {
    if (!isOpen) {
      form.reset()
      setSelectedBookings([])
      setCurrentSelectedDate(null)
      setCurrentStartTime('')
      setCurrentEndTime('')
      setError('')
      setStep(1)
      setBookedTimeSlots([])
      setUserBookingsOnDate(null)
    }
  }, [isOpen, form])

  const resetAndClose = () => {
    form.reset()
    setSelectedBookings([])
    setCurrentSelectedDate(null)
    setCurrentStartTime('')
    setCurrentEndTime('')
    setError('')
    setStep(1)
    setBookedTimeSlots([])
    setUserBookingsOnDate(null)
  }

  // Generate time slots (9 AM to 6 PM in 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break // Stop at 6:00 PM
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(timeString)
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Format time for display
  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (!room) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetAndClose()
        onClose()
      }
    }}>
      <DialogContent className={cn(
        "sm:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto",
        "rounded-xl border backdrop-blur-md",
        "border-brand-navy-200 dark:border-brand-navy-700",
        "bg-white/95 dark:bg-brand-navy-800/95"
      )}>
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold text-brand-navy-900 dark:text-brand-navy-50">
                Book {room.name}
              </DialogTitle>
              <DialogDescription className="text-brand-navy-600 dark:text-brand-navy-400">
                {step === 1 ? 
                  "Enter meeting details and select dates/times" : 
                  "Review your booking details"}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetAndClose()
                onClose()
              }}
              className="h-8 w-8 p-0 text-brand-navy-500 hover:text-brand-navy-700 dark:text-brand-navy-400 dark:hover:text-brand-navy-200"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

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
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 px-1">
          <div className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
            step >= 1 ? "bg-brand-navy-600 text-white" : "bg-brand-navy-200 text-brand-navy-600"
          )}>
            1
          </div>
          <div className={cn(
            "flex-1 h-0.5",
            step >= 2 ? "bg-brand-navy-600" : "bg-brand-navy-200"
          )} />
          <div className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
            step >= 2 ? "bg-brand-navy-600 text-white" : "bg-brand-navy-200 text-brand-navy-600"
          )}>
            2
          </div>
        </div>

        <form onSubmit={form.handleSubmit(step === 1 ? () => setStep(2) : async (values) => {
          setIsSubmitting(true)
          try {
            await onSubmit({
              ...values,
              room_id: room.id,
              bookings: selectedBookings
            })
            
            setTimeout(() => {
              resetAndClose()
              toast({
                title: "Booking request submitted",
                description: "Your booking request has been submitted for approval.",
              })
            }, 500)
          } catch (error: any) {
            console.error("Error creating booking:", error)
            let errorMessage = 'Failed to create booking. Please try again.'
            if (error.message) {
              errorMessage = error.message
            } else if (typeof error === 'string') {
              errorMessage = error
            }
            setError(errorMessage)
          } finally {
            setIsSubmitting(false)
          }
        })}>
          {/* Step 1: Meeting Details */}
          {step === 1 && (
            <div className="space-y-6 py-2">
              <div className="space-y-4">
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
                </div>
              </div>

              {/* Date/Time Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">
                  Add Dates & Times
                </h3>

                {/* Date Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-brand-navy-600 dark:text-brand-navy-400">
                    Select Date
                  </label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal border-brand-navy-200 dark:border-brand-navy-700"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {currentSelectedDate ? format(currentSelectedDate, 'EEE, MMM d, yyyy') : 'Choose a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={currentSelectedDate || undefined}
                        onSelect={(date) => setCurrentSelectedDate(date || null)}
                        disabled={(date) => date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Selection */}
                {currentSelectedDate && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-brand-navy-600 dark:text-brand-navy-400">
                        Start Time
                      </label>
                      <Select value={currentStartTime} onValueChange={setCurrentStartTime}>
                        <SelectTrigger className="border-brand-navy-200 dark:border-brand-navy-700">
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {formatTimeDisplay(time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-brand-navy-600 dark:text-brand-navy-400">
                        End Time
                      </label>
                      <Select value={currentEndTime} onValueChange={setCurrentEndTime}>
                        <SelectTrigger className="border-brand-navy-200 dark:border-brand-navy-700">
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {formatTimeDisplay(time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Add Booking Button */}
                {currentSelectedDate && currentStartTime && currentEndTime && (
                  <Button
                    type="button"
                    onClick={() => {
                      if (!currentSelectedDate || !currentStartTime || !currentEndTime) return

                      const newBooking: BookingDateTime = {
                        id: Date.now().toString(),
                        date: currentSelectedDate,
                        startTime: currentStartTime,
                        endTime: currentEndTime,
                      }

                      setSelectedBookings(prev => [...prev, newBooking])
                      setCurrentSelectedDate(null)
                      setCurrentStartTime('')
                      setCurrentEndTime('')
                      setIsCalendarOpen(false)

                      toast({
                        title: "Date and time added",
                        description: `${format(newBooking.date, 'EEE, MMM d')} from ${formatTimeDisplay(newBooking.startTime)} to ${formatTimeDisplay(newBooking.endTime)}`,
                      })
                    }}
                    className="w-full bg-brand-navy-600 hover:bg-brand-navy-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Date & Time
                  </Button>
                )}

                {/* Selected Bookings */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-brand-navy-600 dark:text-brand-navy-400">
                    Selected Dates & Times
                  </h4>
                  {selectedBookings.length === 0 ? (
                    <div className="text-center py-6 text-brand-navy-500 dark:text-brand-navy-400">
                      <CalendarIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No dates selected yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedBookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50/50 dark:bg-brand-navy-900/50">
                          <div className="flex items-center gap-3">
                            <CalendarIcon className="h-4 w-4 text-brand-navy-500" />
                            <span className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">
                              {format(booking.date, 'EEE, MMM d')}
                            </span>
                            <span className="text-sm text-brand-navy-600 dark:text-brand-navy-400">
                              {formatTimeDisplay(booking.startTime)} - {formatTimeDisplay(booking.endTime)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedBookings(prev => prev.filter(b => b.id !== booking.id))}
                            className="h-8 w-8 p-0 text-brand-navy-500 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="space-y-6 py-2">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-brand-navy-900 dark:text-brand-navy-50">Review Booking Details</h3>
                
                <Card className="border-brand-navy-200 dark:border-brand-navy-700">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <span className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Meeting Title:</span>
                      <p className="text-brand-navy-900 dark:text-brand-navy-50">{form.getValues('title')}</p>
                    </div>
                    {form.getValues('description') && (
                      <div>
                        <span className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Description:</span>
                        <p className="text-brand-navy-900 dark:text-brand-navy-50">{form.getValues('description')}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Selected Times:</span>
                      <div className="space-y-1 mt-1">
                        {selectedBookings.map((booking) => (
                          <p key={booking.id} className="text-sm text-brand-navy-900 dark:text-brand-navy-50">
                            {format(booking.date, 'EEE, MMM d')} from {formatTimeDisplay(booking.startTime)} to {formatTimeDisplay(booking.endTime)}
                          </p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {error && (
                  <Alert className="border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-destructive">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
            {step === 1 ? (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    resetAndClose()
                    onClose()
                  }}
                  className="border-brand-navy-200 dark:border-brand-navy-700"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={selectedBookings.length === 0}
                  className="bg-brand-navy-600 hover:bg-brand-navy-700"
                >
                  Review Bookings <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="border-brand-navy-200 dark:border-brand-navy-700"
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-brand-navy-600 hover:bg-brand-navy-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Confirm Bookings"
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
