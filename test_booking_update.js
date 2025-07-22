// Test script to check if booking updates are working correctly
// Run this with Node.js after setting up the environment variables

// Import required modules
const fetch = require('node-fetch');

// Configuration
const API_URL = 'http://localhost:3000/api';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN'; // Replace with a valid token

// Test booking ID - replace with an actual booking ID from your database
const TEST_BOOKING_ID = 'REPLACE_WITH_ACTUAL_BOOKING_ID';

// Test function to update a booking
async function testUpdateBooking() {
  try {
    console.log('Testing booking update functionality...');
    
    // First, get the current booking to see its state
    const getResponse = await fetch(`${API_URL}/bookings/${TEST_BOOKING_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!getResponse.ok) {
      const errorData = await getResponse.json();
      throw new Error(`Failed to get booking: ${errorData.error || getResponse.statusText}`);
    }
    
    const currentBooking = await getResponse.json();
    console.log('Current booking state:', currentBooking);
    
    // Prepare update data - change the title and status
    const updateData = {
      title: `Updated Title ${new Date().toISOString()}`,
      status: currentBooking.status === 'pending' ? 'confirmed' : 'pending'
    };
    
    console.log('Updating booking with:', updateData);
    
    // Send the update request
    const updateResponse = await fetch(`${API_URL}/bookings/${TEST_BOOKING_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`Failed to update booking: ${errorData.error || updateResponse.statusText}`);
    }
    
    const updatedBooking = await updateResponse.json();
    console.log('Updated booking:', updatedBooking);
    
    // Verify the update was successful
    if (updatedBooking.title === updateData.title && updatedBooking.status === updateData.status) {
      console.log('✅ Booking update successful!');
    } else {
      console.log('❌ Booking update failed - data mismatch:');
      console.log('Expected:', updateData);
      console.log('Actual:', {
        title: updatedBooking.title,
        status: updatedBooking.status
      });
    }
    
    return updatedBooking;
  } catch (error) {
    console.error('Error testing booking update:', error);
    return null;
  }
}

// Run the test
testUpdateBooking().then(result => {
  console.log('Test completed.');
}); 