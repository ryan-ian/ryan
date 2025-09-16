import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugMissingFacilities() {
  console.log('=== Debugging Missing Facilities Issue ===\n');

  try {
    // 1. Check all facilities
    console.log('1. Checking all facilities...');
    const { data: facilities, error: facilitiesError } = await supabase
      .from('facilities')
      .select('id, name, location, manager_id');

    if (facilitiesError) {
      console.error('Error fetching facilities:', facilitiesError);
      return;
    }

    console.log(`Found ${facilities?.length || 0} facilities:`);
    facilities?.forEach(facility => {
      console.log(`  - ${facility.name} (ID: ${facility.id})`);
    });
    console.log();

    // 2. Check all rooms and their facility_id references
    console.log('2. Checking all rooms and their facility references...');
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name, facility_id, facility_name');

    if (roomsError) {
      console.error('Error fetching rooms:', roomsError);
      return;
    }

    console.log(`Found ${rooms?.length || 0} rooms:`);
    
    const facilityIds = new Set(facilities?.map(f => f.id) || []);
    const orphanedRooms = [];
    
    rooms?.forEach(room => {
      const hasValidFacility = facilityIds.has(room.facility_id);
      console.log(`  - ${room.name} (ID: ${room.id})`);
      console.log(`    Facility ID: ${room.facility_id}`);
      console.log(`    Facility Name: ${room.facility_name || 'None'}`);
      console.log(`    Valid Reference: ${hasValidFacility ? '✅' : '❌'}`);
      
      if (!hasValidFacility) {
        orphanedRooms.push(room);
      }
      console.log();
    });

    // 3. Report orphaned rooms
    if (orphanedRooms.length > 0) {
      console.log('3. Orphaned rooms (rooms with missing facility references):');
      orphanedRooms.forEach(room => {
        console.log(`  ❌ Room: ${room.name} (${room.id})`);
        console.log(`     Missing Facility ID: ${room.facility_id}`);
      });
      console.log();
    } else {
      console.log('3. ✅ No orphaned rooms found!\n');
    }

    // 4. Try to fetch the specific facility mentioned in the error
    const problemFacilityId = 'a2311611-cb0d-4c1a-b318-eee95f507485';
    console.log(`4. Checking specific facility from error: ${problemFacilityId}`);
    
    const { data: specificFacility, error: specificError } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', problemFacilityId)
      .single();

    if (specificError) {
      console.log(`❌ Facility ${problemFacilityId} does not exist:`, specificError.message);
    } else {
      console.log(`✅ Facility found:`, specificFacility);
    }
    console.log();

    // 5. Check how many rooms reference this missing facility
    const { data: roomsWithMissingFacility, error: roomsWithMissingError } = await supabase
      .from('rooms')
      .select('id, name, facility_id')
      .eq('facility_id', problemFacilityId);

    if (roomsWithMissingError) {
      console.error('Error checking rooms with missing facility:', roomsWithMissingError);
    } else {
      console.log(`5. Rooms referencing missing facility ${problemFacilityId}:`);
      roomsWithMissingFacility?.forEach(room => {
        console.log(`   - ${room.name} (${room.id})`);
      });
    }

  } catch (error) {
    console.error('Error during debugging:', error);
  }
}

// Run the debug function
debugMissingFacilities();
