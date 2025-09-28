import { createAdminClient } from '@/lib/supabase'
import type { Notification } from '@/types'

/**
 * Creates a notification for a user
 * @param userId - The ID of the user to send the notification to
 * @param title - The notification title
 * @param message - The notification message
 * @param type - The notification type
 * @param relatedId - Optional ID of related entity (booking, room, etc.)
 * @returns The created notification or null if there was an error
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification['type'],
  relatedId?: string
): Promise<Notification | null> {
  try {
    // Use admin client to bypass RLS
    const adminClient = createAdminClient()
    
    // Create the notification
    const { data, error } = await adminClient
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        related_id: relatedId,
        is_read: false,
      } as any)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating notification:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Exception in createNotification:', error)
    return null
  }
}

// REMOVED: createFacilityManagerBookingNotification
// This function duplicated the Supabase database trigger functionality.
// Booking request notifications are now handled automatically by the
// create_booking_notification database function when bookings are inserted.

// REMOVED: createBookingConfirmationNotification
// This function duplicated the Supabase database trigger functionality.
// Booking confirmation notifications are now handled automatically by the
// create_booking_notification database function when booking status changes to 'confirmed'.

// REMOVED: createBookingRejectionNotification
// This function duplicated the Supabase database trigger functionality.
// Booking rejection notifications are now handled automatically by the
// create_booking_notification database function when booking status changes to 'cancelled'.

/**
 * Creates a booking reminder notification
 * @param userId - The ID of the user who made the booking
 * @param bookingId - The ID of the booking
 * @param bookingTitle - The title of the booking
 * @param roomName - The name of the room
 * @param startTime - The start time of the booking
 * @returns The created notification or null if there was an error
 */
export async function createBookingReminderNotification(
  userId: string,
  bookingId: string,
  bookingTitle: string,
  roomName: string,
  startTime: Date
): Promise<Notification | null> {
  // Format the time nicely
  const timeString = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  
  return createNotification(
    userId,
    'Upcoming Meeting Reminder',
    `Your meeting "${bookingTitle}" in ${roomName} starts at ${timeString}.`,
    'booking_reminder',
    bookingId
  )
}

/**
 * Creates a room maintenance notification
 * @param userId - The ID of the user to notify
 * @param roomId - The ID of the room
 * @param roomName - The name of the room
 * @param message - The maintenance message
 * @returns The created notification or null if there was an error
 */
export async function createRoomMaintenanceNotification(
  userId: string,
  roomId: string,
  roomName: string,
  message: string
): Promise<Notification | null> {
  return createNotification(
    userId,
    'Room Maintenance',
    `Room "${roomName}" maintenance update: ${message}`,
    'room_maintenance',
    roomId
  )
}

/**
 * Creates a system notification
 * @param userId - The ID of the user to notify
 * @param title - The notification title
 * @param message - The notification message
 * @returns The created notification or null if there was an error
 */
export async function createSystemNotification(
  userId: string,
  title: string,
  message: string
): Promise<Notification | null> {
  return createNotification(
    userId,
    title,
    message,
    'system_notification'
  )
}

// REMOVED: createBookingRequestNotification
// This function duplicated the Supabase database trigger functionality.
// Booking request notifications for admins are now handled automatically by the
// create_booking_notification database function when bookings are inserted.

// REMOVED: createPendingApprovalNotificationsForAdmins
// This function duplicated the Supabase database trigger functionality.
// Admin notifications for new booking requests are now handled automatically by the
// create_booking_notification database function when bookings are inserted.

/**
 * Creates a daily summary notification for admins with pending bookings
 * @param adminId - The ID of the admin to notify
 * @param pendingCount - The number of pending bookings
 * @returns The created notification or null if there was an error
 */
export async function createPendingBookingsSummaryNotification(
  adminId: string,
  pendingCount: number
): Promise<Notification | null> {
  return createNotification(
    adminId,
    'Pending Bookings Summary',
    `You have ${pendingCount} booking request${pendingCount === 1 ? '' : 's'} pending approval.`,
    'pending_approval'
  )
}

/**
 * Sends a daily summary notification to all admins about pending bookings
 * @returns An array of created notifications or empty array if there was an error
 */
export async function sendPendingBookingsSummaryToAdmins(): Promise<Notification[]> {
  try {
    // Use admin client to bypass RLS
    const adminClient = createAdminClient()
    
    // Get count of pending bookings
    const { count, error: countError } = await adminClient
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    
    if (countError || count === null) {
      console.error('Error counting pending bookings:', countError)
      return []
    }
    
    // If no pending bookings, don't send notifications
    if (count === 0) {
      return []
    }
    
    // Get all admin users
    const { data: admins, error: adminsError } = await adminClient
      .from('users')
      .select('id')
      .eq('role', 'admin') as { data: { id: string }[] | null, error: any }
    
    if (adminsError || !admins) {
      console.error('Error fetching admins:', adminsError)
      return []
    }
    
    // Create notifications for each admin
    const notificationPromises = admins.map(admin => 
      createPendingBookingsSummaryNotification(admin.id, count)
    )
    
    // Wait for all notifications to be created
    const results = await Promise.allSettled(notificationPromises)
    
    // Return only successful notifications
    return results
      .filter((result): result is PromiseFulfilledResult<Notification> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value)
  } catch (error) {
    console.error('Exception in sendPendingBookingsSummaryToAdmins:', error)
    return []
  }
}