import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, department, position, phone } = await request.json()

    if (!name || !email || !password || !department || !position) {
      return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Register with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          department,
          position,
          role: 'user'
        }
      }
    })

    if (error) {
      console.error("Registration error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // The database trigger will create the user profile automatically
    return NextResponse.json({ 
      message: "User created successfully",
      userId: data.user.id
    }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
