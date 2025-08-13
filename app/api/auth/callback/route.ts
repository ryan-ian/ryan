import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/auth/verify-success'

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(new URL('/auth/verify-success?error=invalid_code', request.url))
      }

      if (data.session) {
        // Successful verification - redirect to success page
        return NextResponse.redirect(new URL('/auth/verify-success', request.url))
      }
    } catch (error) {
      console.error('Exception in auth callback:', error)
      return NextResponse.redirect(new URL('/auth/verify-success?error=server_error', request.url))
    }
  }

  // If no code or other issues, redirect to error state
  return NextResponse.redirect(new URL('/auth/verify-success?error=missing_code', request.url))
}
