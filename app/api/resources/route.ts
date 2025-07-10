import { type NextRequest, NextResponse } from "next/server"
import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { verifyToken } from "@/lib/auth"
import type { Resource } from "@/types"

const dataPath = join(process.cwd(), "data", "resources.json")

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = readFileSync(dataPath, "utf8")
    const resources: Resource[] = JSON.parse(data)

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

    const token = authHeader.replace("Bearer ", "")
    const user = verifyToken(token)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, description } = body

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    const data = readFileSync(dataPath, "utf8")
    const resources: Resource[] = JSON.parse(data)

    const newResource: Resource = {
      id: `resource_${Date.now()}`,
      name,
      type,
      status: "available",
      description: description || undefined,
    }

    resources.push(newResource)
    writeFileSync(dataPath, JSON.stringify(resources, null, 2))

    return NextResponse.json(newResource, { status: 201 })
  } catch (error) {
    console.error("Error creating resource:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
