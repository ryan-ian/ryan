/**
 * Attendance System Utilities
 * Handles attendance code generation, verification, and QR token management
 */

import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import * as types from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production'
const ATTENDANCE_CODE_LENGTH = 4
const MAX_VERIFICATION_ATTEMPTS = 5
const VERIFICATION_COOLDOWN_MINUTES = 15
const QR_TOKEN_EXPIRY_MINUTES = 15

/**
 * Generate a random 4-digit attendance code
 */
export function generateAttendanceCode(): string {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(ATTENDANCE_CODE_LENGTH, '0')
}

/**
 * Generate a random salt for hashing
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Hash an attendance code with salt using SHA-256
 */
export function hashAttendanceCode(code: string, salt: string): string {
  return crypto
    .createHash('sha256')
    .update(salt + code)
    .digest('hex')
}

/**
 * Verify an attendance code against its hash
 */
export function verifyAttendanceCodeHash(
  submittedCode: string,
  storedHash: string,
  salt: string
): boolean {
  const calculatedHash = hashAttendanceCode(submittedCode, salt)
  return calculatedHash === storedHash
}

/**
 * Generate a JWT token for QR code access
 */
export function generateQRToken(bookingId: string): string {
  const payload: types.QRTokenPayload = {
    booking_id: bookingId,
    scope: 'attendance_view',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (QR_TOKEN_EXPIRY_MINUTES * 60)
  }

  return jwt.sign(payload, JWT_SECRET)
}

/**
 * Verify and decode a QR token
 */
export function verifyQRToken(token: string): types.QRTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as types.QRTokenPayload
    
    // Additional scope validation
    if (decoded.scope !== 'attendance_view') {
      return null
    }
    
    return decoded
  } catch (error) {
    console.error('QR token verification failed:', error)
    return null
  }
}

/**
 * Check if attendance marking is allowed based on time windows
 */
export function isAttendanceWindowOpen(
  startTime: string,
  endTime: string,
  gracePeriodMinutes: number = 15
): boolean {
  const now = new Date()
  const meetingStart = new Date(startTime)
  const meetingEnd = new Date(endTime)
  const graceEnd = new Date(meetingEnd.getTime() + gracePeriodMinutes * 60 * 1000)
  
  return now >= meetingStart && now <= graceEnd
}

/**
 * Check if QR code should be visible (after meeting start AND organizer check-in)
 */
export function shouldShowQR(
  startTime: string,
  endTime: string,
  checkedInAt: string | null,
  gracePeriodMinutes: number = 15
): boolean {
  const now = new Date()
  const meetingStart = new Date(startTime)
  const meetingEnd = new Date(endTime)
  const graceEnd = new Date(meetingEnd.getTime() + gracePeriodMinutes * 60 * 1000)
  
  // QR is shown only if:
  // 1. Current time is after meeting start
  // 2. Current time is before meeting end + grace period
  // 3. Organizer has checked in (checkedInAt is not null)
  return now >= meetingStart && now <= graceEnd && checkedInAt !== null
}

/**
 * Generate attendance code expiry time (meeting end + grace period)
 */
export function getAttendanceCodeExpiry(
  meetingEndTime: string,
  gracePeriodMinutes: number = 15
): Date {
  const meetingEnd = new Date(meetingEndTime)
  return new Date(meetingEnd.getTime() + gracePeriodMinutes * 60 * 1000)
}

/**
 * Check if attendance code has expired
 */
export function isAttendanceCodeExpired(expiryTime: string): boolean {
  return new Date() > new Date(expiryTime)
}

/**
 * Check if user can request a new attendance code (rate limiting)
 */
export function canRequestAttendanceCode(
  lastSentAt: string | null,
  sendCount: number,
  maxSends: number = 5,
  cooldownMinutes: number = 1
): { canRequest: boolean; reason?: string } {
  // Check max sends
  if (sendCount >= maxSends) {
    return {
      canRequest: false,
      reason: `Maximum of ${maxSends} code requests reached`
    }
  }
  
  // Check cooldown
  if (lastSentAt) {
    const lastSent = new Date(lastSentAt)
    const cooldownEnd = new Date(lastSent.getTime() + cooldownMinutes * 60 * 1000)
    
    if (new Date() < cooldownEnd) {
      const remainingSeconds = Math.ceil((cooldownEnd.getTime() - Date.now()) / 1000)
      return {
        canRequest: false,
        reason: `Please wait ${remainingSeconds} seconds before requesting another code`
      }
    }
  }
  
  return { canRequest: true }
}

