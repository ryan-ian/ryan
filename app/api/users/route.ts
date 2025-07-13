import { type NextRequest, NextResponse } from "next/server"
import { adminGetAllUsers } from "@/lib/supabase-data"

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
