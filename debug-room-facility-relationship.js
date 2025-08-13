#!/usr/bin/env node

/**
 * Debug script to investigate room and facility manager relationships
 * 
 * This script helps debug why facility manager emails are not being sent
 * by checking the database relationships for a specific room.
 * 
 * Usage: node debug-room-facility-relationship.js
 */

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or update them here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// The room ID from the issue
const ROOM_ID = 'b68d9495-27e1-4af5-9766-793abf7ab924';

async function debugRoomFacilityRelationship() {
  console.log('🔍 Debugging Room and Facility Manager Relationship');
  console.log('==================================================');
  console.log(`Target Room ID: ${ROOM_ID}`);
  console.log('');

  try {
    // Step 1: Check if the room exists
    console.log('📋 Step 1: Checking room existence...');
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', ROOM_ID)
      .single();

    if (roomError) {
      console.error('❌ Error fetching room:', roomError);
      return;
    }

    if (!room) {
      console.error('❌ Room not found');
      return;
    }

    console.log('✅ Room found:');
    console.log(`   - ID: ${room.id}`);
    console.log(`   - Name: ${room.name}`);
    console.log(`   - Facility ID: ${room.facility_id}`);
    console.log('');

    // Step 2: Check if the facility exists
    console.log('📋 Step 2: Checking facility existence...');
    if (!room.facility_id) {
      console.error('❌ Room has no facility_id assigned');
      return;
    }

    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', room.facility_id)
      .single();

    if (facilityError) {
      console.error('❌ Error fetching facility:', facilityError);
      return;
    }

    if (!facility) {
      console.error('❌ Facility not found');
      return;
    }

    console.log('✅ Facility found:');
    console.log(`   - ID: ${facility.id}`);
    console.log(`   - Name: ${facility.name}`);
    console.log(`   - Location: ${facility.location}`);
    console.log(`   - Manager ID: ${facility.manager_id}`);
    console.log('');

    // Step 3: Check if the facility has a manager assigned
    console.log('📋 Step 3: Checking facility manager assignment...');
    if (!facility.manager_id) {
      console.error('❌ Facility has no manager_id assigned');
      console.log('💡 Solution: Assign a facility manager to this facility');
      return;
    }

    // Step 4: Check if the manager user exists
    console.log('📋 Step 4: Checking facility manager user...');
    const { data: manager, error: managerError } = await supabase
      .from('users')
      .select('*')
      .eq('id', facility.manager_id)
      .single();

    if (managerError) {
      console.error('❌ Error fetching facility manager:', managerError);
      return;
    }

    if (!manager) {
      console.error('❌ Facility manager user not found');
      console.log('💡 Solution: The manager_id references a non-existent user');
      return;
    }

    console.log('✅ Facility manager found:');
    console.log(`   - ID: ${manager.id}`);
    console.log(`   - Name: ${manager.name}`);
    console.log(`   - Email: ${manager.email}`);
    console.log(`   - Role: ${manager.role}`);
    console.log(`   - Status: ${manager.status}`);
    console.log('');

    // Step 5: Validate manager email
    console.log('📋 Step 5: Validating manager email...');
    if (!manager.email) {
      console.error('❌ Facility manager has no email address');
      console.log('💡 Solution: Add an email address to the facility manager user');
      return;
    }

    if (!manager.email.includes('@')) {
      console.error('❌ Facility manager has invalid email address:', manager.email);
      console.log('💡 Solution: Update the facility manager email to a valid format');
      return;
    }

    console.log('✅ Manager email is valid');
    console.log('');

    // Step 6: Test the exact query used in the API
    console.log('📋 Step 6: Testing API query pattern...');
    const { data: facilityWithManager, error: queryError } = await supabase
      .from('facilities')
      .select('*, manager:manager_id(id, name, email)')
      .eq('id', room.facility_id)
      .single();

    if (queryError) {
      console.error('❌ Error with API query pattern:', queryError);
      return;
    }

    console.log('✅ API query pattern works:');
    console.log('   Facility with manager:', JSON.stringify(facilityWithManager, null, 2));
    console.log('');

    // Summary
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('===================');
    console.log('✅ Room exists and is properly configured');
    console.log('✅ Facility exists and is linked to the room');
    console.log('✅ Facility manager is assigned and exists');
    console.log('✅ Manager has a valid email address');
    console.log('✅ Database relationships are correct');
    console.log('');
    console.log('🎯 CONCLUSION');
    console.log('=============');
    console.log('The database relationships are correct. The issue is likely in the API code.');
    console.log('The facility manager email notification should work with this room.');
    console.log('');
    console.log('🔧 NEXT STEPS');
    console.log('=============');
    console.log('1. Check if the booking is using createSingleBooking vs createMultipleBookings');
    console.log('2. Verify the facility manager notification code is being executed');
    console.log('3. Check server logs for any errors during facility manager lookup');
    console.log('4. Test with the updated createSingleBooking function');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function checkAllRoomsWithoutFacilityManagers() {
  console.log('\n🔍 Checking for rooms without facility managers...');
  console.log('==================================================');

  try {
    const { data: roomsWithoutManagers, error } = await supabase
      .from('rooms')
      .select(`
        id,
        name,
        facility_id,
        facilities!facility_id (
          id,
          name,
          manager_id,
          manager:manager_id (
            id,
            name,
            email
          )
        )
      `)
      .is('facilities.manager_id', null);

    if (error) {
      console.error('❌ Error checking rooms:', error);
      return;
    }

    if (roomsWithoutManagers && roomsWithoutManagers.length > 0) {
      console.log(`⚠️ Found ${roomsWithoutManagers.length} rooms without facility managers:`);
      roomsWithoutManagers.forEach(room => {
        console.log(`   - Room: ${room.name} (${room.id})`);
        console.log(`     Facility: ${room.facilities?.name || 'Unknown'} (${room.facility_id})`);
      });
    } else {
      console.log('✅ All rooms have facility managers assigned');
    }
  } catch (error) {
    console.error('❌ Error checking rooms without managers:', error);
  }
}

// Run the debug functions
async function runDebug() {
  await debugRoomFacilityRelationship();
  await checkAllRoomsWithoutFacilityManagers();
}

runDebug().catch(console.error);