/**
 * Check if user can attempt verification (rate limiting)
 */
export function canAttemptVerification(
  attempts: number,
  lastAttemptAt: string | null,
  maxAttempts: number = MAX_VERIFICATION_ATTEMPTS,
  cooldownMinutes: number = VERIFICATION_COOLDOWN_MINUTES
): { canAttempt: boolean; reason?: string } {
  // Check if in cooldown period after max attempts
  if (attempts >= maxAttempts && lastAttemptAt) {
    const lastAttempt = new Date(lastAttemptAt)
    const cooldownEnd = new Date(lastAttempt.getTime() + cooldownMinutes * 60 * 1000)
    
    if (new Date() < cooldownEnd) {
      const remainingMinutes = Math.ceil((cooldownEnd.getTime() - Date.now()) / (1000 * 60))
      return {
        canAttempt: false,
        reason: `Too many failed attempts. Please try again in ${remainingMinutes} minutes`
      }
    }
  }
  
  return { canAttempt: true }
}

/**
 * Validate attendance code format
 */
export function isValidAttendanceCodeFormat(code: string): boolean {
  return /^\d{4}$/.test(code)
}

/**
 * Generate QR code data URL for a booking
 */
export function generateQRCodeData(bookingId: string, baseUrl: string): string {
  const token = generateQRToken(bookingId)
  return `${baseUrl}/attendance?b=${bookingId}&t=${token}`
}

/**
 * Extract IP address from request headers
 */
export function extractIPAddress(headers: Record<string, string | string[]>): string | null {
  const forwarded = headers['x-forwarded-for']
  const realIP = headers['x-real-ip']
  const remoteAddr = headers['remote-addr']
  
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  
  if (typeof realIP === 'string') {
    return realIP
  }
  
  if (typeof remoteAddr === 'string') {
    return remoteAddr
  }
  
  return null
}

/**
 * Sanitize user agent string
 */
export function sanitizeUserAgent(userAgent: string | undefined): string | null {
  if (!userAgent) return null
  
  // Limit length and remove potential XSS
  return userAgent.slice(0, 500).replace(/<[^>]*>/g, '')
}

/**
 * Create attendance event log data
 */
export function createAttendanceEventData(
  eventType: types.MeetingAttendanceEvent['event_type'],
  bookingId: string,
  invitationId?: string,
  additionalData?: Record<string, any>,
  ipAddress?: string | null,
  userAgent?: string | null
): Omit<types.MeetingAttendanceEvent, 'id' | 'created_at'> {
  return {
    booking_id: bookingId,
    invitation_id: invitationId,
    event_type: eventType,
    ip_address: ipAddress || undefined,
    user_agent: userAgent || undefined,
    additional_data: additionalData
  }
}

/**
 * Format attendance status for display
 */
export function formatAttendanceStatus(status: "not_present" | "present"): string {
  switch (status) {
    case 'present':
      return 'Present'
    case 'not_present':
      return 'Not Present'
    default:
      return 'Unknown'
  }
}

/**
 * Calculate occupancy percentage
 */
export function calculateOccupancyPercentage(present: number, capacity: number): number {
  if (capacity === 0) return 0
  return Math.round((present / capacity) * 100)
}

/**
 * Get occupancy status color/severity
 */
export function getOccupancyStatus(present: number, capacity: number): {
  status: 'low' | 'medium' | 'high' | 'over'
  color: string
  percentage: number
} {
  const percentage = calculateOccupancyPercentage(present, capacity)
  
  if (present > capacity) {
    return { status: 'over', color: 'red', percentage }
  } else if (percentage >= 90) {
    return { status: 'high', color: 'orange', percentage }
  } else if (percentage >= 60) {
    return { status: 'medium', color: 'yellow', percentage }
  } else {
    return { status: 'low', color: 'green', percentage }
  }
}

/**
 * Constants for export
 */
export const ATTENDANCE_CONSTANTS = {
  CODE_LENGTH: ATTENDANCE_CODE_LENGTH,
  MAX_VERIFICATION_ATTEMPTS,
  VERIFICATION_COOLDOWN_MINUTES,
  QR_TOKEN_EXPIRY_MINUTES,
  DEFAULT_GRACE_PERIOD_MINUTES: 15,
  MAX_CODE_REQUESTS_PER_MEETING: 5,
  CODE_REQUEST_COOLDOWN_MINUTES: 1
} as const

