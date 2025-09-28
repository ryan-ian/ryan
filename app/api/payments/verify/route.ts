import { type NextRequest, NextResponse } from "next/server"
import { supabase, createAdminClient } from "@/lib/supabase"
import { paystackAPI } from "@/lib/paystack-api"
import { sendBookingRequestSubmittedEmail, sendBookingCreationNotificationToManager } from "@/lib/email-service"
// REMOVED: Duplicate notification imports
// Booking notifications are now handled automatically by Supabase database triggers
import { getRoomById, getUserById } from "@/lib/supabase-data"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid authorization" }, { status: 401 })
    }

    const { reference } = await request.json()

    if (!reference) {
      return NextResponse.json({
        error: "Payment reference is required"
      }, { status: 400 })
    }

    console.log("🔍 Verifying payment:", reference)

    // Verify payment with Paystack
    const paystackVerification = await paystackAPI.verifyPayment(reference)

    if (!paystackVerification.status) {
      console.error("❌ Paystack verification failed:", paystackVerification)
      return NextResponse.json({
        error: "Payment verification failed"
      }, { status: 400 })
    }

    const paymentData = paystackVerification.data
    const isPaymentSuccessful = paymentData.status === 'success'

    console.log("✅ Paystack verification result:", {
      reference,
      status: paymentData.status,
      amount: paymentData.amount,
      successful: isPaymentSuccessful
    })

    // Get admin client for database operations
    const adminClient = createAdminClient()

    // Find the payment record
    const { data: paymentRecord, error: paymentFindError } = await adminClient
      .from('payments')
      .select('*')
      .eq('paystack_reference', reference)
      .single()

    if (paymentFindError || !paymentRecord) {
      console.error("❌ Payment record not found:", paymentFindError)
      return NextResponse.json({
        error: "Payment record not found"
      }, { status: 404 })
    }

    // Extract temporary booking data from payment record
    console.log("🔍 Payment record structure:", {
      id: paymentRecord.id,
      paystack_reference: paymentRecord.paystack_reference,
      paystack_response_keys: paymentRecord.paystack_response ? Object.keys(paymentRecord.paystack_response) : 'null',
      has_temp_booking_data: !!paymentRecord.paystack_response?.temp_booking_data
    })

    let tempBookingData = paymentRecord.paystack_response?.temp_booking_data

    // Fallback: Check if temp_booking_data is nested under paystack_data (for backward compatibility)
    if (!tempBookingData && paymentRecord.paystack_response?.paystack_data) {
      console.log("🔄 Checking for temp_booking_data in paystack_data structure")
      tempBookingData = paymentRecord.paystack_response.paystack_data.temp_booking_data
    }

    // Additional fallback: Check if the data is directly in paystack_response (old structure)
    if (!tempBookingData && paymentRecord.paystack_response) {
      console.log("🔄 Checking for temp_booking_data in direct paystack_response")
      // Look for booking data fields directly in the response
      const response = paymentRecord.paystack_response
      if (response.room_id && response.user_id && response.start_time) {
        console.log("🔄 Found booking data directly in paystack_response")
        tempBookingData = response
      }
    }

    if (!tempBookingData) {
      console.error("❌ Temporary booking data not found in payment record")
      console.error("❌ Full paystack_response:", JSON.stringify(paymentRecord.paystack_response, null, 2))
      return NextResponse.json({
        error: "Booking data not found"
      }, { status: 404 })
    }

    // Validate that we have all required booking data fields
    const requiredFields = ['room_id', 'user_id', 'title', 'start_time', 'end_time', 'total_cost']
    const missingFields = requiredFields.filter(field => !tempBookingData[field])

    if (missingFields.length > 0) {
      console.error("❌ Missing required booking data fields:", missingFields)
      console.error("❌ Available fields:", Object.keys(tempBookingData))
      return NextResponse.json({
        error: `Incomplete booking data. Missing: ${missingFields.join(', ')}`
      }, { status: 400 })
    }

    console.log("📦 Retrieved temporary booking data:", {
      reference,
      bookingData: {
        room_id: tempBookingData.room_id,
        user_id: tempBookingData.user_id,
        title: tempBookingData.title,
        start_time: tempBookingData.start_time,
        end_time: tempBookingData.end_time,
        total_cost: tempBookingData.total_cost
      }
    })

    // Update payment record with verification results
    const { error: paymentUpdateError } = await adminClient
      .from('payments')
      .update({
        status: isPaymentSuccessful ? 'success' : 'failed',
        payment_method: paymentData.channel,
        mobile_network: paymentData.authorization?.channel === 'mobile_money'
          ? paymentData.authorization?.mobile_money?.network
          : null,
        mobile_number: paymentData.authorization?.channel === 'mobile_money'
          ? paymentData.authorization?.mobile_money?.number
          : null,
        paystack_response: paystackVerification,
        paid_at: isPaymentSuccessful ? new Date().toISOString() : null
      })
      .eq('id', paymentRecord.id)

    if (paymentUpdateError) {
      console.error("❌ Error updating payment record:", paymentUpdateError)
      return NextResponse.json({
        error: "Failed to update payment record"
      }, { status: 500 })
    }

    if (isPaymentSuccessful) {
      // Payment successful - create the actual booking record
      console.log("🎉 Payment successful, creating booking record...")

      const { data: newBooking, error: bookingCreateError } = await adminClient
        .from('bookings')
        .insert({
          room_id: tempBookingData.room_id,
          user_id: tempBookingData.user_id,
          title: tempBookingData.title,
          description: tempBookingData.description,
          start_time: tempBookingData.start_time,
          end_time: tempBookingData.end_time,
          status: 'pending', // Use allowed status for admin approval
          payment_status: 'paid',
          payment_date: new Date().toISOString(),
          payment_method: paymentData.channel,
          payment_id: paymentRecord.id,
          total_cost: tempBookingData.total_cost,
          payment_reference: tempBookingData.payment_reference,
          paystack_reference: tempBookingData.paystack_reference,
          payment_expires_at: tempBookingData.payment_expires_at
        })
        .select()
        .single()

      if (bookingCreateError) {
        console.error("❌ Error creating booking record:", bookingCreateError)
        return NextResponse.json({
          error: "Failed to create booking record"
        }, { status: 500 })
      }

      // Update payment record with the booking_id
      const { error: paymentLinkError } = await adminClient
        .from('payments')
        .update({ booking_id: newBooking.id })
        .eq('id', paymentRecord.id)

      if (paymentLinkError) {
        console.error("⚠️ Error linking payment to booking:", paymentLinkError)
        // Don't fail the request for this
      }

      console.log("✅ Booking created successfully:", {
        bookingId: newBooking.id,
        paymentReference: reference
      })

      // Use the newly created booking for the rest of the process
      const booking = newBooking

      // Get room and user details for notifications
      const room = await getRoomById(booking.room_id)
      const userDetails = await getUserById(booking.user_id)

      if (room && userDetails) {
        try {
          // Send email notifications
          console.log("📧 Preparing to send booking request email:", {
            userEmail: userDetails.email,
            userName: userDetails.name,
            bookingTitle: booking.title,
            roomName: room.name,
            startTime: booking.start_time,
            endTime: booking.end_time
          })

          await sendBookingRequestSubmittedEmail(
            userDetails.email,
            userDetails.name || userDetails.email,
            booking.title,
            room.name,
            booking.start_time,
            booking.end_time
          )

          // Send notification to facility manager
          console.log(`🔍 [PAYMENT VERIFY] Fetching facility manager for room ${room.id}`)

          // Use the separate facility manager lookup module
          const { getFacilityManagerByRoomId } = await import("@/lib/facility-manager-lookup")
          console.log(`🧪 [PAYMENT VERIFY] Function type:`, typeof getFacilityManagerByRoomId)

          const facilityManager = await getFacilityManagerByRoomId(room.id)

          if (facilityManager && facilityManager.email && facilityManager.name) {
            console.log(`📧 [PAYMENT VERIFY] Sending facility manager email to ${facilityManager.email}`)
            await sendBookingCreationNotificationToManager(
              facilityManager.email,
              facilityManager.name,
              userDetails.name || 'Unknown User',
              userDetails.email || 'unknown@email.com',
              booking.title,
              room.name,
              facilityManager.facilityName,
              booking.start_time,
              booking.end_time
            )
            // NOTE: Facility manager notification is now handled automatically by Supabase database trigger
            // when booking is inserted with 'pending' status
          } else {
            console.warn(`⚠️ [PAYMENT VERIFY] Cannot send facility manager email - manager not found or missing email/name for room ${room.id}`)
          }

          // NOTE: Admin notifications are now handled automatically by Supabase database trigger
          // when booking is inserted with 'pending' status

        } catch (notificationError) {
          console.error("⚠️ Error sending notifications:", notificationError)
          // Don't fail the payment verification if notifications fail
        }
      }

      console.log("🎉 Payment verified and booking finalized:", {
        bookingId: booking.id,
        paymentReference: reference,
        amount: paymentData.amount / 100 // Convert from kobo to GHS
      })

      return NextResponse.json({
        success: true,
        payment: {
          status: 'success',
          reference,
          amount: paymentData.amount / 100,
          currency: paymentData.currency,
          channel: paymentData.channel,
          paid_at: paymentData.paid_at
        },
        booking: {
          id: booking.id,
          status: 'pending',
          payment_status: 'paid',
          title: booking.title,
          room_name: room?.name,
          start_time: booking.start_time,
          end_time: booking.end_time,
          total_cost: booking.total_cost
        },
        message: "Payment successful! Your booking request has been submitted for approval."
      })

    } else {
      // Payment failed - clean up temporary data
      console.log("❌ Payment verification failed:", {
        reference,
        status: paymentData.status,
        tempDataCleanup: true
      })

      // Clean up the temporary data from payment record
      const { error: cleanupError } = await adminClient
        .from('payments')
        .update({
          paystack_response: {
            ...paymentRecord.paystack_response,
            temp_booking_data: null // Remove temporary data
          }
        })
        .eq('id', paymentRecord.id)

      if (cleanupError) {
        console.error("⚠️ Error cleaning up temporary data:", cleanupError)
      }

      return NextResponse.json({
        success: false,
        payment: {
          status: 'failed',
          reference,
          amount: paymentData.amount / 100,
          currency: paymentData.currency
        },
        booking: {
          id: null,
          status: 'failed',
          payment_status: 'failed',
          title: tempBookingData.title,
          room_name: tempBookingData.room_name,
          start_time: tempBookingData.start_time,
          end_time: tempBookingData.end_time,
          total_cost: tempBookingData.total_cost
        },
        message: "Payment verification failed. Please try again."
      })
    }

  } catch (error) {
    console.error("❌ Payment verification error:", error)
    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 })
  }
}