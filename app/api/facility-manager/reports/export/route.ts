import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { 
  getFacilityDashboardMetrics, 
  getUtilizationAnalytics, 
  getAttendanceAnalytics,
  getDateRanges,
  type DateRange
} from "@/lib/facility-analytics"
import puppeteer from 'puppeteer'

export async function POST(request: NextRequest) {
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
      .select('id, role, name')
      .eq('id', user.id)
      .single()

    if (userError || !userProfile || userProfile.role !== 'facility_manager') {
      return NextResponse.json({ error: "Facility manager access required" }, { status: 403 })
    }

    const { period, startDate, endDate, reportType } = await request.json()

    // Determine date range
    let dateRange: DateRange
    
    if (startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        label: "Custom Range"
      }
    } else {
      const ranges = getDateRanges()
      switch (period) {
        case "7":
          dateRange = ranges[0]
          break
        case "30":
          dateRange = ranges[1]
          break
        case "90":
          dateRange = ranges[2]
          break
        case "180":
          dateRange = ranges[3]
          break
        case "365":
          dateRange = ranges[4]
          break
        default:
          dateRange = ranges[1]
      }
    }

    console.log(`📄 [PDF Export] Generating ${reportType} report for manager ${user.id}`)

    // Get facility information
    const { data: facilityData } = await supabase
      .from('facilities')
      .select('id, name, location, description')
      .eq('manager_id', user.id)
      .single()

    const facilityInfo = facilityData || { name: 'Unknown Facility', location: '', description: '' }

    // Get analytics data
    const [dashboardMetrics, utilizationAnalytics, attendanceAnalytics] = await Promise.all([
      getFacilityDashboardMetrics(user.id, dateRange),
      getUtilizationAnalytics(user.id, dateRange),
      getAttendanceAnalytics(user.id, dateRange)
    ])

    // Generate PDF
    const pdfBuffer = await generatePDFReport({
      facilityInfo,
      managerName: userProfile.name,
      dateRange,
      reportType: reportType || 'comprehensive',
      dashboardMetrics,
      utilizationAnalytics,
      attendanceAnalytics
    })

    // Return PDF as response
    const filename = `facility-report-${facilityInfo.name.replace(/\s+/g, '-').toLowerCase()}-${dateRange.startDate.toISOString().split('T')[0]}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error: any) {
    console.error("❌ [PDF Export] Error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to generate report" 
      },
      { status: 500 }
    )
  }
}

async function generatePDFReport(data: any): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()

  // Generate HTML content for the report
  const htmlContent = generateReportHTML(data)

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

  // Generate PDF
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '1in',
      right: '1in',
      bottom: '1in',
      left: '1in'
    }
  })

  await browser.close()

  return pdfBuffer
}

function generateReportHTML(data: any): string {
  const {
    facilityInfo,
    managerName,
    dateRange,
    reportType,
    dashboardMetrics,
    utilizationAnalytics,
    attendanceAnalytics
  } = data

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`
  const formatHours = (hours: number) => `${hours.toFixed(1)}h`
  const formatTime = (hour: number) => {
    if (hour === 0) return "12 AM"
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return "12 PM"
    return `${hour - 12} PM`
  }
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Facility Report - ${facilityInfo.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }
        
        .header h1 {
            color: #1e40af;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #6b7280;
            font-size: 14px;
        }
        
        .facility-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .facility-info h2 {
            color: #1e40af;
            margin-bottom: 15px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-weight: bold;
            color: #374151;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .info-value {
            color: #1f2937;
            font-size: 14px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .metric-title {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
        
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }
        
        .metric-change {
            font-size: 12px;
            color: #059669;
        }
        
        .metric-change.negative {
            color: #dc2626;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            color: #1e40af;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .revenue-breakdown {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        .table th {
            background: #f8fafc;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
            font-weight: bold;
            color: #374151;
        }
        
        .table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .table tr:nth-child(even) {
            background: #f9fafb;
        }
        
        .meeting-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 20px;
        }
        
        .stat-box {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
        }
        
        .stat-label {
            font-size: 12px;
            color: #6b7280;
            margin-top: 5px;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <h1>Facility Management Report</h1>
        <p>Generated on ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
    </div>

    <!-- Facility Information -->
    <div class="facility-info">
        <h2>Facility Information</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Facility Name</div>
                <div class="info-value">${facilityInfo.name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Location</div>
                <div class="info-value">${facilityInfo.location || 'Not specified'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Manager</div>
                <div class="info-value">${managerName}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Report Period</div>
                <div class="info-value">${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}</div>
            </div>
        </div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
        <h2>Executive Summary</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">Room Utilization Rate</div>
                <div class="metric-value">${formatPercentage(dashboardMetrics.roomUtilizationRate.current)}</div>
                <div class="metric-change ${dashboardMetrics.roomUtilizationRate.changePercent >= 0 ? '' : 'negative'}">
                    ${dashboardMetrics.roomUtilizationRate.changePercent >= 0 ? '+' : ''}${dashboardMetrics.roomUtilizationRate.changePercent.toFixed(1)}% from previous period
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Total Bookings</div>
                <div class="metric-value">${dashboardMetrics.totalBookings.current}</div>
                <div class="metric-change ${dashboardMetrics.totalBookings.changePercent >= 0 ? '' : 'negative'}">
                    ${dashboardMetrics.totalBookings.changePercent >= 0 ? '+' : ''}${dashboardMetrics.totalBookings.changePercent.toFixed(1)}% from previous period
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Attendance Rate</div>
                <div class="metric-value">${formatPercentage(dashboardMetrics.attendanceRate.current)}</div>
                <div class="metric-change ${dashboardMetrics.attendanceRate.changePercent >= 0 ? '' : 'negative'}">
                    ${dashboardMetrics.attendanceRate.changePercent >= 0 ? '+' : ''}${dashboardMetrics.attendanceRate.changePercent.toFixed(1)}% from previous period
                </div>
            </div>
        </div>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">No-Show Rate</div>
                <div class="metric-value">${formatPercentage(dashboardMetrics.noShowRate.current)}</div>
                <div class="metric-change ${dashboardMetrics.noShowRate.changePercent <= 0 ? '' : 'negative'}">
                    ${dashboardMetrics.noShowRate.changePercent >= 0 ? '+' : ''}${dashboardMetrics.noShowRate.changePercent.toFixed(1)}% from previous period
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Peak Hour Usage</div>
                <div class="metric-value">${formatTime(dashboardMetrics.peakHourUsage.current)}</div>
                <div class="metric-change">
                    Most popular booking time
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Avg Meeting Duration</div>
                <div class="metric-value">${formatHours(dashboardMetrics.averageMeetingDuration.current)}</div>
                <div class="metric-change ${dashboardMetrics.averageMeetingDuration.changePercent >= 0 ? '' : 'negative'}">
                    ${dashboardMetrics.averageMeetingDuration.changePercent >= 0 ? '+' : ''}${dashboardMetrics.averageMeetingDuration.changePercent.toFixed(1)}% from previous period
                </div>
            </div>
        </div>
    </div>

    <!-- Room Utilization Analysis -->
    <div class="section">
        <h2>Room Utilization Performance</h2>
        <div class="revenue-breakdown">
            <div>
                <h3>Utilization Overview</h3>
                <div class="stat-box">
                    <div class="stat-number">${formatPercentage(utilizationAnalytics.overallUtilization)}</div>
                    <div class="stat-label">Overall Utilization</div>
                </div>
                <div class="stat-box" style="margin-top: 10px;">
                    <div class="stat-number">${formatHours(utilizationAnalytics.averageBookingDuration)}</div>
                    <div class="stat-label">Average Booking Duration</div>
                </div>
                <div class="stat-box" style="margin-top: 10px;">
                    <div class="stat-number">${formatTime(utilizationAnalytics.peakUtilizationHour)}</div>
                    <div class="stat-label">Peak Utilization Hour</div>
                </div>
            </div>
            <div>
                <h3>Room Utilization Breakdown</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Room Name</th>
                            <th>Utilization Rate</th>
                            <th>Bookings</th>
                            <th>Hours Used</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${utilizationAnalytics.utilizationByRoom.slice(0, 5).map(room => `
                            <tr>
                                <td>${room.roomName}</td>
                                <td>${formatPercentage(room.utilizationRate)}</td>
                                <td>${room.bookingCount}</td>
                                <td>${formatHours(room.bookedHours)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="page-break"></div>

    <!-- Attendance Performance -->
    <div class="section">
        <h2>Attendance & No-Show Analysis</h2>
        <div class="meeting-stats">
            <div class="stat-box">
                <div class="stat-number">${attendanceAnalytics.totalMeetings}</div>
                <div class="stat-label">Total Meetings</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${formatPercentage(attendanceAnalytics.checkInRate)}</div>
                <div class="stat-label">Check-in Rate</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${formatPercentage(attendanceAnalytics.noShowRate)}</div>
                <div class="stat-label">No-Show Rate</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${formatPercentage(attendanceAnalytics.punctualityRate)}</div>
                <div class="stat-label">Punctuality Rate</div>
            </div>
        </div>

        <h3 style="margin-top: 30px;">Check-in Performance Breakdown</h3>
        <div class="meeting-stats">
            ${attendanceAnalytics.checkInPerformance.map(perf => `
                <div class="stat-box">
                    <div class="stat-number">${perf.count}</div>
                    <div class="stat-label">${perf.status.replace('-', ' ').toUpperCase()} (${formatPercentage(perf.percentage)})</div>
                </div>
            `).join('')}
        </div>

        <h3 style="margin-top: 30px;">Peak Booking Times</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Bookings</th>
                    <th>Check-in Rate</th>
                </tr>
            </thead>
            <tbody>
                ${attendanceAnalytics.popularMeetingTimes.slice(0, 8).map(time => `
                    <tr>
                        <td>${formatTime(time.hour)}</td>
                        <td>${time.count}</td>
                        <td>${formatPercentage(time.checkInRate)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <!-- Operational Insights -->
    <div class="section">
        <h2>Operational Insights & Recommendations</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
            <h3>Key Findings</h3>
            <ul style="margin-left: 20px; line-height: 1.8;">
                <li><strong>Utilization:</strong> Overall facility utilization is ${formatPercentage(utilizationAnalytics.overallUtilization)}</li>
                <li><strong>Attendance:</strong> ${formatPercentage(attendanceAnalytics.checkInRate)} of bookings result in successful check-ins</li>
                <li><strong>No-Shows:</strong> ${formatPercentage(attendanceAnalytics.noShowRate)} of confirmed bookings are no-shows</li>
                <li><strong>Peak Usage:</strong> Most bookings occur at ${formatTime(utilizationAnalytics.peakUtilizationHour)}</li>
                <li><strong>Meeting Duration:</strong> Average meeting length is ${formatHours(utilizationAnalytics.averageBookingDuration)}</li>
            </ul>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>This report was generated automatically by the Conference Hub Facility Management System.</p>
        <p>For questions about this report, please contact your system administrator.</p>
    </div>
</body>
</html>
  `
}
