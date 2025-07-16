import { NextRequest, NextResponse } from "next/server"
import { testStorageSetup } from "@/lib/test-storage"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid and the user is an admin

    console.log("Running storage setup test...")
    const results = await testStorageSetup()

    return NextResponse.json(results)
  } catch (error: any) {
    console.error("Test storage API error:", error)
    return NextResponse.json({ 
      error: "Failed to test storage setup",
      details: error.message || "Unknown error" 
    }, { status: 500 })
  }
} 