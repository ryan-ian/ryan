"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Building, 
  Users, 
  MapPin, 
  CalendarIcon, 
  Clock, 
  ArrowLeft, 
  ArrowRight,
  Check, 
  AlertCircle
} from "lucide-react"
import { format, addDays } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Room, Resource } from "@/types"
import { ProtectedRoute } from "@/components/protected-route"
import { ResourceIcon } from "@/components/ui/resource-icon"
import { supabase } from "@/lib/supabase"

// Step indicators component
const StepIndicator = ({ currentStep, steps }: { currentStep: number; steps: string[] }) => {
  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
        <div
          className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
            index === currentStep
                ? "bg-primary text-primary-foreground scale-110"
              : index < currentStep
                ? "bg-primary/80 text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
            {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
          </div>
          <span className={cn(
            "hidden md:block text-sm font-medium",
            index === currentStep ? "text-primary" : "text-muted-foreground"
          )}>{step}</span>
        </div>
      ))}
    </div>
  )
}

// Resource item component
const ResourceItem = ({ resource, selected, onToggle }: { resource: Resource; selected: boolean; onToggle: () => void }) => {
  return (
    <div 
      className={cn(
        "flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-all duration-300",
        selected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/50"
      )}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <ResourceIcon type={resource.type || 'default'} name={resource.name} size="lg" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{resource.name}</p>
          <p className="text-sm text-muted-foreground">{resource.description}</p>
        </div>
      </div>
      <Checkbox checked={selected} className="h-5 w-5" />
    </div>
  )
}

