import { type NextRequest, NextResponse } from "next/server"
import { supabase, createAdminClient } from "@/lib/supabase"
import { paystackAPI } from "@/lib/paystack-api"
import {
  calculateBookingAmount,
  generatePaymentReference,
  getPaymentExpiryTime,
  validatePaymentAmount,
  createPaymentMetadata
} from "@/lib/payment-utils"
import { getRoomById, getUserById } from "@/lib/supabase-data"

export async function POST(request: NextRequest) {
  console.log("🚀 Payment initialization API called")

  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      console.log("❌ No authorization token provided")
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    console.log("🔐 Verifying authentication token...")
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.log("❌ Authentication failed:", authError)
      return NextResponse.json({ error: "Invalid authorization" }, { status: 401 })
    }

    console.log("✅ User authenticated:", user.email)

    const requestData = await request.json()
    console.log("📊 Payment initialization request:", requestData)

    // Validate required fields
    const { room_id, start_time, end_time, title, description, state_id } = requestData

    if (!room_id || !start_time || !end_time || !title) {
      return NextResponse.json({
        error: "Missing required fields: room_id, start_time, end_time, title"
      }, { status: 400 })
    }

    // Get room details including pricing
    const room = await getRoomById(room_id)
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (room.status !== "available") {
      return NextResponse.json({ error: "Room not available" }, { status: 400 })
    }

    // Check if room has pricing configured
    if (!room.hourly_rate || room.hourly_rate <= 0) {
      return NextResponse.json({
        error: "Room pricing not configured"
      }, { status: 400 })
    }

    // Get user details
    const userDetails = await getUserById(user.id)
    if (!userDetails) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Parse and validate times
    const startDateTime = new Date(start_time)
    const endDateTime = new Date(end_time)

    if (startDateTime >= endDateTime) {
      return NextResponse.json({
        error: "End time must be after start time"
      }, { status: 400 })
    }

    if (startDateTime < new Date()) {
      return NextResponse.json({
        error: "Cannot book rooms in the past"
      }, { status: 400 })
    }

    // Calculate payment amount
    const paymentCalculation = calculateBookingAmount(
      startDateTime,
      endDateTime,
      room.hourly_rate
    )

    // Validate payment amount
    const amountValidation = validatePaymentAmount(paymentCalculation.totalAmount)
    if (!amountValidation.isValid) {
      return NextResponse.json({
        error: amountValidation.error
      }, { status: 400 })
    }

    // Generate payment reference
    const paymentReference = generatePaymentReference()
    const expiresAt = getPaymentExpiryTime()

    // Create payment metadata
    const metadata = createPaymentMetadata({
      roomId: room.id,
      roomName: room.name,
      userId: user.id,
      userName: userDetails.name || userDetails.email,
      userEmail: userDetails.email,
      startTime: startDateTime,
      endTime: endDateTime,
      title
    })

    // Build callback URL with state restoration parameters
    const baseCallbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`
    const callbackUrl = state_id
      ? `${baseCallbackUrl}?state_id=${state_id}&return_to=booking_modal`
      : baseCallbackUrl

    // Initialize payment with Paystack
    const paystackResponse = await paystackAPI.initializePayment({
      email: userDetails.email,
      amount: paymentCalculation.totalAmount,
      reference: paymentReference,
      callback_url: callbackUrl,
      metadata: {
        ...metadata,
        state_id: state_id || null,
        flow_type: 'redirect'
      }
    })

    if (!paystackResponse.status) {
      console.error("Paystack initialization failed:", paystackResponse)
      return NextResponse.json({
        error: "Payment initialization failed"
      }, { status: 500 })
    }

    // Get admin client for database operations
    const adminClient = createAdminClient()

    // Store booking data as JSON temporarily (will be finalized after payment)
    // This avoids database constraint violations since we don't create the booking record yet
    const tempBookingData = {
      room_id,
      user_id: user.id,
      title,
      description: description || null,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      total_cost: paymentCalculation.totalAmount,
      payment_status: 'pending',
      payment_reference: paymentReference,
      paystack_reference: paymentReference,
      payment_expires_at: expiresAt.toISOString(),
      room_name: room.name,
      user_name: userDetails.name || userDetails.email,
      user_email: userDetails.email,
      duration_hours: paymentCalculation.durationHours
    }

    console.log("📦 Storing temporary booking data as JSON:", {
      paymentReference,
      bookingData: tempBookingData
    })

    console.log("🔍 Paystack response structure:", {
      status: paystackResponse.status,
      message: paystackResponse.message,
      data_keys: paystackResponse.data ? Object.keys(paystackResponse.data) : 'null'
    })

    // Create payment record with booking data stored as JSON in metadata
    const { data: paymentRecord, error: paymentError } = await adminClient
      .from('payments')
      .insert({
        booking_id: null, // Will be set after booking creation
        paystack_reference: paymentReference,
        amount: paymentCalculation.totalAmount,
        currency: paymentCalculation.currency,
        status: 'pending',
        paystack_response: {
          paystack_data: paystackResponse, // Store Paystack response separately
          temp_booking_data: tempBookingData // Store booking data in payment record
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (paymentError) {
      console.error("❌ Error creating payment record:", paymentError)
      return NextResponse.json({
        error: "Failed to create payment record"
      }, { status: 500 })
    }

    console.log("✅ Payment record created successfully:", {
      paymentId: paymentRecord.id,
      paymentReference: paymentRecord.paystack_reference,
      paystack_response_keys: paymentRecord.paystack_response ? Object.keys(paymentRecord.paystack_response) : 'null',
      has_temp_booking_data: !!paymentRecord.paystack_response?.temp_booking_data
    })

    console.log("✅ Payment initialized successfully:", {
      paymentReference,
      paymentId: paymentRecord.id,
      amount: paymentCalculation.totalAmount,
      tempDataStored: true
    })

    // Return payment initialization response
    return NextResponse.json({
      success: true,
      payment: {
        reference: paymentReference,
        authorization_url: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code,
        amount: paymentCalculation.totalAmount,
        currency: paymentCalculation.currency,
        expires_at: expiresAt.toISOString()
      },
      booking: {
        id: null, // Will be created after payment verification
        room_name: room.name,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        duration_hours: paymentCalculation.durationHours,
        total_cost: paymentCalculation.totalAmount,
        temp_data_stored: true
      }
    })

  } catch (error) {
    console.error("Payment initialization error:", error)
    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 })
  }
}