import { type NextRequest, NextResponse } from "next/server"
import { getFacilityManagerByRoomId } from "@/lib/facility-manager-lookup"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const roomId = searchParams.get("roomId")

    if (!roomId) {
      return NextResponse.json(
        { error: "roomId parameter is required" },
        { status: 400 }
      )
    }

    console.log(`🧪 [TEST] Testing facility manager lookup for room: ${roomId}`)
    console.log(`🧪 [TEST] Function type:`, typeof getFacilityManagerByRoomId)
    console.log(`🧪 [TEST] Function exists:`, !!getFacilityManagerByRoomId)

    if (typeof getFacilityManagerByRoomId !== 'function') {
      return NextResponse.json({
        success: false,
        error: "getFacilityManagerByRoomId is not a function",
        functionType: typeof getFacilityManagerByRoomId,
        functionExists: !!getFacilityManagerByRoomId
      })
    }

    const facilityManager = await getFacilityManagerByRoomId(roomId)
    
    if (facilityManager) {
      console.log(`✅ [TEST] Facility manager found:`, facilityManager)
      return NextResponse.json({
        success: true,
        facilityManager,
        message: "Facility manager lookup successful"
      })
    } else {
      console.log(`❌ [TEST] No facility manager found for room: ${roomId}`)
      return NextResponse.json({
        success: false,
        facilityManager: null,
        message: "No facility manager found for this room"
      })
    }
    
  } catch (error) {
    console.error(`❌ [TEST] Error in facility manager lookup test:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
