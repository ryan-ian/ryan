import { useEffect, useRef, useState } from 'react'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'
export type RealtimePayload<T = any> = RealtimePostgresChangesPayload<T>

interface UseRealtimeOptions {
  table: string
  event?: RealtimeEvent | '*'
  schema?: string
  filter?: string
  enabled?: boolean
}

interface UseRealtimeReturn<T> {
  data: T | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  channel: RealtimeChannel | null
}

/**
 * Custom hook for managing Supabase realtime subscriptions
 * Automatically handles connection lifecycle and cleanup
 */
export function useRealtime<T = any>({
  table,
  event = '*',
  schema = 'public',
  filter,
  enabled = true
}: UseRealtimeOptions): UseRealtimeReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    setIsConnecting(true)
    setError(null)

    // Create a unique channel name
    const channelName = `realtime:${schema}:${table}:${Date.now()}`
    
    // Create the channel
    const channel = supabase.channel(channelName)

    // Configure postgres changes subscription
    let subscription = channel.on(
      'postgres_changes',
      {
        event: event as any,
        schema,
        table,
        filter
      },
      (payload: RealtimePostgresChangesPayload<T>) => {
        console.log(`📡 Realtime event received for ${table}:`, payload.eventType, payload)
        setData(payload as T)
        setError(null)
      }
    )

    // Handle connection status
    channel.on('system', {}, (payload) => {
      console.log(`📡 Realtime system event for ${table}:`, payload)
      
      if (payload.status === 'SUBSCRIBED') {
        setIsConnected(true)
        setIsConnecting(false)
        console.log(`✅ Successfully subscribed to ${table} realtime updates`)
      } else if (payload.status === 'CHANNEL_ERROR') {
        setError(`Failed to subscribe to ${table} updates`)
        setIsConnected(false)
        setIsConnecting(false)
      } else if (payload.status === 'CLOSED') {
        setIsConnected(false)
        setIsConnecting(false)
      }
    })

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log(`📡 Realtime subscription status for ${table}:`, status)
      
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
        setIsConnecting(false)
      } else if (status === 'CHANNEL_ERROR') {
        setError(`Failed to subscribe to ${table} updates`)
        setIsConnected(false)
        setIsConnecting(false)
      } else if (status === 'CLOSED') {
        setIsConnected(false)
        setIsConnecting(false)
      }
    })

    channelRef.current = channel

    // Cleanup function
    return () => {
      console.log(`🧹 Cleaning up realtime subscription for ${table}`)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setIsConnected(false)
      setIsConnecting(false)
      setData(null)
      setError(null)
    }
  }, [table, event, schema, filter, enabled])

  return {
    data,
    isConnected,
    isConnecting,
    error,
    channel: channelRef.current
  }
}

/**
 * Hook specifically for booking realtime updates
 */
export function useBookingRealtime(enabled = true) {
  return useRealtime({
    table: 'bookings',
    enabled
  })
}

/**
 * Hook specifically for notification realtime updates
 */
export function useNotificationRealtime(enabled = true) {
  return useRealtime({
    table: 'notifications',
    enabled
  })
}

/**
 * Hook specifically for meeting invitation realtime updates
 */
export function useMeetingInvitationRealtime(enabled = true) {
  return useRealtime({
    table: 'meeting_invitations',
    enabled
  })
}

/**
 * Hook specifically for payment realtime updates
 */
export function usePaymentRealtime(enabled = true) {
  return useRealtime({
    table: 'payments',
    enabled
  })
}
