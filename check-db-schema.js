// Script to check database schema directly using Supabase client
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkDatabaseSchema() {
  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('Checking rooms table schema...');
    
    // Check if facility_id exists in rooms table
    const { data: roomColumns, error: roomError } = await supabase
      .rpc('get_table_columns', { table_name: 'rooms' });
    
    if (roomError) {
      console.error('Error fetching rooms schema:', roomError);
      
      // Alternative approach: just fetch a room and log its structure
      console.log('Trying alternative approach: fetching a sample room...');
      const { data: sampleRoom, error: sampleRoomError } = await supabase
        .from('rooms')
        .select('*')
        .limit(1)
        .single();
      
      if (sampleRoomError) {
        console.error('Error fetching sample room:', sampleRoomError);
      } else {
        console.log('Sample room structure:', Object.keys(sampleRoom));
        console.log('Sample room data:', sampleRoom);
      }
    } else {
      console.log('Rooms table columns:', roomColumns);
      const hasFacilityId = roomColumns.some(col => col.column_name === 'facility_id');
      console.log('Has facility_id column:', hasFacilityId);
    }
    
    // Check facilities table
    console.log('\nChecking facilities table...');
    const { data: facilities, error: facilitiesError } = await supabase
      .from('facilities')
      .select('*');
    
    if (facilitiesError) {
      console.error('Error fetching facilities:', facilitiesError);
    } else {
      console.log(`Found ${facilities.length} facilities:`);
      facilities.forEach(f => {
        console.log(`- ${f.id}: ${f.name}`);
      });
    }
    
    // Try the exact join that should be working
    console.log('\nTesting facility join directly...');
    const { data: roomsWithFacility, error: joinError } = await supabase
      .from('rooms')
      .select('*, facility:facility_id(id, name, location)')
      .limit(2);
    
    if (joinError) {
      console.error('Join error:', joinError);
    } else {
      console.log('Join result:', roomsWithFacility);
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkDatabaseSchema(); 