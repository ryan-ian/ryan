// Debug script to directly interact with the bookings table using Supabase client
// This will help identify if the issue is with the API or with the database access

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

// Load environment variables (you'll need to set these or use dotenv)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseKey);
const adminClient = createClient(supabaseUrl, serviceRoleKey);

// Test booking ID - replace with an actual booking ID from your database
const TEST_BOOKING_ID = 'REPLACE_WITH_ACTUAL_BOOKING_ID';

// Function to get booking by ID
async function getBookingById(id) {
  try {
    console.log(`Getting booking with ID: ${id}`);
    
    // Try with regular client first
    const { data: regularData, error: regularError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
      
    console.log('Regular client result:');
    if (regularError) {
      console.error('Error:', regularError);
    } else {
      console.log('Data:', regularData);
    }
    
    // Try with admin client
    const { data: adminData, error: adminError } = await adminClient
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
      
    console.log('\nAdmin client result:');
    if (adminError) {
      console.error('Error:', adminError);
    } else {
      console.log('Data:', adminData);
    }
    
    return { regularData, adminData };
  } catch (error) {
    console.error('Exception in getBookingById:', error);
    return null;
  }
}

// Function to update booking by ID
async function updateBooking(id, updateData) {
  try {
    console.log(`Updating booking with ID: ${id}`);
    console.log('Update data:', updateData);
    
    // Try with regular client first
    const { data: regularData, error: regularError } = await supabase
      .from('bookings')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    console.log('\nRegular client update result:');
    if (regularError) {
      console.error('Error:', regularError);
    } else {
      console.log('Data:', regularData);
    }
    
    // Try with admin client
    const { data: adminData, error: adminError } = await adminClient
      .from('bookings')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    console.log('\nAdmin client update result:');
    if (adminError) {
      console.error('Error:', adminError);
    } else {
      console.log('Data:', adminData);
    }
    
    return { regularData, adminData };
  } catch (error) {
    console.error('Exception in updateBooking:', error);
    return null;
  }
}

// Function to check RLS policies
async function checkRlsPolicies() {
  try {
    console.log('Checking RLS policies for bookings table...');
    
    // This requires admin access to the database
    const { data, error } = await adminClient.rpc('get_policies', { table_name: 'bookings' });
    
    if (error) {
      console.error('Error checking policies:', error);
    } else {
      console.log('Policies:', data);
    }
    
    return data;
  } catch (error) {
    console.error('Exception in checkRlsPolicies:', error);
    return null;
  }
}

// Run the tests
async function runTests() {
  console.log('=== DEBUGGING BOOKINGS TABLE ===\n');
  
  // First, check RLS policies
  await checkRlsPolicies();
  
  // Get the current booking
  const { regularData, adminData } = await getBookingById(TEST_BOOKING_ID);
  
  // If we can get the booking, try updating it
  if (adminData) {
    const updateData = {
      title: `Debug Test ${new Date().toISOString()}`,
      status: adminData.status === 'pending' ? 'confirmed' : 'pending'
    };
    
    await updateBooking(TEST_BOOKING_ID, updateData);
    
    // Verify the update
    console.log('\n=== VERIFYING UPDATE ===\n');
    await getBookingById(TEST_BOOKING_ID);
  }
}

// Run all tests
runTests().then(() => {
  console.log('\nDebug completed.');
}); 