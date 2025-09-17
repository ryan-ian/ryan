import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { 
  getFacilityDashboardMetrics, 
  getRevenueAnalytics, 
  getMeetingAnalytics,
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
    const [dashboardMetrics, revenueAnalytics, meetingAnalytics] = await Promise.all([
      getFacilityDashboardMetrics(user.id, dateRange),
      getRevenueAnalytics(user.id, dateRange),
      getMeetingAnalytics(user.id, dateRange)
    ])

    // Generate PDF
    const pdfBuffer = await generatePDFReport({
      facilityInfo,
      managerName: userProfile.name,
      dateRange,
      reportType: reportType || 'comprehensive',
      dashboardMetrics,
      revenueAnalytics,
      meetingAnalytics
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
    revenueAnalytics,
    meetingAnalytics
  } = data

  const formatCurrency = (amount: number) => `GH₵ ${amount.toFixed(2)}`
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`
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
                <div class="metric-title">Total Revenue</div>
                <div class="metric-value">${formatCurrency(dashboardMetrics.totalRevenue.current)}</div>
                <div class="metric-change ${dashboardMetrics.totalRevenue.changePercent >= 0 ? '' : 'negative'}">
                    ${dashboardMetrics.totalRevenue.changePercent >= 0 ? '+' : ''}${dashboardMetrics.totalRevenue.changePercent.toFixed(1)}% from previous period
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Active Bookings</div>
                <div class="metric-value">${dashboardMetrics.activeBookings.current}</div>
                <div class="metric-change ${dashboardMetrics.activeBookings.changePercent >= 0 ? '' : 'negative'}">
                    ${dashboardMetrics.activeBookings.changePercent >= 0 ? '+' : ''}${dashboardMetrics.activeBookings.changePercent.toFixed(1)}% from previous period
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Room Utilization</div>
                <div class="metric-value">${formatPercentage(dashboardMetrics.roomUtilization.current)}</div>
                <div class="metric-change ${dashboardMetrics.roomUtilization.changePercent >= 0 ? '' : 'negative'}">
                    ${dashboardMetrics.roomUtilization.changePercent >= 0 ? '+' : ''}${dashboardMetrics.roomUtilization.changePercent.toFixed(1)}% from previous period
                </div>
            </div>
        </div>
    </div>

    <!-- Revenue Analysis -->
    <div class="section">
        <h2>Financial Performance</h2>
        <div class="revenue-breakdown">
            <div>
                <h3>Revenue Overview</h3>
                <div class="stat-box">
                    <div class="stat-number">${formatCurrency(revenueAnalytics.totalRevenue)}</div>
                    <div class="stat-label">Total Revenue</div>
                </div>
                <div class="stat-box" style="margin-top: 10px;">
                    <div class="stat-number">${formatCurrency(revenueAnalytics.averageBookingValue)}</div>
                    <div class="stat-label">Average Booking Value</div>
                </div>
                <div class="stat-box" style="margin-top: 10px;">
                    <div class="stat-number">${formatPercentage(revenueAnalytics.collectionEfficiency)}</div>
                    <div class="stat-label">Collection Efficiency</div>
                </div>
            </div>
            <div>
                <h3>Top Performing Rooms</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Room Name</th>
                            <th>Revenue</th>
                            <th>Bookings</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${revenueAnalytics.revenueByRoom.slice(0, 5).map(room => `
                            <tr>
                                <td>${room.roomName}</td>
                                <td>${formatCurrency(room.revenue)}</td>
                                <td>${room.bookingCount}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="page-break"></div>

    <!-- Meeting Performance -->
    <div class="section">
        <h2>Meeting & Guest Analytics</h2>
        <div class="meeting-stats">
            <div class="stat-box">
                <div class="stat-number">${meetingAnalytics.totalMeetings}</div>
                <div class="stat-label">Total Meetings</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${formatPercentage(meetingAnalytics.checkInRate)}</div>
                <div class="stat-label">Check-in Rate</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${formatPercentage(meetingAnalytics.punctualityRate)}</div>
                <div class="stat-label">Punctuality Rate</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${meetingAnalytics.averageDuration.toFixed(0)} min</div>
                <div class="stat-label">Average Duration</div>
            </div>
        </div>

        <h3 style="margin-top: 30px;">Guest Engagement Statistics</h3>
        <div class="meeting-stats">
            <div class="stat-box">
                <div class="stat-number">${meetingAnalytics.guestInvitationStats.totalInvitations}</div>
                <div class="stat-label">Total Invitations</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${formatPercentage(meetingAnalytics.guestInvitationStats.acceptanceRate)}</div>
                <div class="stat-label">Acceptance Rate</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${formatPercentage(meetingAnalytics.guestInvitationStats.responseRate)}</div>
                <div class="stat-label">Response Rate</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${(meetingAnalytics.guestInvitationStats.averageResponseTime / 24).toFixed(1)} days</div>
                <div class="stat-label">Avg Response Time</div>
            </div>
        </div>
    </div>

    <!-- Payment Methods -->
    ${revenueAnalytics.paymentMethodDistribution.length > 0 ? `
    <div class="section">
        <h2>Payment Method Analysis</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Payment Method</th>
                    <th>Total Amount</th>
                    <th>Transaction Count</th>
                    <th>Average Value</th>
                </tr>
            </thead>
            <tbody>
                ${revenueAnalytics.paymentMethodDistribution.map(method => `
                    <tr>
                        <td>${method.method}</td>
                        <td>${formatCurrency(method.amount)}</td>
                        <td>${method.count}</td>
                        <td>${formatCurrency(method.amount / method.count)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
        <p>This report was generated automatically by the Conference Hub Facility Management System.</p>
        <p>For questions about this report, please contact your system administrator.</p>
    </div>
</body>
</html>
  `
}
