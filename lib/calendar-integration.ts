import { supabase, createAdminClient } from '@/lib/supabase';
import { CalendarProvider, CalendarIntegration, CalendarEvent } from '@/lib/types';
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from '@/lib/calendar-service';
import { createOutlookCalendarEvent, updateOutlookCalendarEvent, deleteOutlookCalendarEvent } from '@/lib/calendar-service';

/**
 * Get a user's calendar integration by provider
 * @param userId User ID
 * @param provider Calendar provider (google, outlook)
 * @returns Calendar integration or null if not found
 */
export async function getUserCalendarIntegration(
  userId: string,
  provider: CalendarProvider
): Promise<CalendarIntegration | null> {
  try {
    const { data, error } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error(`Error fetching ${provider} calendar integration for user ${userId}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Exception in getUserCalendarIntegration:`, error);
    return null;
  }
}

/**
 * Store or update a user's calendar integration
 * @param userId User ID
 * @param provider Calendar provider
 * @param accessToken Access token
 * @param refreshToken Refresh token
 * @param expiresAt Token expiration timestamp
 * @param calendarId Optional calendar ID
 * @returns The created or updated calendar integration
 */
export async function storeCalendarIntegration(
  userId: string,
  provider: CalendarProvider,
  accessToken: string,
  refreshToken: string,
  expiresAt: string,
  calendarId?: string
): Promise<CalendarIntegration | null> {
  try {
    // Check if integration already exists
    const { data: existingIntegration, error: fetchError } = await supabase
      .from('calendar_integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    if (existingIntegration) {
      // Update existing integration
      const { data, error } = await adminClient
        .from('calendar_integrations')
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: expiresAt,
          calendar_id: calendarId,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingIntegration.id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating ${provider} calendar integration:`, error);
        return null;
      }

      return data;
    } else {
      // Create new integration
      const { data, error } = await adminClient
        .from('calendar_integrations')
        .insert({
          user_id: userId,
          provider,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: expiresAt,
          calendar_id: calendarId,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating ${provider} calendar integration:`, error);
        return null;
      }

      return data;
    }
  } catch (error) {
    console.error(`Exception in storeCalendarIntegration:`, error);
    return null;
  }
}

/**
 * Store a calendar event reference
 * @param bookingId Booking ID
 * @param userId User ID
 * @param provider Calendar provider
 * @param eventId Calendar event ID
 * @returns The created calendar event reference
 */
export async function storeCalendarEvent(
  bookingId: string,
  userId: string,
  provider: CalendarProvider,
  eventId: string
): Promise<CalendarEvent | null> {
  try {
    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('calendar_events')
      .insert({
        booking_id: bookingId,
        user_id: userId,
        provider,
        event_id: eventId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(`Error storing ${provider} calendar event:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Exception in storeCalendarEvent:`, error);
    return null;
  }
}

/**
 * Get calendar event reference by booking ID
 * @param bookingId Booking ID
 * @param provider Calendar provider
 * @returns Calendar event reference or null if not found
 */
export async function getCalendarEventByBookingId(
  bookingId: string,
  provider: CalendarProvider
): Promise<CalendarEvent | null> {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('provider', provider)
      .single();

    if (error || !data) {
      console.error(`Error fetching ${provider} calendar event for booking ${bookingId}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Exception in getCalendarEventByBookingId:`, error);
    return null;
  }
}

/**
 * Sync a booking to a user's calendar
 * @param userId User ID
 * @param bookingId Booking ID
 * @param bookingTitle Booking title
 * @param roomName Room name
 * @param description Booking description
 * @param startTime Start time
 * @param endTime End time
 * @param attendees List of attendee email addresses
 * @returns True if successful, false otherwise
 */
export async function syncBookingToCalendar(
  userId: string,
  bookingId: string,
  bookingTitle: string,
  roomName: string,
  description: string,
  startTime: string,
  endTime: string,
  attendees: string[] = []
): Promise<boolean> {
  try {
    // Check for Google Calendar integration
    const googleIntegration = await getUserCalendarIntegration(userId, 'google');
    if (googleIntegration) {
      // Check if event already exists
      const existingEvent = await getCalendarEventByBookingId(bookingId, 'google');
      
      if (existingEvent) {
        // Update existing event
        const updated = await updateGoogleCalendarEvent(
          existingEvent.event_id,
          bookingTitle,
          roomName,
          description,
          startTime,
          endTime,
          attendees,
          googleIntegration.access_token
        );
        
        return updated;
      } else {
        // Create new event
        const eventId = await createGoogleCalendarEvent(
          googleIntegration.user_id,
          bookingTitle,
          roomName,
          description,
          startTime,
          endTime,
          attendees,
          googleIntegration.access_token
        );
        
        if (eventId) {
          // Store the event reference
          await storeCalendarEvent(bookingId, userId, 'google', eventId);
          return true;
        }
      }
    }
    
    // Check for Outlook Calendar integration
    const outlookIntegration = await getUserCalendarIntegration(userId, 'outlook');
    if (outlookIntegration) {
      // Check if event already exists
      const existingEvent = await getCalendarEventByBookingId(bookingId, 'outlook');
      
      if (existingEvent) {
        // Update existing event
        const updated = await updateOutlookCalendarEvent(
          existingEvent.event_id,
          bookingTitle,
          roomName,
          description,
          startTime,
          endTime,
          attendees,
          outlookIntegration.access_token
        );
        
        return updated;
      } else {
        // Create new event
        const eventId = await createOutlookCalendarEvent(
          outlookIntegration.user_id,
          bookingTitle,
          roomName,
          description,
          startTime,
          endTime,
          attendees,
          outlookIntegration.access_token
        );
        
        if (eventId) {
          // Store the event reference
          await storeCalendarEvent(bookingId, userId, 'outlook', eventId);
          return true;
        }
      }
    }
    
    // No calendar integration found
    return false;
  } catch (error) {
    console.error(`Exception in syncBookingToCalendar:`, error);
    return false;
  }
}

/**
 * Delete a booking from a user's calendar
 * @param userId User ID
 * @param bookingId Booking ID
 * @returns True if successful, false otherwise
 */
export async function deleteBookingFromCalendar(
  userId: string,
  bookingId: string
): Promise<boolean> {
  try {
    let success = false;
    
    // Check for Google Calendar integration and event
    const googleIntegration = await getUserCalendarIntegration(userId, 'google');
    const googleEvent = await getCalendarEventByBookingId(bookingId, 'google');
    
    if (googleIntegration && googleEvent) {
      // Delete the event
      await deleteGoogleCalendarEvent(
        googleEvent.event_id,
        googleIntegration.access_token
      );
      
      // Delete the event reference
      await supabase
        .from('calendar_events')
        .delete()
        .eq('id', googleEvent.id);
      
      success = true;
    }
    
    // Check for Outlook Calendar integration and event
    const outlookIntegration = await getUserCalendarIntegration(userId, 'outlook');
    const outlookEvent = await getCalendarEventByBookingId(bookingId, 'outlook');
    
    if (outlookIntegration && outlookEvent) {
      // Delete the event
      await deleteOutlookCalendarEvent(
        outlookEvent.event_id,
        outlookIntegration.access_token
      );
      
      // Delete the event reference
      await supabase
        .from('calendar_events')
        .delete()
        .eq('id', outlookEvent.id);
      
      success = true;
    }
    
    return success;
  } catch (error) {
    console.error(`Exception in deleteBookingFromCalendar:`, error);
    return false;
  }
} 