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
  AlertCircle,
  Projector,
  Wifi,
  Monitor,
  Mic,
  VideoIcon
} from "lucide-react"
import { format, addDays } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Room, Resource } from "@/types"

// Step indicators component
const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  return (
    <div className="flex items-center justify-center space-x-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            index === currentStep
              ? "bg-primary text-primary-foreground"
              : index < currentStep
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {index + 1}
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
        "flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border"
      )}
      onClick={onToggle}
    >
      <Checkbox checked={selected} onCheckedChange={onToggle} />
      <div className="flex-1">
        <p className="font-medium">{resource.name}</p>
        <p className="text-sm text-muted-foreground">{resource.description}</p>
      </div>
      <Badge variant={resource.status === "available" ? "outline" : "secondary"}>
        {resource.status}
      </Badge>
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
        "cursor-pointer transition-all hover:shadow-md",
        selected ? "border-primary ring-2 ring-primary/20" : ""
      )}
      onClick={onSelect}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
        {room.image ? (
          <img
            src={room.image}
            alt={room.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Building className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{room.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {room.location}
            </p>
          </div>
          {selected && (
            <Badge className="bg-primary">Selected</Badge>
          )}
        </div>
        <div className="mt-2 space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Capacity: {room.capacity} people</span>
          </div>
          {room.room_resources && room.room_resources.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {room.room_resources.map((resourceId) => (
                <Badge key={resourceId} variant="outline" className="text-xs">
                  {resourceId}
                </Badge>
              ))}
            </div>
          )}
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
    <div
      className={cn(
        "px-3 py-2 rounded-md text-sm transition-all",
        isSelected ? "bg-primary text-primary-foreground" : 
        isAvailable ? "bg-background hover:bg-muted border cursor-pointer" : 
        "bg-muted/30 text-muted-foreground cursor-not-allowed opacity-60 blur-[0.3px] border-dashed border-muted"
      )}
      onClick={() => isAvailable && onSelect()}
      title={isAvailable ? `Select ${time}` : `Already booked at ${time}`}
    >
      {time}
      {!isAvailable && (
        <div className="flex items-center justify-center mt-1">
          <span className="text-[10px] text-muted-foreground">Booked</span>
        </div>
      )}
    </div>
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
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [preselectedRoomId])

  // Filter rooms based on selected resources and capacity
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

  // Generate time slots for selected date and room
  useEffect(() => {
    if (formData.date && formData.room_id) {
      // Generate all possible time slots from 8 AM to 6 PM
      const allTimeSlots: string[] = []
      for (let hour = 8; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          allTimeSlots.push(timeString)
        }
      }
      
      // Fetch actual booked slots from API
      const fetchBookedSlots = async () => {
        try {
          const formattedDate = format(formData.date!, 'yyyy-MM-dd')
          
          // Construct the date range for the selected day (from 00:00 to 23:59)
          const startOfDay = `${formattedDate}T00:00:00`
          const endOfDay = `${formattedDate}T23:59:59`
          
          const response = await fetch(`/api/bookings?roomId=${formData.room_id}&start=${startOfDay}&end=${endOfDay}`)
          
          if (!response.ok) {
            throw new Error('Failed to fetch bookings')
          }
          
          const bookings = await response.json()
          
          // Extract booked time slots from bookings
          const bookedSlots: string[] = []
          
          for (const booking of bookings) {
            if (booking.status === 'confirmed' || booking.status === 'pending') {
              // Extract just the time part (HH:MM) from the datetime strings
              const startTime = booking.start_time.split('T')[1].substring(0, 5)
              const endTime = booking.end_time.split('T')[1].substring(0, 5)
              
              // Add all time slots between start and end time
              let currentSlot = startTime
              while (currentSlot < endTime) {
                bookedSlots.push(currentSlot)
                
                // Move to next 30-minute slot
                const [hours, minutes] = currentSlot.split(':').map(Number)
                let newMinutes = minutes + 30
                let newHours = hours
                
                if (newMinutes >= 60) {
                  newMinutes = 0
                  newHours += 1
                }
                
                currentSlot = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
              }
            }
          }
          
          setAvailableTimeSlots(allTimeSlots.filter(slot => !bookedSlots.includes(slot)))
          setBookedTimeSlots(bookedSlots)
        } catch (error) {
          console.error('Error fetching booked slots:', error)
          // Fallback to showing all slots as available
          setAvailableTimeSlots(allTimeSlots)
          setBookedTimeSlots([])
        }
      }
      
      fetchBookedSlots()
    }
  }, [formData.date, formData.room_id])

  // Handle form input changes
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  // Toggle resource selection
  const toggleResource = (resourceId: string) => {
    setFormData((prev) => {
      const selectedResources = prev.selectedResources.includes(resourceId)
        ? prev.selectedResources.filter((id) => id !== resourceId)
        : [...prev.selectedResources, resourceId]
      
      return { ...prev, selectedResources }
    })
  }

  // Validate current step
  const validateStep = () => {
    const newErrors: Record<string, string> = {}
    
    switch (currentStep) {
      case 0: // Meeting Details
        if (!formData.title.trim()) {
          newErrors.title = "Meeting title is required"
        }
        
        if (!formData.date) {
          newErrors.date = "Please select a date"
        }
        break
        
      case 1: // Resource Selection
        // No validation needed
        break
        
      case 2: // Room Selection
        if (!formData.room_id) {
          newErrors.room_id = "Please select a room"
        }
        break
        
      case 3: // Time Selection
        if (!formData.start_time) {
          newErrors.start_time = "Please select a start time"
        }
        
        if (!formData.end_time) {
          newErrors.end_time = "Please select an end time"
        }
        
        if (formData.start_time && formData.end_time) {
          const start = formData.start_time
          const end = formData.end_time
          
          if (end <= start) {
            newErrors.end_time = "End time must be after start time"
          }
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Navigate to next step
  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1))
    }
  }

  // Navigate to previous step
  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  // Handle form submission
  const handleSubmit = async () => {
    setSubmitting(true)
    
    try {
      // Check if user exists
      if (!user || !user.id) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create a booking.",
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }
      
      // Format the date and time for the API
      const formattedDate = format(formData.date!, 'yyyy-MM-dd')
      const startDateTime = `${formattedDate}T${formData.start_time}:00`
      const endDateTime = `${formattedDate}T${formData.end_time}:00`
      
      const bookingData = {
        room_id: formData.room_id,
        user_id: user.id,
        title: formData.title,
        description: formData.description || null,
        start_time: startDateTime,
        end_time: endDateTime,
        attendees: formData.attendees ? [formData.attendees] : [],
        status: "pending", // All new bookings start as pending
        resources: formData.selectedResources
      }
      
      console.log("Sending booking data:", bookingData)
      
      // Make the actual API call to create a booking
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer token` // In a real app, use an actual token
        },
        body: JSON.stringify(bookingData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create booking")
      }
      
      toast({
        title: "Booking Request Submitted",
        description: "Your booking request has been submitted and is pending approval.",
      })
      
      router.push("/conference-room-booking/bookings")
    } catch (error) {
      console.error("Failed to submit booking:", error)
      
      toast({
        title: "Error",
        description: "Failed to submit booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Meeting Details
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Enter meeting title"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe the purpose of your meeting"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendees">Expected Attendees</Label>
              <Input
                id="attendees"
                type="number"
                value={formData.attendees}
                onChange={(e) => handleChange("attendees", e.target.value)}
                placeholder="Number of people"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground",
                      errors.date && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => handleChange("date", date)}
                    disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.date}
                </p>
              )}
            </div>
          </div>
        )
        
      case 1: // Resource Selection
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the resources you need for your meeting. Only rooms with these resources will be shown in the next step.
            </p>
            
            {resources.length > 0 ? (
              <div className="grid gap-3">
                {resources.map((resource) => (
                  <ResourceItem
                    key={resource.id}
                    resource={resource}
                    selected={formData.selectedResources.includes(resource.id)}
                    onToggle={() => toggleResource(resource.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">
                No resources available
              </p>
            )}
          </div>
        )
        
      case 2: // Room Selection
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a room for your meeting. 
              {formData.selectedResources.length > 0 && " Only rooms with your selected resources are shown."}
            </p>
            
            {filteredRooms.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    selected={formData.room_id === room.id}
                    onSelect={() => handleChange("room_id", room.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No rooms available with the selected resources.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setCurrentStep(1)}
                >
                  Adjust Resource Selection
                </Button>
              </div>
            )}
            
            {errors.room_id && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.room_id}
              </p>
            )}
          </div>
        )
        
      case 3: // Time Selection
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Select a start and end time for your meeting. Booked time slots are blurred out and unavailable.
            </p>
            
            <div className="bg-muted/20 p-4 rounded-md">
              <div className="flex items-center mb-2 text-sm">
                <div className="flex items-center mr-4">
                  <div className="w-3 h-3 bg-background border rounded-sm mr-1"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center mr-4">
                  <div className="w-3 h-3 bg-primary rounded-sm mr-1"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-muted/30 blur-[0.3px] border-dashed border-muted rounded-sm mr-1"></div>
                  <span>Booked</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">Start Time *</Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mt-3">
                  {availableTimeSlots.map((time) => (
                    <TimeSlot
                      key={`start-${time}`}
                      time={time}
                      isAvailable={!bookedTimeSlots.includes(time)}
                      isSelected={formData.start_time === time}
                      onSelect={() => handleChange("start_time", time)}
                    />
                  ))}
                </div>
                {errors.start_time && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.start_time}
                  </p>
                )}
              </div>
              
              <div>
                <Label className="text-base font-medium">End Time *</Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mt-3">
                  {availableTimeSlots.map((time) => (
                    <TimeSlot
                      key={`end-${time}`}
                      time={time}
                      isAvailable={
                        !bookedTimeSlots.includes(time) && 
                        (formData.start_time ? time > formData.start_time : true)
                      }
                      isSelected={formData.end_time === time}
                      onSelect={() => handleChange("end_time", time)}
                    />
                  ))}
                </div>
                {errors.end_time && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.end_time}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
        
      case 4: // Confirmation
        const selectedRoom = rooms.find((room) => room.id === formData.room_id)
        const selectedResourceIds = formData.selectedResources
        const selectedResourcesData = resources.filter((resource) => 
          selectedResourceIds.includes(resource.id)
        )
        
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-medium">Meeting Details</h3>
              <div className="bg-muted/50 p-4 rounded-md space-y-2">
                <p><span className="font-medium">Title:</span> {formData.title}</p>
                {formData.description && (
                  <p><span className="font-medium">Description:</span> {formData.description}</p>
                )}
                <p>
                  <span className="font-medium">Date:</span>{" "}
                  {formData.date ? format(formData.date, "PPP") : ""}
                </p>
                <p>
                  <span className="font-medium">Time:</span>{" "}
                  {formData.start_time} - {formData.end_time}
                </p>
                {formData.attendees && (
                  <p>
                    <span className="font-medium">Attendees:</span> {formData.attendees}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Selected Room</h3>
              {selectedRoom ? (
                <div className="bg-muted/50 p-4 rounded-md">
                  <p className="font-medium">{selectedRoom.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedRoom.location}
                  </p>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Capacity:</span> {selectedRoom.capacity} people
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No room selected</p>
              )}
            </div>
            
            {selectedResourcesData.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Selected Resources</h3>
                <div className="bg-muted/50 p-4 rounded-md">
                  <ul className="space-y-1">
                    {selectedResourcesData.map((resource) => (
                      <li key={resource.id} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {resource.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Your booking will be submitted with <strong>pending</strong> status. An administrator will review and approve your request.
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Book a Room</h1>
        <p className="text-muted-foreground">Reserve a conference room for your meeting</p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{steps[currentStep]}</CardTitle>
          <CardDescription>
            Step {currentStep + 1} of {totalSteps}
          </CardDescription>
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        </CardHeader>
        
        <CardContent>
          {renderStepContent()}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t bg-muted/50 p-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          {currentStep === totalSteps - 1 ? (
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Submit Booking
                </>
              )}
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
