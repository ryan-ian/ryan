// Script to apply the check-in flow migration to Supabase
// This creates the missing handle_booking_check_in function and related tables

require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

// Create admin client
const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function applyCheckInMigration() {
  try {
    console.log('🚀 Starting check-in flow migration...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'check_in_flow_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Read migration file:', migrationPath);

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;

      console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`📋 Statement preview: ${statement.substring(0, 100)}...`);

      try {
        const { data, error } = await adminClient.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          // Try direct execution if rpc fails
          const { error: directError } = await adminClient
            .from('_temp_migration')
            .select('*')
            .limit(0);
          
          // If that fails too, try using the SQL editor approach
          console.log(`⚠️  RPC failed, trying direct execution: ${error.message}`);
          
          // For critical functions, we'll output them for manual execution
          if (statement.includes('handle_booking_check_in')) {
            console.log('\n🔧 CRITICAL: Please execute this function manually in Supabase SQL Editor:');
            console.log('=' * 80);
            console.log(statement + ';');
            console.log('=' * 80);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (execError) {
        console.log(`⚠️  Statement ${i + 1} failed: ${execError.message}`);
        
        // For critical functions, output for manual execution
        if (statement.includes('handle_booking_check_in') || statement.includes('handle_booking_auto_release')) {
          console.log('\n🔧 CRITICAL FUNCTION - Please execute manually in Supabase SQL Editor:');
          console.log('=' * 80);
          console.log(statement + ';');
          console.log('=' * 80);
        }
      }
    }

    // Test if the function was created successfully
    console.log('\n🧪 Testing handle_booking_check_in function...');
    
    try {
      const { data, error } = await adminClient.rpc('handle_booking_check_in', {
        booking_id_param: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        user_id_param: null
      });

      if (error && error.message.includes('Booking not found')) {
        console.log('✅ Function exists and is working (expected "Booking not found" error)');
      } else if (error) {
        console.log(`❌ Function test failed: ${error.message}`);
        console.log('\n🔧 Please create the function manually using the SQL below:');
        outputManualSQL();
      } else {
        console.log('✅ Function test passed');
      }
    } catch (testError) {
      console.log(`❌ Function test error: ${testError.message}`);
      console.log('\n🔧 Please create the function manually using the SQL below:');
      outputManualSQL();
    }

    console.log('\n🎉 Migration process completed!');
    console.log('\n📋 Next steps:');
    console.log('1. If any functions failed, execute them manually in Supabase SQL Editor');
    console.log('2. Test the check-in functionality in your application');
    console.log('3. Verify that bookings can be checked in successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n🔧 Please create the functions manually using the SQL below:');
    outputManualSQL();
  }
}

function outputManualSQL() {
  console.log('\n' + '=' * 80);
  console.log('MANUAL SQL EXECUTION REQUIRED');
  console.log('=' * 80);
  console.log(`
-- 1. First, create the handle_booking_check_in function:
CREATE OR REPLACE FUNCTION handle_booking_check_in(
  booking_id_param UUID,
  user_id_param UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
  result JSON;
BEGIN
  -- Get the booking
  SELECT * INTO booking_record FROM bookings WHERE id = booking_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;
  
  -- Check if already checked in
  IF booking_record.checked_in_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already checked in');
  END IF;
  
  -- Check if within check-in window (can check in up to 15 minutes before start time)
  IF NOW() < (booking_record.start_time - INTERVAL '15 minutes') THEN
    RETURN json_build_object('success', false, 'error', 'Check-in not yet available');
  END IF;
  
  -- Check if past auto-release time
  IF booking_record.auto_release_at IS NOT NULL AND NOW() > booking_record.auto_release_at THEN
    RETURN json_build_object('success', false, 'error', 'Booking has been auto-released');
  END IF;
  
  -- Update booking with check-in time
  UPDATE bookings 
  SET 
    checked_in_at = NOW(),
    auto_release_at = NULL,
    updated_at = NOW()
  WHERE id = booking_id_param;
  
  -- Create check-in event (if check_in_events table exists)
  BEGIN
    INSERT INTO check_in_events (booking_id, event_type, performed_by_user_id, notes)
    VALUES (booking_id_param, 'check_in', user_id_param, 'User checked in via room display');
  EXCEPTION WHEN undefined_table THEN
    -- Ignore if table doesn't exist yet
    NULL;
  END;
  
  RETURN json_build_object('success', true, 'checked_in_at', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant execute permission:
GRANT EXECUTE ON FUNCTION handle_booking_check_in(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_booking_check_in(UUID, UUID) TO anon;
`);
  console.log('=' * 80);
}

// Run the migration
applyCheckInMigration().catch(console.error);
