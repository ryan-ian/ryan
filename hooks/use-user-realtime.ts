"use client"

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { toast } from '@/components/ui/use-toast'
import type { Booking, BookingWithDetails, MeetingInvitation } from '@/types'

interface UseUserRealtimeOptions {
  onBookingStatusChange?: (booking: Booking, oldStatus: string, newStatus: string) => void
  onBookingUpdate?: () => void
  onMeetingInvitationUpdate?: (invitation: MeetingInvitation) => void
  onNotificationReceived?: (notification: any) => void
  enabled?: boolean
  showToasts?: boolean
}

/**
 * Real-time hook for users to track their booking changes and updates
 * Listens for booking status changes, meeting invitations, and notifications
 */
export function useUserRealtime({
  onBookingStatusChange,
  onBookingUpdate,
  onMeetingInvitationUpdate,
  onNotificationReceived,
  enabled = true,
  showToasts = true
}: UseUserRealtimeOptions = {}) {
  const { user } = useAuth()
  const subscriptionRef = useRef<any>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectedRef = useRef(false)
  const isBrowser = typeof window !== 'undefined'

  const setupRealtimeSubscription = useCallback(() => {
    if (!isBrowser) {
      // SSR/no window: no-op
      return
    }

    if (!user || !enabled) {
      console.log('👤 [User Realtime] Skipping subscription setup - user or enabled check failed:', { user: !!user, enabled })
      return
    }

    // Do not run user realtime subscriptions for admin (admin uses facility manager realtime instead)
    if ((user as any).role === 'admin') {
      console.log('👤 [User Realtime] Skipping subscription setup for admin role (handled by facility manager realtime)')
      return
    }

    // Validate user has required properties
    if (!user.id || !user.email) {
      console.error('👤 [User Realtime] Invalid user data - missing id or email:', { id: user.id, email: user.email })
      return
    }

    // Clean up existing subscription
    if (subscriptionRef.current) {
      console.log('👤 [User Realtime] Cleaning up existing subscription')
      try {
        subscriptionRef.current.unsubscribe()
      } catch (error) {
        console.error('👤 [User Realtime] Error cleaning up subscription:', error)
      }
      subscriptionRef.current = null
    }

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }

    console.log('👤 [User Realtime] Setting up subscription for user:', user.id)

    let subscription
    try {
      subscription = supabase
      .channel(`user_updates_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          try {
            console.log('👤 [User Realtime] Booking updated:', payload)

            // Validate payload data
            if (!payload || !payload.old || !payload.new) {
              console.error('👤 [User Realtime] Invalid payload received:', payload)
              return
            }

            const oldBooking = payload.old as Booking
            const newBooking = payload.new as Booking

            // Validate booking data
            if (!oldBooking.id || !newBooking.id || oldBooking.id !== newBooking.id) {
              console.error('👤 [User Realtime] Invalid booking data:', { oldBooking, newBooking })
              return
            }

            // Check if status changed
            const statusChanged = oldBooking.status !== newBooking.status

            if (statusChanged) {
              console.log(`👤 [User Realtime] Your booking status changed: ${oldBooking.status} → ${newBooking.status} for booking ${newBooking.id}`)

            // Get room details for better messaging
            try {
              const { data: roomData, error: roomError } = await supabase
                .from('rooms')
                .select('name, location')
                .eq('id', newBooking.room_id)
                .single()

              const roomName = roomData?.name || 'Room'

              // Show appropriate toast notification
              if (showToasts) {
                if (newBooking.status === 'confirmed') {
                  toast({
                    title: "✅ Booking Approved!",
                    description: `Your booking for ${roomName} has been approved and confirmed.`,
                    duration: 6000,
                  })
                } else if (newBooking.status === 'cancelled') {
                  const reason = newBooking.rejection_reason || 'No reason provided'
                  toast({
                    title: "❌ Booking Cancelled",
                    description: `Your booking for ${roomName} was cancelled. Reason: ${reason}`,
                    variant: "destructive",
                    duration: 8000,
                  })
                } else if (newBooking.status === 'rejected') {
                  const reason = newBooking.rejection_reason || 'No reason provided'
                  toast({
                    title: "🚫 Booking Rejected",
                    description: `Your booking for ${roomName} was rejected. Reason: ${reason}`,
                    variant: "destructive",
                    duration: 8000,
                  })
                }
              }

              // Call the status change callback
              if (onBookingStatusChange) {
                console.log(`👤 [User Realtime] Calling onBookingStatusChange callback for booking ${newBooking.id}`)
                onBookingStatusChange(newBooking, oldBooking.status, newBooking.status)
              }

            } catch (error) {
              console.error('👤 [User Realtime] Error fetching room details for status change:', error)
              
              // Still show generic notification
              if (showToasts) {
                if (newBooking.status === 'confirmed') {
                  toast({
                    title: "✅ Booking Approved!",
                    description: "Your booking has been approved and confirmed.",
                    duration: 6000,
                  })
                } else if (newBooking.status === 'cancelled' || newBooking.status === 'rejected') {
                  toast({
                    title: `❌ Booking ${newBooking.status}`,
                    description: `Your booking has been ${newBooking.status}.`,
                    variant: "destructive",
                    duration: 6000,
                  })
                }
              }

              // Call the status change callback even with generic notification
              if (onBookingStatusChange) {
                console.log(`👤 [User Realtime] Calling onBookingStatusChange callback (fallback) for booking ${newBooking.id}`)
                onBookingStatusChange(newBooking, oldBooking.status, newBooking.status)
              }
            }
          }

          // Check for other important updates (time changes, etc.)
          const timeChanged = oldBooking.start_time !== newBooking.start_time || 
                             oldBooking.end_time !== newBooking.end_time
          
          if (timeChanged && showToasts) {
            toast({
              title: "📅 Booking Time Updated",
              description: "The time for your booking has been modified.",
              duration: 5000,
            })
          }

          // Trigger general update callback
          if (onBookingUpdate) {
            console.log(`👤 [User Realtime] Calling onBookingUpdate callback`)
            setTimeout(() => {
              onBookingUpdate()
            }, 500)
          }

          } catch (error) {
            console.error('👤 [User Realtime] Error processing booking update:', error)

            // Still try to trigger the general update callback on error
            if (onBookingUpdate) {
              console.log(`👤 [User Realtime] Calling onBookingUpdate callback (error fallback)`)
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
          event: 'INSERT',
          schema: 'public',
          table: 'meeting_invitations',
          filter: `email=eq.${user.email}`,
        },
        (payload) => {
          try {
            console.log('👤 [User Realtime] New meeting invitation:', payload)

            if (!payload || !payload.new) {
              console.error('👤 [User Realtime] Invalid meeting invitation payload:', payload)
              return
            }

            const invitation = payload.new as MeetingInvitation

            if (showToasts && invitation.event_title) {
              toast({
                title: "📧 New Meeting Invitation",
                description: `You've been invited to: ${invitation.event_title}`,
                duration: 6000,
              })
            }

            if (onMeetingInvitationUpdate) {
              onMeetingInvitationUpdate(invitation)
            }
          } catch (error) {
            console.error('👤 [User Realtime] Error processing meeting invitation:', error)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'meeting_invitations',
          filter: `email=eq.${user.email}`,
        },
        (payload) => {
          try {
            console.log('👤 [User Realtime] Meeting invitation updated:', payload)

            if (!payload || !payload.new) {
              console.error('👤 [User Realtime] Invalid meeting invitation update payload:', payload)
              return
            }

            const invitation = payload.new as MeetingInvitation

            if (onMeetingInvitationUpdate) {
              onMeetingInvitationUpdate(invitation)
            }
          } catch (error) {
            console.error('👤 [User Realtime] Error processing meeting invitation update:', error)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          try {
            console.log('👤 [User Realtime] New notification:', payload)

            if (!payload || !payload.new) {
              console.error('👤 [User Realtime] Invalid notification payload:', payload)
              return
            }

            // This is handled by the notifications context, but we can still trigger callbacks
            if (onNotificationReceived) {
              onNotificationReceived(payload.new)
            }
          } catch (error) {
            console.error('👤 [User Realtime] Error processing notification:', error)
          }
        }
      )
      .subscribe((status, err) => {
        console.log('👤 [User Realtime] Subscription status:', status, err ? { error: err } : '')

        if (status === 'SUBSCRIBED') {
          console.log('✅ [User Realtime] Successfully subscribed to user updates')
          isConnectedRef.current = true

          // Clear any retry timeout since we're now connected
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current)
            retryTimeoutRef.current = null
          }

        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [User Realtime] Error subscribing to user updates:', err?.message || err || 'Unknown channel error')
          isConnectedRef.current = false

          // Implement retry logic for connection errors
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current)
          }

          retryTimeoutRef.current = setTimeout(() => {
            console.log('🔄 [User Realtime] Retrying subscription after error...')
            setupRealtimeSubscription()
          }, 5000) // Retry after 5 seconds

        } else if (status === 'CLOSED') {
          console.log('🔌 [User Realtime] Subscription closed')
          isConnectedRef.current = false

        } else if (status === 'TIMED_OUT') {
          console.warn('⏰ [User Realtime] Subscription timed out')
          isConnectedRef.current = false

          // Retry on timeout
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current)
          }

          retryTimeoutRef.current = setTimeout(() => {
            console.log('🔄 [User Realtime] Retrying subscription after timeout...')
            setupRealtimeSubscription()
          }, 3000) // Retry after 3 seconds
        }
      })
    } catch (e: any) {
      console.error('❌ [User Realtime] Exception creating subscription:', e?.message || e)
      return
    }

    subscriptionRef.current = subscription
  }, [user, enabled, showToasts, onBookingStatusChange, onBookingUpdate, onMeetingInvitationUpdate, onNotificationReceived])

  useEffect(() => {
    setupRealtimeSubscription()

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        console.log('👤 [User Realtime] Cleaning up subscription on unmount')
        try {
          subscriptionRef.current.unsubscribe()
        } catch (error) {
          console.error('👤 [User Realtime] Error during cleanup:', error)
        }
        subscriptionRef.current = null
      }

      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }

      isConnectedRef.current = false
    }
  }, [setupRealtimeSubscription])

  // Return cleanup function for manual cleanup if needed
  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      console.log('👤 [User Realtime] Manual cleanup requested')
      try {
        subscriptionRef.current.unsubscribe()
      } catch (error) {
        console.error('👤 [User Realtime] Error during manual cleanup:', error)
      }
      subscriptionRef.current = null
    }

    // Clear retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }

    isConnectedRef.current = false
  }, [])

  return {
    cleanup,
    isConnected: isConnectedRef.current
  }
}
