import { supabase } from './supabase'
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns'

export interface DateRange {
  startDate: Date
  endDate: Date
  label: string
}

export interface KPIMetrics {
  totalRevenue: {
    current: number
    previous: number
    change: number
    changePercent: number
  }
  activeBookings: {
    current: number
    previous: number
    change: number
    changePercent: number
  }
  roomUtilization: {
    current: number
    previous: number
    change: number
    changePercent: number
  }
  meetingCompletionRate: {
    current: number
    previous: number
    change: number
    changePercent: number
  }
  averageGuestCount: {
    current: number
    previous: number
    change: number
    changePercent: number
  }
  paymentCollectionRate: {
    current: number
    previous: number
    change: number
    changePercent: number
  }
}

export interface RevenueAnalytics {
  totalRevenue: number
  revenueByRoom: Array<{
    roomId: string
    roomName: string
    revenue: number
    bookingCount: number
  }>
  paymentMethodDistribution: Array<{
    method: string
    amount: number
    count: number
  }>
  revenueTimeline: Array<{
    date: string
    revenue: number
    bookings: number
  }>
  averageBookingValue: number
  collectionEfficiency: number
}

export interface MeetingAnalytics {
  totalMeetings: number
  checkInRate: number
  punctualityRate: number
  averageDuration: number
  guestInvitationStats: {
    totalInvitations: number
    acceptanceRate: number
    responseRate: number
    averageResponseTime: number
  }
  checkInPerformance: Array<{
    status: 'on-time' | 'grace-period' | 'late' | 'no-show'
    count: number
    percentage: number
  }>
  popularMeetingTimes: Array<{
    hour: number
    count: number
  }>
}

export interface ActivityFeedItem {
  id: string
  type: 'booking' | 'payment' | 'check-in' | 'issue' | 'guest-response'
  title: string
  description: string
  timestamp: string
  metadata?: any
}

/**
 * Get predefined date ranges for reports
 */
export function getDateRanges(): DateRange[] {
  const now = new Date()
  
  return [
    {
      startDate: subDays(now, 7),
      endDate: now,
      label: 'Last 7 Days'
    },
    {
      startDate: subDays(now, 30),
      endDate: now,
      label: 'Last 30 Days'
    },
    {
      startDate: subMonths(now, 3),
      endDate: now,
      label: 'Last 3 Months'
    },
    {
      startDate: subMonths(now, 6),
      endDate: now,
      label: 'Last 6 Months'
    },
    {
      startDate: subMonths(now, 12),
      endDate: now,
      label: 'Last 12 Months'
    }
  ]
}

/**
 * Get facility rooms managed by a facility manager
 */
export async function getFacilityRooms(managerId: string): Promise<string[]> {
  try {
    console.log(`🔍 [Analytics] Looking for facilities managed by user: ${managerId}`)
    
    const { data: facilities, error: facilityError } = await supabase
      .from('facilities')
      .select('id, name')
      .eq('manager_id', managerId)
    console.log("in the get rooms function")
    console.log(managerId)
    console.log(facilities)

    if (facilityError) {
      console.error('Error querying facilities:', facilityError)
      return []
    }
    
    console.log(`🏢 [Analytics] Found ${facilities?.length || 0} facilities:`, facilities)

    if (!facilities || facilities.length === 0) {
      console.log('⚠️ [Analytics] No facilities found for this manager')
      return []
    }

    const facilityIds = facilities.map(f => f.id)

    const { data: rooms, error: roomError } = await supabase
      .from('rooms')
      .select('id, name')
      .in('facility_id', facilityIds)

    if (roomError) {
      console.error('Error querying rooms:', roomError)
      return []
    }

    console.log(`🏠 [Analytics] Found ${rooms?.length || 0} rooms:`, rooms)

    return rooms?.map(r => r.id) || []
  } catch (error) {
    console.error('Error fetching facility rooms:', error)
    return []
  }
}

/**
 * Get dashboard KPI metrics with comparison to previous period
 */
