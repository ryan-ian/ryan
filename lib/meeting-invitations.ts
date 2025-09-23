import { supabase, createAdminClient } from '@/lib/supabase'
import * as types from '@/types'

/**
 * Get all meeting invitations for a booking
 */
export async function getMeetingInvitations(bookingId: string): Promise<types.MeetingInvitation[]> {
  try {
    const { data, error } = await supabase
      .from('meeting_invitations')
      .select('*')
      .eq('booking_id', bookingId)
      .order('invited_at', { ascending: false })

    if (error) {
      console.error('Error fetching meeting invitations:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Exception in getMeetingInvitations:', error)
    throw error
  }
}

/**
 * Create meeting invitations for multiple email addresses
 */
export async function createMeetingInvitations(
  bookingId: string,
  organizerId: string,
  inviteeEmails: string[]
): Promise<types.MeetingInvitation[]> {
  try {
    // Prepare invitation records
    const invitations = inviteeEmails.map(email => ({
      booking_id: bookingId,
      organizer_id: organizerId,
      invitee_email: email.toLowerCase().trim(),
      status: 'pending' as const,
      invited_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('meeting_invitations')
      .insert(invitations)
      .select()

    if (error) {
      console.error('Error creating meeting invitations:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Exception in createMeetingInvitations:', error)
    throw error
  }
}

/**
 * Create meeting invitations with attendee names and emails
 */
export async function createMeetingInvitationsWithNames(
  bookingId: string,
  organizerId: string,
  attendees: types.MeetingAttendee[]
): Promise<types.MeetingInvitation[]> {
  try {
    // Generate unique tokens for each invitation
    const { randomUUID } = await import('crypto')
    
    // Prepare invitation records
    const invitations = attendees.map(attendee => ({
      booking_id: bookingId,
      organizer_id: organizerId,
      invitee_email: attendee.email.toLowerCase().trim(),
      invitee_name: attendee.name?.trim() || null,
      invitation_token: randomUUID(),
      response_token: randomUUID(), // For RSVP responses
      status: 'pending' as const,
      email_status: 'pending' as const,
      invited_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('meeting_invitations')
      .insert(invitations)
      .select()

    if (error) {
      console.error('Error creating meeting invitations with names:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Exception in createMeetingInvitationsWithNames:', error)
    throw error
  }
}

/**
 * Get invitation count for a booking
 */
export async function getInvitationCountForBooking(bookingId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('meeting_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('booking_id', bookingId)

    if (error) {
      console.error('Error getting invitation count:', error)
      throw error
    }

    return count || 0
  } catch (error) {
    console.error('Exception in getInvitationCountForBooking:', error)
    throw error
  }
}

/**
 * Check if new invitations can be added without exceeding room capacity
 */
export async function checkInvitationCapacity(
  bookingId: string,
  newInviteeCount: number
): Promise<{ canInvite: boolean; currentCount: number; roomCapacity: number; message?: string }> {
  try {
    // Get current invitation count
    const currentCount = await getInvitationCountForBooking(bookingId)

    // Get room capacity
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        rooms (
          id,
          name,
          capacity
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      throw new Error('Booking not found')
    }

    const room = Array.isArray(booking.rooms) ? booking.rooms[0] : booking.rooms
    if (!room) {
      throw new Error('Room not found for booking')
    }

    const roomCapacity = room.capacity
    const totalAfterInvite = currentCount + newInviteeCount + 1 // +1 for organizer

    const canInvite = totalAfterInvite <= roomCapacity

    return {
      canInvite,
      currentCount,
      roomCapacity,
      message: canInvite 
        ? undefined 
        : `Cannot invite ${newInviteeCount} more people. Room capacity is ${roomCapacity}, current invitations: ${currentCount} (plus organizer).`
    }
  } catch (error) {
    console.error('Exception in checkInvitationCapacity:', error)
    throw error
  }
}

/**
 * Check capacity for new attendees (name + email format)
 */
export async function checkInvitationCapacityForAttendees(
  bookingId: string,
  newAttendees: types.MeetingAttendee[]
): Promise<{ canInvite: boolean; currentCount: number; roomCapacity: number; message?: string }> {
  return checkInvitationCapacity(bookingId, newAttendees.length)
}
