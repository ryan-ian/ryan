"use client"

import { useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { BookingWithDetails } from "@/types"

interface RoomStatusSyncProps {
  roomId: string
  onBookingsUpdate: (bookings: BookingWithDetails[]) => void
  onError?: (error: string) => void
  syncInterval?: number // in milliseconds, default 30 seconds
  enabled?: boolean
}

export function RoomStatusSync({ 
  roomId, 
  onBookingsUpdate, 
  onError, 
  syncInterval = 30000,
  enabled = true 
}: RoomStatusSyncProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastETagRef = useRef<string | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // Fetch bookings with conditional request support
  const fetchBookings = useCallback(async () => {
    if (!enabled) return

    try {
      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date()
      const dateString = today.toISOString().split('T')[0]

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }

      // Add If-None-Match header for conditional requests
      if (lastETagRef.current) {
        headers['If-None-Match'] = lastETagRef.current
      }

      const response = await fetch(`/api/rooms/${roomId}/bookings?date=${dateString}`, {
        headers
      })

      // Handle 304 Not Modified - no changes
      if (response.status === 304) {
        console.log(`📡 [Sync] No changes detected for room ${roomId}`)
        retryCountRef.current = 0 // Reset retry count on successful request
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Store ETag for next request
      const etag = response.headers.get('ETag')
      if (etag) {
        lastETagRef.current = etag
      }

      const data = await response.json()

      if (data.success && data.bookings) {
        console.log(`📡 [Sync] Updated bookings for room ${roomId}: ${data.bookings.length} bookings`)
        onBookingsUpdate(data.bookings)
        retryCountRef.current = 0 // Reset retry count on success
      } else {
        throw new Error(data.error || 'Failed to fetch bookings')
      }

    } catch (error) {
      retryCountRef.current++
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      console.error(`❌ [Sync] Error fetching bookings (attempt ${retryCountRef.current}/${maxRetries}):`, errorMessage)
      
      // Only call onError if we've exceeded max retries
      if (retryCountRef.current >= maxRetries) {
        onError?.(errorMessage)
        retryCountRef.current = 0 // Reset for next cycle
      }
    }
  }, [roomId, onBookingsUpdate, onError, enabled])

  // Set up polling interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Initial fetch
    fetchBookings()

    // Set up interval for periodic updates
    intervalRef.current = setInterval(fetchBookings, syncInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [fetchBookings, syncInterval, enabled])

  // Handle visibility change to pause/resume syncing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause syncing
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        console.log(`⏸️ [Sync] Paused syncing for room ${roomId} (page hidden)`)
      } else {
        // Page is visible, resume syncing
        if (enabled && !intervalRef.current) {
          fetchBookings() // Immediate fetch when page becomes visible
          intervalRef.current = setInterval(fetchBookings, syncInterval)
          console.log(`▶️ [Sync] Resumed syncing for room ${roomId} (page visible)`)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchBookings, syncInterval, enabled, roomId])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log(`🌐 [Sync] Connection restored, resuming sync for room ${roomId}`)
      if (enabled) {
        fetchBookings() // Immediate fetch when coming back online
      }
    }

    const handleOffline = () => {
      console.log(`📴 [Sync] Connection lost for room ${roomId}`)
      onError?.('Connection lost. Updates paused.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [fetchBookings, onError, enabled, roomId])

  // This component doesn't render anything
  return null
}

// Hook for easier usage
export function useRoomStatusSync(
  roomId: string,
  onBookingsUpdate: (bookings: BookingWithDetails[]) => void,
  options?: {
    onError?: (error: string) => void
    syncInterval?: number
    enabled?: boolean
  }
) {
  return (
    <RoomStatusSync
      roomId={roomId}
      onBookingsUpdate={onBookingsUpdate}
      onError={options?.onError}
      syncInterval={options?.syncInterval}
      enabled={options?.enabled}
    />
  )
}
