import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { 
  getFacilityDashboardMetrics, 
  getUtilizationAnalytics, 
  getAttendanceAnalytics,
  getActivityFeed,
  getDateRanges,
  type DateRange
} from "@/lib/facility-analytics"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Get user info from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get user profile to verify facility manager role
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id, role, name, email')
      .eq('id', user.id)
      .single()

    console.log(`📊 [Analytics API] User profile:`, userProfile)
    console.log(`📊 [Analytics API] User error:`, userError)

    if (userError || !userProfile) {
      console.log(`❌ [Analytics API] User profile not found for ${user.id}`)
      return NextResponse.json({ error: "User profile not found" }, { status: 403 })
    }

    if (userProfile.role !== 'facility_manager' && userProfile.role !== 'admin') {
      console.log(`❌ [Analytics API] User ${userProfile.name} has role ${userProfile.role}, not facility_manager or admin`)
      return NextResponse.json({ error: "Facility manager access required" }, { status: 403 })
    }

    console.log(`✅ [Analytics API] Facility manager ${userProfile.name} accessing analytics`)

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "dashboard"
    const period = searchParams.get("period") || "30"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Determine date range
    let dateRange: DateRange
    
    if (startDate && endDate) {
      // Custom date range
      dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        label: "Custom Range"
      }
    } else {
      // Predefined periods
      const ranges = getDateRanges()
      switch (period) {
        case "7":
          dateRange = ranges[0] // Last 7 days
          break
        case "30":
          dateRange = ranges[1] // Last 30 days
          break
        case "90":
          dateRange = ranges[2] // Last 3 months
          break
        case "180":
          dateRange = ranges[3] // Last 6 months
          break
        case "365":
          dateRange = ranges[4] // Last 12 months
          break
        default:
          dateRange = ranges[1] // Default to 30 days
      }
    }

    console.log(`📊 [Facility Analytics] ${type} request for manager ${user.id}, period: ${dateRange.label}`)
    console.log(user.id)

    // Handle different analytics types
    switch (type) {
      case "dashboard":
        const dashboardMetrics = await getFacilityDashboardMetrics(user.id, dateRange)
        console.log(user.id)
        return NextResponse.json({
          success: true,
          data: dashboardMetrics,
          dateRange
        })

      case "utilization":
        const utilizationAnalytics = await getUtilizationAnalytics(user.id, dateRange)
        return NextResponse.json({
          success: true,
          data: utilizationAnalytics,
          dateRange
        })

      case "attendance":
        const attendanceAnalytics = await getAttendanceAnalytics(user.id, dateRange)
        return NextResponse.json({
          success: true,
          data: attendanceAnalytics,
          dateRange
        })

      case "activity":
        const limit = parseInt(searchParams.get("limit") || "20")
        const activityFeed = await getActivityFeed(user.id, limit)
        return NextResponse.json({
          success: true,
          data: activityFeed
        })

      case "all":
        // Get all analytics data in one request for dashboard
        console.log(`📊 [Analytics API] Fetching all analytics for user ${user.id}`)
        
        try {
          const [dashboard, utilization, attendance, activity] = await Promise.all([
            getFacilityDashboardMetrics(user.id, dateRange),
            getUtilizationAnalytics(user.id, dateRange),
            getAttendanceAnalytics(user.id, dateRange),
            getActivityFeed(user.id, 10)
          ])

          console.log(`✅ [Analytics API] Successfully fetched all analytics`)
          
          return NextResponse.json({
            success: true,
            data: {
              dashboard,
              utilization,
              attendance,
              activity
            },
            dateRange
          })
        } catch (analyticsError: any) {
          console.error(`❌ [Analytics API] Error fetching analytics:`, analyticsError)
          return NextResponse.json({
            success: false,
            error: `Analytics error: ${analyticsError.message || 'Unknown error'}`
          }, { status: 500 })
        }

      default:
        return NextResponse.json(
          { error: "Invalid analytics type" },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error("❌ [Facility Analytics] Error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Internal server error" 
      },
      { status: 500 }
    )
  }
}
