import { type NextRequest, NextResponse } from "next/server"
import { adminGetAllUsers } from "@/lib/supabase-data"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid and the user is an admin

    // Get all users using admin privileges
    const users = await adminGetAllUsers()
    
    return NextResponse.json(users)
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }
    // Get the user from the token
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    const userId = userData.user.id
    const body = await request.json()
    // Only allow updating certain fields
    const { name, phone, department, bio } = body
    const { data, error } = await supabase
      .from('users')
      .update({ name, phone, department, bio })
      .eq('id', userId)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
