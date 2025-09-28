/**
 * Test script to validate the new booking details functionality
 * This can be run to verify that the comprehensive booking data fetching works correctly
 */

import { getBookingByIdWithDetails, calculateAverageCheckInTime, calculateRoomUtilization } from './supabase-data'

export async function testBookingDetailsFunction(bookingId: string) {
  console.log(`🧪 Testing booking details function for booking: ${bookingId}`)
  
  try {
    // Test the comprehensive booking details fetcher
    console.log('📋 Fetching booking with comprehensive details...')
    const booking = await getBookingByIdWithDetails(bookingId)
    
    if (!booking) {
      console.log('❌ Booking not found')
      return { success: false, error: 'Booking not found' }
    }
    
    console.log('✅ Booking fetched successfully')
    console.log('📊 Booking data structure:')
    console.log('- Basic booking fields:', {
      id: booking.id,
      title: booking.title,
      status: booking.status,
      start_time: booking.start_time,
      end_time: booking.end_time
    })
    
    console.log('- Room details:', {
      name: booking.rooms?.name,
      location: booking.rooms?.location,
      capacity: booking.rooms?.capacity,
      hourly_rate: booking.rooms?.hourly_rate,
      currency: booking.rooms?.currency,
      facility: booking.rooms?.facilities?.name
    })
    
    console.log('- User details:', {
      name: booking.users?.name,
      email: booking.users?.email,
      organization: booking.users?.organization,
      position: booking.users?.position
    })
    
    console.log('- Payment details:', {
      amount: booking.payments?.amount,
      currency: booking.payments?.currency,
      status: booking.payments?.status,
      payment_method: booking.payments?.payment_method,
      paid_at: booking.payments?.paid_at
    })
    
    console.log('- Meeting invitations count:', booking.invitation_count)
    
    // Test analytics calculations
    console.log('🧮 Testing analytics calculations...')
    
    const averageCheckInTime = await calculateAverageCheckInTime(bookingId)
    console.log('- Average check-in time:', averageCheckInTime || 'No check-ins yet')
    
    const roomUtilization = await calculateRoomUtilization(booking.room_id)
    console.log('- Room utilization (30 days):', `${roomUtilization}%`)
    
    // Validate data integrity
    console.log('🔍 Validating data integrity...')
    const validationResults = {
      hasRoomData: !!booking.rooms,
      hasUserData: !!booking.users,
      hasValidTimes: booking.start_time && booking.end_time,
      hasInvitationCount: typeof booking.invitation_count === 'number',
      roomHasFacility: !!booking.rooms?.facilities,
      userHasOrganization: !!booking.users?.organization
    }
    
    console.log('- Validation results:', validationResults)
    
    const allValid = Object.values(validationResults).every(Boolean)
    console.log(allValid ? '✅ All validations passed' : '⚠️ Some validations failed')
    
    return {
      success: true,
      booking,
      analytics: {
        averageCheckInTime,
        roomUtilization
      },
      validation: validationResults
    }
    
  } catch (error) {
    console.error('❌ Error testing booking details function:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Test multiple bookings to ensure consistency
 */
export async function testMultipleBookings(bookingIds: string[]) {
  console.log(`🧪 Testing multiple bookings: ${bookingIds.join(', ')}`)
  
  const results = []
  
  for (const bookingId of bookingIds) {
    console.log(`\n--- Testing booking ${bookingId} ---`)
    const result = await testBookingDetailsFunction(bookingId)
    results.push({ bookingId, ...result })
  }
  
  console.log('\n📊 Summary of all tests:')
  const successCount = results.filter(r => r.success).length
  console.log(`✅ Successful: ${successCount}/${results.length}`)
  console.log(`❌ Failed: ${results.length - successCount}/${results.length}`)
  
  return results
}

/**
 * Validate that no placeholder values are being used
 */
export function validateNoPlaceholders(analytics: any) {
  const placeholderChecks = {
    averageCheckInTime: analytics.averageCheckInTime !== "2:05 PM",
    roomUtilization: analytics.roomUtilization !== 85,
    totalAmount: analytics.totalAmount !== 0 || analytics.paymentStatus !== 'pending'
  }
  
  console.log('🔍 Placeholder validation:', placeholderChecks)
  
  return placeholderChecks
}
