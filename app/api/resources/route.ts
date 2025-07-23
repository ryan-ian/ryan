import { type NextRequest, NextResponse } from "next/server"
import { getResources, createResource, updateResource, deleteResource, getResourceById } from "@/lib/supabase-data"
import { addCacheHeaders, addETag, cacheConfig } from "@/lib/api-cache"

export async function GET(request: NextRequest) {
  try {
    // Check for conditional request headers
    const ifNoneMatch = request.headers.get('if-none-match')
    
    // Check if we're fetching a specific resource by ID
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (id) {
      // Get a specific resource
      const resource = await getResourceById(id)
      
      if (!resource) {
        return NextResponse.json({ error: "Resource not found" }, { status: 404 })
      }
      
      // Generate ETag for the resource data
      const etag = `"resource-${id}-${JSON.stringify(resource).length}"`
      
      // If client has a matching ETag, return 304 Not Modified
      if (ifNoneMatch && ifNoneMatch === etag) {
        return new NextResponse(null, { status: 304 })
      }
      
      // Return resource data with cache headers
      let response = NextResponse.json(resource)
      response = addCacheHeaders(response, cacheConfig.semiStatic)
      response.headers.set('ETag', etag)
      return response
    }
    
    // Get all resources
    const resources = await getResources()
    
    // Generate ETag for the resources collection
    const etag = `"resources-${resources.length}-${Date.now().toString().slice(0, -4)}"`
    
    // If client has a matching ETag, return 304 Not Modified
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 })
    }
    
    // Return resources data with cache headers
    let response = NextResponse.json(resources)
    response = addCacheHeaders(response, cacheConfig.semiStatic)
    response.headers.set('ETag', etag)
    return response
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
