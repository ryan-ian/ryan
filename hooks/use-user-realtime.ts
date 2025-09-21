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

  const setupRealtimeSubscription = useCallback(() => {
    if (!user || !enabled) return

    // Clean up existing subscription
    if (subscriptionRef.current) {
      console.log('👤 [User Realtime] Cleaning up existing subscription')
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    console.log('👤 [User Realtime] Setting up subscription for user:', user.id)

    const subscription = supabase
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
          console.log('👤 [User Realtime] Booking updated:', payload)
          const oldBooking = payload.old as Booking
          const newBooking = payload.new as Booking

          // Check if status changed
          const statusChanged = oldBooking.status !== newBooking.status
          
          if (statusChanged) {
            console.log(`👤 [User Realtime] Your booking status changed: ${oldBooking.status} → ${newBooking.status}`)

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
                onBookingStatusChange(newBooking, oldBooking.status, newBooking.status)
              }

            } catch (error) {
              console.error('Error fetching room details for status change:', error)
              
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
            setTimeout(() => {
              onBookingUpdate()
            }, 500)
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
          console.log('👤 [User Realtime] New meeting invitation:', payload)
          const invitation = payload.new as MeetingInvitation

          if (showToasts) {
            toast({
              title: "📧 New Meeting Invitation",
              description: `You've been invited to: ${invitation.event_title}`,
              duration: 6000,
            })
          }

          if (onMeetingInvitationUpdate) {
            onMeetingInvitationUpdate(invitation)
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
          console.log('👤 [User Realtime] Meeting invitation updated:', payload)
          const invitation = payload.new as MeetingInvitation

          if (onMeetingInvitationUpdate) {
            onMeetingInvitationUpdate(invitation)
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
          console.log('👤 [User Realtime] New notification:', payload)
          // This is handled by the notifications context, but we can still trigger callbacks
          if (onNotificationReceived) {
            onNotificationReceived(payload.new)
          }
        }
      )
      .subscribe((status) => {
        console.log('👤 [User Realtime] Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ [User Realtime] Successfully subscribed to user updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [User Realtime] Error subscribing to user updates')
        } else if (status === 'CLOSED') {
          console.log('🔌 [User Realtime] Subscription closed')
        }
      })

    subscriptionRef.current = subscription
  }, [user, enabled, showToasts, onBookingStatusChange, onBookingUpdate, onMeetingInvitationUpdate, onNotificationReceived])

  useEffect(() => {
    setupRealtimeSubscription()

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        console.log('👤 [User Realtime] Cleaning up subscription on unmount')
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [setupRealtimeSubscription])

  // Return cleanup function for manual cleanup if needed
  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      console.log('👤 [User Realtime] Manual cleanup requested')
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }
  }, [])

  return { cleanup }
}
