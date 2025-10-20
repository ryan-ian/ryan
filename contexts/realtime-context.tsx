'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

interface RealtimeContextType {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  subscribeToBookings: (callback: (payload: any) => void) => () => void
  subscribeToNotifications: (userId: string, callback: (payload: any) => void) => () => void
  subscribeToMeetingInvitations: (callback: (payload: any) => void) => () => void
  subscribeToPayments: (callback: (payload: any) => void) => () => void
  subscribeToRooms: (callback: (payload: any) => void) => () => void
  subscribeToFacilities: (callback: (payload: any) => void) => () => void
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map())
  const lastStatusRef = useRef<'connecting' | 'connected' | 'disconnected' | 'error'>(connectionStatus)
  const isBrowser = typeof window !== 'undefined'

  // Create a subscription function factory
  const createSubscription = useCallback((
    table: string,
    callback: (payload: any) => void,
    filter?: string
  ) => {
    if (!isBrowser) {
      // SSR/no window: return no-op unsubscribe
      return () => {}
    }

    const channelName = `${table}_${Date.now()}_${Math.random()}`
    
    console.log(`📡 Creating realtime subscription for ${table}`)
    
    const channel = supabase.channel(channelName)
    
    // Configure the postgres changes subscription
    const subscriptionConfig: any = {
      event: '*',
      schema: 'public',
      table
    }
    
    if (filter) {
      subscriptionConfig.filter = filter
    }
    
    channel.on('postgres_changes', subscriptionConfig, (payload) => {
      console.log(`📡 Realtime update for ${table}:`, payload)
      callback(payload)
    })
    
    // Subscribe to the channel
    channel.subscribe((status, err) => {
      console.log(`📡 Subscription status for ${table}:`, status, err ? { error: err } : '')
      const next: 'connecting' | 'connected' | 'disconnected' | 'error' =
        status === 'SUBSCRIBED' ? 'connected'
        : status === 'CHANNEL_ERROR' ? 'error'
        : status === 'CLOSED' ? 'disconnected'
        : connectionStatus

      if (next !== lastStatusRef.current) {
        lastStatusRef.current = next
        if (next === 'connected') setIsConnected(true)
        if (next === 'disconnected' || next === 'error') setIsConnected(false)
        setConnectionStatus(next)
      }
    })
    
    // Store the channel (no state to avoid render loops)
    channelsRef.current.set(channelName, channel)
    
    // Return cleanup function
    return () => {
      console.log(`🧹 Cleaning up subscription for ${table}`)
      try {
        supabase.removeChannel(channel)
      } catch (e) {
        console.error('❌ Error removing channel', e)
      }
      channelsRef.current.delete(channelName)
    }
  }, [])

  // Specific subscription functions
  const subscribeToBookings = useCallback((callback: (payload: any) => void) => {
    return createSubscription('bookings', callback)
  }, [createSubscription])

  const subscribeToNotifications = useCallback((userId: string, callback: (payload: any) => void) => {
    // Filter notifications for the specific user
    const filter = `user_id=eq.${userId}`
    return createSubscription('notifications', callback, filter)
  }, [createSubscription])

  const subscribeToMeetingInvitations = useCallback((callback: (payload: any) => void) => {
    return createSubscription('meeting_invitations', callback)
  }, [createSubscription])

  const subscribeToPayments = useCallback((callback: (payload: any) => void) => {
    return createSubscription('payments', callback)
  }, [createSubscription])

  const subscribeToRooms = useCallback((callback: (payload: any) => void) => {
    return createSubscription('rooms', callback)
  }, [createSubscription])

  const subscribeToFacilities = useCallback((callback: (payload: any) => void) => {
    return createSubscription('facilities', callback)
  }, [createSubscription])

  // Cleanup all channels on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up all realtime channels')
      channelsRef.current.forEach((channel) => {
        try { supabase.removeChannel(channel) } catch {}
      })
      channelsRef.current.clear()
    }
  }, [])

  // Monitor overall connection status
  useEffect(() => {
    if (channelsRef.current.size === 0 && connectionStatus === 'connected') {
      setConnectionStatus('disconnected')
      setIsConnected(false)
    }
  }, [connectionStatus])

  const value: RealtimeContextType = {
    isConnected,
    connectionStatus,
    subscribeToBookings,
    subscribeToNotifications,
    subscribeToMeetingInvitations,
    subscribeToPayments,
    subscribeToRooms,
    subscribeToFacilities
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}
