"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useUserRealtime } from '@/hooks/use-user-realtime'
import type { Booking } from '@/types'
import { CheckCircle, Clock, XCircle, RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react'

interface RealtimeBookingStatusDebugProps {
  className?: string
}

export function RealtimeBookingStatusDebug({ className }: RealtimeBookingStatusDebugProps) {
  const { user } = useAuth()
  const [realtimeEvents, setRealtimeEvents] = useState<Array<{
    id: string
    timestamp: Date
    type: 'status_change' | 'update' | 'error' | 'connection'
    bookingId?: string
    oldStatus?: string
    newStatus?: string
    details: string
    level: 'info' | 'success' | 'warning' | 'error'
  }>>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting')

  // Handle real-time booking status changes
  const handleBookingStatusChange = (booking: Booking, oldStatus: string, newStatus: string) => {
    console.log(`🧪 [Debug] Status change detected: ${oldStatus} → ${newStatus} for booking ${booking.id}`)
    
    const event = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type: 'status_change' as const,
      bookingId: booking.id,
      oldStatus,
      newStatus,
      details: `Booking ${booking.id} status changed from "${oldStatus}" to "${newStatus}"`,
      level: 'success' as const
    }
    
    setRealtimeEvents(prev => [event, ...prev.slice(0, 19)]) // Keep last 20 events
    setConnectionStatus('connected')
  }

  // Handle general booking updates
  const handleBookingUpdate = () => {
    console.log(`🧪 [Debug] General booking update received`)
    
    const event = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type: 'update' as const,
      details: 'General booking update received - data refreshed',
      level: 'info' as const
    }
    
    setRealtimeEvents(prev => [event, ...prev.slice(0, 19)])
    setConnectionStatus('connected')
  }

  // Set up real-time subscription with enhanced debugging
  const { cleanup, isConnected } = useUserRealtime({
    onBookingStatusChange: handleBookingStatusChange,
    onBookingUpdate: handleBookingUpdate,
    enabled: !!user,
    showToasts: false, // Disable toasts for debugging
  })

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      if (isConnected) {
        setConnectionStatus('connected')
      } else if (user) {
        setConnectionStatus('connecting')
      } else {
        setConnectionStatus('disconnected')
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 2000)
    return () => clearInterval(interval)
  }, [isConnected, user])

  // Add connection status events
  useEffect(() => {
    const event = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type: 'connection' as const,
      details: `Connection status: ${connectionStatus}`,
      level: connectionStatus === 'connected' ? 'success' : connectionStatus === 'error' ? 'error' : 'warning' as const
    }
    
    setRealtimeEvents(prev => [event, ...prev.slice(0, 19)])
  }, [connectionStatus])

  // Clear events
  const clearEvents = () => {
    setRealtimeEvents([])
  }

  // Force reconnection
  const forceReconnect = () => {
    cleanup()
    setConnectionStatus('connecting')
    
    const event = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type: 'connection' as const,
      details: 'Manual reconnection triggered',
      level: 'info' as const
    }
    
    setRealtimeEvents(prev => [event, ...prev.slice(0, 19)])
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'cancelled':
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <RefreshCw className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <RefreshCw className="h-4 w-4 text-blue-500" />
    }
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />
      case 'error':
        return <WifiOff className="h-4 w-4 text-red-500" />
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />
    }
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Real-time Booking Debug</CardTitle>
          <CardDescription>Please log in to debug real-time booking updates</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Real-time Booking Debug
          <div className="flex items-center gap-1">
            {getConnectionIcon()}
            <Badge variant={connectionStatus === 'connected' ? "default" : connectionStatus === 'error' ? "destructive" : "secondary"}>
              {connectionStatus}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Debugging real-time booking status changes for user: {user.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Recent Events ({realtimeEvents.length}/20)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={forceReconnect}>
              Reconnect
            </Button>
            <Button variant="outline" size="sm" onClick={clearEvents}>
              Clear Events
            </Button>
          </div>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {realtimeEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No real-time events detected yet</p>
              <p className="text-xs">Try approving/rejecting a booking from the facility manager dashboard</p>
            </div>
          ) : (
            realtimeEvents.map((event) => (
              <div
                key={event.id}
                className={`flex items-start gap-3 p-3 border rounded-lg ${getLevelColor(event.level)}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {event.type === 'status_change' ? (
                    <div className="flex gap-1">
                      {getStatusIcon(event.oldStatus)}
                      <span className="text-xs text-muted-foreground">→</span>
                      {getStatusIcon(event.newStatus)}
                    </div>
                  ) : (
                    getLevelIcon(event.level)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {event.type === 'status_change' ? 'Status Change' : 
                       event.type === 'connection' ? 'Connection' :
                       event.type === 'error' ? 'Error' : 'Update'}
                    </Badge>
                    {event.type === 'status_change' && event.oldStatus && event.newStatus && (
                      <div className="flex items-center gap-1">
                        <Badge className={`text-xs ${getStatusColor(event.oldStatus)}`}>
                          {event.oldStatus}
                        </Badge>
                        <span className="text-xs text-muted-foreground">→</span>
                        <Badge className={`text-xs ${getStatusColor(event.newStatus)}`}>
                          {event.newStatus}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <p className="text-sm">{event.details}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.timestamp.toLocaleTimeString()}
                    {event.bookingId && ` - Booking ID: ${event.bookingId}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p><strong>Debug Information:</strong></p>
          <p>• User ID: {user.id}</p>
          <p>• Connection Status: {connectionStatus}</p>
          <p>• Real-time Enabled: {isConnected ? 'Yes' : 'No'}</p>
          <p><strong>Testing Instructions:</strong></p>
          <p>1. Create a booking request as a user</p>
          <p>2. Open facility manager dashboard in another tab</p>
          <p>3. Approve or reject the booking</p>
          <p>4. Watch for real-time status change events here</p>
        </div>
      </CardContent>
    </Card>
  )
}