export async function getFacilityDashboardMetrics(
  managerId: string,
  dateRange: DateRange
): Promise<KPIMetrics> {
  try {
    const roomIds = await getFacilityRooms(managerId)
    
    if (roomIds.length === 0) {
      return getEmptyKPIMetrics()
    }

    // Calculate previous period for comparison
    const periodDays = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
    const previousStartDate = subDays(dateRange.startDate, periodDays)
    const previousEndDate = dateRange.startDate

    // Get current and previous period metrics in parallel
    const [
      currentRevenue,
      previousRevenue,
      currentBookings,
      previousBookings,
      currentUtilization,
      previousUtilization,
      currentMeetingStats,
      previousMeetingStats
    ] = await Promise.all([
      getRevenueForPeriod(roomIds, dateRange.startDate, dateRange.endDate),
      getRevenueForPeriod(roomIds, previousStartDate, previousEndDate),
      getBookingsForPeriod(roomIds, dateRange.startDate, dateRange.endDate),
      getBookingsForPeriod(roomIds, previousStartDate, previousEndDate),
      getRoomUtilizationForPeriod(roomIds, dateRange.startDate, dateRange.endDate),
      getRoomUtilizationForPeriod(roomIds, previousStartDate, previousEndDate),
      getMeetingStatsForPeriod(roomIds, dateRange.startDate, dateRange.endDate),
      getMeetingStatsForPeriod(roomIds, previousStartDate, previousEndDate)
    ])

    return {
      totalRevenue: calculateKPIChange(currentRevenue.totalRevenue, previousRevenue.totalRevenue),
      activeBookings: calculateKPIChange(currentBookings.confirmed, previousBookings.confirmed),
      roomUtilization: calculateKPIChange(currentUtilization, previousUtilization),
      meetingCompletionRate: calculateKPIChange(currentMeetingStats.completionRate, previousMeetingStats.completionRate),
      averageGuestCount: calculateKPIChange(currentMeetingStats.avgGuestCount, previousMeetingStats.avgGuestCount),
      paymentCollectionRate: calculateKPIChange(currentRevenue.collectionRate, previousRevenue.collectionRate)
    }
  } catch (error) {
    console.error('Error getting dashboard metrics:', error)
    return getEmptyKPIMetrics()
  }
}

/**
 * Get revenue analytics for facility
 */
export async function getRevenueAnalytics(
  managerId: string,
  dateRange: DateRange
): Promise<RevenueAnalytics> {
  try {
    const roomIds = await getFacilityRooms(managerId)
    
    if (roomIds.length === 0) {
      return getEmptyRevenueAnalytics()
    }

    // Get revenue data
    const { data: paymentsData } = await supabase
      .from('payments')
      .select(`
        amount,
        currency,
        status,
        payment_method,
        paid_at,
        bookings!inner(
          room_id,
          start_time,
          rooms!inner(id, name)
        )
      `)
      .in('bookings.room_id', roomIds)
      .gte('paid_at', dateRange.startDate.toISOString())
      .lte('paid_at', dateRange.endDate.toISOString())
      .eq('status', 'success')

    const payments = paymentsData || []

    // Calculate total revenue
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

    // Revenue by room
    const revenueByRoom = payments.reduce((acc, payment) => {
      const roomId = payment.bookings?.room_id
      const roomName = payment.bookings?.rooms?.name || 'Unknown Room'
      
      if (!acc[roomId]) {
        acc[roomId] = { roomId, roomName, revenue: 0, bookingCount: 0 }
      }
      
      acc[roomId].revenue += payment.amount || 0
      acc[roomId].bookingCount += 1
      
      return acc
    }, {} as Record<string, any>)

    // Payment method distribution
    const paymentMethodDistribution = payments.reduce((acc, payment) => {
      const method = payment.payment_method || 'Unknown'
      
      if (!acc[method]) {
        acc[method] = { method, amount: 0, count: 0 }
      }
      
      acc[method].amount += payment.amount || 0
      acc[method].count += 1
      
      return acc
    }, {} as Record<string, any>)

    // Revenue timeline (daily)
    const revenueTimeline = await getRevenueTimeline(roomIds, dateRange.startDate, dateRange.endDate)

    return {
      totalRevenue,
      revenueByRoom: Object.values(revenueByRoom),
      paymentMethodDistribution: Object.values(paymentMethodDistribution),
      revenueTimeline,
      averageBookingValue: payments.length > 0 ? totalRevenue / payments.length : 0,
      collectionEfficiency: await getCollectionEfficiency(roomIds, dateRange.startDate, dateRange.endDate)
    }
  } catch (error) {
    console.error('Error getting revenue analytics:', error)
    return getEmptyRevenueAnalytics()
  }
}

