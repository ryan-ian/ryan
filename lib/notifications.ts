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
      })
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

/**
 * Creates a notification for facility managers when a booking is made for a room in their facility
 * @param facilityManagerId - The ID of the facility manager
 * @param bookingId - The ID of the booking
 * @param userName - The name of the user who made the booking
 * @param bookingTitle - The title of the booking
 * @param roomName - The name of the room
 * @param startTime - The start time of the booking
 * @param endTime - The end time of the booking
 * @returns The created notification or null if there was an error
 */
export async function createFacilityManagerBookingNotification(
  facilityManagerId: string,
  bookingId: string,
  userName: string,
  bookingTitle: string,
  roomName: string,
  startTime: string,
  endTime: string
): Promise<Notification | null> {
  // Format the times nicely
  const startDateTime = new Date(startTime);
  const endDateTime = new Date(endTime);
  const dateStr = startDateTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const startTimeStr = startDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTimeStr = endDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return createNotification(
    facilityManagerId,
    'New Room Booking',
    `${userName} has booked "${roomName}" for "${bookingTitle}" on ${dateStr} from ${startTimeStr} to ${endTimeStr}.`,
    'booking_request',
    bookingId
  )
}

/**
 * Creates a booking confirmation notification
 * @param userId - The ID of the user who made the booking
 * @param bookingId - The ID of the booking
 * @param bookingTitle - The title of the booking
 * @param roomName - The name of the room
 * @returns The created notification or null if there was an error
 */
export async function createBookingConfirmationNotification(
  userId: string,
  bookingId: string,
  bookingTitle: string,
  roomName: string
): Promise<Notification | null> {
  return createNotification(
    userId,
    'Booking Confirmed',
    `Your booking "${bookingTitle}" in ${roomName} has been confirmed.`,
    'booking_confirmation',
    bookingId
  )
}

/**
 * Creates a booking rejection notification
 * @param userId - The ID of the user who made the booking
 * @param bookingId - The ID of the booking
 * @param bookingTitle - The title of the booking
 * @param roomName - The name of the room
 * @param reason - Optional reason for rejection
 * @returns The created notification or null if there was an error
 */
export async function createBookingRejectionNotification(
  userId: string,
  bookingId: string,
  bookingTitle: string,
  roomName: string,
  reason?: string
): Promise<Notification | null> {
  const message = reason
    ? `Your booking "${bookingTitle}" in ${roomName} has been rejected. Reason: ${reason}`
    : `Your booking "${bookingTitle}" in ${roomName} has been rejected.`
  
  return createNotification(
    userId,
    'Booking Rejected',
    message,
    'booking_rejection',
    bookingId
  )
}

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

/**
 * Creates a booking request notification for admins
 * @param adminId - The ID of the admin to notify
 * @param bookingId - The ID of the booking
 * @param userName - The name of the user who made the booking
 * @param bookingTitle - The title of the booking
 * @param roomName - The name of the room
 * @returns The created notification or null if there was an error
 */
export async function createBookingRequestNotification(
  adminId: string,
  bookingId: string,
  userName: string,
  bookingTitle: string,
  roomName: string
): Promise<Notification | null> {
  return createNotification(
    adminId,
    'New Booking Request',
    `${userName} has requested to book "${bookingTitle}" in ${roomName}.`,
    'booking_request',
    bookingId
  )
}

/**
 * Creates pending approval notifications for all admins
 * @param bookingId - The ID of the booking
 * @param userName - The name of the user who made the booking
 * @param bookingTitle - The title of the booking
 * @param roomName - The name of the room
 * @returns An array of created notifications or empty array if there was an error
 */
export async function createPendingApprovalNotificationsForAdmins(
  bookingId: string,
  userName: string,
  bookingTitle: string,
  roomName: string
): Promise<Notification[]> {
  try {
    // Use admin client to bypass RLS
    const adminClient = createAdminClient()
    
    // Get all admin users
    const { data: admins, error: adminsError } = await adminClient
      .from('users')
      .select('id, name')
      .eq('role', 'admin')
    
    if (adminsError || !admins) {
      console.error('Error fetching admins:', adminsError)
      return []
    }
    
    // Create notifications for each admin
    const notificationPromises = admins.map(admin => 
      createBookingRequestNotification(
        admin.id,
        bookingId,
        userName,
        bookingTitle,
        roomName
      )
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
    console.error('Exception in createPendingApprovalNotificationsForAdmins:', error)
    return []
  }
}

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
      .eq('role', 'admin')
    
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