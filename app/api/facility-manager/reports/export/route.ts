import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { 
  getFacilityDashboardMetrics, 
  getUtilizationAnalytics, 
  getAttendanceAnalytics,
  getDateRanges,
  type DateRange
} from "@/lib/facility-analytics"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Increase timeout for PDF generation
export const maxDuration = 30

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

    // Generate PDF using appropriate method based on environment
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
  // Always use Puppeteer for consistent high-quality PDFs
  // Dynamic imports based on environment as per Vercel guide
  const isVercel = !!process.env.VERCEL_ENV
  
  let puppeteer: any
  let launchOptions: any = {
    headless: true,
  }

  try {
    if (isVercel) {
      // Production: Use @sparticuz/chromium for Vercel
      const chromium = (await import("@sparticuz/chromium")).default
      puppeteer = await import("puppeteer-core")
      launchOptions = {
        ...launchOptions,
        args: chromium.args,
        executablePath: await chromium.executablePath(),
      }
    } else {
      // Development: Use regular puppeteer
      puppeteer = await import("puppeteer")
    }

    const browser = await puppeteer.launch(launchOptions)
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

  } catch (error) {
    console.error('Puppeteer PDF generation failed:', error)
    // Fallback to jsPDF if Puppeteer fails
    return generatePDFWithJsPDF(data)
  }
}

