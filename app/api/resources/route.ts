import { NextResponse, NextRequest } from "next/server"
import { getResources } from "@/lib/supabase-data"
import { createAdminClient } from '@/lib/supabase'
import { adminCreateResource } from '@/lib/supabase-data'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const resources = await getResources()
    return NextResponse.json(resources)
  } catch (error) {
    console.error("Get resources error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }
    
    // Create anon client for auth verification
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )
    
    // Verify token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Use admin client to check role
    const adminSupabase = createAdminClient()
    const { data: profile, error: profileError } = await adminSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }
    
    // Parse data
    const resourceData = await request.json()
    
    // Create resource using admin function
    const newResource = await adminCreateResource(resourceData)
    
    return NextResponse.json(newResource, { status: 201 })
  } catch (error) {
    console.error('Create resource error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}