/**
 * Get meeting and guest analytics
 */
export async function getMeetingAnalytics(
  managerId: string,
  dateRange: DateRange
): Promise<MeetingAnalytics> {
  try {
    const roomIds = await getFacilityRooms(managerId)
    
    if (roomIds.length === 0) {
      return getEmptyMeetingAnalytics()
    }

    // Get meetings data
    const { data: meetingsData } = await supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        checked_in_at,
        status,
        meeting_invitations(id, status, invited_at, responded_at),
        check_in_events(event_type, performed_at)
      `)
      .in('room_id', roomIds)
      .gte('start_time', dateRange.startDate.toISOString())
      .lte('start_time', dateRange.endDate.toISOString())
      .in('status', ['confirmed', 'cancelled'])

    const meetings = meetingsData || []

    // Calculate metrics
    const totalMeetings = meetings.length
    const checkedInMeetings = meetings.filter(m => m.checked_in_at).length
    const checkInRate = totalMeetings > 0 ? (checkedInMeetings / totalMeetings) * 100 : 0

    // Punctuality analysis
    const punctualMeetings = meetings.filter(m => 
      m.checked_in_at && new Date(m.checked_in_at) <= new Date(m.start_time)
    ).length
    const punctualityRate = checkedInMeetings > 0 ? (punctualMeetings / checkedInMeetings) * 100 : 0

    // Average duration
    const completedMeetings = meetings.filter(m => m.checked_in_at)
    const averageDuration = calculateAverageDuration(completedMeetings)

    // Guest invitation stats
    const allInvitations = meetings.flatMap(m => m.meeting_invitations || [])
    const guestInvitationStats = calculateGuestStats(allInvitations)

    // Check-in performance breakdown
    const checkInPerformance = categorizeCheckInPerformance(meetings)

    // Popular meeting times
    const popularMeetingTimes = calculatePopularMeetingTimes(meetings)

    return {
      totalMeetings,
      checkInRate,
      punctualityRate,
      averageDuration,
      guestInvitationStats,
      checkInPerformance,
      popularMeetingTimes
    }
  } catch (error) {
    console.error('Error getting meeting analytics:', error)
    return getEmptyMeetingAnalytics()
  }
}

/**
 * Get recent activity feed for facility
 */
export async function getActivityFeed(
  managerId: string,
  limit: number = 20
): Promise<ActivityFeedItem[]> {
  try {
    const roomIds = await getFacilityRooms(managerId)
    
    if (roomIds.length === 0) {
      return []
    }

    // Get recent activities from multiple sources
    const [recentBookings, recentPayments, recentCheckIns, recentIssues] = await Promise.all([
      getRecentBookings(roomIds, limit / 4),
      getRecentPayments(roomIds, limit / 4),
      getRecentCheckIns(roomIds, limit / 4),
      getRecentIssues(roomIds, limit / 4)
    ])

    // Combine and sort by timestamp
    const activities: ActivityFeedItem[] = [
      ...recentBookings,
      ...recentPayments,
      ...recentCheckIns,
      ...recentIssues
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return activities.slice(0, limit)
  } catch (error) {
    console.error('Error getting activity feed:', error)
    return []
  }
}

// Helper functions
function calculateKPIChange(current: number, previous: number) {
  const change = current - previous
  const changePercent = previous > 0 ? (change / previous) * 100 : 0
  
  return {
    current,
    previous,
    change,
    changePercent
  }
}

function getEmptyKPIMetrics(): KPIMetrics {
  const empty = { current: 0, previous: 0, change: 0, changePercent: 0 }
  return {
    totalRevenue: empty,
    activeBookings: empty,
    roomUtilization: empty,
    meetingCompletionRate: empty,
    averageGuestCount: empty,
    paymentCollectionRate: empty
  }
}

function getEmptyRevenueAnalytics(): RevenueAnalytics {
  return {
    totalRevenue: 0,
    revenueByRoom: [],
    paymentMethodDistribution: [],
    revenueTimeline: [],
    averageBookingValue: 0,
    collectionEfficiency: 0
  }
}

function getEmptyMeetingAnalytics(): MeetingAnalytics {
  return {
    totalMeetings: 0,
    checkInRate: 0,
    punctualityRate: 0,
    averageDuration: 0,
    guestInvitationStats: {
      totalInvitations: 0,
      acceptanceRate: 0,
      responseRate: 0,
      averageResponseTime: 0
    },
    checkInPerformance: [],
    popularMeetingTimes: []
  }
}

// Helper function implementations

async function getRevenueForPeriod(roomIds: string[], startDate: Date, endDate: Date) {
  try {
    const { data: payments } = await supabase
      .from('payments')
      .select(`
        amount,
        status,
        bookings!inner(room_id)
      `)
      .in('bookings.room_id', roomIds)
      .gte('paid_at', startDate.toISOString())
      .lte('paid_at', endDate.toISOString())
      .eq('status', 'success')

    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    
    // Get total bookings for collection rate calculation
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('payment_status')
      .in('room_id', roomIds)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .neq('status', 'cancelled')

    const totalBookings = allBookings?.length || 0
    const paidBookings = allBookings?.filter(b => b.payment_status === 'paid').length || 0
    const collectionRate = totalBookings > 0 ? (paidBookings / totalBookings) * 100 : 0

    return { totalRevenue, collectionRate }
  } catch (error) {
    console.error('Error getting revenue for period:', error)
    return { totalRevenue: 0, collectionRate: 0 }
  }
}

async function getBookingsForPeriod(roomIds: string[], startDate: Date, endDate: Date) {
  try {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('status')
      .in('room_id', roomIds)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())

    const confirmed = bookings?.filter(b => b.status === 'confirmed').length || 0
    const pending = bookings?.filter(b => b.status === 'pending').length || 0
    const cancelled = bookings?.filter(b => b.status === 'cancelled').length || 0

    return { confirmed, pending, cancelled }
  } catch (error) {
    console.error('Error getting bookings for period:', error)
    return { confirmed: 0, pending: 0, cancelled: 0 }
  }
}

async function getRoomUtilizationForPeriod(roomIds: string[], startDate: Date, endDate: Date) {
  try {
    if (roomIds.length === 0) return 0

    // Calculate total available hours for all rooms in the period
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const hoursPerDay = 10 // Assuming 10 hours operating time per day
    const totalAvailableHours = roomIds.length * totalDays * hoursPerDay

    // Get total booked hours
    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .in('room_id', roomIds)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .eq('status', 'confirmed')

    const totalBookedHours = bookings?.reduce((sum, booking) => {
      const start = new Date(booking.start_time)
      const end = new Date(booking.end_time)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return sum + hours
    }, 0) || 0

    return totalAvailableHours > 0 ? (totalBookedHours / totalAvailableHours) * 100 : 0
  } catch (error) {
    console.error('Error calculating room utilization:', error)
    return 0
  }
}

async function getMeetingStatsForPeriod(roomIds: string[], startDate: Date, endDate: Date) {
  try {
    const { data: meetings } = await supabase
      .from('bookings')
      .select(`
        id,
        checked_in_at,
        meeting_invitations(id)
      `)
      .in('room_id', roomIds)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .eq('status', 'confirmed')

    const totalMeetings = meetings?.length || 0
    const checkedInMeetings = meetings?.filter(m => m.checked_in_at).length || 0
    const completionRate = totalMeetings > 0 ? (checkedInMeetings / totalMeetings) * 100 : 0

    // Calculate average guest count
    const totalGuests = meetings?.reduce((sum, meeting) => {
      return sum + (meeting.meeting_invitations?.length || 0)
    }, 0) || 0
    const avgGuestCount = totalMeetings > 0 ? totalGuests / totalMeetings : 0

    return { completionRate, avgGuestCount }
  } catch (error) {
    console.error('Error getting meeting stats:', error)
    return { completionRate: 0, avgGuestCount: 0 }
  }
}

async function getRevenueTimeline(roomIds: string[], startDate: Date, endDate: Date) {
  try {
    const { data: payments } = await supabase
      .from('payments')
      .select(`
        amount,
        paid_at,
        bookings!inner(room_id)
      `)
      .in('bookings.room_id', roomIds)
      .gte('paid_at', startDate.toISOString())
      .lte('paid_at', endDate.toISOString())
      .eq('status', 'success')

    // Group by date
    const timeline = payments?.reduce((acc: any, payment) => {
      const date = payment.paid_at?.split('T')[0] // Get YYYY-MM-DD
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, bookings: 0 }
      }
      acc[date].revenue += payment.amount || 0
      acc[date].bookings += 1
      return acc
    }, {}) || {}

    return Object.values(timeline)
  } catch (error) {
    console.error('Error getting revenue timeline:', error)
    return []
  }
}

async function getCollectionEfficiency(roomIds: string[], startDate: Date, endDate: Date) {
  try {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('payment_status, total_cost')
      .in('room_id', roomIds)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .neq('status', 'cancelled')
      .not('total_cost', 'is', null)

    const totalBookings = bookings?.length || 0
    const paidBookings = bookings?.filter(b => b.payment_status === 'paid').length || 0

    return totalBookings > 0 ? (paidBookings / totalBookings) * 100 : 0
  } catch (error) {
    console.error('Error calculating collection efficiency:', error)
    return 0
  }
}

function calculateAverageDuration(meetings: any[]) {
  if (!meetings || meetings.length === 0) return 0

  const totalDuration = meetings.reduce((sum, meeting) => {
    if (meeting.start_time && meeting.end_time) {
      const start = new Date(meeting.start_time)
      const end = new Date(meeting.end_time)
      const duration = (end.getTime() - start.getTime()) / (1000 * 60) // minutes
      return sum + duration
    }
    return sum
  }, 0)

  return meetings.length > 0 ? totalDuration / meetings.length : 0
}

function calculateGuestStats(invitations: any[]) {
  if (!invitations || invitations.length === 0) {
    return {
      totalInvitations: 0,
      acceptanceRate: 0,
      responseRate: 0,
      averageResponseTime: 0
    }
  }

  const totalInvitations = invitations.length
  const accepted = invitations.filter(inv => inv.status === 'accepted').length
  const responded = invitations.filter(inv => inv.status !== 'pending').length
  
  const acceptanceRate = totalInvitations > 0 ? (accepted / totalInvitations) * 100 : 0
  const responseRate = totalInvitations > 0 ? (responded / totalInvitations) * 100 : 0

  // Calculate average response time
  const responseTimes = invitations
    .filter(inv => inv.invited_at && inv.responded_at)
    .map(inv => {
      const invited = new Date(inv.invited_at)
      const responded = new Date(inv.responded_at)
      return (responded.getTime() - invited.getTime()) / (1000 * 60 * 60) // hours
    })

  const averageResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
    : 0

  return {
    totalInvitations,
    acceptanceRate,
    responseRate,
    averageResponseTime
  }
}

function categorizeCheckInPerformance(meetings: any[]) {
  if (!meetings || meetings.length === 0) return []

  const categories = {
    'on-time': 0,
    'grace-period': 0,
    'late': 0,
    'no-show': 0
  }

  meetings.forEach(meeting => {
    if (!meeting.checked_in_at) {
      categories['no-show']++
    } else {
      const startTime = new Date(meeting.start_time)
      const checkInTime = new Date(meeting.checked_in_at)
      const diffMinutes = (checkInTime.getTime() - startTime.getTime()) / (1000 * 60)

      if (diffMinutes <= 0) {
        categories['on-time']++
      } else if (diffMinutes <= 15) {
        categories['grace-period']++
      } else {
        categories['late']++
      }
    }
  })

  const total = meetings.length
  return Object.entries(categories).map(([status, count]) => ({
    status,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0
  }))
}

function calculatePopularMeetingTimes(meetings: any[]) {
  if (!meetings || meetings.length === 0) return []

  const hourCounts: { [hour: number]: number } = {}

  meetings.forEach(meeting => {
    const startTime = new Date(meeting.start_time)
    const hour = startTime.getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })

  return Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
}

async function getRecentBookings(roomIds: string[], limit: number): Promise<ActivityFeedItem[]> {
  try {
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id,
        title,
        created_at,
        status,
        users!inner(name),
        rooms!inner(name)
      `)
      .in('room_id', roomIds)
      .order('created_at', { ascending: false })
      .limit(limit)

    return bookings?.map(booking => ({
      id: booking.id,
      type: 'booking',
      title: `New booking: ${booking.title}`,
      description: `${booking.users?.name} booked ${booking.rooms?.name}`,
      timestamp: booking.created_at,
      metadata: { status: booking.status }
    })) || []
  } catch (error) {
    console.error('Error getting recent bookings:', error)
    return []
  }
}

