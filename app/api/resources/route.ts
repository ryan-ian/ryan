import { NextResponse } from "next/server"
import { getResources } from "@/lib/supabase-data"

export async function GET() {
  try {
    const resources = await getResources()
    return NextResponse.json(resources)
  } catch (error) {
    console.error("Get resources error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
