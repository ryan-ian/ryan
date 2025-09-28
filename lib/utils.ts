import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert a string to a URL-friendly slug
 * @param text The string to convert to a slug
 * @returns A URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters except -
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '')          // Trim - from end of text
}

/**
 * Get the room slug and ID for URL construction
 * @param room Room object with id and name
 * @returns Object with slug and id properties
 */
export function getRoomSlug(room: { id: string, name: string }) {
  return {
    slug: slugify(room.name),
    id: room.id
  }
}

// ===== PRICING UTILITIES =====

/**
 * Format currency amount in Ghana Cedis
 * @param amount The amount to format (in GHS) - can be number or string
 * @param currency Currency code (default: 'GHS')
 * @returns Formatted currency string with ₵ symbol
 */
export function formatCurrency(amount: number | string, currency: string = 'GHS'): string {
  // Convert to number and handle invalid inputs
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  // Handle invalid or NaN values
  if (isNaN(numericAmount) || numericAmount === null || numericAmount === undefined) {
    return currency === 'GHS' ? '₵0.00' : '0.00'
  }
  
  if (currency === 'GHS') {
    return `₵${numericAmount.toFixed(2)}`
  }
  
  // Fallback for other currencies
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount)
}

/**
 * Calculate the total cost for a room booking
 * @param hourlyRate Rate per hour in GHS
 * @param startTime Start time of booking
 * @param endTime End time of booking

 * @param roundUp Whether to round up partial hours (default: false for proportional pricing)
 * @returns Object with total cost, duration, and breakdown
 */
export function calculateBookingCost(
  hourlyRate: number,
  startTime: Date,
  endTime: Date,
  roundUp: boolean = false
): {
  totalCost: number
  durationHours: number
  actualHours: number
  breakdown: string
} {
  // Calculate duration in milliseconds
  const durationMs = endTime.getTime() - startTime.getTime()
  const durationHours = durationMs / (1000 * 60 * 60)

  let actualHours = durationHours

  // Round up partial hours if specified (legacy behavior)
  if (roundUp && actualHours !== Math.floor(actualHours)) {
    actualHours = Math.ceil(actualHours)
  }

  const totalCost = hourlyRate * actualHours

  // Format hours for display (round to 2 decimal places)
  const displayHours = Math.round(actualHours * 100) / 100
  const breakdown = `${formatCurrency(hourlyRate)}/hr × ${displayHours} hours`

  return {
    totalCost,
    durationHours,
    actualHours,
    breakdown
  }
}

/**
 * Calculate booking duration in hours between two times
 * @param startTime Start time
 * @param endTime End time
 * @returns Duration in hours (can be decimal)
 */
export function calculateDurationHours(startTime: Date, endTime: Date): number {
  const durationMs = endTime.getTime() - startTime.getTime()
  return durationMs / (1000 * 60 * 60)
}

/**
 * Validate pricing data for a room
 * @param pricing Pricing information to validate
 * @returns Object with isValid flag and error messages
 */
export function validatePricing(pricing: {
  hourly_rate?: number
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate hourly rate
  if (pricing.hourly_rate !== undefined) {
    if (pricing.hourly_rate < 0) {
      errors.push('Hourly rate must be positive')
    }
    if (pricing.hourly_rate > 10000) {
      errors.push('Hourly rate seems unreasonably high (max: ₵10,000/hr)')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get pricing tier based on hourly rate
 * @param hourlyRate Rate per hour in GHS
 * @returns Pricing tier classification
 */
export function getPricingTier(hourlyRate: number): 'budget' | 'standard' | 'premium' | 'luxury' {
  if (hourlyRate <= 50) return 'budget'
  if (hourlyRate <= 150) return 'standard'
  if (hourlyRate <= 300) return 'premium'
  return 'luxury'
}

/**
 * Get pricing tier color for UI display
 * @param tier Pricing tier
 * @returns Tailwind CSS color classes
 */
export function getPricingTierColor(tier: 'budget' | 'standard' | 'premium' | 'luxury'): string {
  switch (tier) {
    case 'budget': return 'text-green-600 bg-green-50 border-green-200'
    case 'standard': return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'premium': return 'text-purple-600 bg-purple-50 border-purple-200'
    case 'luxury': return 'text-amber-600 bg-amber-50 border-amber-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}
