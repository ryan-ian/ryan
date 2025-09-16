// Payment Utilities for Conference Hub
// This file contains utility functions for payment calculations and processing

import { PAYSTACK_CONFIG, convertToKobo, convertFromKobo } from './paystack-config'

/**
 * Calculate the total cost for a booking based on duration and hourly rate
 * @param startTime - Booking start time
 * @param endTime - Booking end time  
 * @param pricePerHour - Room hourly rate in GHS
 * @returns Payment calculation details
 */
export function calculateBookingAmount(
  startTime: Date, 
  endTime: Date, 
  pricePerHour: number
): {
  startTime: Date
  endTime: Date
  pricePerHour: number
  currency: string
  totalAmount: number
  durationHours: number
} {
  // Calculate duration in milliseconds
  const durationMs = endTime.getTime() - startTime.getTime()
  
  // Convert to hours and round up partial hours
  const durationHours = Math.ceil(durationMs / (1000 * 60 * 60))
  
  // Calculate total amount
  const totalAmount = durationHours * pricePerHour
  
  return {
    startTime,
    endTime,
    pricePerHour,
    currency: PAYSTACK_CONFIG.CURRENCY,
    totalAmount,
    durationHours
  }
}

/**
 * Generate a unique payment reference for Conference Hub
 * Format: CHB_timestamp_random
 * @returns Unique payment reference string
 */
export function generatePaymentReference(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `CHB_${timestamp}_${random}`
}

/**
 * Check if a payment has expired based on expiry time
 * @param expiresAt - ISO string of expiry time
 * @returns True if payment has expired
 */
export function isPaymentExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

/**
 * Get payment expiry time from now
 * @param minutes - Minutes from now (default: 15)
 * @returns Date object for expiry time
 */
export function getPaymentExpiryTime(minutes: number = PAYSTACK_CONFIG.TIMEOUT_MINUTES): Date {
  return new Date(Date.now() + minutes * 60 * 1000)
}

/**
 * Format payment amount for display
 * @param amount - Amount in GHS
 * @param currency - Currency code (default: GHS)
 * @returns Formatted currency string
 */
export function formatPaymentAmount(amount: number, currency: string = PAYSTACK_CONFIG.CURRENCY): string {
  if (currency === 'GHS') {
    return `₵${amount.toFixed(2)}`
  }
  return `${amount.toFixed(2)} ${currency}`
}

/**
 * Validate payment amount against configured limits
 * @param amount - Amount to validate in GHS
 * @returns Validation result with error message if invalid
 */
export function validatePaymentAmount(amount: number): { isValid: boolean; error?: string } {
  if (amount < PAYSTACK_CONFIG.MIN_AMOUNT) {
    return {
      isValid: false,
      error: `Minimum payment amount is ${formatPaymentAmount(PAYSTACK_CONFIG.MIN_AMOUNT)}`
    }
  }
  
  if (amount > PAYSTACK_CONFIG.MAX_AMOUNT) {
    return {
      isValid: false,
      error: `Maximum payment amount is ${formatPaymentAmount(PAYSTACK_CONFIG.MAX_AMOUNT)}`
    }
  }
  
  return { isValid: true }
}

/**
 * Calculate booking duration in different units
 * @param startTime - Start time
 * @param endTime - End time
 * @returns Duration breakdown
 */
export function calculateBookingDuration(startTime: Date, endTime: Date) {
  const durationMs = endTime.getTime() - startTime.getTime()
  
  return {
    milliseconds: durationMs,
    minutes: Math.floor(durationMs / (1000 * 60)),
    hours: durationMs / (1000 * 60 * 60),
    hoursRounded: Math.ceil(durationMs / (1000 * 60 * 60))
  }
}

/**
 * Create payment metadata for Paystack
 * @param bookingData - Booking information
 * @returns Metadata object for Paystack
 */
export function createPaymentMetadata(bookingData: {
  bookingId?: string
  roomId: string
  roomName: string
  userId: string
  userName: string
  userEmail: string
  startTime: Date
  endTime: Date
  title: string
}) {
  return {
    booking_id: bookingData.bookingId,
    room_id: bookingData.roomId,
    room_name: bookingData.roomName,
    user_id: bookingData.userId,
    user_name: bookingData.userName,
    user_email: bookingData.userEmail,
    start_time: bookingData.startTime.toISOString(),
    end_time: bookingData.endTime.toISOString(),
    meeting_title: bookingData.title,
    platform: 'Conference Hub',
    payment_type: 'room_booking'
  }
}

/**
 * Parse payment reference to extract information
 * @param reference - Payment reference string
 * @returns Parsed reference information
 */
export function parsePaymentReference(reference: string): {
  isValid: boolean
  timestamp?: number
  randomPart?: string
  createdAt?: Date
} {
  const pattern = /^CHB_(\d+)_([A-Z0-9]{6})$/
  const match = reference.match(pattern)
  
  if (!match) {
    return { isValid: false }
  }
  
  const timestamp = parseInt(match[1])
  const randomPart = match[2]
  
  return {
    isValid: true,
    timestamp,
    randomPart,
    createdAt: new Date(timestamp)
  }
}

/**
 * Get payment status display information
 * @param status - Payment status
 * @returns Display information for the status
 */
export function getPaymentStatusDisplay(status: string): {
  label: string
  color: string
  description: string
} {
  switch (status) {
    case PAYSTACK_CONFIG.STATUS.PENDING:
      return {
        label: 'Pending',
        color: 'yellow',
        description: 'Payment is being processed'
      }
    case PAYSTACK_CONFIG.STATUS.SUCCESS:
      return {
        label: 'Paid',
        color: 'green',
        description: 'Payment completed successfully'
      }
    case PAYSTACK_CONFIG.STATUS.FAILED:
      return {
        label: 'Failed',
        color: 'red',
        description: 'Payment failed to process'
      }
    case PAYSTACK_CONFIG.STATUS.ABANDONED:
      return {
        label: 'Abandoned',
        color: 'gray',
        description: 'Payment was abandoned by user'
      }
    case PAYSTACK_CONFIG.STATUS.CANCELLED:
      return {
        label: 'Cancelled',
        color: 'gray',
        description: 'Payment was cancelled'
      }
    default:
      return {
        label: 'Unknown',
        color: 'gray',
        description: 'Unknown payment status'
      }
  }
}

// Export utility functions
export {
  convertToKobo,
  convertFromKobo,
  PAYSTACK_CONFIG
}
