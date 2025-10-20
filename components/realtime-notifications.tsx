'use client'

import { useEffect, useState } from 'react'
import { Bell, X, CheckCircle, AlertCircle, Calendar, CreditCard } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useUserRealtime } from '@/hooks/use-user-realtime'
import { useFacilityManagerRealtime } from '@/hooks/use-facility-manager-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface RealtimeNotification {
  id: string
  type: 'booking_status' | 'new_booking' | 'payment' | 'meeting_invitation'
  title: string
  message: string
  timestamp: Date
  read: boolean
  data?: any
}

interface RealtimeNotificationsProps {
  className?: string
  maxNotifications?: number
}

export function RealtimeNotifications({ 
  className, 
  maxNotifications = 5 
}: RealtimeNotificationsProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // User realtime updates
  const userRealtime = useUserRealtime()
  
  // Facility manager realtime updates (always call the hook to preserve hook order)
  const facilityManagerRealtime = useFacilityManagerRealtime()

  // Add notification helper
  const addNotification = (notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: RealtimeNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false
    }
    
    setNotifications(prev => [newNotification, ...prev.slice(0, maxNotifications - 1)])
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
    }, 10000)
  }

  // Handle user booking status changes
  useEffect(() => {
    if (userRealtime?.hasBookingStatusUpdates && userRealtime.bookingStatusUpdates.length > 0) {
      const latestUpdate = userRealtime.bookingStatusUpdates[0]
      
      addNotification({
        type: 'booking_status',
        title: 'Booking Status Updated',
        message: `Your booking "${latestUpdate.title}" status changed to ${latestUpdate.status}`,
        data: latestUpdate
      })
    }
  }, [userRealtime?.hasBookingStatusUpdates, userRealtime?.bookingStatusUpdates])

  // Handle new notifications
  useEffect(() => {
    if (userRealtime?.hasNewNotifications && userRealtime.notifications.length > 0) {
      const latestNotification = userRealtime.notifications[0]
      
      addNotification({
        type: 'meeting_invitation',
        title: latestNotification.title || 'New Notification',
        message: latestNotification.message,
        data: latestNotification
      })
    }
  }, [userRealtime?.hasNewNotifications, userRealtime?.notifications])

  // Handle payment updates
  useEffect(() => {
    if (userRealtime?.hasPaymentUpdates && userRealtime.paymentUpdates.length > 0) {
      const latestPayment = userRealtime.paymentUpdates[0]
      
      addNotification({
        type: 'payment',
        title: 'Payment Update',
        message: `Payment status: ${latestPayment.status}`,
        data: latestPayment
      })
    }
  }, [userRealtime?.hasPaymentUpdates, userRealtime?.paymentUpdates])

  // Handle facility manager new booking requests
  useEffect(() => {
    if (facilityManagerRealtime?.hasNewBookingRequests && facilityManagerRealtime.newBookingRequests.length > 0) {
      const latestRequest = facilityManagerRealtime.newBookingRequests[0]
      
      addNotification({
        type: 'new_booking',
        title: 'New Booking Request',
        message: `New request for "${latestRequest.title}"`,
        data: latestRequest
      })
    }
  }, [facilityManagerRealtime?.hasNewBookingRequests, facilityManagerRealtime?.newBookingRequests])

  // Get icon for notification type
  const getNotificationIcon = (type: RealtimeNotification['type']) => {
    switch (type) {
      case 'booking_status':
        return <Calendar className="h-4 w-4" />
      case 'new_booking':
        return <Bell className="h-4 w-4" />
      case 'payment':
        return <CreditCard className="h-4 w-4" />
      case 'meeting_invitation':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  // Get color for notification type
  const getNotificationColor = (type: RealtimeNotification['type']) => {
    switch (type) {
      case 'booking_status':
        return 'bg-blue-500'
      case 'new_booking':
        return 'bg-green-500'
      case 'payment':
        return 'bg-purple-500'
      case 'meeting_invitation':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Clear all notifications
  const clearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className={cn("fixed top-4 right-4 z-50 space-y-2", className)}>
      {/* Notification Bell */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notifications Panel */}
      {isOpen && (
        <Card className="w-80 max-h-96 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold text-sm">Live Updates</h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                    !notification.read && "bg-blue-50 dark:bg-blue-950/20"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white",
                      getNotificationColor(notification.type)
                    )}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeNotification(notification.id)
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
