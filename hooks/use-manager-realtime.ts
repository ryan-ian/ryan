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

          // Validate booking data
          if (!newBooking || !newBooking.id || !newBooking.user_id || !newBooking.room_id) {
            console.error('🏢 [Manager Realtime] Invalid booking data received:', newBooking)
            return
          }

          console.log('🏢 [Manager Realtime] Processing booking:', {
            id: newBooking.id,
            user_id: newBooking.user_id,
            room_id: newBooking.room_id,
            title: newBooking.title,
            status: newBooking.status
          })

          // Check if this booking is for a room managed by this facility manager
          try {
            // Get the room details to check facility
            const { data: roomData, error: roomError } = await supabase
              .from('rooms')
              .select('facility_id, name, location')
              .eq('id', newBooking.room_id)
              .single()

            if (roomError) {
              console.error('🏢 [Manager Realtime] Error fetching room details:', roomError)
              return
            }

            if (!roomData) {
              console.error('🏢 [Manager Realtime] Room not found for ID:', newBooking.room_id)
              return
            }

            // If facility filtering is enabled, check if this room belongs to the manager's facility
            if (facilityId && roomData.facility_id !== facilityId) {
              console.log('🏢 [Manager Realtime] Booking not for managed facility, ignoring')
              return
            }

            // Get user details for the booking with better error handling
            console.log('🏢 [Manager Realtime] Fetching user details for user_id:', newBooking.user_id)

            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('id, name, email, organization, position')
              .eq('id', newBooking.user_id)
              .single()

            if (userError) {
              console.error('🏢 [Manager Realtime] Error fetching user details:', {
                error: userError,
                user_id: newBooking.user_id,
                error_code: userError.code,
                error_message: userError.message
              })

              // Continue with fallback user data instead of returning
              const fallbackUserData = {
                id: newBooking.user_id,
                name: 'Unknown User',
                email: 'unknown@example.com',
                organization: 'Unknown',
                position: 'Unknown'
              }

              console.log('🏢 [Manager Realtime] Using fallback user data for booking processing')

              // Process booking with fallback data
              const enrichedBooking: BookingWithDetails = {
                ...newBooking,
                rooms: roomData,
                users: fallbackUserData
              }

              if (onNewBooking) {
                onNewBooking(enrichedBooking)
              }

              if (onBookingUpdate) {
                setTimeout(() => {
                  onBookingUpdate()
                }, 500)
              }
              return
            }

            if (!userData) {
              console.error('🏢 [Manager Realtime] User not found for ID:', newBooking.user_id)
              return
            }

            console.log('🏢 [Manager Realtime] New booking for managed facility!')
            console.log('🏢 [Manager Realtime] User data retrieved:', {
              id: userData.id,
              name: userData.name,
              email: userData.email
            })

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
              console.log('🏢 [Manager Realtime] Calling onNewBooking with enriched data')
              onNewBooking(enrichedBooking)
            }

            // Trigger general update callback
            if (onBookingUpdate) {
              console.log('🏢 [Manager Realtime] Triggering onBookingUpdate callback')
              setTimeout(() => {
                onBookingUpdate()
              }, 500)
            }
          } catch (error) {
            console.error('🏢 [Manager Realtime] Exception processing new booking:', {
              error: error,
              booking_id: newBooking?.id,
              user_id: newBooking?.user_id,
              room_id: newBooking?.room_id,
              stack: error instanceof Error ? error.stack : 'No stack trace'
            })

            // Even if there's an error, try to trigger the update callback
            if (onBookingUpdate) {
              console.log('🏢 [Manager Realtime] Triggering fallback onBookingUpdate due to error')
              setTimeout(() => {
                onBookingUpdate()
              }, 1000)
            }
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

          // Validate booking data
          if (!newBooking || !newBooking.id || !oldBooking) {
            console.error('🏢 [Manager Realtime] Invalid booking update data received')
            return
          }

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
                console.error('🏢 [Manager Realtime] Error fetching room details for update:', roomError)
                return
              }

              if (!roomData) {
                console.error('🏢 [Manager Realtime] Room not found for update:', newBooking.room_id)
                return
              }

              // If facility filtering is enabled, check if this room belongs to the manager's facility
              if (facilityId && roomData.facility_id !== facilityId) {
                console.log('🏢 [Manager Realtime] Booking update not for managed facility, ignoring')
                return
              }

              console.log('🏢 [Manager Realtime] Status change for managed facility!')

              // Call the status change callback
              if (onBookingStatusChange) {
                // Get user details for enriched booking with error handling
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('id, name, email, organization, position')
                  .eq('id', newBooking.user_id)
                  .single()

                let finalUserData = userData
                if (userError) {
                  console.error('🏢 [Manager Realtime] Error fetching user details for status change:', userError)
                  // Use fallback user data
                  finalUserData = {
                    id: newBooking.user_id,
                    name: 'Unknown User',
                    email: 'unknown@example.com',
                    organization: 'Unknown',
                    position: 'Unknown'
                  }
                }

                const enrichedBooking: BookingWithDetails = {
                  ...newBooking,
                  rooms: roomData,
                  users: finalUserData
                }

                console.log('🏢 [Manager Realtime] Calling onBookingStatusChange')
                onBookingStatusChange(enrichedBooking, oldBooking.status, newBooking.status)
              }

              // Trigger general update callback
              if (onBookingUpdate) {
                console.log('🏢 [Manager Realtime] Triggering onBookingUpdate for status change')
                setTimeout(() => {
                  onBookingUpdate()
                }, 500)
              }
            } catch (error) {
              console.error('🏢 [Manager Realtime] Exception processing booking status change:', {
                error: error,
                booking_id: newBooking?.id,
                old_status: oldBooking?.status,
                new_status: newBooking?.status,
                stack: error instanceof Error ? error.stack : 'No stack trace'
              })

              // Trigger fallback update
              if (onBookingUpdate) {
                console.log('🏢 [Manager Realtime] Triggering fallback onBookingUpdate for status change error')
                setTimeout(() => {
                  onBookingUpdate()
                }, 1000)
              }
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
