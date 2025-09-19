/**
 * ICS (iCalendar) file generation for meeting invitations
 * Supports RFC 5545 standard with proper timezone, reminders, and attendee handling
 */

import { generateVTimezone as generateVTimezoneUtil } from './timezone-utils'

export interface ICSEvent {
  uid: string
  summary: string
  description?: string
  location?: string
  startTime: string // ISO 8601 date string
  endTime: string // ISO 8601 date string
  organizerEmail: string
  organizerName: string
  attendees?: Array<{
    email: string
    name?: string
    role?: 'REQ-PARTICIPANT' | 'OPT-PARTICIPANT' | 'NON-PARTICIPANT'
    rsvp?: boolean
  }>
  reminderMinutes?: number
  sequence?: number
  method?: 'REQUEST' | 'CANCEL' | 'REPLY'
  timezone?: string
}

/**
 * Generate a unique UID for a booking
 */
export function generateBookingUID(bookingId: string): string {
  return `booking-${bookingId}@conferencehub.local`
}

/**
 * Format date for ICS (YYYYMMDDTHHMMSSZ for UTC)
 */
function formatICSDate(dateString: string, timezone?: string): string {
  const date = new Date(dateString)
  
  if (timezone && timezone !== 'UTC') {
    // For timezone-aware dates, format as YYYYMMDDTHHMMSS without Z
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '')
  } else {
    // For UTC dates, format as YYYYMMDDTHHMMSSZ
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  }
}

/**
 * Escape text for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

/**
 * Fold long lines according to RFC 5545 (max 75 characters)
 */
function foldLine(line: string): string {
  if (line.length <= 75) {
    return line
  }
  
  const folded: string[] = []
  let remaining = line
  
  // First line can be 75 characters
  folded.push(remaining.substring(0, 75))
  remaining = remaining.substring(75)
  
  // Subsequent lines are indented with a space and can be 74 characters
  while (remaining.length > 74) {
    folded.push(' ' + remaining.substring(0, 74))
    remaining = remaining.substring(74)
  }
  
  if (remaining.length > 0) {
    folded.push(' ' + remaining)
  }
  
  return folded.join('\r\n')
}

/**
 * Generate VTIMEZONE component for a given timezone
 */
function generateVTimezone(timezone: string): string {
  return generateVTimezoneUtil(timezone)
}

/**
 * Generate ICS content for a meeting invitation
 */
export function generateICS(event: ICSEvent): string {
  const {
    uid,
    summary,
    description,
    location,
    startTime,
    endTime,
    organizerEmail,
    organizerName,
    attendees = [],
    reminderMinutes = 15,
    sequence = 0,
    method = 'REQUEST',
    timezone = 'UTC'
  } = event

  // Generate timestamp
  const now = new Date()
  const dtstamp = formatICSDate(now.toISOString())
  
  // Format dates
  const dtstart = formatICSDate(startTime, timezone)
  const dtend = formatICSDate(endTime, timezone)
  
  // Build ICS content
  let ics = 'BEGIN:VCALENDAR\r\n'
  ics += 'VERSION:2.0\r\n'
  ics += 'PRODID:-//Conference Hub//Meeting Scheduler//EN\r\n'
  ics += `METHOD:${method}\r\n`
  ics += 'CALSCALE:GREGORIAN\r\n'
  
  // Add timezone if not UTC
  if (timezone && timezone !== 'UTC') {
    ics += generateVTimezone(timezone)
  }
  
  // Begin event
  ics += 'BEGIN:VEVENT\r\n'
  ics += foldLine(`UID:${uid}`) + '\r\n'
  ics += foldLine(`DTSTAMP:${dtstamp}`) + '\r\n'
  ics += foldLine(`SEQUENCE:${sequence}`) + '\r\n'
  
  // Date/time
  if (timezone && timezone !== 'UTC') {
    ics += foldLine(`DTSTART;TZID=${timezone}:${dtstart}`) + '\r\n'
    ics += foldLine(`DTEND;TZID=${timezone}:${dtend}`) + '\r\n'
  } else {
    ics += foldLine(`DTSTART:${dtstart}`) + '\r\n'
    ics += foldLine(`DTEND:${dtend}`) + '\r\n'
  }
  
  // Event details
  ics += foldLine(`SUMMARY:${escapeICSText(summary)}`) + '\r\n'
  
  if (description) {
    ics += foldLine(`DESCRIPTION:${escapeICSText(description)}`) + '\r\n'
  }
  
  if (location) {
    ics += foldLine(`LOCATION:${escapeICSText(location)}`) + '\r\n'
  }
  
  // Organizer
  ics += foldLine(`ORGANIZER;CN="${escapeICSText(organizerName)}":mailto:${organizerEmail}`) + '\r\n'
  
  // Attendees
  attendees.forEach(attendee => {
    const role = attendee.role || 'REQ-PARTICIPANT'
    const rsvp = attendee.rsvp !== false ? 'TRUE' : 'FALSE'
    const cn = attendee.name ? `;CN="${escapeICSText(attendee.name)}"` : ''
    
    ics += foldLine(`ATTENDEE;ROLE=${role};RSVP=${rsvp}${cn}:mailto:${attendee.email}`) + '\r\n'
  })
  
  // Status and other properties
  ics += 'STATUS:CONFIRMED\r\n'
  ics += 'TRANSP:OPAQUE\r\n'
  ics += 'CLASS:PUBLIC\r\n'
  
  // Reminder/Alarm
  if (reminderMinutes > 0 && method !== 'CANCEL') {
    ics += 'BEGIN:VALARM\r\n'
    ics += 'TRIGGER:-PT' + reminderMinutes + 'M\r\n'
    ics += 'ACTION:DISPLAY\r\n'
    ics += foldLine(`DESCRIPTION:Reminder: ${escapeICSText(summary)}`) + '\r\n'
    ics += 'END:VALARM\r\n'
  }
  
  // End event
  ics += 'END:VEVENT\r\n'
  ics += 'END:VCALENDAR\r\n'
  
  return ics
}

