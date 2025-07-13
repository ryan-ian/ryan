import { type NextRequest, NextResponse } from "next/server"
import { getResources, createResource, updateResource, deleteResource, getResourceById } from "@/lib/supabase-data"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid and the user is an admin

    // Check if we're fetching a specific resource by ID
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (id) {
      // Get a specific resource
      const resource = await getResourceById(id)
      
      if (!resource) {
        return NextResponse.json({ error: "Resource not found" }, { status: 404 })
      }
      
      return NextResponse.json(resource)
    }

    // Get resources from Supabase
    const resources = await getResources()
    
    return NextResponse.json(resources)
  } catch (error) {
    console.error("Error fetching resources:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid and the user is an admin

    const body = await request.json()
    const { name, type, status, description } = body

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    // Create resource in Supabase
    const newResource = await createResource({
      name,
      type,
      status: status || "available",
      description: description || null
    })

    return NextResponse.json(newResource, { status: 201 })
  } catch (error) {
    console.error("Error creating resource:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid and the user is an admin

    const body = await request.json()
    const { id, name, type, status, description } = body
    
    if (!id) {
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 })
    }

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    // Update resource in Supabase
    const updatedResource = await updateResource(id, {
      name,
      type,
      status,
      description: description || null
    })

    return NextResponse.json(updatedResource)
  } catch (error) {
    console.error("Error updating resource:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid and the user is an admin

    // Get resource ID from URL
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 })
    }

    // Delete the resource
    await deleteResource(id)

    return NextResponse.json({ success: true, message: "Resource deleted successfully" })
  } catch (error) {
    console.error("Error deleting resource:", error)
    
    if (error instanceof Error && error.message === 'Cannot delete resource that is being used in bookings') {
      return NextResponse.json({ 
        error: "Cannot delete resource that is being used in bookings. Remove it from all bookings first." 
      }, { status: 409 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
