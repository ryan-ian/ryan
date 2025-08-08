import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

interface UseBookingRealtimeOptions {
  onBookingUpdate?: () => void
  facilityId?: string
  enabled?: boolean
}

/**
 * Hook to listen for real-time booking updates
 * Automatically refreshes data when bookings are approved/rejected
 */
export function useBookingRealtime({ 
  onBookingUpdate, 
  facilityId, 
  enabled = true 
}: UseBookingRealtimeOptions = {}) {
  const { user } = useAuth()
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    if (!enabled || !user || !onBookingUpdate) {
      return
    }

    console.log(`🔄 [Realtime] Setting up booking subscription for user: ${user.id}`)

    // Subscribe to booking changes
    const subscription = supabase
      .channel('booking-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: facilityId ? `room_id.in.(${facilityId})` : undefined
        },
        (payload) => {
          console.log(`🔄 [Realtime] Booking updated:`, payload)
          
          // Check if this is a status change
          const oldRecord = payload.old as any
          const newRecord = payload.new as any
          
          if (oldRecord?.status !== newRecord?.status) {
            console.log(`🔄 [Realtime] Status changed from ${oldRecord?.status} to ${newRecord?.status}`)
            
            // Trigger data refresh after a short delay to ensure database consistency
            setTimeout(() => {
              console.log(`🔄 [Realtime] Triggering data refresh...`)
              onBookingUpdate()
            }, 1000)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log(`🔄 [Realtime] New booking created:`, payload)
          
          // Trigger data refresh for new bookings
          setTimeout(() => {
            console.log(`🔄 [Realtime] Triggering data refresh for new booking...`)
            onBookingUpdate()
          }, 1000)
        }
      )
      .subscribe((status) => {
        console.log(`🔄 [Realtime] Subscription status:`, status)
      })

    subscriptionRef.current = subscription

    return () => {
      console.log(`🔄 [Realtime] Cleaning up booking subscription`)
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [enabled, user, onBookingUpdate, facilityId])

  return {
    isConnected: subscriptionRef.current?.state === 'SUBSCRIBED'
  }
}

/**
 * Hook specifically for facility manager reports
 * Automatically refreshes report data when bookings change
 */
export function useFacilityManagerRealtimeUpdates(refreshData: () => void, facilityId?: string) {
  const { user } = useAuth()
  
  return useBookingRealtime({
    onBookingUpdate: refreshData,
    facilityId,
    enabled: user?.role === 'admin' && !!refreshData
  })
}
