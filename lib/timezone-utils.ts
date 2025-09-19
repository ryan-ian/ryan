/**
 * Timezone utilities for calendar integration
 * Provides timezone detection and fallback handling
 */

export interface TimezoneInfo {
  timezone: string
  offset: string
  name: string
}

/**
 * Get timezone for a room/facility
 * For now, this uses a simple mapping and fallback to UTC
 * In the future, this could be extended to:
 * - Read timezone from room/facility database fields
 * - Use IP geolocation
 * - Use browser timezone detection
 */
export function getRoomTimezone(room?: any, facility?: any): string {
  // Future: Check room.timezone or facility.timezone fields
  // if (room?.timezone) return room.timezone
  // if (facility?.timezone) return facility.timezone
  
  // For now, provide some basic location-based timezone detection
  if (room?.location || facility?.location) {
    const location = (room?.location || facility?.location).toLowerCase()
    
    // Ghana (common timezone for this system)
    if (location.includes('ghana') || location.includes('accra')) {
      return 'Africa/Accra'
    }
    
    // Nigeria
    if (location.includes('nigeria') || location.includes('lagos')) {
      return 'Africa/Lagos'
    }
    
    // Kenya
    if (location.includes('kenya') || location.includes('nairobi')) {
      return 'Africa/Nairobi'
    }
    
    // South Africa
    if (location.includes('south africa') || location.includes('johannesburg') || location.includes('cape town')) {
      return 'Africa/Johannesburg'
    }
    
    // UK
    if (location.includes('london') || location.includes('uk') || location.includes('united kingdom')) {
      return 'Europe/London'
    }
    
    // US East Coast
    if (location.includes('new york') || location.includes('washington') || location.includes('boston')) {
      return 'America/New_York'
    }
    
    // US West Coast
    if (location.includes('los angeles') || location.includes('san francisco') || location.includes('seattle')) {
      return 'America/Los_Angeles'
    }
  }
  
  // Default fallback to UTC
  return 'UTC'
}

/**
 * Get timezone info including offset and display name
 */
export function getTimezoneInfo(timezone: string): TimezoneInfo {
  try {
    const now = new Date()
    const offsetMinutes = -now.getTimezoneOffset()
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60)
    const offsetMins = Math.abs(offsetMinutes) % 60
    const offsetSign = offsetMinutes >= 0 ? '+' : '-'
    const offset = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`
    
    // Try to get the timezone display name
    let name = timezone
    try {
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'long'
      })
      const parts = formatter.formatToParts(now)
      const timeZonePart = parts.find(part => part.type === 'timeZoneName')
      if (timeZonePart) {
        name = timeZonePart.value
      }
    } catch {
      // Fallback to timezone identifier
      name = timezone.replace(/_/g, ' ')
    }
    
    return {
      timezone,
      offset,
      name
    }
  } catch (error) {
    console.error('Error getting timezone info:', error)
    return {
      timezone: 'UTC',
      offset: '+00:00',
      name: 'Coordinated Universal Time'
    }
  }
}

/**
 * Convert a date to a specific timezone for ICS formatting
 */
export function formatDateForTimezone(dateString: string, timezone: string): string {
  try {
    const date = new Date(dateString)
    
    if (timezone === 'UTC') {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
    }
    
    // For non-UTC timezones, format as local time
    const localTime = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date)
    
    // Convert "YYYY-MM-DD HH:mm:ss" to "YYYYMMDDTHHMMSS"
    return localTime.replace(/[-: ]/g, '').replace(/(\d{8})(\d{6})/, '$1T$2')
  } catch (error) {
    console.error('Error formatting date for timezone:', error)
    // Fallback to UTC
    return new Date(dateString).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  }
}

/**
 * Generate VTIMEZONE component for ICS files
 * This is a simplified implementation - in production you'd want
 * a more comprehensive timezone database
 */
export function generateVTimezone(timezone: string): string {
  if (timezone === 'UTC') {
    return ''
  }
  
  // Simplified timezone definitions
  const timezones: Record<string, string> = {
    'Africa/Accra': `BEGIN:VTIMEZONE\r
TZID:Africa/Accra\r
BEGIN:STANDARD\r
DTSTART:20070101T000000\r
TZNAME:GMT\r
TZOFFSETFROM:+0000\r
TZOFFSETTO:+0000\r
END:STANDARD\r
END:VTIMEZONE\r
`,
    'Africa/Lagos': `BEGIN:VTIMEZONE\r
TZID:Africa/Lagos\r
BEGIN:STANDARD\r
DTSTART:20070101T000000\r
TZNAME:WAT\r
TZOFFSETFROM:+0100\r
TZOFFSETTO:+0100\r
END:STANDARD\r
END:VTIMEZONE\r
`,
    'Europe/London': `BEGIN:VTIMEZONE\r
TZID:Europe/London\r
BEGIN:DAYLIGHT\r
DTSTART:20070325T010000\r
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\r
TZNAME:BST\r
TZOFFSETFROM:+0000\r
TZOFFSETTO:+0100\r
END:DAYLIGHT\r
BEGIN:STANDARD\r
DTSTART:20071028T020000\r
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU\r
TZNAME:GMT\r
TZOFFSETFROM:+0100\r
TZOFFSETTO:+0000\r
END:STANDARD\r
END:VTIMEZONE\r
`,
    'America/New_York': `BEGIN:VTIMEZONE\r
TZID:America/New_York\r
BEGIN:DAYLIGHT\r
DTSTART:20070311T020000\r
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU\r
TZNAME:EDT\r
TZOFFSETFROM:-0500\r
TZOFFSETTO:-0400\r
END:DAYLIGHT\r
BEGIN:STANDARD\r
DTSTART:20071104T020000\r
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU\r
TZNAME:EST\r
TZOFFSETFROM:-0400\r
TZOFFSETTO:-0500\r
END:STANDARD\r
END:VTIMEZONE\r
`
  }
  
  return timezones[timezone] || ''
}

/**
 * Default reminder minutes based on timezone/location
 */
export function getDefaultReminderMinutes(timezone: string): number {
  // For now, return a standard 15 minutes
  // In the future, this could be customized based on:
  // - User preferences
  // - Meeting type
  // - Time of day
  return 15
}
