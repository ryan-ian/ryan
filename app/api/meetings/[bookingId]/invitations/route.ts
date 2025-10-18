import { NextRequest, NextResponse } from 'next/server'

interface Invitee {
  name: string
  email: string
}

interface RequestBody {
  invitees: Invitee[]
}

/**
 * Send meeting invitations to multiple attendees
 * POST /api/meetings/[bookingId]/invitations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params
    const body = await request.json()
    const { invitees }: RequestBody = body

    if (!invitees || !Array.isArray(invitees) || invitees.length === 0) {
      return NextResponse.json(
        { error: 'Invitees array is required' },
        { status: 400 }
      )
    }

    // Validate invitee structure
    for (const invitee of invitees) {
      if (!invitee.name || !invitee.email) {
        return NextResponse.json(
          { error: 'Each invitee must have name and email' },
          { status: 400 }
        )
      }
    }

    // Call Edge Function
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-meeting-invitations`
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        booking_id: bookingId,
        invitees: invitees,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Edge function failed:', result)
      return NextResponse.json(
        { error: result.error || 'Failed to send invitations' },
        { status: response.status }
      )
    }

    console.log(`✅ Invitations sent via Edge Function:`, result.summary)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error sending invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