// Room card component
const RoomCard = ({ 
  room, 
  selected, 
  onSelect 
}: { 
  room: Room; 
  selected: boolean; 
  onSelect: () => void 
}) => {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-xl overflow-hidden",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border/50"
      )}
      onClick={onSelect}
    >
      <div className="relative aspect-video w-full">
        {room.image ? (
          <img
            src={room.image}
            alt={room.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Building className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {selected && (
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1.5">
            <Check className="h-4 w-4" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg text-foreground">{room.name}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
          <MapPin className="h-4 w-4" />
              {room.location}
            </p>
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{room.capacity} people</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Time slot component
const TimeSlot = ({ 
  time, 
  isAvailable, 
  isSelected, 
  onSelect 
}: { 
  time: string; 
  isAvailable: boolean; 
  isSelected: boolean; 
  onSelect: () => void 
}) => {
  return (
    <button
      type="button"
      className={cn(
        "h-10 w-full rounded-md text-center transition-all duration-200 border",
        isSelected 
          ? "bg-primary text-primary-foreground border-primary shadow-sm font-medium scale-105" 
          : isAvailable 
            ? "bg-background hover:bg-accent hover:text-accent-foreground border-input" 
            : "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60 border-muted",
      )}
      onClick={() => isAvailable && onSelect()}
      disabled={!isAvailable}
      title={isAvailable ? `Select ${time}` : `Booked at ${time}`}
    >
      <div className="flex flex-col items-center justify-center">
        <span className={cn("text-sm", isSelected && "font-medium")}>{time}</span>
        {!isAvailable && (
          <span className="text-[10px] flex items-center gap-1 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive/70 animate-pulse"></span>
            <span className="tracking-tight">Booked</span>
          </span>
        )}
      </div>
    </button>
  )
}

export default function NewBookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const preselectedRoomId = searchParams.get("roomId")

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(0)
  const totalSteps = 5
  const steps = [
    "Meeting Details",
    "Resource Selection",
    "Room Selection",
    "Time Selection",
    "Confirmation",
  ]

  // Form data state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: undefined as Date | undefined,
    attendees: "",
    selectedResources: [] as string[],
    room_id: preselectedRoomId || "",
    start_time: "",
    end_time: "",
  })

  // Resources and rooms state
  const [resources, setResources] = useState<Resource[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch resources and rooms
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, resourcesRes] = await Promise.all([
          fetch("/api/rooms"),
          fetch("/api/resources")
        ])
        
        const roomsData = await roomsRes.json()
        const resourcesData = await resourcesRes.json()
        
        const availableRooms = Array.isArray(roomsData) 
          ? roomsData.filter((room: Room) => room.status === "available")
          : []
        
        const availableResources = Array.isArray(resourcesData)
          ? resourcesData.filter((resource: Resource) => resource.status === "available")
          : []
        
        setRooms(availableRooms)
        setFilteredRooms(availableRooms)
        setResources(availableResources)
        
        // If room is preselected, set it in form data
        if (preselectedRoomId) {
          const room = availableRooms.find((r: Room) => r.id === preselectedRoomId)
          if (room) {
            setFormData((prev) => ({ ...prev, room_id: preselectedRoomId }))
          }
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error)
        toast({
          title: "Error",
          description: "Failed to load rooms and resources. Please try again later.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [preselectedRoomId, toast])

  // Fetch booked slots when date or room changes
  useEffect(() => {
    if (formData.date && formData.room_id) {
      const fetchBookedSlots = async () => {
        try {
          const formattedDate = format(formData.date, "yyyy-MM-dd")
          const response = await fetch(`/api/bookings?roomId=${formData.room_id}&date=${formattedDate}`)
          
          if (!response.ok) {
            throw new Error(`API returned status ${response.status}`)
          }
          
          const bookings = await response.json()
          
          if (Array.isArray(bookings)) {
            const bookedSlots = bookings.flatMap(booking => {
              const start = new Date(booking.start_time)
              const end = new Date(booking.end_time)
              const slots = []
              for (let d = new Date(start); d < end; d.setMinutes(d.getMinutes() + 30)) {
                slots.push(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
              }
              return slots
            })
            setBookedTimeSlots(bookedSlots)
          } else {
            console.error("Fetched bookings is not an array:", bookings)
            setBookedTimeSlots([])
          }
        } catch (error) {
          console.error("Failed to fetch booked slots:", error)
          toast({
            title: "Error",
            description: "Could not fetch booked time slots for the selected room and date.",
            variant: "destructive",
          })
          setBookedTimeSlots([])
        }
      }
      fetchBookedSlots()
    } else {
      setBookedTimeSlots([])
    }
  }, [formData.date, formData.room_id, toast])
  
  // Filter rooms based on capacity and resources
  useEffect(() => {
    const attendeesCount = parseInt(formData.attendees) || 0
    
    const filtered = rooms.filter((room) => {
      // Capacity check
      if (attendeesCount > 0 && room.capacity < attendeesCount) {
        return false
      }
      
      // Resources check
      if (formData.selectedResources.length > 0) {
        if (!room.room_resources) return false
      return formData.selectedResources.every((resourceId) => 
          room.room_resources?.includes(resourceId)
      )
      }
      
      return true
    })
    
    setFilteredRooms(filtered)
  }, [formData.selectedResources, formData.attendees, rooms])

  // Generate time slots
  useEffect(() => {
    const slots = []
    for (let i = 8; i < 18; i++) {
      slots.push(`${String(i).padStart(2, '0')}:00`)
      slots.push(`${String(i).padStart(2, '0')}:30`)
    }
    setAvailableTimeSlots(slots)
  }, [])

// Check if a time slot is booked
const isTimeSlotBooked = (time: string) => {
  return bookedTimeSlots.includes(time);
}

// Check if a time range has any conflicts
const hasTimeRangeConflict = (start: string, end: string) => {
  if (!start || !end) return false;
  
  const startTime = timeToMinutes(start);
  const endTime = timeToMinutes(end);
  
  // Check each 30-minute slot in the range
  for (let time = startTime; time < endTime; time += 30) {
    const timeStr = minutesToTimeString(time);
    if (isTimeSlotBooked(timeStr)) {
      return true;
    }
  }
  
  return false;
}

// Check if meeting duration is valid (at least 30 minutes)
const isValidDuration = (start: string, end: string) => {
  if (!start || !end) return false;
  
  const startTime = timeToMinutes(start);
  const endTime = timeToMinutes(end);
  
  return endTime - startTime >= 30;
}

// Convert time string (HH:MM) to minutes since midnight
const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes since midnight to time string (HH:MM)
const minutesToTimeString = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const toggleResource = (resourceId: string) => {
    setFormData((prev) => {
      const selectedResources = prev.selectedResources.includes(resourceId)
        ? prev.selectedResources.filter((id) => id !== resourceId)
        : [...prev.selectedResources, resourceId]
      
      return { ...prev, selectedResources }
    })
  }

  const validateStep = () => {
    const newErrors: Record<string, string> = {}
    switch (currentStep) {
      case 0:
        if (!formData.title) newErrors.title = "Meeting title is required."
        if (!formData.attendees) newErrors.attendees = "Number of attendees is required."
        else if (isNaN(parseInt(formData.attendees)) || parseInt(formData.attendees) <= 0) {
          newErrors.attendees = "Please enter a valid number of attendees."
        }
        break
      case 2:
        if (!formData.room_id) newErrors.room = "Please select a room."
        break
      case 3:
        if (!formData.date) newErrors.date = "Please select a date."
        if (!formData.start_time) newErrors.start_time = "Please select a start time."
        if (!formData.end_time) newErrors.end_time = "Please select an end time."
        
        if (formData.start_time && formData.end_time) {
          const startMinutes = timeToMinutes(formData.start_time);
          const endMinutes = timeToMinutes(formData.end_time);
          
          if (endMinutes <= startMinutes) {
            newErrors.end_time = "End time must be after start time.";
          } else if (!isValidDuration(formData.start_time, formData.end_time)) {
            newErrors.end_time = "Meeting must be at least 30 minutes long.";
          } else if (hasTimeRangeConflict(formData.start_time, formData.end_time)) {
            newErrors.time_conflict = "Your selected time range includes already booked slots.";
          }
        }
        break
      default:
        break
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep()) {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Update the handleSubmit function to fix the booking data format
  const handleSubmit = async () => {
    if (!validateStep()) return

    setSubmitting(true)
    
    try {
      if (!formData.date || !formData.start_time || !formData.end_time) {
        throw new Error("Please select a date, start time, and end time.");
      }
      
      if (!isValidDuration(formData.start_time, formData.end_time)) {
        throw new Error("Meeting must be at least 30 minutes long.");
      }
      
      if (hasTimeRangeConflict(formData.start_time, formData.end_time)) {
        throw new Error("Selected time range includes already booked slots.");
      }
      
      // Get authentication session
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        throw new Error("You must be logged in to book a room. Please log in and try again.");
      }
      
      // Create the date objects directly from the date string
      if (!formData.date) {
        throw new Error("Date is required");
      }
      const dateStr = format(formData.date, 'yyyy-MM-dd');
      const startTime = new Date(`${dateStr}T${formData.start_time}:00`);
      const endTime = new Date(`${dateStr}T${formData.end_time}:00`);
      
      // Format attendees as a string array to match schema
      const attendeesArray = formData.attendees ? [formData.attendees] : [];
        
      const bookingData = {
        title: formData.title,
        description: formData.description || null,
        user_id: user?.id,
        room_id: formData.room_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        attendees: attendeesArray,
        status: "pending",
        resources: formData.selectedResources.length > 0 ? formData.selectedResources : null,
      };
    
      console.log("Submitting booking data:", bookingData);
      
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(bookingData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Failed to create booking.");
      }
      
      const result = await response.json();
      console.log("Booking created successfully:", result);
      
      toast({
        title: "Booking Confirmed!",
        description: `Your booking for ${formData.title} is pending approval from the administrator.`,
      });
      
      router.push("/conference-room-booking/bookings");
    } catch (error: any) {
      console.error("Booking submission failed:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., Quarterly Review" 
              />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Briefly describe the purpose of the meeting."
              />
            </div>
            <div>
              <Label htmlFor="attendees">Number of Attendees</Label>
              <Input
                id="attendees"
                type="number"
                value={formData.attendees}
                onChange={(e) => handleChange("attendees", e.target.value)}
                placeholder="e.g., 10" 
              />
              {errors.attendees && <p className="text-sm text-destructive mt-1">{errors.attendees}</p>}
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-4">
            {resources.map(resource => (
                  <ResourceItem
                    key={resource.id}
                    resource={resource}
                    selected={formData.selectedResources.includes(resource.id)}
                    onToggle={() => toggleResource(resource.id)}
                  />
                ))}
          </div>
        )
      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    selected={formData.room_id === room.id}
                    onSelect={() => handleChange("room_id", room.id)}
                  />
                ))}
            {errors.room && <p className="text-sm text-destructive mt-1 col-span-full">{errors.room}</p>}
          </div>
        )
      case 3:
        return (
          <div className="flex flex-col gap-6">
            <div className="bg-card rounded-lg p-4 border shadow-sm">
              <h4 className="font-semibold mb-3 text-foreground">Select Date</h4>
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) => handleChange("date", date)}
                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                className="rounded-md"
                modifiers={{ selected: formData.date ? [formData.date] : [] }}
                modifiersStyles={{
                  selected: { 
                    backgroundColor: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                    fontWeight: "bold"
                  }
                }}
                weekStartsOn={1} // Start week on Monday
                showOutsideDays={false} // Don't show days from previous/next months
                fromDate={new Date()} // Only allow selection from today onwards
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full justify-between",
                  head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center",
                  row: "flex w-full mt-2 justify-between",
                  cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                  day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
              {errors.date && <p className="text-sm text-destructive mt-1">{errors.date}</p>}
            </div>
            
            {formData.date && (
              <div className="bg-card rounded-lg p-4 border shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-foreground">Select Time</h4>
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>Minimum duration: 30 minutes</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium">Start Time</h5>
                      {formData.start_time && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Selected: {formData.start_time}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableTimeSlots.map(time => (
                        <TimeSlot
                          key={`start-${time}`}
                          time={time}
                          isAvailable={!isTimeSlotBooked(time) && (!formData.end_time || timeToMinutes(time) < timeToMinutes(formData.end_time))}
                          isSelected={formData.start_time === time}
                          onSelect={() => {
                            handleChange("start_time", time);
                            // If end time is before start time, clear it
                            if (formData.end_time && timeToMinutes(time) >= timeToMinutes(formData.end_time)) {
                              handleChange("end_time", "");
                            }
                          }}
                        />
                      ))}
                    </div>
                    {errors.start_time && <p className="text-sm text-destructive mt-2">{errors.start_time}</p>}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium">End Time</h5>
                      {formData.end_time && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Selected: {formData.end_time}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableTimeSlots.map(time => {
                        // Check if this time is valid as an end time (at least 30 minutes after start time)
                        const isValidEndTime = formData.start_time ? 
                          timeToMinutes(time) >= timeToMinutes(formData.start_time) + 30 : 
                          true;
                          
                        return (
                          <TimeSlot
                            key={`end-${time}`}
                            time={time}
                            isAvailable={!isTimeSlotBooked(time) && isValidEndTime}
                            isSelected={formData.end_time === time}
                            onSelect={() => handleChange("end_time", time)}
                          />
                        );
                      })}
                    </div>
                    {errors.end_time && <p className="text-sm text-destructive mt-2">{errors.end_time}</p>}
                  </div>
                </div>
                
                {errors.time_conflict && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">{errors.time_conflict}</p>
                  </div>
                )}
                
                {formData.start_time && formData.end_time && !errors.time_conflict && (
                  <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <p className="text-sm">
                      Your booking will be from <span className="font-medium">{formData.start_time}</span> to <span className="font-medium">{formData.end_time}</span>
                      {formData.start_time && formData.end_time && (
                        <span className="ml-1 text-muted-foreground">
                          ({Math.round((timeToMinutes(formData.end_time) - timeToMinutes(formData.start_time)) / 30) * 30} minutes)
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {!formData.date && (
              <div className="flex items-center justify-center h-40 bg-muted/30 rounded-md border border-dashed">
                <p className="text-muted-foreground">Please select a date first</p>
              </div>
            )}
          </div>
        )
      case 4:
        const selectedRoom = rooms.find(r => r.id === formData.room_id)
        return (
          <div className="space-y-6 text-sm">
            <h3 className="text-xl font-bold text-foreground">Confirm Your Booking</h3>
            <div className="p-6 bg-muted/50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-muted-foreground">Meeting Title</p>
                  <p className="text-foreground">{formData.title}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Attendees</p>
                  <p className="text-foreground">{formData.attendees}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Date</p>
                  <p className="text-foreground">{formData.date ? format(formData.date as Date, 'PPP') : 'Not selected'}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Time</p>
                  <p className="text-foreground">
                    {formData.start_time} - {formData.end_time}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="font-semibold text-muted-foreground">Room</p>
                  <p className="text-foreground">{selectedRoom?.name} ({selectedRoom?.location})</p>
                </div>
                {formData.selectedResources.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="font-semibold text-muted-foreground">Selected Resources</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.selectedResources.map(id => {
                        const resource = resources.find(r => r.id === id)
                        return resource ? <Badge key={id} variant="secondary">{resource.name}</Badge> : null
                      })}
                    </div>
                  </div>
                )}
              </div>
              {formData.description && (
                <div>
                  <p className="font-semibold text-muted-foreground">Description</p>
                  <p className="text-foreground whitespace-pre-wrap">{formData.description}</p>
                </div>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="p-6 text-center">
          <p>Loading...</p>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="p-6">
        <Card className="max-w-4xl mx-auto bg-card border-border/50">
        <CardHeader>
            <StepIndicator currentStep={currentStep} steps={steps} />
            <CardTitle className="text-center text-2xl font-bold text-foreground">
              {steps[currentStep]}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {
                currentStep === 0 ? "Let's start with the basic details of your meeting." :
                currentStep === 1 ? "Select any additional resources you'll need." :
                currentStep === 2 ? "Choose a room that fits your needs." :
                currentStep === 3 ? "Select a date and time for your meeting." :
                "Please review and confirm your booking details."
              }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
          <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
            {currentStep < totalSteps - 1 ? (
              <Button onClick={nextStep}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Confirm Booking"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
    </ProtectedRoute>
  )
}
