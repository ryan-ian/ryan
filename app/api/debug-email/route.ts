import { type NextRequest, NextResponse } from "next/server"
import { sendBookingConfirmationEmail, sendBookingRejectionEmail } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    
    console.log(`🧪 [DEBUG EMAIL] Testing ${type} email to: ${email}`)
    
    let result = false
    
    if (type === 'confirmation') {
      result = await sendBookingConfirmationEmail(
        email,
        "Test User",
        "Debug Test Meeting",
        "Debug Room",
        new Date().toISOString(),
        new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      )
    } else if (type === 'rejection') {
      result = await sendBookingRejectionEmail(
        email,
        "Test User", 
        "Debug Test Meeting",
        "Debug Room",
        "Testing rejection email"
      )
    }
    
    console.log(`🧪 [DEBUG EMAIL] Result: ${result}`)
    
    return NextResponse.json({ 
      success: result,
      message: result ? "Email sent successfully" : "Email failed to send",
      type
    })
  } catch (error: any) {
    console.error("❌ [DEBUG EMAIL] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send debug email" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Debug email endpoint. POST with { email, type } where type is 'confirmation' or 'rejection'",
    environmentCheck: {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      SMTP_PORT: process.env.SMTP_PORT || '587',
      SMTP_SECURE: process.env.SMTP_SECURE || 'false'
    }
  })
}