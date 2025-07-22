"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { format, addDays, isBefore, isToday, parseISO } from "date-fns"
import { Calendar as CalendarIcon, Clock, ArrowRight, Loader2, Plus, X, AlertCircle, Info } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Room } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import React from "react"

// Custom Calendar implementation with types
type ButtonVariant = "outline" | "ghost";
const cn = (...classes: (string | false | undefined | null)[]): string => classes.filter((c): c is string => Boolean(c)).join(" ");
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

function Calendar({ className, showOutsideDays = true, onSelect, selected, bookedDates = [] }: CalendarProps) {
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
    if (isDateBooked(day)) return;
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
                const disabled = !isCurrentMonth || isPastOrToday(day) || isDateBooked(day);
                let tooltip = undefined;
                if (isPastOrToday(day)) tooltip = "Cannot select past or today.";
                if (isDateBooked(day)) tooltip = "You already have a booking on this day.";
                return (
                  <td key={dayIndex} className="relative p-0 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => handleDateClick(day, isCurrentMonth)}
                      className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "h-10 w-10 flex items-center justify-center mx-auto my-1 font-normal rounded-full transition-colors duration-150",
                        (!isCurrentMonth || isPastOrToday(day)) && "text-gray-400 opacity-40 cursor-not-allowed pointer-events-none",
                        isDateBooked(day) && "text-gray-400 opacity-60 cursor-not-allowed pointer-events-none",
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

// Define the form schema with Zod
const bookingFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
})

type BookingFormValues = z.infer<typeof bookingFormSchema>

// Define a type for a single booking date/time
interface BookingDateTime {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
}

interface BookingCreationModalProps {
  isOpen: boolean
  onClose: () => void
  room: Room | null
  onSubmit: (data: BookingFormValues & { room_id: string, bookings: BookingDateTime[] }) => Promise<void>
}

