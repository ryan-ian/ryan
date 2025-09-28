'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
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
  const [channels, setChannels] = useState<Map<string, RealtimeChannel>>(new Map())

  // Create a subscription function factory
  const createSubscription = useCallback((
    table: string,
    callback: (payload: any) => void,
    filter?: string
  ) => {
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
    
    // Handle connection status
    channel.on('system', {}, (payload) => {
      if (payload.status === 'SUBSCRIBED') {
        console.log(`✅ Successfully subscribed to ${table}`)
        setIsConnected(true)
        setConnectionStatus('connected')
      } else if (payload.status === 'CHANNEL_ERROR') {
        console.error(`❌ Error subscribing to ${table}:`, payload)
        setConnectionStatus('error')
      }
    })
    
    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log(`📡 Subscription status for ${table}:`, status)
      
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
        setConnectionStatus('connected')
      } else if (status === 'CHANNEL_ERROR') {
        setConnectionStatus('error')
      } else if (status === 'CLOSED') {
        setIsConnected(false)
        setConnectionStatus('disconnected')
      }
    })
    
    // Store the channel
    setChannels(prev => new Map(prev).set(channelName, channel))
    
    // Return cleanup function
    return () => {
      console.log(`🧹 Cleaning up subscription for ${table}`)
      supabase.removeChannel(channel)
      setChannels(prev => {
        const newChannels = new Map(prev)
        newChannels.delete(channelName)
        return newChannels
      })
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
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [channels])

  // Monitor overall connection status
  useEffect(() => {
    if (channels.size === 0) {
      setConnectionStatus('disconnected')
      setIsConnected(false)
    }
  }, [channels.size])

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
