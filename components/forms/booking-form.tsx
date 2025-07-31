"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Calendar as CalendarIcon, Clock, Users, Building, Info, Loader2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Booking, Room } from "@/types"

// Define the form schema with Zod
const bookingFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  date: z.date({
    required_error: "Please select a date.",
  }),
  start_time: z.string({
    required_error: "Please select a start time.",
  }),
  end_time: z.string({
    required_error: "Please select an end time.",
  }),
  room_id: z.string({
    required_error: "Please select a room.",
  }),
  attendees: z.number().int().min(1, { message: "At least one attendee is required." }).optional(),
})
.refine((data) => {
  if (!data.start_time || !data.end_time || !data.date) return true
  const start = new Date(`${format(data.date, 'yyyy-MM-dd')}T${data.start_time}`)
  const end = new Date(`${format(data.date, 'yyyy-MM-dd')}T${data.end_time}`)
  return end > start
}, {
  message: "End time must be after start time",
  path: ["end_time"]
})

type BookingFormValues = z.infer<typeof bookingFormSchema>

export interface BookingFormProps {
  initialData?: Partial<Booking>
  rooms?: Room[]
  selectedRoomId?: string
  onSubmit: (data: BookingFormValues) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
  cancelHref?: string
  onCancel?: () => void
}

export function BookingForm({
  initialData,
  rooms = [],
  selectedRoomId,
  onSubmit,
  isLoading = false,
  submitLabel = "Save Booking",
  cancelHref,
  onCancel,
}: BookingFormProps) {
  // Parse dates from initialData
  const getInitialDate = () => {
    if (initialData?.start_time) {
      return new Date(initialData.start_time)
    }
    return new Date()
  }

  const getInitialStartTime = () => {
    if (initialData?.start_time) {
      return format(new Date(initialData.start_time), 'HH:mm')
    }
    return ''
  }

  const getInitialEndTime = () => {
    if (initialData?.end_time) {
      return format(new Date(initialData.end_time), 'HH:mm')
    }
    return ''
  }

  // Define the form
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      date: getInitialDate(),
      start_time: getInitialStartTime(),
      end_time: getInitialEndTime(),
      room_id: initialData?.room_id || selectedRoomId || "",
      attendees: initialData?.attendees || 1,
    },
  })

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title || "",
        description: initialData.description || "",
        date: getInitialDate(),
        start_time: getInitialStartTime(),
        end_time: getInitialEndTime(),
        room_id: initialData.room_id || selectedRoomId || "",
        attendees: initialData.attendees || 1,
      })
    } else if (selectedRoomId) {
      form.setValue('room_id', selectedRoomId)
    }
  }, [initialData, selectedRoomId, form])

  // Generate time options in 30-minute intervals
  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
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

  // Handle form submission
  const handleSubmit = async (values: BookingFormValues) => {
    await onSubmit(values)
  }

  // Find the selected room
  const selectedRoom = rooms.find(room => room.id === form.watch('room_id'))

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card className="border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Title</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Info className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                      <Input 
                        className={cn(
                          "pl-10 border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800",
                          form.formState.errors.title && "border-destructive focus-visible:ring-destructive"
                        )} 
                        placeholder="Weekly Team Meeting" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Meeting agenda and details..." 
                      className={cn(
                        "resize-none border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800",
                        form.formState.errors.description && "border-destructive focus-visible:ring-destructive"
                      )}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800",
                              !field.value && "text-brand-navy-500 dark:text-brand-navy-400",
                              form.formState.errors.date && "border-destructive focus-visible:ring-destructive"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          className="text-brand-navy-900 dark:text-brand-navy-100"
                          classNames={{
                            day_selected: "bg-brand-teal-500 text-white hover:bg-brand-teal-600 focus:bg-brand-teal-600",
                            day_today: "border border-brand-teal-500 text-brand-teal-600 dark:text-brand-teal-400",
                            day_disabled: "text-brand-navy-400 dark:text-brand-navy-500 opacity-50"
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="attendees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Attendees</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                        <Input 
                          className={cn(
                            "pl-10 border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800",
                            form.formState.errors.attendees && "border-destructive focus-visible:ring-destructive"
                          )}
                          type="number" 
                          min={1} 
                          placeholder="5" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </div>
                    </FormControl>
                    {selectedRoom && (
                      <FormDescription className="text-brand-navy-600 dark:text-brand-navy-400">
                        Room capacity: <span className="font-medium text-brand-teal-600 dark:text-brand-teal-400">{selectedRoom.capacity}</span> people
                      </FormDescription>
                    )}
                    {selectedRoom && field.value && field.value > selectedRoom.capacity && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Exceeds room capacity of {selectedRoom.capacity}</span>
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Time Conflict Warning */}
            {form.formState.errors.end_time && form.formState.errors.end_time.message === "End time must be after start time" && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Time Conflict</p>
                  <p className="text-xs text-destructive/90">End time must be after start time. Please select a valid time range.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(
                          "border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800",
                          form.formState.errors.start_time && "border-destructive focus-visible:ring-destructive"
                        )}>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                            <SelectValue placeholder="Select start time" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
                        {timeOptions.map((time) => (
                          <SelectItem key={`start-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(
                          "border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800",
                          form.formState.errors.end_time && "border-destructive focus-visible:ring-destructive"
                        )}>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                            <SelectValue placeholder="Select end time" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
                        {timeOptions.map((time) => (
                          <SelectItem key={`end-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {!selectedRoomId && (
              <FormField
                control={form.control}
                name="room_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(
                          "border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800",
                          form.formState.errors.room_id && "border-destructive focus-visible:ring-destructive"
                        )}>
                          <div className="flex items-center">
                            <Building className="mr-2 h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                            <SelectValue placeholder="Select a room" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name} (<span className="text-brand-teal-600 dark:text-brand-teal-400">{room.capacity}</span> capacity)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>
        
        <CardFooter className="flex justify-between px-0">
          {onCancel ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700"
            >
              Cancel
            </Button>
          ) : cancelHref ? (
            <Button 
              type="button" 
              variant="outline" 
              asChild
              className="border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700"
            >
              <a href={cancelHref}>Cancel</a>
            </Button>
          ) : (
            <div></div>
          )}
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-brand-teal-500 hover:bg-brand-teal-600 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Form>
  )
} 