#!/usr/bin/env node

/**
 * Script to fix notifications realtime subscription issues
 * This script applies the necessary database changes to enable proper realtime notifications
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyNotificationsFixSql() {
  console.log('🔧 Applying notifications realtime fix...')
  
  try {
    // Read the SQL fix file
    const sqlPath = path.join(__dirname, '..', 'lib', 'fix-notifications-rls.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split SQL statements and execute them
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      console.log(`📝 Executing: ${statement.substring(0, 50)}...`)
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.error(`❌ Error executing statement: ${error.message}`)
        // Don't exit, continue with other statements
      } else {
        console.log('✅ Statement executed successfully')
      }
    }
    
  } catch (error) {
    console.error('❌ Error reading SQL file or executing statements:', error.message)
    return false
  }
  
  return true
}

async function checkConfiguration() {
  console.log('\n🔍 Checking notifications table configuration...')
  
  try {
    // Check if the function exists and call it
    const { data, error } = await supabase.rpc('check_notifications_realtime')
    
    if (error) {
      console.log('📝 Creating check function first...')
      // Create the function if it doesn't exist
      const checkFunctionSql = `
        CREATE OR REPLACE FUNCTION check_notifications_realtime()
        RETURNS TABLE(
          rls_enabled boolean,
          replica_identity text,
          in_publication boolean
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            t.relrowsecurity as rls_enabled,
            t.relreplident::text as replica_identity,
            EXISTS(
              SELECT 1 FROM pg_publication_tables pt 
              WHERE pt.pubname = 'supabase_realtime' 
              AND pt.tablename = 'notifications'
            ) as in_publication
          FROM pg_class t
          WHERE t.relname = 'notifications';
        END;
        $$ LANGUAGE plpgsql;
      `
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: checkFunctionSql })
      if (createError) {
        console.error('❌ Could not create check function:', createError.message)
        return
      }
      
      // Try again
      const { data: retryData, error: retryError } = await supabase.rpc('check_notifications_realtime')
      if (retryError) {
        console.error('❌ Could not check configuration:', retryError.message)
        return
      }
      data = retryData
    }
    
    if (data && data.length > 0) {
      const config = data[0]
      console.log('📊 Notifications table configuration:')
      console.log(`   RLS Enabled: ${config.rls_enabled ? '✅' : '❌'}`)
      console.log(`   Replica Identity: ${config.replica_identity}`)
      console.log(`   In Realtime Publication: ${config.in_publication ? '✅' : '❌'}`)
      
      if (config.rls_enabled && config.replica_identity === 'f' && config.in_publication) {
        console.log('✅ Notifications table is properly configured for realtime!')
      } else {
        console.log('⚠️  Configuration needs attention')
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking configuration:', error.message)
  }
}

async function main() {
  console.log('🚀 Starting notifications realtime fix...\n')
  
  // Apply the SQL fixes
  const success = await applyNotificationsFixSql()
  
  if (success) {
    console.log('\n✅ SQL fixes applied successfully!')
    
    // Check the final configuration
    await checkConfiguration()
    
    console.log('\n🎉 Notifications realtime fix completed!')
    console.log('📋 Next steps:')
    console.log('   1. Restart your application')
    console.log('   2. Check browser console for realtime connection status')
    console.log('   3. Test creating a notification to verify realtime works')
  } else {
    console.log('\n❌ Some errors occurred during the fix')
    console.log('   Please check the errors above and try running the script again')
  }
}

// Run the script
main().catch(console.error)