function generatePDFWithJsPDF(data: any): Buffer {
  const {
    facilityInfo,
    managerName,
    dateRange,
    dashboardMetrics,
    utilizationAnalytics,
    attendanceAnalytics
  } = data

  const doc = new jsPDF()
  
  // Helper functions
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

  let yPosition = 20

  // Header with blue accent line
  doc.setFillColor(37, 99, 235) // Blue color
  doc.rect(0, 0, 210, 8, 'F') // Blue header bar
  
  doc.setFontSize(24)
  doc.setTextColor(30, 64, 175) // Blue text
  doc.text('Facility Management Report', 20, 25)
  
  doc.setFontSize(12)
  doc.setTextColor(107, 114, 128) // Gray text
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 20, 32)
  yPosition = 45

  // Facility Information Card
  doc.setFillColor(248, 250, 252) // Light gray background
  doc.roundedRect(15, yPosition - 5, 180, 35, 3, 3, 'F')
  
  doc.setFontSize(16)
  doc.setTextColor(30, 64, 175)
  doc.text('Facility Information', 20, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Facility Name: ${facilityInfo.name}`, 20, yPosition)
  doc.text(`Location: ${facilityInfo.location || 'Not specified'}`, 110, yPosition)
  yPosition += 6
  doc.text(`Manager: ${managerName}`, 20, yPosition)
  doc.text(`Report Period: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`, 110, yPosition)
  yPosition += 20

  // Executive Summary with Cards
  doc.setFontSize(16)
  doc.setTextColor(30, 64, 175)
  doc.text('Executive Summary', 20, yPosition)
  yPosition += 15

  // Create metric cards
  const metrics = [
    { title: 'Room Utilization Rate', value: formatPercentage(dashboardMetrics.roomUtilizationRate.current), change: `${dashboardMetrics.roomUtilizationRate.changePercent >= 0 ? '+' : ''}${dashboardMetrics.roomUtilizationRate.changePercent.toFixed(1)}%` },
    { title: 'Total Bookings', value: dashboardMetrics.totalBookings.current.toString(), change: `${dashboardMetrics.totalBookings.changePercent >= 0 ? '+' : ''}${dashboardMetrics.totalBookings.changePercent.toFixed(1)}%` },
    { title: 'Attendance Rate', value: formatPercentage(dashboardMetrics.attendanceRate.current), change: `${dashboardMetrics.attendanceRate.changePercent >= 0 ? '+' : ''}${dashboardMetrics.attendanceRate.changePercent.toFixed(1)}%` },
    { title: 'No-Show Rate', value: formatPercentage(dashboardMetrics.noShowRate.current), change: `${dashboardMetrics.noShowRate.changePercent >= 0 ? '+' : ''}${dashboardMetrics.noShowRate.changePercent.toFixed(1)}%` },
    { title: 'Peak Hour Usage', value: formatTime(dashboardMetrics.peakHourUsage.current), change: 'Most popular time' },
    { title: 'Avg Meeting Duration', value: formatHours(dashboardMetrics.averageMeetingDuration.current), change: `${dashboardMetrics.averageMeetingDuration.changePercent >= 0 ? '+' : ''}${dashboardMetrics.averageMeetingDuration.changePercent.toFixed(1)}%` }
  ]

  // Draw metric cards in 3x2 grid
  for (let i = 0; i < metrics.length; i++) {
    const row = Math.floor(i / 3)
    const col = i % 3
    const cardX = 20 + (col * 60)
    const cardY = yPosition + (row * 35)
    
    // Card background
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(229, 231, 235)
    doc.roundedRect(cardX, cardY, 55, 30, 2, 2, 'FD')
    
    // Card content
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text(metrics[i].title.toUpperCase(), cardX + 3, cardY + 8)
    
    doc.setFontSize(16)
    doc.setTextColor(30, 64, 175)
    doc.text(metrics[i].value, cardX + 3, cardY + 18)
    
    doc.setFontSize(7)
    doc.setTextColor(5, 150, 105)
    doc.text(metrics[i].change, cardX + 3, cardY + 25)
  }

  yPosition += 80

  // Room Utilization Analysis
  doc.setFontSize(16)
  doc.setTextColor(30, 64, 175)
  doc.text('Room Utilization Performance', 20, yPosition)
  yPosition += 10

  // Stats boxes
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(20, yPosition, 85, 25, 2, 2, 'F')
  doc.setFontSize(14)
  doc.setTextColor(30, 64, 175)
  doc.text(formatPercentage(utilizationAnalytics.overallUtilization), 25, yPosition + 8)
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('OVERALL UTILIZATION', 25, yPosition + 15)
  
  doc.roundedRect(110, yPosition, 85, 25, 2, 2, 'F')
  doc.setFontSize(14)
  doc.setTextColor(30, 64, 175)
  doc.text(formatHours(utilizationAnalytics.averageBookingDuration), 115, yPosition + 8)
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('AVG BOOKING DURATION', 115, yPosition + 15)
  
  yPosition += 35

  // Room utilization table with enhanced styling
  const roomData = utilizationAnalytics.utilizationByRoom.slice(0, 5).map(room => [
    room.roomName,
    formatPercentage(room.utilizationRate),
    room.bookingCount.toString(),
    formatHours(room.bookedHours)
  ])

  autoTable(doc, {
    startY: yPosition,
    head: [['Room Name', 'Utilization Rate', 'Bookings', 'Hours Used']],
    body: roomData,
    styles: { 
      fontSize: 10,
      cellPadding: 6,
      lineColor: [229, 231, 235],
      lineWidth: 0.5
    },
    headStyles: { 
      fillColor: [248, 250, 252],
      textColor: [55, 65, 81],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 20, right: 20 }
  })

  yPosition = (doc as any).lastAutoTable.finalY + 20

  // Attendance Analysis
  doc.setFontSize(16)
  doc.setTextColor(30, 64, 175)
  doc.text('Attendance & No-Show Analysis', 20, yPosition)
  yPosition += 15

  // Attendance stats in 2x2 grid
  const attendanceStats = [
    { label: 'Total Meetings', value: attendanceAnalytics.totalMeetings.toString() },
    { label: 'Check-in Rate', value: formatPercentage(attendanceAnalytics.checkInRate) },
    { label: 'No-Show Rate', value: formatPercentage(attendanceAnalytics.noShowRate) },
    { label: 'Punctuality Rate', value: formatPercentage(attendanceAnalytics.punctualityRate) }
  ]

  for (let i = 0; i < attendanceStats.length; i++) {
    const row = Math.floor(i / 2)
    const col = i % 2
    const boxX = 20 + (col * 90)
    const boxY = yPosition + (row * 20)
    
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(boxX, boxY, 85, 15, 2, 2, 'F')
    
    doc.setFontSize(12)
    doc.setTextColor(30, 64, 175)
    doc.text(attendanceStats[i].value, boxX + 5, boxY + 7)
    
    doc.setFontSize(7)
    doc.setTextColor(107, 114, 128)
    doc.text(attendanceStats[i].label.toUpperCase(), boxX + 5, boxY + 12)
  }

  yPosition += 50

  // Operational Insights
  doc.setFontSize(16)
  doc.setTextColor(30, 64, 175)
  doc.text('Operational Insights & Recommendations', 20, yPosition)
  yPosition += 10

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(20, yPosition, 170, 40, 3, 3, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text('Key Findings:', 25, yPosition + 8)
  doc.text(`• Overall facility utilization is ${formatPercentage(utilizationAnalytics.overallUtilization)}`, 25, yPosition + 15)
  doc.text(`• ${formatPercentage(attendanceAnalytics.checkInRate)} of bookings result in successful check-ins`, 25, yPosition + 22)
  doc.text(`• ${formatPercentage(attendanceAnalytics.noShowRate)} of confirmed bookings are no-shows`, 25, yPosition + 29)
  doc.text(`• Most bookings occur at ${formatTime(utilizationAnalytics.peakUtilizationHour)}`, 25, yPosition + 36)

  // Footer
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text('This report was generated automatically by the Conference Hub Facility Management System.', 20, doc.internal.pageSize.height - 20)
  doc.text('For questions about this report, please contact your system administrator.', 20, doc.internal.pageSize.height - 10)

  return Buffer.from(doc.output('arraybuffer'))
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
