"use client"

import { useState, useEffect } from "react"
import * as React from "react"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, parseISO, isBefore, addDays } from "date-fns"
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

// Button variants for custom calendar
type ButtonVariant = "outline" | "ghost";
const buttonVariants = ({ variant }: { variant: ButtonVariant }) => {
  const base = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50";
  const variants: Record<ButtonVariant, string> = {
    outline: "border border-gray-300 bg-white shadow-sm hover:bg-gray-50 hover:text-gray-900",
    ghost: "hover:bg-gray-100 hover:text-gray-900"
  };
  return `${base} ${variants[variant] || ""}`;
};

// Helper to compare two dates (ignoring time)
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// CalendarProps: add bookedDates
interface CalendarProps {
  className?: string;
  showOutsideDays?: boolean;
  onSelect?: (date: Date) => void;
  selected?: Date | null;
  bookedDates?: Date[];
}

function CustomCalendar({ className, showOutsideDays = true, onSelect, selected, bookedDates = [] }: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState<Date>(selected || new Date());
  const today = new Date();
  today.setHours(0,0,0,0);
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  const prevMonth = new Date(currentYear, currentMonth, 0);
  const daysInPrevMonth = prevMonth.getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const goToPrevMonth = () => { setCurrentDate(new Date(currentYear, currentMonth - 1, 1)); };
  const goToNextMonth = () => { setCurrentDate(new Date(currentYear, currentMonth + 1, 1)); };
  // Helper: is date in the past or today
  const isPastOrToday = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    date.setHours(0,0,0,0);
    return date <= today;
  };
  // Helper: is date booked
  const isDateBooked = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    date.setHours(0,0,0,0);
    return bookedDates.some(d => isSameDay(d, date));
  };
  const handleDateClick = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    if (isPastOrToday(day)) return;
    // For edit modal, allow clicking on booked dates (they might be the current booking being edited)
    // The parent component will handle the validation
    if (onSelect) { const date = new Date(currentYear, currentMonth, day); onSelect(date); }
  };
  const isToday = (day: number) => today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
  const isSelected = (day: number) => selected && selected.getDate() === day && selected.getMonth() === currentMonth && selected.getFullYear() === currentYear;
  const calendarDays: { day: number; isCurrentMonth: boolean; isPrevMonth: boolean; isNextMonth: boolean }[] = [];
  for (let i = firstDayWeekday - 1; i >= 0; i--) { const day = daysInPrevMonth - i; calendarDays.push({ day, isCurrentMonth: false, isPrevMonth: true, isNextMonth: false }); }
  for (let day = 1; day <= daysInMonth; day++) { calendarDays.push({ day, isCurrentMonth: true, isPrevMonth: false, isNextMonth: false }); }
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) { calendarDays.push({ day, isCurrentMonth: false, isPrevMonth: false, isNextMonth: true }); }
  return (
    <div className={cn("p-3", className)}>
      <div className="flex justify-center pt-1 relative items-center mb-4">
        <button onClick={goToPrevMonth} className={cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1")} aria-label="Previous month">‹</button>
        <div className="text-sm font-normal">{monthNames[currentMonth]} {currentYear}</div>
        <button onClick={goToNextMonth} className={cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1")} aria-label="Next month">›</button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>{dayNames.map((day, index) => (<th key={index} className="text-gray-500 rounded-md w-10 h-10 font-normal text-xs text-center pb-2" scope="col">{day}</th>))}</tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, weekIndex) => (
            <tr key={weekIndex}>
              {Array.from({ length: 7 }, (_, dayIndex) => {
                const dayInfo = calendarDays[weekIndex * 7 + dayIndex];
                if (!dayInfo) return <td key={dayIndex}></td>;
                const { day, isCurrentMonth } = dayInfo;
                const isTodayDate = isCurrentMonth && isToday(day);
                const isSelectedDate = isCurrentMonth && isSelected(day);
                const disabled = !isCurrentMonth || isPastOrToday(day);
                let tooltip = undefined;
                if (isPastOrToday(day)) tooltip = "Cannot select past or today.";
                if (isDateBooked(day) && !isSelectedDate) tooltip = "You have a booking on this day.";
                return (
                  <td key={dayIndex} className="relative p-0 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => handleDateClick(day, isCurrentMonth)}
                      className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "h-10 w-10 flex items-center justify-center mx-auto my-1 font-normal rounded-full transition-colors duration-150",
                        (!isCurrentMonth || isPastOrToday(day)) && "text-gray-400 opacity-40 cursor-not-allowed pointer-events-none",
                        isDateBooked(day) && !isSelectedDate && "text-orange-600 bg-orange-100 hover:bg-orange-200",
                        isTodayDate && "border border-blue-500",
                        isSelectedDate && "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700"
                      )}
                      tabIndex={isCurrentMonth && !disabled ? 0 : -1}
                      aria-current={isTodayDate ? "date" : undefined}
                      aria-selected={isSelectedDate ? "true" : "false"}
                      aria-disabled={disabled ? "true" : undefined}
                      disabled={disabled}
                      title={tooltip}
                    >
                      {day}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Form validation schema (simplified - date/time handled separately)
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
  onSubmit: (data: { title: string; description?: string; start_time: string; end_time: string }) => Promise<void>
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [currentSelectedDate, setCurrentSelectedDate] = useState<Date | null>(null)
  const [currentStartTime, setCurrentStartTime] = useState('')
  const [currentEndTime, setCurrentEndTime] = useState('')
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([])
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false)
  const [bookingsForDay, setBookingsForDay] = useState<any[]>([])
  const [userBookedDates, setUserBookedDates] = useState<Date[]>([])

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
      const startDate = new Date(booking.start_time)
      const endDate = new Date(booking.end_time)

      form.reset({
        title: booking.title || "",
        description: booking.description || "",
      })

      // Set date/time state separately
      setCurrentSelectedDate(startDate)
      setCurrentStartTime(startDate.toTimeString().slice(0, 5)) // HH:MM format
      setCurrentEndTime(endDate.toTimeString().slice(0, 5)) // HH:MM format
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

  // Check if a time slot is booked
  const isTimeSlotBooked = (time: string) => {
    return bookedTimeSlots.includes(time)
  }

  // Helper: is a time within 30 min after any booking's end
  const isWithinBufferPeriod = (time: string) => {
    const timeDate = parseISO(`2000-01-01T${time}:00`)
    return bookingsForDay.some((booking) => {
      const bookingEnd = new Date(booking.end_time)
      const bufferEnd = new Date(bookingEnd.getTime() + 30 * 60 * 1000)
      // Only check for bookings that end before this time
      return timeDate > bookingEnd && timeDate < bufferEnd
    })
  }

  // Load user booked dates when modal opens
  useEffect(() => {
    if (isOpen && booking) {
      loadUserBookedDates()
    }
  }, [isOpen, booking])

  // Function to load user booked dates for calendar display
  const loadUserBookedDates = async () => {
    if (!booking) return

    try {
      // For edit modal, we show the current booking date as booked
      // This provides visual consistency while still allowing editing
      const currentBookingDate = new Date(booking.start_time)
      currentBookingDate.setHours(0, 0, 0, 0)
      setUserBookedDates([currentBookingDate])
    } catch (error) {
      console.error('Error loading user booked dates:', error)
      // Fallback to just the current booking date
      const currentBookingDate = new Date(booking.start_time)
      currentBookingDate.setHours(0, 0, 0, 0)
      setUserBookedDates([currentBookingDate])
    }
  }

  // Fetch booked time slots when a date is selected
  useEffect(() => {
    if (currentSelectedDate && room) {
      fetchBookedTimeSlots(currentSelectedDate, room.id)
    }
  }, [currentSelectedDate, room])

  // Function to fetch booked time slots for the selected date and room
  const fetchBookedTimeSlots = async (date: Date, roomId: string) => {
    if (!date || !roomId) return

    setIsLoadingTimeSlots(true)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')

      // Fetch bookings for the selected date and room
      const response = await fetch(`/api/rooms/${roomId}/bookings?date=${dateStr}`)

      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }

      const responseData = await response.json()

      // Extract bookings array from response, with fallback to empty array
      const bookingsArray = responseData?.bookings || responseData || []

      // Ensure we have an array before calling filter
      if (!Array.isArray(bookingsArray)) {
        console.warn('Bookings data is not an array:', bookingsArray)
        setBookingsForDay([])
        setBookedTimeSlots([])
        return
      }

      // Filter out the current booking being edited
      const otherBookings = bookingsArray.filter((b: any) =>
        b.id !== booking?.id && (b.status === 'confirmed' || b.status === 'pending')
      )

      setBookingsForDay(otherBookings)

      // Generate booked time slots
      const bookedSlots: string[] = []
      otherBookings.forEach((booking: any) => {
        const start = new Date(booking.start_time)
        const end = new Date(booking.end_time)

        // Generate 30-minute slots for the booking duration
        let current = new Date(start)
        while (current < end) {
          const timeString = current.toTimeString().slice(0, 5)
          bookedSlots.push(timeString)
          current = new Date(current.getTime() + 30 * 60 * 1000) // Add 30 minutes
        }
      })

      setBookedTimeSlots(bookedSlots)
    } catch (error) {
      console.error('Error fetching booked time slots:', error)
      toast({
        title: "Error",
        description: "Failed to fetch availability information",
        variant: "destructive"
      })
    } finally {
      setIsLoadingTimeSlots(false)
    }
  }

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (!date) return

    // Check if date is in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0)

    if (isBefore(selectedDate, today)) {
      setError('Cannot select past dates. Please choose a future date.')
      return
    }

    setCurrentSelectedDate(date)
    setCurrentStartTime('')
    setCurrentEndTime('')
    setError('')

    // Close the calendar after selection
    setIsCalendarOpen(false)
  }

  const handleSubmit = async (values: EditBookingFormValues) => {
    if (!booking || !currentSelectedDate || !currentStartTime || !currentEndTime) {
      setError('Please select a date, start time, and end time.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Validate time range
      if (currentStartTime >= currentEndTime) {
        setError('End time must be after start time.')
        return
      }

      // Check if any selected time slot is already booked
      const startTimeIndex = timeSlots.indexOf(currentStartTime)
      const endTimeIndex = timeSlots.indexOf(currentEndTime)

      if (startTimeIndex !== -1 && endTimeIndex !== -1) {
        for (let i = startTimeIndex; i < endTimeIndex; i++) {
          if (isTimeSlotBooked(timeSlots[i])) {
            setError(`The time slot ${formatTimeDisplay(timeSlots[i])} is already booked. Please select a different time range.`)
            return
          }
        }
      }

      // Create start and end datetime objects for submission
      const [startHour, startMinute] = currentStartTime.split(':').map(Number)
      const [endHour, endMinute] = currentEndTime.split(':').map(Number)

      const startDateTime = new Date(currentSelectedDate)
      startDateTime.setHours(startHour, startMinute, 0, 0)

      const endDateTime = new Date(currentSelectedDate)
      endDateTime.setHours(endHour, endMinute, 0, 0)

      // Prepare submission data with datetime fields
      const submissionData = {
        title: values.title,
        description: values.description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      }

      await onSubmit(submissionData)

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

  // Only allow editing pending bookings that are not paid
  if (booking.status !== "pending" || booking.payment_status === 'paid') {
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
                {booking.payment_status === 'paid'
                  ? "Paid bookings cannot be edited to maintain payment consistency."
                  : `Only pending bookings can be edited. This booking has a status of "${booking.status}".`
                }
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
          <div className="space-y-2">
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

          {/* Date/Time Selection */}
          <Card className="border-brand-navy-200/60 dark:border-brand-navy-600/60 bg-gradient-to-r from-brand-navy-50/80 to-brand-teal-50/40 dark:from-brand-navy-800/80 dark:to-brand-navy-700/40 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-brand-teal-600 dark:text-brand-teal-400" />
                <span className="text-sm font-semibold text-brand-navy-700 dark:text-brand-navy-300">Schedule</span>
              </div>

              {/* Date Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-brand-navy-700 dark:text-brand-navy-300">
                  Select Date
                </label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-medium h-12 px-4 border-2 border-brand-navy-200 dark:border-brand-navy-600 hover:border-brand-teal-300 dark:hover:border-brand-teal-500 bg-white dark:bg-brand-navy-800 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-700 transition-all duration-200"
                    >
                      <CalendarIcon className="mr-3 h-5 w-5 text-brand-teal-600 dark:text-brand-teal-400" />
                      {currentSelectedDate ? (
                        <span className="text-brand-navy-900 dark:text-brand-navy-100">
                          {format(currentSelectedDate, 'EEE, MMM d, yyyy')}
                        </span>
                      ) : (
                        <span className="text-brand-navy-500 dark:text-brand-navy-400">Choose a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 border-2 border-brand-navy-200 dark:border-brand-navy-600 shadow-xl z-[60]"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                    avoidCollisions={true}
                    collisionPadding={8}
                  >
                        <CustomCalendar
                          selected={currentSelectedDate || undefined}
                          onSelect={handleDateSelect}
                          className="rounded-md"
                          bookedDates={userBookedDates}
                          roomId={room.id}
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
                        {timeSlots.map((time) => {
                          const isBooked = isTimeSlotBooked(time)
                          const isBuffer = isWithinBufferPeriod(time)
                          return (
                            <SelectItem
                              key={`start-${time}`}
                              value={time}
                              disabled={isBooked || isBuffer}
                              className={cn(
                                "text-sm py-1",
                                (isBooked || isBuffer) && "text-muted-foreground line-through opacity-50"
                              )}
                              title={isBuffer ? "Cannot start a meeting within 30 minutes after a previous booking." : undefined}
                            >
                              {formatTimeDisplay(time)}
                              {isBooked && " (Booked)"}
                              {isBuffer && " (Buffer)"}
                            </SelectItem>
                          )
                        })}
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
                        {timeSlots.map((time) => {
                          // Only show times after the selected start time
                          if (currentStartTime && time <= currentStartTime) {
                            return null
                          }

                          // Check if any slot between start time and this end time is booked
                          let hasConflict = false
                          if (currentStartTime) {
                            const startIdx = timeSlots.indexOf(currentStartTime)
                            const endIdx = timeSlots.indexOf(time)

                            for (let i = startIdx; i < endIdx; i++) {
                              if (isTimeSlotBooked(timeSlots[i])) {
                                hasConflict = true
                                break
                              }
                            }
                          }

                          return (
                            <SelectItem
                              key={`end-${time}`}
                              value={time}
                              disabled={hasConflict}
                              className={cn(
                                "text-sm py-1",
                                hasConflict && "text-muted-foreground line-through opacity-50"
                              )}
                            >
                              {formatTimeDisplay(time)}
                              {hasConflict && " (Conflict)"}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {isLoadingTimeSlots && (
                <Alert className="border-info/50 bg-info/5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription className="text-info text-sm">
                    Loading availability...
                  </AlertDescription>
                </Alert>
              )}
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