async function getRecentPayments(roomIds: string[], limit: number): Promise<ActivityFeedItem[]> {
  try {
    const { data: payments } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        status,
        paid_at,
        bookings!inner(
          title,
          room_id,
          users!inner(name)
        )
      `)
      .in('bookings.room_id', roomIds)
      .eq('status', 'success')
      .order('paid_at', { ascending: false })
      .limit(limit)

    return payments?.map(payment => ({
      id: payment.id,
      type: 'payment',
      title: `Payment received: GH₵ ${payment.amount?.toFixed(2)}`,
      description: `From ${payment.bookings?.users?.name} for "${payment.bookings?.title}"`,
      timestamp: payment.paid_at || '',
      metadata: { amount: payment.amount }
    })) || []
  } catch (error) {
    console.error('Error getting recent payments:', error)
    return []
  }
}

async function getRecentCheckIns(roomIds: string[], limit: number): Promise<ActivityFeedItem[]> {
  try {
    const { data: checkIns } = await supabase
      .from('check_in_events')
      .select(`
        id,
        event_type,
        performed_at,
        bookings!inner(
          title,
          room_id,
          users!inner(name)
        )
      `)
      .in('bookings.room_id', roomIds)
      .order('performed_at', { ascending: false })
      .limit(limit)

    return checkIns?.map(checkIn => ({
      id: checkIn.id,
      type: 'check-in',
      title: `Meeting ${checkIn.event_type.replace('_', ' ')}`,
      description: `${checkIn.bookings?.users?.name} - "${checkIn.bookings?.title}"`,
      timestamp: checkIn.performed_at,
      metadata: { eventType: checkIn.event_type }
    })) || []
  } catch (error) {
    console.error('Error getting recent check-ins:', error)
    return []
  }
}

async function getRecentIssues(roomIds: string[], limit: number): Promise<ActivityFeedItem[]> {
  try {
    const { data: issues } = await supabase
      .from('room_issues')
      .select(`
        id,
        title,
        status,
        reported_at,
        rooms!inner(name)
      `)
      .in('room_id', roomIds)
      .order('reported_at', { ascending: false })
      .limit(limit)

    return issues?.map(issue => ({
      id: issue.id,
      type: 'issue',
      title: `Room issue: ${issue.title}`,
      description: `${issue.rooms?.name} - Status: ${issue.status}`,
      timestamp: issue.reported_at,
      metadata: { status: issue.status }
    })) || []
  } catch (error) {
    console.error('Error getting recent issues:', error)
    return []
  }
}
