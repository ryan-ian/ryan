
"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  CreditCard,
  Loader2,
  ChevronRight
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Room } from "@/types"
import { ProtectedRoute } from "@/components/protected-route"
import { retrieveRoomData, doesStoredRoomMatch, clearRoomData, getStorageInfo } from "@/lib/booking-session"

// Import reusable components
import { Calendar } from "@/components/booking/calendar"
import { TimeSlotSelector } from "@/components/booking/time-slot-selector"

// PaystackPop type is already declared in lib/paystack-config.ts

// Step indicator component
const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const steps = [
    { number: 1, title: "Room", description: "Selected Room" },
    { number: 2, title: "Details", description: "Booking Form" },
    { number: 3, title: "Payment", description: "Review & Pay" }
  ]

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < currentStep ? <Check className="h-5 w-5" /> : step.number}
              </div>
              <div className="mt-2 text-center">
                <div className={cn(
                  "text-sm font-medium",
                  index <= currentStep ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-4 transition-colors duration-300",
                index < currentStep ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Room display component
const RoomDisplay = ({ room, loadingSource }: { room: Room; loadingSource: 'session' | 'api' | 'error' }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Loading source indicator */}
      {loadingSource === 'session' && (
        <div className="flex items-center justify-center animate-in slide-in-from-top duration-300 delay-150">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
            <Check className="h-3 w-3 mr-1" />
            Instantly loaded from your selection
          </div>
        </div>
      )}
      
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 shadow-lg animate-in slide-in-from-bottom duration-500 delay-100">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 shadow-md">
              {room.image ? (
                <img
                  src={room.image}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                  <Building className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground mb-1">{room.name}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{room.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{room.capacity} people</span>
                </div>
              </div>
              {room.description && (
                <p className="text-sm text-muted-foreground mb-3">{room.description}</p>
              )}
              {room.hourly_rate && room.hourly_rate > 0 && (
                <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-1 shadow-sm">
                  <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                    {room.currency || 'GHS'} {room.hourly_rate}/hour
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Booking form component
interface BookingFormData {
  title: string
  description: string
  date: Date | null
  startTime: string
  endTime: string
}

const BookingForm = ({ 
  formData, 
  onChange, 
  room 
}: { 
  formData: BookingFormData
  onChange: (data: Partial<BookingFormData>) => void
  room: Room 
}) => {
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  // Fetch booked time slots when date changes
  useEffect(() => {
    if (formData.date && room) {
      fetchBookedSlots(formData.date, room.id)
    }
  }, [formData.date, room])

  const fetchBookedSlots = async (date: Date, roomId: string) => {
    setIsLoadingSlots(true)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const response = await fetch(`/api/bookings?roomId=${roomId}&date=${dateStr}`)
      
      if (response.ok) {
        const bookings = await response.json()
        const bookedSlots: string[] = []
        
        bookings.forEach((booking: any) => {
          const start = new Date(booking.start_time)
          const end = new Date(booking.end_time)
          
          // Generate 30-minute slots between start and end
          const currentSlot = new Date(start)
          while (currentSlot < end) {
            bookedSlots.push(format(currentSlot, 'HH:mm'))
            currentSlot.setMinutes(currentSlot.getMinutes() + 30)
          }
        })
        
        setBookedTimeSlots(bookedSlots)
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error)
    } finally {
      setIsLoadingSlots(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ title: e.target.value })}
              placeholder="e.g., Weekly Team Meeting"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ description: e.target.value })}
              placeholder="Meeting agenda and details..."
              className="mt-1 resize-none h-24"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Select Date *</Label>
            <div className="mt-1">
              <Calendar
                selected={formData.date}
                onSelect={(date) => onChange({ date })}
                className="rounded-md border"
              />
            </div>
          </div>
        </div>
      </div>

      {formData.date && (
        <div className="space-y-4">
          <div className="border-t pt-6">
            <Label>Select Time *</Label>
            <TimeSlotSelector
              selectedDate={formData.date}
              startTime={formData.startTime}
              endTime={formData.endTime}
              onStartTimeChange={(time) => onChange({ startTime: time })}
              onEndTimeChange={(time) => onChange({ endTime: time })}
              bookedSlots={bookedTimeSlots}
              isLoading={isLoadingSlots}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Review and payment component
const ReviewAndPayment = ({ 
  formData, 
  room, 
  onPayment,
  onDirectPayment
}: { 
  formData: BookingFormData
  room: Room
  onPayment: () => void
  onDirectPayment: (bookingData: any, amount: number, currency: string) => Promise<void>
}) => {
  const [paymentState, setPaymentState] = useState<'ready' | 'initializing' | 'processing' | 'verifying' | 'success' | 'error'>('ready')
  const [paymentError, setPaymentError] = useState<string>('')
  const { user } = useAuth()
  const { toast } = useToast()

  const calculateCost = () => {
    if (!formData.startTime || !formData.endTime || !room.hourly_rate) return 0
    
    const start = new Date(`2000-01-01T${formData.startTime}:00`)
    const end = new Date(`2000-01-01T${formData.endTime}:00`)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    
    return Math.ceil(durationHours) * room.hourly_rate
  }

  const totalCost = calculateCost()
  const requiresPayment = room.hourly_rate && room.hourly_rate > 0

  // Direct payment initialization
  const handleDirectPayment = async () => {
    if (!user || !formData.date) {
      setPaymentError('Missing required information')
      setPaymentState('error')
      return
    }

    setPaymentState('initializing')
    setPaymentError('')

    try {
      const bookingData = {
        room_id: room.id,
        title: formData.title,
        description: formData.description,
        start_time: new Date(`${format(formData.date, 'yyyy-MM-dd')}T${formData.startTime}:00`).toISOString(),
        end_time: new Date(`${format(formData.date, 'yyyy-MM-dd')}T${formData.endTime}:00`).toISOString()
      }

      // Initialize payment with existing API
      const token = localStorage.getItem("auth-token")
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Payment initialization failed')
      }

      setPaymentState('processing')

      // Load Paystack script if not already loaded
      if (!window.PaystackPop) {
        await loadPaystackScript()
      }

      // Open Paystack modal directly
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        email: user.email,
        amount: totalCost * 100, // Convert to kobo/pesewas
        currency: room.currency || 'GHS',
        ref: result.payment.reference,
        callback: function(response: any) {
          handlePaymentSuccess(response)
        },
        onClose: function() {
          setPaymentState('ready')
          toast({
            title: "Payment Cancelled",
            description: "You can try again when you're ready.",
            variant: "default"
          })
        }
      })
      
      handler.openIframe()

    } catch (error: any) {
      console.error('Payment initialization error:', error)
      setPaymentError(error.message || 'Failed to initialize payment')
      setPaymentState('error')
      
      toast({
        title: "Payment Failed",
        description: error.message || 'Failed to initialize payment. Please try again.',
        variant: "destructive"
      })
    }
  }

  // Handle payment success callback
  const handlePaymentSuccess = async (response: any) => {
    setPaymentState('verifying')

    try {
      const token = localStorage.getItem("auth-token")
      
      const verifyResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reference: response.reference
        })
      })

      const verifyResult = await verifyResponse.json()

      if (verifyResponse.ok && verifyResult.success) {
        setPaymentState('success')
        
        // Show success toast
        toast({
          title: "🎉 Payment Successful!",
          description: `Your booking for ${room.name} has been confirmed. Total paid: ${room.currency || 'GHS'} ${totalCost.toFixed(2)}`,
          duration: 5000,
        })

        // Wait a moment to show success state, then proceed
        setTimeout(() => {
          onDirectPayment(verifyResult, totalCost, room.currency || 'GHS')
        }, 1500)
      } else {
        throw new Error(verifyResult.message || 'Payment verification failed')
      }
    } catch (error: any) {
      console.error('Payment verification error:', error)
      setPaymentError(error.message || 'Payment verification failed')
      setPaymentState('error')
      
      toast({
        title: "Verification Failed",
        description: error.message || 'Payment verification failed. Please contact support if payment was deducted.',
        variant: "destructive"
      })
    }
  }

  // Load Paystack script dynamically
  const loadPaystackScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.PaystackPop) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Paystack'))
      document.body.appendChild(script)
    })
  }

  // Retry payment
  const retryPayment = () => {
    setPaymentState('ready')
    setPaymentError('')
    handleDirectPayment()
  }

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Meeting Title</span>
              <p className="mt-1">{formData.title}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Room</span>
              <p className="mt-1">{room.name}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Date</span>
              <p className="mt-1">{formData.date ? format(formData.date, 'PPP') : 'Not selected'}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Time</span>
              <p className="mt-1">{formData.startTime} - {formData.endTime}</p>
            </div>
          </div>
          
          {formData.description && (
            <div>
              <span className="font-medium text-muted-foreground">Description</span>
              <p className="mt-1 text-sm">{formData.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Summary */}
      {requiresPayment ? (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Hourly Rate:</span>
                <span>{room.currency || 'GHS'} {room.hourly_rate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Duration:</span>
                <span>{Math.ceil((new Date(`2000-01-01T${formData.endTime}:00`).getTime() - new Date(`2000-01-01T${formData.startTime}:00`).getTime()) / (1000 * 60 * 60))} hours</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{room.currency || 'GHS'} {totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Error Display */}
            {paymentState === 'error' && paymentError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive font-medium">Payment Failed</p>
                </div>
                <p className="text-sm text-destructive mt-1">{paymentError}</p>
              </div>
            )}
            
            {/* Dynamic Payment Button */}
            <Button 
              onClick={paymentState === 'error' ? retryPayment : handleDirectPayment}
              disabled={paymentState === 'initializing' || paymentState === 'processing' || paymentState === 'verifying' || paymentState === 'success'}
              className={cn(
                "w-full transition-all duration-300",
                paymentState === 'success' && "bg-green-600 hover:bg-green-700",
                paymentState === 'error' && "bg-destructive hover:bg-destructive/90"
              )}
              size="lg"
            >
              {paymentState === 'ready' && (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay with Paystack
                </>
              )}
              {paymentState === 'initializing' && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing Payment...
                </>
              )}
              {paymentState === 'processing' && (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-pulse" />
                  Complete Payment in Paystack Window
                </>
              )}
              {paymentState === 'verifying' && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Payment...
                </>
              )}
              {paymentState === 'success' && (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Payment Successful!
                </>
              )}
              {paymentState === 'error' && (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>

            {/* Processing Status */}
            {paymentState === 'processing' && (
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Please complete your payment in the Paystack window. Do not close this page.
                </p>
              </div>
            )}

            {/* Success Status */}
            {paymentState === 'success' && (
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  Payment completed successfully! Your booking is being finalized...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-1">No Payment Required</h3>
              <p className="text-sm text-green-600 dark:text-green-400 mb-4">This room is free to book</p>
              <Button 
                onClick={onPayment}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                Confirm Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Main component wrapped in Suspense boundary
function BookingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState(0)
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingSource, setLoadingSource] = useState<'session' | 'api' | 'error'>('session')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<BookingFormData>({
    title: "",
    description: "",
    date: null,
    startTime: "",
    endTime: ""
  })

  // Get room ID from URL params
  const roomId = searchParams.get("roomId")

  // Hybrid room loading: session storage first, then API fallback
  useEffect(() => {
    if (roomId) {
      loadRoomData(roomId)
    } else {
      // Redirect to room selection if no room ID
      router.push("/conference-room-booking")
    }
  }, [roomId, router])

  const loadRoomData = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // Step 1: Check session storage first
      console.log('🔍 Checking session storage for room data...')
      const storedRoom = retrieveRoomData()
      
      if (storedRoom && doesStoredRoomMatch(id)) {
        console.log('✅ Found valid room data in session storage:', storedRoom.name)
        setRoom(storedRoom)
        setLoadingSource('session')
        setLoading(false)
        return
      }
      
      console.log('📡 No valid session data found, fetching from API...')
      
      // Step 2: Fallback to API
      setLoadingSource('api')
      const response = await fetch(`/api/rooms/${id}`)
      
      if (response.ok) {
        const roomData = await response.json()
        console.log('✅ Room data fetched from API:', roomData.name)
        setRoom(roomData)
        setLoadingSource('api')
      } else if (response.status === 404) {
        throw new Error('Room not found')
      } else {
        throw new Error('Failed to load room details')
      }
    } catch (error: any) {
      console.error('❌ Error loading room:', error)
      setError(error.message || 'Failed to load room details')
      setLoadingSource('error')
      
      // Clear any stale session data
      clearRoomData()
    } finally {
      setLoading(false)
    }
  }

  // Retry loading room data
  const retryLoadRoom = () => {
    if (roomId) {
      loadRoomData(roomId)
    }
  }

  const updateFormData = (updates: Partial<BookingFormData>) => {
    setFormData((prev: BookingFormData) => ({ ...prev, ...updates }))
  }

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim().length >= 2 &&
               formData.date !== null &&
               formData.startTime !== "" &&
               formData.endTime !== ""
      case 2:
        return true // Review step, no additional validation needed
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((prev: number) => prev + 1)
    } else {
      toast({
        title: "Please complete all required fields",
        description: "Fill in all required information before proceeding",
        variant: "destructive"
      })
    }
  }

  const prevStep = () => {
    setCurrentStep((prev: number) => prev - 1)
  }

  const handlePayment = () => {
    // Free booking - create directly
    createBooking()
  }

  // Handle direct payment success
  const handleDirectPaymentSuccess = async (paymentData: any, amount: number, currency: string) => {
    // Payment was successful, booking should already be created by payment verification
    toast({
      title: "🎉 Booking Request Submitted!",
      description: `Your booking for ${room?.name} has been submitted for approval. Payment of ${currency} ${amount.toFixed(2)} processed successfully.`,
      duration: 5000,
    })
    
    // Redirect to bookings page
    setTimeout(() => {
      router.push("/conference-room-booking/bookings")
    }, 1000)
  }

  const createBooking = async (paymentData?: any) => {
    setSubmitting(true)
    
    try {
      if (!formData.date || !user) throw new Error("Missing required data")

      if (paymentData) {
        // Payment was successful, booking should already be created by payment verification
        toast({
          title: "Booking Confirmed!",
          description: "Your payment was successful and booking is confirmed"
        })
        router.push("/conference-room-booking/bookings")
        return
      }

      // For free rooms, create booking directly
      const bookingData = {
        room_id: room!.id,
        user_id: user.id,
        title: formData.title,
        description: formData.description || null,
        start_time: new Date(`${format(formData.date, 'yyyy-MM-dd')}T${formData.startTime}:00`).toISOString(),
        end_time: new Date(`${format(formData.date, 'yyyy-MM-dd')}T${formData.endTime}:00`).toISOString(),
        status: 'pending',
        payment_status: 'not_required'
      }

      const token = localStorage.getItem("auth-token")
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      })

      if (response.ok) {
        toast({
          title: "Booking Submitted!",
          description: "Your booking request has been submitted for approval"
        })
        router.push("/conference-room-booking/bookings")
      } else {
        throw new Error("Failed to create booking")
      }
    } catch (error) {
      console.error('Booking creation error:', error)
      toast({
        title: "Booking Failed",
        description: "An error occurred while creating your booking. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }


  // Loading state with different messages based on source
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {loadingSource === 'session' ? 'Preparing your booking...' : 
               loadingSource === 'api' ? 'Loading room details...' : 
               'Loading...'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {loadingSource === 'session' ? 'Setting up your selected room' :
               loadingSource === 'api' ? 'Fetching the latest room information' :
               'Please wait a moment'}
            </p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Error state with retry option
  if (error || !room) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 mx-auto mb-6 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {error === 'Room not found' ? 'Room Not Found' : 'Unable to Load Room'}
            </h3>
            <p className="text-muted-foreground mb-6 text-sm">
              {error === 'Room not found' 
                ? 'The requested room could not be found. It may have been removed or the link is invalid.'
                : error || 'There was an issue loading the room details. Please try again.'}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={retryLoadRoom}
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  'Try Again'
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/conference-room-booking')}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Room Selection
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <RoomDisplay room={room} loadingSource={loadingSource} />
      case 1:
        return (
          <BookingForm 
            formData={formData}
            onChange={updateFormData}
            room={room}
          />
        )
      case 2:
        return (
          <ReviewAndPayment 
            formData={formData}
            room={room}
            onPayment={handlePayment}
            onDirectPayment={handleDirectPaymentSuccess}
          />
        )
      default:
        return null
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Book a Room</h1>
            <p className="text-muted-foreground">Complete your booking in just a few steps</p>
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} totalSteps={3} />

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg border-0">
              <CardHeader className="text-center border-b bg-muted/30">
                <CardTitle className="text-xl">
                  {currentStep === 0 && "Confirm Room Selection"}
                  {currentStep === 1 && "Booking Details"}  
                  {currentStep === 2 && "Review & Payment"}
                </CardTitle>
                <CardDescription>
                  {currentStep === 0 && "Verify this is the room you want to book"}
                  {currentStep === 1 && "Enter your meeting details and select date/time"}
                  {currentStep === 2 && "Review your booking and complete payment"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-8">
                {renderStepContent()}
              </CardContent>

              {/* Navigation */}
              <div className="flex justify-between items-center p-6 border-t bg-muted/30">
                <Button 
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                {currentStep < 2 ? (
                  <Button 
                    onClick={nextStep}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Ready to {room.hourly_rate && room.hourly_rate > 0 ? 'pay' : 'book'}
                  </div>
                )}
              </div>
            </Card>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  )
}

// Main page component with Suspense wrapper
export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  )
}
