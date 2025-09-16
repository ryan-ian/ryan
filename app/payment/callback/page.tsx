"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, ArrowLeft, Calendar, Clock, MapPin } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { restoreBookingState, clearBookingState, type BookingModalState } from "@/lib/booking-state-manager"
import { format } from "date-fns"

interface PaymentResult {
  success: boolean
  payment?: {
    status: string
    reference: string
    amount: number
    currency: string
    channel: string
  }
  booking?: {
    id: string
    title: string
    room_name: string
    start_time: string
    end_time: string
    total_cost: number
  }
  message: string
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function PaymentCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bookingState, setBookingState] = useState<BookingModalState | null>(null)
  const [shouldRestoreModal, setShouldRestoreModal] = useState(false)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get('reference')
        const trxref = searchParams.get('trxref')
        const stateId = searchParams.get('state_id')
        const returnTo = searchParams.get('return_to')

        // Use reference from URL params (Paystack returns this)
        const paymentReference = reference || trxref

        if (!paymentReference) {
          setError("No payment reference found in URL")
          setLoading(false)
          return
        }

        // Try to restore booking state if state_id is provided
        if (stateId) {
          const restoredState = restoreBookingState(stateId)
          if (restoredState) {
            setBookingState(restoredState)
            setShouldRestoreModal(returnTo === 'booking_modal')
            console.log("📂 Booking state restored for payment callback")
          }
        }

        console.log("🔍 Verifying payment with reference:", paymentReference)

        // Get authentication session
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token

        if (!token) {
          setError("Authentication required. Please log in and try again.")
          setLoading(false)
          return
        }

        // Verify payment with our API
        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            reference: paymentReference
          })
        })

        const verificationResult = await response.json()

        if (!response.ok) {
          throw new Error(verificationResult.error || 'Payment verification failed')
        }

        setResult(verificationResult)

        // Show appropriate toast message
        if (verificationResult.success) {
          toast({
            title: "Payment Successful!",
            description: "Your booking request has been paid and sent successfully. Meeting is awaiting approval from admin.",
            duration: 5000
          })
        } else {
          toast({
            title: "Payment Failed",
            description: verificationResult.message || "Payment could not be processed.",
            variant: "destructive",
            duration: 5000
          })
        }

      } catch (error: any) {
        console.error("❌ Payment verification error:", error)
        setError(error.message || "Failed to verify payment")
        
        toast({
          title: "Verification Error",
          description: error.message || "Failed to verify payment",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      verifyPayment()
    } else {
      setError("Please log in to view payment results")
      setLoading(false)
    }
  }, [searchParams, user])

  const handleGoToBookings = () => {
    // Clear the booking state since we're navigating away
    if (bookingState) {
      clearBookingState()
    }
    router.push('/conference-room-booking/bookings')
  }

  const handleTryAgain = () => {
    // Clear the booking state and go back to rooms
    if (bookingState) {
      clearBookingState()
    }
    router.push('/conference-room-booking/rooms')
  }

  const handleRestoreBookingModal = () => {
    // Navigate back to the booking page with state restoration
    const returnUrl = bookingState
      ? `/conference-room-booking/rooms?restore_booking=true&state_id=${searchParams.get('state_id')}`
      : '/conference-room-booking/rooms'

    router.push(returnUrl)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground text-center">
              Please wait while we verify your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-xl text-destructive">Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleTryAgain} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={handleGoToBookings} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No payment result available</p>
            <Button onClick={handleGoToBookings} className="mt-4">
              Go to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          {result.success ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-xl text-green-600">Payment Successful!</CardTitle>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <CardTitle className="text-xl text-destructive">Payment Failed</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{result.message}</p>
          </div>

          {result.success && result.booking && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm">Booking Details</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Meeting:</span>
                  <span>{result.booking.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room:</span>
                  <span>{result.booking.room_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time:</span>
                  <span>
                    {new Date(result.booking.start_time).toLocaleDateString()} {' '}
                    {new Date(result.booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {' '}
                    {new Date(result.booking.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span>₵{result.booking.total_cost?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {result.payment && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm">Payment Details</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono text-xs">{result.payment.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="capitalize">{result.payment.channel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`capitalize ${result.payment.status === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                    {result.payment.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleGoToBookings} className="w-full">
              View My Bookings
            </Button>

            {result.success && shouldRestoreModal && bookingState && (
              <Button variant="outline" onClick={handleRestoreBookingModal} className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                Continue Booking
              </Button>
            )}

            {!result.success && (
              <Button variant="outline" onClick={handleTryAgain} className="w-full">
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Loading component for Suspense fallback
function PaymentCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading Payment</h2>
          <p className="text-muted-foreground text-center">
            Please wait while we process your payment...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Main page component with Suspense wrapper
export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<PaymentCallbackLoading />}>
      <PaymentCallbackContent />
    </Suspense>
  )
}
