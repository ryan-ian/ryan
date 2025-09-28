import { useEffect, useCallback, useState } from 'react'
import { useRealtime } from '@/contexts/realtime-context'
import { useAuth } from '@/contexts/auth-context'
import type { BookingWithDetails } from '@/types'

interface FacilityManagerRealtimeState {
  newBookingRequests: BookingWithDetails[]
  bookingUpdates: BookingWithDetails[]
  paymentUpdates: any[]
  isConnected: boolean
}

/**
 * Custom hook for facility manager dashboard realtime updates
 * Handles booking requests, status changes, and payment updates
 */
export function useFacilityManagerRealtime() {
  const { user } = useAuth()
  const realtime = useRealtime()
  const [state, setState] = useState<FacilityManagerRealtimeState>({
    newBookingRequests: [],
    bookingUpdates: [],
    paymentUpdates: [],
    isConnected: false
  })

  // Callback for new booking requests
  const handleBookingUpdate = useCallback((payload: any) => {
    console.log('📅 Facility Manager - Booking update received:', payload)
    
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    if (eventType === 'INSERT') {
      // New booking request
      if (newRecord.status === 'pending') {
        setState(prev => ({
          ...prev,
          newBookingRequests: [newRecord, ...prev.newBookingRequests.slice(0, 9)] // Keep last 10
        }))
        
        // Show notification for new booking request
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Booking Request', {
            body: `New booking request for ${newRecord.title}`,
            icon: '/favicon.ico'
          })
        }
      }
    } else if (eventType === 'UPDATE') {
      // Booking status change
      setState(prev => ({
        ...prev,
        bookingUpdates: [newRecord, ...prev.bookingUpdates.slice(0, 9)] // Keep last 10
      }))
      
      // If status changed from pending to confirmed/cancelled, remove from new requests
      if (oldRecord.status === 'pending' && newRecord.status !== 'pending') {
        setState(prev => ({
          ...prev,
          newBookingRequests: prev.newBookingRequests.filter(req => req.id !== newRecord.id)
        }))
      }
    }
  }, [])

  // Callback for payment updates
  const handlePaymentUpdate = useCallback((payload: any) => {
    console.log('💳 Facility Manager - Payment update received:', payload)
    
    const { eventType, new: newRecord } = payload
    
    if (eventType === 'UPDATE' || eventType === 'INSERT') {
      setState(prev => ({
        ...prev,
        paymentUpdates: [newRecord, ...prev.paymentUpdates.slice(0, 9)] // Keep last 10
      }))
    }
  }, [])

  // Callback for meeting invitation updates
  const handleMeetingInvitationUpdate = useCallback((payload: any) => {
    console.log('📧 Facility Manager - Meeting invitation update received:', payload)
    
    // You can add specific logic here for meeting invitation updates
    // For now, we'll just log it
  }, [])

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      return
    }

    console.log('🔄 Setting up facility manager realtime subscriptions')

    // Subscribe to booking updates
    const unsubscribeBookings = realtime.subscribeToBookings(handleBookingUpdate)
    
    // Subscribe to payment updates
    const unsubscribePayments = realtime.subscribeToPayments(handlePaymentUpdate)
    
    // Subscribe to meeting invitation updates
    const unsubscribeMeetingInvitations = realtime.subscribeToMeetingInvitations(handleMeetingInvitationUpdate)

    // Update connection status
    setState(prev => ({
      ...prev,
      isConnected: realtime.isConnected
    }))

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up facility manager realtime subscriptions')
      unsubscribeBookings()
      unsubscribePayments()
      unsubscribeMeetingInvitations()
    }
  }, [user, realtime, handleBookingUpdate, handlePaymentUpdate, handleMeetingInvitationUpdate])

  // Update connection status when realtime connection changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected: realtime.isConnected
    }))
  }, [realtime.isConnected])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Clear functions
  const clearNewBookingRequests = useCallback(() => {
    setState(prev => ({
      ...prev,
      newBookingRequests: []
    }))
  }, [])

  const clearBookingUpdates = useCallback(() => {
    setState(prev => ({
      ...prev,
      bookingUpdates: []
    }))
  }, [])

  const clearPaymentUpdates = useCallback(() => {
    setState(prev => ({
      ...prev,
      paymentUpdates: []
    }))
  }, [])

  return {
    ...state,
    clearNewBookingRequests,
    clearBookingUpdates,
    clearPaymentUpdates,
    hasNewBookingRequests: state.newBookingRequests.length > 0,
    hasBookingUpdates: state.bookingUpdates.length > 0,
    hasPaymentUpdates: state.paymentUpdates.length > 0
  }
}
