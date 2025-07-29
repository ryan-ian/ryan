import { NextRequest, NextResponse } from "next/server"
import { isEmailReady, initEmailService } from "@/lib/email-service"

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking email service status...');
    
    const emailReady = isEmailReady();
    console.log(`📧 Email service ready: ${emailReady}`);
    
    // If not ready, try to initialize
    if (!emailReady) {
      console.log('🔄 Email service not ready, attempting to initialize...');
      const initResult = await initEmailService();
      console.log(`📧 Initialization result: ${initResult}`);
      
      return NextResponse.json({
        ready: initResult,
        message: initResult ? "Email service initialized successfully" : "Email service initialization failed",
        details: {
          transporter: !!initResult,
          configuration: {
            host: process.env.SMTP_HOST ? "SET" : "NOT SET",
            port: process.env.SMTP_PORT ? "SET" : "NOT SET",
            user: process.env.SMTP_USER ? "SET" : "NOT SET",
            password: process.env.SMTP_PASSWORD ? "SET" : "NOT SET",
            fromName: process.env.EMAIL_FROM_NAME ? "SET" : "NOT SET",
            fromAddress: process.env.EMAIL_FROM_ADDRESS ? "SET" : "NOT SET"
          }
        }
      });
    }
    
    return NextResponse.json({
      ready: true,
      message: "Email service is ready",
      details: {
        transporter: true,
        configuration: {
          host: process.env.SMTP_HOST ? "SET" : "NOT SET",
          port: process.env.SMTP_PORT ? "SET" : "NOT SET",
          user: process.env.SMTP_USER ? "SET" : "NOT SET",
          password: process.env.SMTP_PASSWORD ? "SET" : "NOT SET",
          fromName: process.env.EMAIL_FROM_NAME ? "SET" : "NOT SET",
          fromAddress: process.env.EMAIL_FROM_ADDRESS ? "SET" : "NOT SET"
        }
      }
    });
  } catch (error) {
    console.error("❌ Email status check error:", error);
    return NextResponse.json(
      { 
        ready: false, 
        error: "Failed to check email service status",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 