/**
 * Generate ICS for booking approval
 */
export function generateBookingApprovalICS(
  bookingId: string,
  title: string,
  description: string | undefined,
  roomName: string,
  facilityName: string,
  startTime: string,
  endTime: string,
  organizerEmail: string,
  organizerName: string,
  attendees: Array<{ email: string; name?: string }> = [],
  reminderMinutes: number = 15,
  timezone: string = 'UTC'
): string {
  const event: ICSEvent = {
    uid: generateBookingUID(bookingId),
    summary: title,
    description: description || `Conference room booking: ${roomName}`,
    location: `${roomName}, ${facilityName}`,
    startTime,
    endTime,
    organizerEmail,
    organizerName,
    attendees: attendees.map(attendee => ({
      email: attendee.email,
      name: attendee.name,
      role: 'REQ-PARTICIPANT',
      rsvp: true
    })),
    reminderMinutes,
    sequence: 0,
    method: 'REQUEST',
    timezone
  }
  
  return generateICS(event)
}

/**
 * Generate ICS for booking update
 */
export function generateBookingUpdateICS(
  bookingId: string,
  title: string,
  description: string | undefined,
  roomName: string,
  facilityName: string,
  startTime: string,
  endTime: string,
  organizerEmail: string,
  organizerName: string,
  attendees: Array<{ email: string; name?: string }> = [],
  sequence: number,
  reminderMinutes: number = 15,
  timezone: string = 'UTC'
): string {
  const event: ICSEvent = {
    uid: generateBookingUID(bookingId),
    summary: title,
    description: description || `Conference room booking: ${roomName}`,
    location: `${roomName}, ${facilityName}`,
    startTime,
    endTime,
    organizerEmail,
    organizerName,
    attendees: attendees.map(attendee => ({
      email: attendee.email,
      name: attendee.name,
      role: 'REQ-PARTICIPANT',
      rsvp: true
    })),
    reminderMinutes,
    sequence,
    method: 'REQUEST',
    timezone
  }
  
  return generateICS(event)
}

/**
 * Generate ICS for booking cancellation
 */
export function generateBookingCancellationICS(
  bookingId: string,
  title: string,
  description: string | undefined,
  roomName: string,
  facilityName: string,
  startTime: string,
  endTime: string,
  organizerEmail: string,
  organizerName: string,
  attendees: Array<{ email: string; name?: string }> = [],
  sequence: number,
  timezone: string = 'UTC'
): string {
  const event: ICSEvent = {
    uid: generateBookingUID(bookingId),
    summary: title,
    description: description || `Conference room booking: ${roomName}`,
    location: `${roomName}, ${facilityName}`,
    startTime,
    endTime,
    organizerEmail,
    organizerName,
    attendees: attendees.map(attendee => ({
      email: attendee.email,
      name: attendee.name,
      role: 'REQ-PARTICIPANT',
      rsvp: true
    })),
    sequence,
    method: 'CANCEL',
    timezone
  }
  
  return generateICS(event)
}
