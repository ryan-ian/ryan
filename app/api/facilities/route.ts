import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { addCacheHeaders, addETag, cacheConfig } from "@/lib/api-cache"

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const search = url.searchParams.get('search') || ''
    const sortBy = url.searchParams.get('sortBy') || 'name'
    const sortOrder = url.searchParams.get('sortOrder') || 'asc'
    const facilityId = url.searchParams.get('id') || null
    
    // Check for conditional request headers
    const ifNoneMatch = request.headers.get('if-none-match')
    
    const adminClient = createAdminClient()
    
    // If a specific facility ID is requested
    if (facilityId) {
      const { data, error } = await adminClient
        .from('facilities')
        .select(`
          *,
          manager:manager_id(id, name, email, role)
        `)
        .eq('id', facilityId)
        .single()
        
      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: "Facility not found" }, { status: 404 })
        }
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      
      return NextResponse.json(data)
    }
    
    // Otherwise, return a paginated list of facilities
    let query = adminClient
      .from('facilities')
      .select(`
        *,
        manager:manager_id(id, name, email, role)
      `, { count: 'exact' })
    
    // Apply search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    // Apply sorting
    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Generate ETag for the facilities collection
    const etag = `"facilities-${data?.length || 0}-${Date.now().toString().slice(0, -5)}"`
    
    // If client has a matching ETag, return 304 Not Modified
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 })
    }
    
    // Return facilities data with cache headers
    let response = NextResponse.json({
      facilities: data || [],
      total: count || 0
    })
    response = addCacheHeaders(response, cacheConfig.static) // Use static cache config for longer caching
    response.headers.set('ETag', etag)
    return response
  } catch (error) {
    console.error("Get facilities error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const facilityData = await request.json()
    
    // Validate required fields
    if (!facilityData.name) {
      return NextResponse.json({ error: "Facility name is required" }, { status: 400 })
    }
    
    // Create the facility
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('facilities')
      .insert({
        name: facilityData.name,
        location: facilityData.location || null,
        description: facilityData.description || null,
        manager_id: facilityData.manager_id || null
      })
      .select(`
        *,
        manager:manager_id(id, name, email, role)
      `)
      .single()
      
    if (error) {
      console.error('Error creating facility:', error)
      
      // Check for unique constraint violation
      if (error.code === '23505') {
        if (error.message.includes('manager_id')) {
          return NextResponse.json({ error: "This user is already managing a facility." }, { status: 409 })
        }
      }
      
      return NextResponse.json({ error: "Failed to create facility" }, { status: 500 })
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Create facility error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: "Facility ID is required" }, { status: 400 })
    }
    
    const facilityData = await request.json()
    
    // Create update object with only provided fields
    const updateData: any = {}
    if (facilityData.name !== undefined) updateData.name = facilityData.name
    if (facilityData.location !== undefined) updateData.location = facilityData.location
    if (facilityData.description !== undefined) updateData.description = facilityData.description
    if (facilityData.manager_id !== undefined) updateData.manager_id = facilityData.manager_id
    
    // Update the facility
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('facilities')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        manager:manager_id(id, name, email, role)
      `)
      .single()
      
    if (error) {
      console.error('Error updating facility:', error)
      
      // Check for unique constraint violation
      if (error.code === '23505') {
        if (error.message.includes('manager_id')) {
          return NextResponse.json({ error: "This user is already managing a facility." }, { status: 409 })
        }
      }
      
      return NextResponse.json({ error: "Failed to update facility" }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("Update facility error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: "Facility ID is required" }, { status: 400 })
    }
    
    // Check for dependencies
    const adminClient = createAdminClient()
    
    // Check for rooms associated with this facility
    const { count: roomCount, error: roomError } = await adminClient
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('facility_id', id)
    
    if (roomError) {
      return NextResponse.json({ error: roomError.message }, { status: 400 })
    }
    
    // Check for resources associated with this facility
    const { count: resourceCount, error: resourceError } = await adminClient
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('facility_id', id)
    
    if (resourceError) {
      return NextResponse.json({ error: resourceError.message }, { status: 400 })
    }
    
    // Delete the facility
    const { error } = await adminClient
      .from('facilities')
      .delete()
      .eq('id', id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      dependencies: {
        rooms: roomCount || 0,
        resources: resourceCount || 0
      }
    })
  } catch (error) {
    console.error("Delete facility error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 