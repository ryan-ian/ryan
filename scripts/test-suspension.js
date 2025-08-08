const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSuspensionFunctionality() {
  console.log('🔍 Testing user suspension functionality...\n');

  try {
    // 1. Check if users table has suspension columns
    console.log('1. Checking users table schema...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, status, suspended_until, suspension_reason')
      .limit(1);

    if (usersError) {
      console.error('❌ Error querying users table:', usersError.message);
      console.log('\n💡 You may need to run the database migration:');
      console.log('   Run the SQL in database/migrations/add_user_suspension_fields.sql');
      return;
    }

    console.log('✅ Users table schema looks good');

    // 2. Get a test user (first user that's not suspended)
    console.log('\n2. Finding a test user...');
    const { data: testUsers, error: testUsersError } = await supabase
      .from('users')
      .select('*')
      .neq('role', 'admin') // Don't test on admin users
      .or('status.is.null,status.eq.active')
      .limit(1);

    if (testUsersError || !testUsers || testUsers.length === 0) {
      console.error('❌ No suitable test user found');
      return;
    }

    const testUser = testUsers[0];
    console.log(`✅ Found test user: ${testUser.name} (${testUser.email})`);

    // 3. Test suspension
    console.log('\n3. Testing user suspension...');
    const suspendedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
    const suspensionReason = 'Test suspension - automated test';

    const { data: suspendedUser, error: suspendError } = await supabase
      .from('users')
      .update({
        status: 'suspended',
        suspended_until: suspendedUntil,
        suspension_reason: suspensionReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', testUser.id)
      .select()
      .single();

    if (suspendError) {
      console.error('❌ Error suspending user:', suspendError.message);
      return;
    }

    console.log('✅ User suspended successfully');
    console.log(`   Status: ${suspendedUser.status}`);
    console.log(`   Suspended until: ${suspendedUser.suspended_until}`);
    console.log(`   Reason: ${suspendedUser.suspension_reason}`);

    // 4. Test unsuspension
    console.log('\n4. Testing user unsuspension...');
    const { data: unsuspendedUser, error: unsuspendError } = await supabase
      .from('users')
      .update({
        status: 'active',
        suspended_until: null,
        suspension_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', testUser.id)
      .select()
      .single();

    if (unsuspendError) {
      console.error('❌ Error unsuspending user:', unsuspendError.message);
      return;
    }

    console.log('✅ User unsuspended successfully');
    console.log(`   Status: ${unsuspendedUser.status}`);
    console.log(`   Suspended until: ${unsuspendedUser.suspended_until || 'null'}`);
    console.log(`   Reason: ${unsuspendedUser.suspension_reason || 'null'}`);

    console.log('\n🎉 All suspension functionality tests passed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testSuspensionFunctionality();
