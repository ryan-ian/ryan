import { google, calendar_v3 } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { format } from 'date-fns';

// Google Calendar API configuration
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar'];

/**
 * Create a Google Calendar event for a booking
 * @param userEmail User's email address
 * @param bookingTitle Title of the booking
 * @param roomName Name of the room
 * @param description Description of the booking
 * @param startTime Start time of the booking
 * @param endTime End time of the booking
 * @param attendees List of attendee email addresses
 * @param accessToken User's Google OAuth access token
 * @returns Promise resolving to the created event ID or null if failed
 */
export async function createGoogleCalendarEvent(
  userEmail: string,
  bookingTitle: string,
  roomName: string,
  description: string,
  startTime: string,
  endTime: string,
  attendees: string[],
  accessToken: string
): Promise<string | null> {
  try {
    // Create OAuth2 client with the provided token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    // Create Calendar API client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Format attendees
    const eventAttendees = attendees.map(email => ({ email }));
    
    // Add the user as an attendee if not already included
    if (!attendees.includes(userEmail)) {
      eventAttendees.push({ email: userEmail });
    }

    // Create event
    const event: calendar_v3.Schema$Event = {
      summary: bookingTitle,
      location: roomName,
      description: description || `Conference room booking: ${roomName}`,
      start: {
        dateTime: startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime,
        timeZone: 'UTC',
      },
      attendees: eventAttendees,
      reminders: {
        useDefault: true,
      },
    };

    // Insert event to the user's calendar
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendUpdates: 'all', // Send email notifications to attendees
    });

    console.log('Google Calendar event created:', response.data.id);
    return response.data.id || null;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return null;
  }
}

/**
 * Update a Google Calendar event for a booking
 * @param eventId ID of the event to update
 * @param bookingTitle Title of the booking
 * @param roomName Name of the room
 * @param description Description of the booking
 * @param startTime Start time of the booking
 * @param endTime End time of the booking
 * @param attendees List of attendee email addresses
 * @param accessToken User's Google OAuth access token
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function updateGoogleCalendarEvent(
  eventId: string,
  bookingTitle: string,
  roomName: string,
  description: string,
  startTime: string,
  endTime: string,
  attendees: string[],
  accessToken: string
): Promise<boolean> {
  try {
    // Create OAuth2 client with the provided token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    // Create Calendar API client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Format attendees
    const eventAttendees = attendees.map(email => ({ email }));

    // Update event
    const event: calendar_v3.Schema$Event = {
      summary: bookingTitle,
      location: roomName,
      description: description || `Conference room booking: ${roomName}`,
      start: {
        dateTime: startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime,
        timeZone: 'UTC',
      },
      attendees: eventAttendees,
    };

    // Update the event
    await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: event,
      sendUpdates: 'all', // Send email notifications to attendees
    });

    console.log('Google Calendar event updated:', eventId);
    return true;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    return false;
  }
}

/**
 * Delete a Google Calendar event
 * @param eventId ID of the event to delete
 * @param accessToken User's Google OAuth access token
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function deleteGoogleCalendarEvent(
  eventId: string,
  accessToken: string
): Promise<boolean> {
  try {
    // Create OAuth2 client with the provided token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    // Create Calendar API client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Delete the event
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all', // Send email notifications to attendees
    });

    console.log('Google Calendar event deleted:', eventId);
    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return false;
  }
}

/**
 * Create an Outlook Calendar event for a booking
 * @param userEmail User's email address
 * @param bookingTitle Title of the booking
 * @param roomName Name of the room
 * @param description Description of the booking
 * @param startTime Start time of the booking
 * @param endTime End time of the booking
 * @param attendees List of attendee email addresses
 * @param accessToken User's Microsoft Graph API access token
 * @returns Promise resolving to the created event ID or null if failed
 */
export async function createOutlookCalendarEvent(
  userEmail: string,
  bookingTitle: string,
  roomName: string,
  description: string,
  startTime: string,
  endTime: string,
  attendees: string[],
  accessToken: string
): Promise<string | null> {
  try {
    // Initialize Microsoft Graph client
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    // Format attendees
    const eventAttendees = attendees.map(email => ({
      emailAddress: {
        address: email,
      },
      type: 'required',
    }));

    // Create event
    const event = {
      subject: bookingTitle,
      body: {
        contentType: 'HTML',
        content: description || `Conference room booking: ${roomName}`,
      },
      start: {
        dateTime: new Date(startTime).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(endTime).toISOString(),
        timeZone: 'UTC',
      },
      location: {
        displayName: roomName,
      },
      attendees: eventAttendees,
      isReminderOn: true,
    };

    // Insert event to the user's calendar
    const response = await client
      .api('/me/events')
      .post(event);

    console.log('Outlook Calendar event created:', response.id);
    return response.id || null;
  } catch (error) {
    console.error('Error creating Outlook Calendar event:', error);
    return null;
  }
}

/**
 * Update an Outlook Calendar event for a booking
 * @param eventId ID of the event to update
 * @param bookingTitle Title of the booking
 * @param roomName Name of the room
 * @param description Description of the booking
 * @param startTime Start time of the booking
 * @param endTime End time of the booking
 * @param attendees List of attendee email addresses
 * @param accessToken User's Microsoft Graph API access token
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function updateOutlookCalendarEvent(
  eventId: string,
  bookingTitle: string,
  roomName: string,
  description: string,
  startTime: string,
  endTime: string,
  attendees: string[],
  accessToken: string
): Promise<boolean> {
  try {
    // Initialize Microsoft Graph client
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    // Format attendees
    const eventAttendees = attendees.map(email => ({
      emailAddress: {
        address: email,
      },
      type: 'required',
    }));

    // Update event
    const event = {
      subject: bookingTitle,
      body: {
        contentType: 'HTML',
        content: description || `Conference room booking: ${roomName}`,
      },
      start: {
        dateTime: new Date(startTime).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(endTime).toISOString(),
        timeZone: 'UTC',
      },
      location: {
        displayName: roomName,
      },
      attendees: eventAttendees,
    };

    // Update the event
    await client
      .api(`/me/events/${eventId}`)
      .update(event);

    console.log('Outlook Calendar event updated:', eventId);
    return true;
  } catch (error) {
    console.error('Error updating Outlook Calendar event:', error);
    return false;
  }
}

/**
 * Delete an Outlook Calendar event
 * @param eventId ID of the event to delete
 * @param accessToken User's Microsoft Graph API access token
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function deleteOutlookCalendarEvent(
  eventId: string,
  accessToken: string
): Promise<boolean> {
  try {
    // Initialize Microsoft Graph client
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    // Delete the event
    await client
      .api(`/me/events/${eventId}`)
      .delete();

    console.log('Outlook Calendar event deleted:', eventId);
    return true;
  } catch (error) {
    console.error('Error deleting Outlook Calendar event:', error);
    return false;
  }
} 