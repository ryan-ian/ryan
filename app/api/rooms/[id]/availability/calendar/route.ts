import { NextRequest, NextResponse } from 'next/server'
import { getCalendarRestrictions } from '@/lib/calendar-availability'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params
    const { searchParams } = new URL(request.url)
    
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    
    // Validate month parameter (0-11 for JavaScript Date months)
    if (month < 0 || month > 11) {
      return NextResponse.json(
        { error: 'Invalid month parameter. Must be 0-11.' },
        { status: 400 }
      )
    }
    
    // Validate year parameter
    if (year < 2020 || year > 2030) {
      return NextResponse.json(
        { error: 'Invalid year parameter. Must be between 2020-2030.' },
        { status: 400 }
      )
    }
    
    console.log(`📅 Fetching calendar restrictions for room ${roomId}, month ${month + 1}/${year}`)
    
    const restrictions = await getCalendarRestrictions(roomId, month, year)
    
    return NextResponse.json(restrictions)
    
  } catch (error) {
    console.error('Error fetching calendar restrictions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar restrictions' },
      { status: 500 }
    )
  }
}

