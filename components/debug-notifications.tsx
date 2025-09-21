"use client"

import { useState } from 'react'
import { useNotifications } from '@/contexts/notifications-context'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function DebugNotifications() {
  const { user } = useAuth()
  const { notifications, unreadCount, fetchNotifications } = useNotifications()
  const [isCreating, setIsCreating] = useState(false)

  const createTestNotification = async () => {
    if (!user) return
    
    setIsCreating(true)
    try {
      // Create a test notification via API
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          title: 'Test Real-time Notification',
          message: `This is a test notification created at ${new Date().toLocaleTimeString()}`,
          type: 'info'
        })
      })

      if (response.ok) {
        console.log('✅ Test notification created successfully')
      } else {
        console.error('❌ Failed to create test notification')
      }
    } catch (error) {
      console.error('❌ Error creating test notification:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔔 Real-time Notifications Debug
          <Badge variant="secondary">{unreadCount} unread</Badge>
        </CardTitle>
        <CardDescription>
          Test real-time notifications functionality. Check browser console for logs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={createTestNotification}
            disabled={isCreating || !user}
            size="sm"
          >
            {isCreating ? 'Creating...' : 'Create Test Notification'}
          </Button>
          <Button 
            onClick={fetchNotifications}
            variant="outline"
            size="sm"
          >
            Refresh Notifications
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Connection Status:</h4>
          <div className="text-sm text-muted-foreground">
            User: {user ? `${user.name} (${user.id})` : 'Not logged in'}
          </div>
          <div className="text-sm text-muted-foreground">
            Total notifications: {notifications.length}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Recent Notifications (Last 5):</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {notifications.slice(0, 5).map((notification) => (
              <div 
                key={notification.id} 
                className={`p-3 text-sm border rounded-lg ${
                  notification.is_read 
                    ? 'bg-muted/50 border-muted' 
                    : 'bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800'
                }`}
              >
                <div className="font-medium flex items-center gap-2">
                  {notification.title}
                  {!notification.is_read && (
                    <Badge variant="default" className="text-xs">New</Badge>
                  )}
                </div>
                <div className="text-muted-foreground mt-1">
                  {notification.message}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.created_at).toLocaleString()} • Type: {notification.type}
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No notifications yet. Create a test notification to see real-time updates.
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <h5 className="font-medium text-sm mb-2">🔍 How to test:</h5>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Open browser console (F12)</li>
            <li>2. Click "Create Test Notification"</li>
            <li>3. You should see:</li>
            <li className="ml-4">• Console logs about subscription</li>
            <li className="ml-4">• Toast notification appear immediately</li>
            <li className="ml-4">• Notification added to list above</li>
            <li className="ml-4">• Unread count increase</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
