import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { PAYSTACK_CONFIG } from "@/lib/paystack-config"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    if (!signature) {
      console.error("❌ Missing Paystack signature")
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      console.error("❌ Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Parse the webhook payload
    const event = JSON.parse(body)
    console.log("📨 Paystack webhook received:", {
      event: event.event,
      reference: event.data?.reference
    })

    // Handle different webhook events
    switch (event.event) {
      case 'charge.success':
        await handlePaymentSuccess(event.data)
        break
      
      case 'charge.failed':
        await handlePaymentFailed(event.data)
        break
      
      case 'charge.abandoned':
        await handlePaymentAbandoned(event.data)
        break
      
      default:
        console.log("ℹ️ Unhandled webhook event:", event.event)
    }

    return NextResponse.json({ status: "success" })

  } catch (error) {
    console.error("❌ Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handlePaymentSuccess(data: any) {
  try {
    const reference = data.reference
    console.log("🎉 Processing successful payment webhook:", reference)

    const adminClient = createAdminClient()

    // Update payment record
    const { error: paymentError } = await adminClient
      .from('payments')
      .update({
        status: 'success',
        payment_method: data.channel,
        mobile_network: data.authorization?.channel === 'mobile_money' 
          ? data.authorization?.mobile_money?.network 
          : null,
        mobile_number: data.authorization?.channel === 'mobile_money' 
          ? data.authorization?.mobile_money?.number 
          : null,
        paid_at: new Date().toISOString()
      })
      .eq('paystack_reference', reference)

    if (paymentError) {
      console.error("❌ Error updating payment record:", paymentError)
      return
    }

    // Update booking status
    const { error: bookingError } = await adminClient
      .from('bookings')
      .update({
        status: 'pending',
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
        payment_method: data.channel
      })
      .eq('paystack_reference', reference)

    if (bookingError) {
      console.error("❌ Error updating booking record:", bookingError)
      return
    }

    console.log("✅ Payment success webhook processed:", reference)

  } catch (error) {
    console.error("❌ Error handling payment success:", error)
  }
}

async function handlePaymentFailed(data: any) {
  try {
    const reference = data.reference
    console.log("❌ Processing failed payment webhook:", reference)

    const adminClient = createAdminClient()

    // Update payment record
    const { error: paymentError } = await adminClient
      .from('payments')
      .update({
        status: 'failed'
      })
      .eq('paystack_reference', reference)

    if (paymentError) {
      console.error("❌ Error updating payment record:", paymentError)
      return
    }

    // Update booking status
    const { error: bookingError } = await adminClient
      .from('bookings')
      .update({
        status: 'cancelled',
        payment_status: 'failed'
      })
      .eq('paystack_reference', reference)

    if (bookingError) {
      console.error("❌ Error updating booking record:", bookingError)
      return
    }

    console.log("✅ Payment failed webhook processed:", reference)

  } catch (error) {
    console.error("❌ Error handling payment failure:", error)
  }
}

async function handlePaymentAbandoned(data: any) {
  try {
    const reference = data.reference
    console.log("⚠️ Processing abandoned payment webhook:", reference)

    const adminClient = createAdminClient()

    // Update payment record
    const { error: paymentError } = await adminClient
      .from('payments')
      .update({
        status: 'abandoned'
      })
      .eq('paystack_reference', reference)

    if (paymentError) {
      console.error("❌ Error updating payment record:", paymentError)
      return
    }

    // Update booking status
    const { error: bookingError } = await adminClient
      .from('bookings')
      .update({
        status: 'cancelled',
        payment_status: 'abandoned'
      })
      .eq('paystack_reference', reference)

    if (bookingError) {
      console.error("❌ Error updating booking record:", bookingError)
      return
    }

    console.log("✅ Payment abandoned webhook processed:", reference)

  } catch (error) {
    console.error("❌ Error handling payment abandonment:", error)
  }
}
