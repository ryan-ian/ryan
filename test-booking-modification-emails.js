// Test script to debug booking modification email notifications
// Run this with: node test-booking-modification-emails.js

const fetch = require('node-fetch');

async function testBookingModification() {
  console.log('🧪 Testing booking modification email notifications...');
  
  try {
    // First, let's get a list of existing bookings to find one to modify
    console.log('📋 Fetching existing bookings...');
    const bookingsResponse = await fetch('http://localhost:3000/api/bookings');
    
    if (!bookingsResponse.ok) {
      throw new Error(`Failed to fetch bookings: ${bookingsResponse.status}`);
    }
    
    const bookingsData = await bookingsResponse.json();
    console.log('📋 Bookings response:', bookingsData);
    
    if (!bookingsData.bookings || bookingsData.bookings.length === 0) {
      console.log('⚠️ No bookings found to test with');
      return;
    }
    
    // Get the first booking
    const testBooking = bookingsData.bookings[0];
    console.log('🎯 Using test booking:', testBooking);
    
    // Prepare modification data
    const modificationData = {
      title: `${testBooking.title} - MODIFIED TEST`,
      description: `${testBooking.description || ''} - Email test modification`,
      start_time: testBooking.start_time,
      end_time: testBooking.end_time
    };
    
    console.log('📝 Modification data:', modificationData);
    
    // Send the modification request
    console.log('🚀 Sending booking modification request...');
    const modifyResponse = await fetch(`http://localhost:3000/api/bookings/${testBooking.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modificationData)
    });
    
    console.log('📊 Modification response status:', modifyResponse.status);
    
    if (!modifyResponse.ok) {
      const errorText = await modifyResponse.text();
      throw new Error(`Failed to modify booking: ${modifyResponse.status} - ${errorText}`);
    }
    
    const modifyResult = await modifyResponse.json();
    console.log('✅ Booking modification result:', modifyResult);
    
    console.log('🎉 Test completed! Check the server logs for email debugging information.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBookingModification();