export function BookingCreationModal({
  isOpen,
  onClose,
  room,
  onSubmit
}: BookingCreationModalProps) {
  const { user } = useAuth()
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

  // Fetch booked time slots when a date is selected
  useEffect(() => {
    if (currentSelectedDate && room) {
      fetchBookedTimeSlots(currentSelectedDate, room.id)
      checkUserBookingsOnDate(currentSelectedDate)
    }
  }, [currentSelectedDate, room])

  // Function to fetch booked time slots for the selected date and room
  const fetchBookedTimeSlots = async (date: Date, roomId: string) => {
    if (!date || !roomId) return
    
    setIsLoadingTimeSlots(true)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      
      // Fetch bookings for the selected date and room
      const response = await fetch(`/api/bookings?roomId=${roomId}&date=${dateStr}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }
      
      const bookings = await response.json()
      setBookingsForDay(bookings)
      
      // Extract booked time slots
      const bookedSlots: string[] = []
      
      bookings.forEach((booking: any) => {
        const startTime = new Date(booking.start_time)
        const endTime = new Date(booking.end_time)
        
        // Get all 30-minute slots between start and end time
        const currentSlot = new Date(startTime)
        
        while (currentSlot < endTime) {
          const timeSlot = format(currentSlot, 'HH:mm')
          bookedSlots.push(timeSlot)
          
          // Add 30 minutes
          currentSlot.setMinutes(currentSlot.getMinutes() + 30)
        }
      })
      
      setBookedTimeSlots(bookedSlots)
      console.log('Booked time slots:', bookedSlots)
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

  // Helper: is a time within 30 min after any booking's end
  function isWithinBufferPeriod(time: string) {
    const timeDate = parseISO(`2000-01-01T${time}:00`);
    return bookingsForDay.some((booking) => {
      const bookingEnd = new Date(booking.end_time);
      const bufferEnd = new Date(bookingEnd.getTime() + 30 * 60 * 1000);
      // Only check for bookings that end before this time
      return timeDate > bookingEnd && timeDate < bufferEnd;
    });
  }

  // Function to check if user already has bookings on the selected date
  const checkUserBookingsOnDate = async (date: Date) => {
    if (!date || !user?.id) return
    
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const token = localStorage.getItem("auth-token")
      
      if (!token) {
        console.error('No auth token found')
        return
      }
      
      const response = await fetch(`/api/bookings/user?date=${dateStr}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch user bookings')
      }
      
      const bookings = await response.json()
      
      if (bookings && bookings.length > 0) {
        // User already has a booking on this date
        setUserBookingsOnDate({
          date: dateStr,
          room: bookings[0].rooms?.name || 'Unknown room'
        })
      } else {
        setUserBookingsOnDate(null)
      }
    } catch (error) {
      console.error('Error checking user bookings:', error)
      // Don't show error toast here as it's not critical
    }
  }

  const handleSubmit = async (values: BookingFormValues) => {
    if (!room) return
    if (selectedBookings.length === 0) {
      setError('Please add at least one booking date and time')
      return
    }
    
    setIsSubmitting(true)
    try {
      await onSubmit({
        ...values,
        room_id: room.id,
        bookings: selectedBookings
      })
      
      // Add a small delay before closing to ensure API has time to process
      setTimeout(() => {
        resetAndClose()
        
        // Show success toast
        toast({
          title: "Booking request submitted",
          description: "Your booking request has been submitted for approval.",
        })
      }, 500)
    } catch (error: any) {
      console.error("Error creating booking:", error)
      
      // Extract error message
      let errorMessage = 'Failed to create booking. Please try again.'
      
      if (error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // Set error message
      setError(errorMessage)
      
      // Show error toast
      toast({
        title: "Booking failed",
        description: errorMessage,
        variant: "destructive"
      })
      
      setIsSubmitting(false)
    }
  }

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

  // Generate time options in 30-minute intervals
  const generateTimeOptions = () => {
    const options = []
    for (let hour = 8; hour < 18; hour++) {
      for (let minute of [0, 30]) {
        const formattedHour = hour.toString().padStart(2, '0')
        const formattedMinute = minute.toString().padStart(2, '0')
        const time = `${formattedHour}:${formattedMinute}`
        options.push(time)
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  // Check if a time slot is booked
  const isTimeSlotBooked = (time: string) => {
    return bookedTimeSlots.includes(time)
  }

  const isDateDisabled = (date: Date) => {
    // Disable past dates and today
    return isBefore(date, addDays(new Date(), 1))
  }

  // Format functions
  const formatDate = (date: Date) => {
    return format(date, 'EEE, MMM d, yyyy')
  }

  const formatShortDate = (date: Date) => {
    return format(date, 'MMM d, yyyy')
  }

  const formatTimeDisplay = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    return format(date, 'h:mm a')
  }

  // Check if a date is already selected
  const isDateAlreadySelected = (date: Date) => {
    return selectedBookings.some(booking => 
      booking.date.toDateString() === date.toDateString()
    )
  }

  // Validate time range
  const validateTimeRange = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return false
    
    const start = parseISO(`2000-01-01T${startTime}:00`)
    const end = parseISO(`2000-01-01T${endTime}:00`)
    
    return isBefore(start, end)
  }

  // Check for time conflicts
  const hasTimeConflict = (date: Date, startTime: string, endTime: string) => {
    const existingBooking = selectedBookings.find(booking => 
      booking.date.toDateString() === date.toDateString()
    )
    
    if (!existingBooking) return false
    
    const newStart = parseISO(`2000-01-01T${startTime}:00`)
    const newEnd = parseISO(`2000-01-01T${endTime}:00`)
    const existingStart = parseISO(`2000-01-01T${existingBooking.startTime}:00`)
    const existingEnd = parseISO(`2000-01-01T${existingBooking.endTime}:00`)
    
    // Check for overlap
    return (isBefore(newStart, existingEnd) && isBefore(existingStart, newEnd))
  }

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    
    // Check if date is in the past or today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0)
    
    if (isBefore(selectedDate, addDays(today, 1))) {
      setError('Cannot select past dates or today. Please choose a future date.')
      return
    }
    
    setCurrentSelectedDate(date)
    setCurrentStartTime('')
    setCurrentEndTime('')
    setError('')
  }

  // Add a booking
  const handleAddBooking = () => {
    // Validation checks
    if (!currentSelectedDate) {
      setError('Please select a date first')
      return
    }

    if (!currentStartTime) {
      setError('Please select a start time')
      return
    }

    if (!currentEndTime) {
      setError('Please select an end time')
      return
    }

    if (!validateTimeRange(currentStartTime, currentEndTime)) {
      setError('End time must be after start time')
      return
    }

    if (selectedBookings.length >= 5) {
      setError('Maximum 5 room bookings allowed')
      return
    }

    if (isDateAlreadySelected(currentSelectedDate)) {
      setError('You already have a booking for this date. Please select a different date.')
      return
    }
    
    // Check if user already has a booking on this date
    if (userBookingsOnDate) {
      setError(`You already have a booking on ${format(currentSelectedDate, 'MMM d, yyyy')} for ${userBookingsOnDate.room}. You can only book one room per day.`)
      return
    }

    // Check if any selected time slot is already booked
    const startTimeIndex = timeOptions.indexOf(currentStartTime)
    const endTimeIndex = timeOptions.indexOf(currentEndTime)
    
    if (startTimeIndex !== -1 && endTimeIndex !== -1) {
      for (let i = startTimeIndex; i < endTimeIndex; i++) {
        if (isTimeSlotBooked(timeOptions[i])) {
          setError(`The time slot ${formatTimeDisplay(timeOptions[i])} is already booked. Please select a different time range.`)
          return
        }
      }
    }

    // Add the booking
    const newBooking: BookingDateTime = {
      date: currentSelectedDate,
      startTime: currentStartTime,
      endTime: currentEndTime,
      id: Date.now().toString() // Simple ID generation
    }

    setSelectedBookings(prev => [...prev, newBooking])
    setCurrentSelectedDate(null)
    setCurrentStartTime('')
    setCurrentEndTime('')
    setIsCalendarOpen(false)
    setError('')
    
    // Show success toast
    toast({
      title: "Date and time added",
      description: `${format(newBooking.date, 'EEE, MMM d')} from ${formatTimeDisplay(newBooking.startTime)} to ${formatTimeDisplay(newBooking.endTime)}`,
    })
  }

  // Remove a booking
  const handleRemoveBooking = (bookingId: string) => {
    setSelectedBookings(prev => prev.filter(booking => booking.id !== bookingId))
    setError('')
  }

  // Clear all bookings
  const handleClearAll = () => {
    setSelectedBookings([])
    setCurrentSelectedDate(null)
    setCurrentStartTime('')
    setCurrentEndTime('')
    setError('')
  }

  const canAddBooking = currentSelectedDate && currentStartTime && currentEndTime && 
                        validateTimeRange(currentStartTime, currentEndTime) && 
                        selectedBookings.length < 5 &&
                        !isDateAlreadySelected(currentSelectedDate!)

  // Add this function before the return statement
  const renderAvailabilityInfo = () => {
    if (!currentSelectedDate || isLoadingTimeSlots) return null;
    
    // Count available and booked slots
    const totalSlots = timeOptions.length;
    const bookedCount = bookedTimeSlots.length;
    const availableCount = totalSlots - bookedCount;
    
    // Calculate availability percentage
    const availabilityPercentage = Math.round((availableCount / totalSlots) * 100);
    
    // Determine status color based on availability
    let statusColor = "text-green-600 dark:text-green-400";
    let statusBg = "bg-green-100 dark:bg-green-900/30";
    let statusText = "Fully Available";
    
    if (bookedCount > 0) {
      if (availabilityPercentage < 30) {
        statusColor = "text-red-600 dark:text-red-400";
        statusBg = "bg-red-100 dark:bg-red-900/30";
        statusText = "Limited Availability";
      } else if (availabilityPercentage < 70) {
        statusColor = "text-amber-600 dark:text-amber-400";
        statusBg = "bg-amber-100 dark:bg-amber-900/30";
        statusText = "Partially Available";
      } else {
        statusColor = "text-green-600 dark:text-green-400";
        statusBg = "bg-green-100 dark:bg-green-900/30";
        statusText = "Mostly Available";
      }
    }
    
    // If user already has a booking on this date, show warning instead
    if (userBookingsOnDate) {
      return (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2" />
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Booking Limit Reached
            </p>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            You already have a booking for {userBookingsOnDate.room} on {format(currentSelectedDate, 'MMMM d, yyyy')}.
            You can only book one room per day.
          </p>
        </div>
      );
    }
    
    return (
      <div className="mt-4">
        <div className={`p-3 ${statusBg} border rounded-md`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className={`h-4 w-4 ${statusColor} mr-2`} />
              <p className={`text-sm font-medium ${statusColor}`}>
                {statusText}
              </p>
            </div>
            <Badge variant="outline" className={statusColor}>
              {availableCount}/{totalSlots} slots available
            </Badge>
          </div>
          
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${availabilityPercentage === 100 ? 'bg-green-500' : availabilityPercentage > 70 ? 'bg-green-500' : availabilityPercentage > 30 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${availabilityPercentage}%` }}
            ></div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            {bookedCount > 0 ? (
              <>Booked periods are marked and cannot be selected.</>
            ) : (
              <>All time slots are available for this room on {format(currentSelectedDate, 'MMM d, yyyy')}.</>
            )}
          </p>
        </div>
      </div>
    );
  };

  // In the BookingCreationModal, collect all user booked dates (from userBookingsOnDate and selectedBookings)
  const userBookedDates: Date[] = [];
  if (userBookingsOnDate) {
    // If userBookingsOnDate is set, add that date
    userBookedDates.push(new Date(userBookingsOnDate.date));
  }
  selectedBookings.forEach(b => userBookedDates.push(new Date(b.date)));

  if (!room) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetAndClose()
        onClose()
      }
    }}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Book {room.name}</DialogTitle>
            {/* <DialogClose className="h-6 w-6 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose> */}

          </div>
          <DialogDescription>
            {step === 1 ? 
              "Enter meeting details and select dates/times" : 
              "Review your booking details"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(step === 1 ? () => setStep(2) : handleSubmit)}>
          {step === 1 ? (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Meeting Title
                  </label>
                  <Input
                    id="title"
                    placeholder="Weekly Team Meeting"
                    {...form.register("title")}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Meeting agenda and details..."
                    className="resize-none"
                    {...form.register("description")}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">Select Dates & Times</h3>
                  <span className="text-xs text-muted-foreground">
                    {selectedBookings.length}/5 dates selected
                  </span>
                </div>

                {/* Date Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                      Select Date
                    </label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {currentSelectedDate ? formatShortDate(currentSelectedDate) : 'Choose a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          selected={currentSelectedDate || undefined}
                          onSelect={handleDateSelect}
                          className="rounded-md"
                          bookedDates={userBookedDates}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* User booking warning */}
                  {currentSelectedDate && userBookingsOnDate && (
                    <Alert variant="default" className="mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Booking Limit Reached</AlertTitle>
                      <AlertDescription>
                        You already have a booking on {format(currentSelectedDate, 'MMM d, yyyy')} for {userBookingsOnDate.room}. 
                        You can only book one room per day.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Time Selection */}
                  {currentSelectedDate && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-muted-foreground">
                          Start Time
                        </label>
                        <Select 
                          value={currentStartTime} 
                          onValueChange={setCurrentStartTime}
                          disabled={isLoadingTimeSlots || !!userBookingsOnDate}
                        >
                          <SelectTrigger>
                            {isLoadingTimeSlots ? (
                              <div className="flex items-center">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                <span>Loading...</span>
                              </div>
                            ) : (
                              <SelectValue placeholder="Select start time" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map((time) => {
                              const isBooked = isTimeSlotBooked(time);
                              const isBuffer = isWithinBufferPeriod(time);
                              return (
                                <SelectItem
                                  key={`start-${time}`}
                                  value={time}
                                  disabled={isBooked || isBuffer}
                                  className={cn(
                                    (isBooked || isBuffer) && "text-muted-foreground line-through opacity-50"
                                  )}
                                  title={isBuffer ? "Cannot start a meeting within 30 minutes after a previous booking." : undefined}
                                >
                                  {formatTimeDisplay(time)}
                                  {isBooked && " (Booked)"}
                                  {isBuffer && " (Buffer)"}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-muted-foreground">
                          End Time
                        </label>
                        <Select 
                          value={currentEndTime} 
                          onValueChange={setCurrentEndTime}
                          disabled={isLoadingTimeSlots || !currentStartTime || !!userBookingsOnDate}
                        >
                          <SelectTrigger>
                            {isLoadingTimeSlots ? (
                              <div className="flex items-center">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                <span>Loading...</span>
                              </div>
                            ) : (
                              <SelectValue placeholder="Select end time" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map((time) => {
                              // Only show times after the selected start time
                              if (currentStartTime && time <= currentStartTime) {
                                return null;
                              }
                              
                              // Check if any slot between start time and this end time is booked
                              let hasConflict = false;
                              if (currentStartTime) {
                                const startIdx = timeOptions.indexOf(currentStartTime);
                                const endIdx = timeOptions.indexOf(time);
                                
                                for (let i = startIdx; i < endIdx; i++) {
                                  if (isTimeSlotBooked(timeOptions[i])) {
                                    hasConflict = true;
                                    break;
                                  }
                                }
                              }
                              
                              return (
                                <SelectItem 
                                  key={`end-${time}`} 
                                  value={time}
                                  disabled={hasConflict}
                                  className={cn(
                                    hasConflict && "text-muted-foreground line-through opacity-50"
                                  )}
                                >
                                  {formatTimeDisplay(time)}
                                  {hasConflict && " (Conflict)"}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Add Booking Button */}
                  {currentSelectedDate && (
                    <Button
                      type="button"
                      onClick={handleAddBooking}
                      disabled={!canAddBooking || !!userBookingsOnDate || isLoadingTimeSlots}
                      className="w-full"
                    >
                      {isLoadingTimeSlots ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading Availability...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Date & Time
                        </>
                      )}
                    </Button>
                  )}
                  
                  {/* Booking information */}
                  {currentSelectedDate && !isLoadingTimeSlots && !userBookingsOnDate && renderAvailabilityInfo()}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Selected Bookings Display */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Selected Dates & Times</h3>
                    {selectedBookings.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAll}
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  {selectedBookings.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No dates selected yet</p>
                      <p className="text-xs">Use the form above to add dates and times</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {selectedBookings
                        .sort((a, b) => a.date.getTime() - b.date.getTime() || a.startTime.localeCompare(b.startTime))
                        .map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-md border"
                          >
                            <div className="flex items-start gap-3">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">
                                  {formatDate(booking.date)}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">
                                    {formatTimeDisplay(booking.startTime)} - {formatTimeDisplay(booking.endTime)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveBooking(booking.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  All bookings will be created with <span className="font-medium">pending</span> status and require administrator approval.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Meeting Details</h3>
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Title</p>
                      <p className="text-sm">{form.getValues("title")}</p>
                    </div>
                    {form.getValues("description") && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Description</p>
                        <p className="text-sm">{form.getValues("description")}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Room</p>
                      <p className="text-sm">{room.name} ({room.location})</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Capacity</p>
                      <p className="text-sm">{room.capacity} people</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Selected Dates & Times</h3>
                  <Badge variant="outline">{selectedBookings.length} {selectedBookings.length === 1 ? 'booking' : 'bookings'}</Badge>
                </div>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {selectedBookings
                    .sort((a, b) => a.date.getTime() - b.date.getTime() || a.startTime.localeCompare(b.startTime))
                    .map((booking) => (
                      <Card key={booking.id}>
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">
                                {formatDate(booking.date)}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  {formatTimeDisplay(booking.startTime)} - {formatTimeDisplay(booking.endTime)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  All bookings will be created with <span className="font-medium">pending</span> status and require administrator approval.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            {step === 1 ? (
              <>
                <Button type="button" variant="outline" onClick={() => {
                  resetAndClose();
                  onClose();
                }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={selectedBookings.length === 0}
                >
                  Review Bookings <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
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