"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CountdownTimer } from "@/components/ui/countdown-timer"
import { cn } from "@/lib/utils"
import type { BookingWithDetails, CheckInStatus } from "@/types"

interface CheckInManagerProps {
  booking: BookingWithDetails
  onCheckInSuccess?: (checkedInAt: string) => void
  onAutoRelease?: () => void
  className?: string
}

export function CheckInManager({ 
  booking, 
  onCheckInSuccess, 
  onAutoRelease, 
  className 
}: CheckInManagerProps) {
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch check-in status
  const fetchCheckInStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/bookings/${booking.id}/check-in`)
      const data = await response.json()
      
      if (data.success) {
        setCheckInStatus(data.checkInStatus)
      } else {
        console.error('Failed to fetch check-in status:', data.error)
      }
    } catch (error) {
      console.error('Error fetching check-in status:', error)
    } finally {
      setLoading(false)
    }
  }, [booking.id])

  // Initial load and periodic refresh
  useEffect(() => {
    fetchCheckInStatus()
    
    // Refresh status every 30 seconds
    const interval = setInterval(fetchCheckInStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchCheckInStatus])

  // Handle check-in
  const handleCheckIn = async () => {
    if (!checkInStatus?.canCheckIn) return

    setIsCheckingIn(true)
    setCheckInError(null)

    try {
      const response = await fetch(`/api/bookings/${booking.id}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: booking.user_id
        })
      })

      const data = await response.json()

      if (data.success) {
        setShowSuccess(true)
        setCheckInStatus(prev => prev ? {
          ...prev,
          isCheckedIn: true,
          checkInTime: data.checked_in_at,
          autoReleaseScheduled: false,
          canCheckIn: false
        } : null)
        
        onCheckInSuccess?.(data.checked_in_at)
        
        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        setCheckInError(data.error || 'Failed to check in')
      }
    } catch (error) {
      console.error('Check-in error:', error)
      setCheckInError('Failed to check in. Please try again.')
    } finally {
      setIsCheckingIn(false)
    }
  }

  // Handle auto-release
  const handleAutoRelease = async () => {
    try {
      const response = await fetch(`/api/bookings/${booking.id}/auto-release`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        onAutoRelease?.()
      } else {
        console.error('Auto-release failed:', data.error)
      }
    } catch (error) {
      console.error('Auto-release error:', error)
    }
  }

  // Calculate remaining time for auto-release
  const getRemainingMinutes = () => {
    if (!checkInStatus?.gracePeriodEnd) return 0
    
    const now = new Date()
    const endTime = new Date(checkInStatus.gracePeriodEnd)
    const diffMs = endTime.getTime() - now.getTime()
    
    return Math.max(0, Math.ceil(diffMs / (1000 * 60)))
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!checkInStatus) {
    return null
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Check-in Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {checkInStatus.isCheckedIn ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-700 dark:text-green-300">
                Checked In
              </span>
              {checkInStatus.checkInTime && (
                <span className="text-sm text-muted-foreground">
                  at {new Date(checkInStatus.checkInTime).toLocaleTimeString()}
                </span>
              )}
            </>
          ) : checkInStatus.canCheckIn ? (
            <>
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Check-in Available</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="font-medium text-muted-foreground">
                Check-in Not Available
              </span>
            </>
          )}
        </div>

        {/* Check-in Button */}
        {!checkInStatus.isCheckedIn && checkInStatus.canCheckIn && (
          <Button 
            onClick={handleCheckIn}
            disabled={isCheckingIn}
            className={cn(
              "min-w-[120px] transition-all duration-300",
              showSuccess ? "bg-green-500 hover:bg-green-600" : ""
            )}
          >
            {isCheckingIn ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : showSuccess ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : null}
            {isCheckingIn ? "Checking In..." : showSuccess ? "Checked In" : "Check In"}
          </Button>
        )}
      </div>

      {/* Auto-release Warning */}
      {checkInStatus.autoReleaseScheduled && !checkInStatus.isCheckedIn && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
          <div className="flex items-start mb-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-2 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-300">
                Check-in Required
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                This room will be auto-released if not checked in within the grace period.
              </p>
            </div>
          </div>
          
          <CountdownTimer 
            durationInMinutes={getRemainingMinutes()} 
            onComplete={handleAutoRelease}
            variant="warning"
          />
        </div>
      )}

      {/* Check-in Error */}
      {checkInError && (
        <div className="flex items-center text-red-500 text-sm animate-fadeIn">
          <AlertCircle className="h-4 w-4 mr-1" />
          {checkInError}
        </div>
      )}

      {/* Check-in Info */}
      {!checkInStatus.canCheckIn && !checkInStatus.isCheckedIn && (
        <div className="text-sm text-muted-foreground">
          {checkInStatus.checkInAvailableAt && (
            <p>
              Check-in available from{" "}
              {new Date(checkInStatus.checkInAvailableAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
