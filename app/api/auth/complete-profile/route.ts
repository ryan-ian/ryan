import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { organization, position } = await request.json()

    if (!organization || !position) {
      return NextResponse.json({ 
        error: "Organization and position are required" 
      }, { status: 400 })
    }

    // Get the current session
    const authHeader = request.headers.get('authorization')
    let user = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract the token from Bearer header
      const token = authHeader.replace('Bearer ', '')
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token)
      
      if (!userError && authUser) {
        user = authUser
      }
    }

    if (!user) {
      // Try to get session from cookies as fallback
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        return NextResponse.json({ 
          error: "Authentication required" 
        }, { status: 401 })
      }
      
      user = session.user
    }

    // Update the user profile
    const { data, error } = await supabase
      .from('users')
      .update({
        organization,
        position
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error("Profile update error:", error)
      return NextResponse.json({ 
        error: "Failed to update profile" 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Profile updated successfully",
      user: data
    }, { status: 200 })

  } catch (error) {
    console.error("Complete profile error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
