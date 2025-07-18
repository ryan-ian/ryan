import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createBookingReminderNotification } from '@/lib/notifications'

// This route is intended to be called by a cron job every 5-15 minutes
export async function GET(request: Request) {
  try {
    // Check for API key or secret to secure the endpoint
    const url = new URL(request.url)
    const apiKey = url.searchParams.get('api_key')
    
    // In production, you would validate the API key against a stored value
    // For now, we'll use a simple check (this should be improved in production)
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Use admin client to bypass RLS
    const adminClient = createAdminClient()
    
    // Get current time and time 15 minutes from now
    const now = new Date()
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000)
    
    // Find bookings that start in the next 15 minutes
    const { data: upcomingBookings, error } = await adminClient
      .from('bookings')
      .select(`
        id,
        user_id,
        title,
        start_time,
        room_id,
        rooms (
          id,
          name
        )
      `)
      .eq('status', 'confirmed')
      .gte('start_time', now.toISOString())
      .lt('start_time', fifteenMinutesFromNow.toISOString())
    
    if (error) {
      console.error('Error fetching upcoming bookings:', error)
      return NextResponse.json({ error: 'Failed to fetch upcoming bookings' }, { status: 500 })
    }
    
    if (!upcomingBookings || upcomingBookings.length === 0) {
      return NextResponse.json({ message: 'No upcoming bookings to send reminders for' })
    }
    
    // Check which bookings already have reminders sent
    const bookingIds = upcomingBookings.map(booking => booking.id)
    const { data: existingReminders, error: remindersError } = await adminClient
      .from('notifications')
      .select('related_id')
      .in('related_id', bookingIds)
      .eq('type', 'booking_reminder')
    
    if (remindersError) {
      console.error('Error fetching existing reminders:', remindersError)
      return NextResponse.json({ error: 'Failed to fetch existing reminders' }, { status: 500 })
    }
    
    // Create a set of booking IDs that already have reminders
    const bookingsWithReminders = new Set(existingReminders?.map(reminder => reminder.related_id) || [])
    
    // Send reminders for bookings that don't already have them
    const reminderPromises = upcomingBookings
      .filter(booking => !bookingsWithReminders.has(booking.id))
      .map(booking => {
        return createBookingReminderNotification(
          booking.user_id,
          booking.id,
          booking.title,
          booking.rooms?.name || 'Unknown Room',
          new Date(booking.start_time)
        )
      })
    
    // Wait for all reminders to be sent
    const results = await Promise.allSettled(reminderPromises)
    
    // Count successful and failed reminders
    const successful = results.filter(result => result.status === 'fulfilled').length
    const failed = results.filter(result => result.status === 'rejected').length
    
    return NextResponse.json({
      message: `Processed ${upcomingBookings.length} upcoming bookings`,
      stats: {
        total: upcomingBookings.length,
        alreadyNotified: bookingsWithReminders.size,
        remindersSent: successful,
        remindersFailed: failed
      }
    })
  } catch (error) {
    console.error('Exception in booking reminders cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}