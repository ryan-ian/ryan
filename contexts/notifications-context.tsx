"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { Notification } from '@/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { toast } from '@/components/ui/use-toast'

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  fetchNotifications: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const subscriptionRef = useRef<any>(null)

  // Set up real-time subscription for new notifications
  const setupNotificationsSubscription = () => {
    if (!user) return

    // Clean up any existing subscription first
    if (subscriptionRef.current) {
      console.log('🔔 Cleaning up existing subscription')
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    console.log('🔔 Setting up real-time notifications subscription for user:', user.id)

    const subscription = supabase
      .channel(`notifications_channel_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 New notification received:', payload)
          const newNotification = payload.new as Notification
          
          // Add the new notification to the state
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)
          
          // Show a toast for the new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            duration: 5000,
          })
        }
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to notifications')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to notifications')
        }
      })

    // Store the subscription reference
    subscriptionRef.current = subscription
  }

  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications()
      // Set up real-time subscription for new notifications
      setupNotificationsSubscription()
    } else {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
    }

    // Cleanup subscription on unmount or user change
    return () => {
      if (subscriptionRef.current) {
        console.log('🔔 Cleaning up notifications subscription on unmount')
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [user])

  // Fetch all notifications for the current user
  const fetchNotifications = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      setNotifications(data || [])
      // Count unread notifications
      setUnreadCount(data?.filter(n => !n.is_read).length || 0)
    } catch (error) {
      console.error('Exception in fetchNotifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Exception in markAsRead:', error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return
      }

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Exception in markAllAsRead:', error)
    }
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
} 