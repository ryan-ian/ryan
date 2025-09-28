'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Bug, Database, Wifi, WifiOff } from 'lucide-react'

interface RealtimeDebugPanelProps {
  className?: string
}

export function RealtimeDebugPanel({ className }: RealtimeDebugPanelProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected')
  const [lastEvent, setLastEvent] = useState<any>(null)
  const [eventCount, setEventCount] = useState(0)
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null
  }

  useEffect(() => {
    console.log('🐛 [Debug Panel] Setting up debug subscription')
    
    const subscription = supabase
      .channel('debug_bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          console.log('🐛 [Debug Panel] Received event:', payload)
          setLastEvent(payload)
          setEventCount(prev => prev + 1)
          
          toast({
            title: "Real-time Event Detected",
            description: `${payload.eventType} event on booking ${payload.new?.id || payload.old?.id}`,
            duration: 3000,
          })
        }
      )
      .subscribe((status) => {
        console.log('🐛 [Debug Panel] Subscription status:', status)
        setConnectionStatus(status)
      })

    return () => {
      console.log('🐛 [Debug Panel] Cleaning up debug subscription')
      subscription.unsubscribe()
    }
  }, [toast])

  const testUserQuery = async () => {
    setIsTestingConnection(true)
    try {
      console.log('🐛 [Debug Panel] Testing user query...')
      
      // Test with a known user ID
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, organization, position')
        .eq('id', '3b184295-66cf-4500-8d4e-bbd28b5587c1')
        .single()

      if (error) {
        console.error('🐛 [Debug Panel] User query error:', error)
        toast({
          title: "User Query Failed",
          description: `Error: ${error.message}`,
          variant: "destructive"
        })
      } else {
        console.log('🐛 [Debug Panel] User query success:', data)
        toast({
          title: "User Query Success",
          description: `Found user: ${data.name}`,
        })
      }
    } catch (error) {
      console.error('🐛 [Debug Panel] User query exception:', error)
      toast({
        title: "User Query Exception",
        description: `Exception: ${error}`,
        variant: "destructive"
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const testRoomQuery = async () => {
    setIsTestingConnection(true)
    try {
      console.log('🐛 [Debug Panel] Testing room query...')
      
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, location, facility_id')
        .limit(1)
        .single()

      if (error) {
        console.error('🐛 [Debug Panel] Room query error:', error)
        toast({
          title: "Room Query Failed",
          description: `Error: ${error.message}`,
          variant: "destructive"
        })
      } else {
        console.log('🐛 [Debug Panel] Room query success:', data)
        toast({
          title: "Room Query Success",
          description: `Found room: ${data.name}`,
        })
      }
    } catch (error) {
      console.error('🐛 [Debug Panel] Room query exception:', error)
      toast({
        title: "Room Query Exception",
        description: `Exception: ${error}`,
        variant: "destructive"
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'SUBSCRIBED':
        return <Wifi className="h-4 w-4 text-green-500" />
      case 'CHANNEL_ERROR':
        return <WifiOff className="h-4 w-4 text-red-500" />
      case 'CLOSED':
        return <WifiOff className="h-4 w-4 text-gray-500" />
      default:
        return <WifiOff className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'SUBSCRIBED':
        return 'bg-green-500'
      case 'CHANNEL_ERROR':
        return 'bg-red-500'
      case 'CLOSED':
        return 'bg-gray-500'
      default:
        return 'bg-yellow-500'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Real-time Debug Panel
        </CardTitle>
        <CardDescription>
          Debug real-time subscriptions and database queries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">Connection Status:</span>
            <Badge className={getStatusColor()}>
              {connectionStatus}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Events received: {eventCount}
          </div>
        </div>

        {lastEvent && (
          <div className="p-3 bg-muted rounded-md">
            <h4 className="text-sm font-medium mb-2">Last Event:</h4>
            <div className="text-xs space-y-1">
              <div><strong>Type:</strong> {lastEvent.eventType}</div>
              <div><strong>Table:</strong> {lastEvent.table}</div>
              {lastEvent.new && (
                <div><strong>Booking ID:</strong> {lastEvent.new.id}</div>
              )}
              {lastEvent.new && (
                <div><strong>User ID:</strong> {lastEvent.new.user_id}</div>
              )}
              {lastEvent.new && (
                <div><strong>Status:</strong> {lastEvent.new.status}</div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={testUserQuery} 
            disabled={isTestingConnection}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Database className="mr-2 h-4 w-4" />
            Test User Query
          </Button>
          
          <Button 
            onClick={testRoomQuery} 
            disabled={isTestingConnection}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Database className="mr-2 h-4 w-4" />
            Test Room Query
          </Button>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Debug Instructions:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Check that connection status shows "SUBSCRIBED"</li>
            <li>Create a new booking to trigger an event</li>
            <li>Verify the event appears in "Last Event" section</li>
            <li>Test database queries to ensure they work</li>
            <li>Check browser console for detailed error logs</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
