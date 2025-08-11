// Debug script to check driver data
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDriverData() {
  console.log('🔍 Checking users table...')
  
  // Check users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('role', 'driver')
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError)
  } else {
    console.log('✅ Driver users found:', users?.length || 0)
    users?.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ID: ${user.id}`)
    })
  }

  console.log('\n🔍 Checking drivers table...')
  
  // Check drivers
  const { data: drivers, error: driversError } = await supabase
    .from('drivers')
    .select('id, name, email, user_id, status')
  
  if (driversError) {
    console.error('❌ Error fetching drivers:', driversError)
  } else {
    console.log('✅ Driver records found:', drivers?.length || 0)
    drivers?.forEach(driver => {
      console.log(`  - ${driver.name} (${driver.email}) - User ID: ${driver.user_id} - Status: ${driver.status}`)
    })
  }

  console.log('\n🔍 Checking assignments table...')
  
  // Check assignments
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id, driver_id, status, created_at')
    .in('status', ['scheduled', 'active'])
  
  if (assignmentsError) {
    console.error('❌ Error fetching assignments:', assignmentsError)
  } else {
    console.log('✅ Active assignments found:', assignments?.length || 0)
    assignments?.forEach(assignment => {
      console.log(`  - Assignment ${assignment.id} - Driver: ${assignment.driver_id} - Status: ${assignment.status}`)
    })
  }
}

debugDriverData().catch(console.error)