// Test script to check if booking creation is working correctly
// Run this with Node.js after setting up the environment variables

// Import required modules
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables (you'll need to set these or use dotenv)
require('dotenv').config({ path: './.env.local' });

// Configuration
const API_URL = 'http://localhost:3000/api';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test function to create a booking
async function testCreateBooking() {
  try {
    console.log('Testing booking creation functionality...');
    
    // 1. Get authentication session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error('Authentication error:', sessionError || 'No session found');
      console.log('Please sign in first using the application.');
      return null;
    }
    
    const token = sessionData.session.access_token;
    const userId = sessionData.session.user.id;
    
    console.log('Authenticated as user:', userId);
    
    // 2. Get available rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'available')
      .limit(1);
    
    if (roomsError || !rooms || rooms.length === 0) {
      console.error('Error fetching rooms:', roomsError || 'No available rooms found');
      return null;
    }
    
    const room = rooms[0];
    console.log('Selected room:', room.name, room.id);
    
    // 3. Prepare booking data
    // Create a date for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const startTime = new Date(`${dateStr}T09:00:00`);
    const endTime = new Date(`${dateStr}T10:00:00`);
    
    const bookingData = {
      title: `Test Booking ${new Date().toISOString()}`,
      description: 'This is a test booking created by the test script',
      user_id: userId,
      room_id: room.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      attendees: [2],
      status: 'pending',
      resources: null
    };
    
    console.log('Creating booking with data:', JSON.stringify(bookingData, null, 2));
    
    // 4. Send the booking creation request
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to create booking:', result);
      return null;
    }
    
    console.log('Booking created successfully:', result);
    
    // 5. Verify the booking was created in the database
    const { data: createdBooking, error: verifyError } = await adminClient
      .from('bookings')
      .select('*')
      .eq('id', result.id || result.bookings?.[0]?.id)
      .single();
    
    if (verifyError || !createdBooking) {
      console.error('Error verifying booking creation:', verifyError || 'Booking not found in database');
      return null;
    }
    
    console.log('✅ Verified booking in database:', createdBooking);
    return createdBooking;
  } catch (error) {
    console.error('Error testing booking creation:', error);
    return null;
  }
}

// Run the test
testCreateBooking().then(result => {
  console.log('Test completed.');
  process.exit(0);
}); 