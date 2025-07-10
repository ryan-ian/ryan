import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, users } from "@/lib/data"
import { hashPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, department, position, phone } = await request.json()

    if (!name || !email || !password || !department || !position) {
      return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 })
    }

    if (getUserByEmail(email)) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    const newUser = {
      id: (users.length + 1).toString(),
      name,
      email,
      password: hashPassword(password),
      role: "user" as const,
      department,
      position,
      phone: phone || undefined,
      dateCreated: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }

    // In a real app, this would save to a database
    users.push(newUser)

    return NextResponse.json({ message: "User created successfully" }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
