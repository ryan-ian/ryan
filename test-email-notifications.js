/**
 * Test script for email notifications functionality
 * This script tests the booking approval and rejection email notifications
 */

const { sendBookingConfirmationEmail, sendBookingRejectionEmail } = require('./lib/email-service.ts')

async function testEmailNotifications() {
  console.log('🧪 Testing Email Notifications...\n')

  // Test data
  const testUser = {
    email: 'test@example.com', // Replace with your test email
    name: 'John Doe'
  }

  const testBooking = {
    title: 'Weekly Team Meeting',
    roomName: 'Conference Room A',
    startTime: new Date('2024-01-15T10:00:00Z').toISOString(),
    endTime: new Date('2024-01-15T11:00:00Z').toISOString()
  }

  try {
    console.log('📧 Testing Booking Confirmation Email...')
    const confirmationResult = await sendBookingConfirmationEmail(
      testUser.email,
      testUser.name,
      testBooking.title,
      testBooking.roomName,
      testBooking.startTime,
      testBooking.endTime
    )
    console.log(`✅ Confirmation email result: ${confirmationResult}\n`)

    console.log('📧 Testing Booking Rejection Email...')
    const rejectionResult = await sendBookingRejectionEmail(
      testUser.email,
      testUser.name,
      testBooking.title,
      testBooking.roomName,
      'Room is already booked for that time slot',
      testBooking.startTime,
      testBooking.endTime
    )
    console.log(`✅ Rejection email result: ${rejectionResult}\n`)

    console.log('🎉 Email notification tests completed!')
    
  } catch (error) {
    console.error('❌ Email test failed:', error)
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEmailNotifications()
}

module.exports = { testEmailNotifications }
