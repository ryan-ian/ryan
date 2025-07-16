import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid and the user is an admin

    // Handle file upload
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed. Please upload an image (JPEG, PNG, WEBP, or GIF)." }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `room-images/${fileName}`
      
      // Upload directly using the Supabase client
      const { data, error } = await supabase
        .storage
        .from('conference-hub')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (error) {
        console.error('Supabase storage error:', error)
        throw error
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('conference-hub')
        .getPublicUrl(data.path)
      
      const imageUrl = publicUrlData.publicUrl
      
      return NextResponse.json({ url: imageUrl }, { status: 201 })
    } catch (uploadError: any) {
      console.error("Supabase upload error:", uploadError)
      
      // Return more detailed error information
      return NextResponse.json({ 
        error: "Failed to upload image to storage", 
        details: uploadError.message || "Unknown error",
        code: uploadError.code || "UNKNOWN"
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Upload API error:", error)
    return NextResponse.json({ 
      error: "Failed to process upload request",
      details: error.message || "Unknown error" 
    }, { status: 500 })
  }
} 