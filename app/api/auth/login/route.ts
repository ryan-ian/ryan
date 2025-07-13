import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error("Login error:", error.message)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (!data.session) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      return NextResponse.json({ error: "Error fetching user data" }, { status: 500 })
    }

    return NextResponse.json({
      token: data.session.access_token,
      user: userData
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
