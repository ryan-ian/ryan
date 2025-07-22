// Script to apply RLS policies to the bookings table in Supabase
// This script requires the Supabase service role key

// Import required modules
require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client
const adminClient = createClient(supabaseUrl, serviceRoleKey);

// SQL for RLS policies
const RLS_POLICIES = `
-- First, check if RLS is enabled on the bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies on the bookings table to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete all bookings" ON bookings;

-- Allow users to view their own bookings
CREATE POLICY "Users can view their own bookings" 
  ON bookings FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to create bookings
CREATE POLICY "Users can create bookings" 
  ON bookings FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own bookings
CREATE POLICY "Users can update their own bookings" 
  ON bookings FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own bookings
CREATE POLICY "Users can delete their own bookings" 
  ON bookings FOR DELETE 
  USING (auth.uid() = user_id);

-- Allow admins to view all bookings
CREATE POLICY "Admins can view all bookings" 
  ON bookings FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Allow admins to update all bookings
CREATE POLICY "Admins can update all bookings" 
  ON bookings FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Allow admins to delete all bookings
CREATE POLICY "Admins can delete all bookings" 
  ON bookings FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );
`;

// Function to apply RLS policies
async function applyRlsPolicies() {
  console.log('Applying RLS policies to bookings table...');
  
  try {
    // Execute the SQL
    const { error } = await adminClient.rpc('apply_sql', { sql_query: RLS_POLICIES });
    
    if (error) {
      console.error('Error applying RLS policies:', error);
      return false;
    }
    
    console.log('RLS policies applied successfully!');
    return true;
  } catch (error) {
    console.error('Exception applying RLS policies:', error);
    return false;
  }
}

// Function to verify RLS policies
async function verifyRlsPolicies() {
  console.log('\nVerifying RLS policies on bookings table...');
  
  try {
    // Query the policies
    const { data, error } = await adminClient.rpc('get_policies', { table_name: 'bookings' });
    
    if (error) {
      console.error('Error getting policies:', error);
      return;
    }
    
    console.log('Current policies on bookings table:');
    console.log(data);
  } catch (error) {
    console.error('Exception verifying RLS policies:', error);
  }
}

// Main function
async function main() {
  console.log('=== APPLYING BOOKINGS TABLE RLS POLICIES ===\n');
  
  // Apply the policies
  const success = await applyRlsPolicies();
  
  if (success) {
    // Verify the policies
    await verifyRlsPolicies();
  }
  
  console.log('\nDone.');
}

// Run the script
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 