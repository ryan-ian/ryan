"use client"

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { toast } from '@/components/ui/use-toast'
import type { Booking, BookingWithDetails } from '@/types'

interface UseManagerRealtimeOptions {
  onNewBooking?: (booking: BookingWithDetails) => void
  onBookingStatusChange?: (booking: BookingWithDetails, oldStatus: string, newStatus: string) => void
  onBookingUpdate?: () => void
  facilityId?: string
  enabled?: boolean
}

/**
 * Real-time hook for facility managers to track booking changes
 * Listens for new bookings and status changes in real-time
 */
export function useManagerRealtime({
  onNewBooking,
  onBookingStatusChange,
  onBookingUpdate,
  facilityId,
  enabled = true
}: UseManagerRealtimeOptions = {}) {
  const { user } = useAuth()
  const subscriptionRef = useRef<any>(null)

  const setupRealtimeSubscription = useCallback(() => {
    if (!user || !enabled) return

    // Clean up existing subscription
    if (subscriptionRef.current) {
      console.log('🏢 [Manager Realtime] Cleaning up existing subscription')
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    console.log('🏢 [Manager Realtime] Setting up subscription for facility manager:', user.id)
    if (facilityId) {
      console.log('🏢 [Manager Realtime] Filtering by facility:', facilityId)
    }

    const subscription = supabase
      .channel(`manager_bookings_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
        },
        async (payload) => {
          console.log('🏢 [Manager Realtime] New booking created:', payload)
          const newBooking = payload.new as Booking

          // Check if this booking is for a room managed by this facility manager
          try {
            // Get the room details to check facility
            const { data: roomData, error: roomError } = await supabase
              .from('rooms')
              .select('facility_id, name, location')
              .eq('id', newBooking.room_id)
              .single()

            if (roomError) {
              console.error('Error fetching room details:', roomError)
              return
            }

            // If facility filtering is enabled, check if this room belongs to the manager's facility
            if (facilityId && roomData.facility_id !== facilityId) {
              console.log('🏢 [Manager Realtime] Booking not for managed facility, ignoring')
              return
            }

            // Get user details for the booking
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('name, email, department')
              .eq('id', newBooking.user_id)
              .single()

            if (userError) {
              console.error('Error fetching user details:', userError)
              return
            }

            console.log('🏢 [Manager Realtime] New booking for managed facility!')

            // Show toast notification for new pending booking
            if (newBooking.status === 'pending') {
              toast({
                title: "New Booking Request",
                description: `${userData.name} has requested ${roomData.name} for ${new Date(newBooking.start_time).toLocaleDateString()}`,
                duration: 6000,
              })
            }

            // Call the callback with enriched booking data
            if (onNewBooking) {
              const enrichedBooking: BookingWithDetails = {
                ...newBooking,
                rooms: roomData,
                users: userData
              }
              onNewBooking(enrichedBooking)
            }

            // Trigger general update callback
            if (onBookingUpdate) {
              setTimeout(() => {
                onBookingUpdate()
              }, 500)
            }
          } catch (error) {
            console.error('Error processing new booking:', error)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
        },
        async (payload) => {
          console.log('🏢 [Manager Realtime] Booking updated:', payload)
          const oldBooking = payload.old as Booking
          const newBooking = payload.new as Booking

          // Check if status changed
          const statusChanged = oldBooking.status !== newBooking.status
          
          if (statusChanged) {
            console.log(`🏢 [Manager Realtime] Status changed from ${oldBooking.status} to ${newBooking.status}`)

            // Check if this booking is for a room managed by this facility manager
            try {
              const { data: roomData, error: roomError } = await supabase
                .from('rooms')
                .select('facility_id, name, location')
                .eq('id', newBooking.room_id)
                .single()

              if (roomError) {
                console.error('Error fetching room details:', roomError)
                return
              }

              // If facility filtering is enabled, check if this room belongs to the manager's facility
              if (facilityId && roomData.facility_id !== facilityId) {
                console.log('🏢 [Manager Realtime] Booking not for managed facility, ignoring')
                return
              }

              console.log('🏢 [Manager Realtime] Status change for managed facility!')

              // Call the status change callback
              if (onBookingStatusChange) {
                // Get user details for enriched booking
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('name, email, department')
                  .eq('id', newBooking.user_id)
                  .single()

                const enrichedBooking: BookingWithDetails = {
                  ...newBooking,
                  rooms: roomData,
                  users: userData || undefined
                }
                onBookingStatusChange(enrichedBooking, oldBooking.status, newBooking.status)
              }

              // Trigger general update callback
              if (onBookingUpdate) {
                setTimeout(() => {
                  onBookingUpdate()
                }, 500)
              }
            } catch (error) {
              console.error('Error processing booking status change:', error)
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🏢 [Manager Realtime] Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ [Manager Realtime] Successfully subscribed to booking changes')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [Manager Realtime] Error subscribing to booking changes')
        } else if (status === 'CLOSED') {
          console.log('🔌 [Manager Realtime] Subscription closed')
        }
      })

    subscriptionRef.current = subscription
  }, [user, enabled, facilityId, onNewBooking, onBookingStatusChange, onBookingUpdate])

  useEffect(() => {
    setupRealtimeSubscription()

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        console.log('🏢 [Manager Realtime] Cleaning up subscription on unmount')
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [setupRealtimeSubscription])

  // Return cleanup function for manual cleanup if needed
  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      console.log('🏢 [Manager Realtime] Manual cleanup requested')
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }
  }, [])

  return { cleanup }
}
