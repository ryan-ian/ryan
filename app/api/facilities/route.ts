import { type NextRequest, NextResponse } from "next/server"
import { getFacilities, createFacility } from "@/lib/supabase-data"
import { createAdminClient } from "@/lib/supabase"
import { addCacheHeaders, addETag, cacheConfig } from "@/lib/api-cache"

export async function GET(request: NextRequest) {
  try {
    // Check for conditional request headers
    const ifNoneMatch = request.headers.get('if-none-match')
    
    const facilities = await getFacilities()
    
    // Generate ETag for the facilities collection
    const etag = `"facilities-${facilities.length}-${Date.now().toString().slice(0, -5)}"`
    
    // If client has a matching ETag, return 304 Not Modified
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 })
    }
    
    // Return facilities data with cache headers - facilities change very infrequently
    let response = NextResponse.json(facilities)
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
    
    // Create the facility
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('facilities')
      .insert({
        name: facilityData.name,
        location: facilityData.location,
        description: facilityData.description || null,
        manager_id: facilityData.user_id
      })
      .select()
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