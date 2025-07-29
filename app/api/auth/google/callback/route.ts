import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { storeCalendarIntegration } from '@/lib/calendar-integration';
import { supabase } from '@/lib/supabase';

// Google OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Handle callback from Google OAuth
 */
export async function GET(request: NextRequest) {
  try {
    // Get code and state from URL parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings?error=missing_params', process.env.NEXT_PUBLIC_APP_URL || ''));
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      return NextResponse.redirect(new URL('/settings?error=token_failure', process.env.NEXT_PUBLIC_APP_URL || ''));
    }

    // Store tokens in database
    const integration = await storeCalendarIntegration(
      state, // state contains user ID
      'google',
      tokens.access_token,
      tokens.refresh_token,
      new Date(tokens.expiry_date).toISOString()
    );

    if (!integration) {
      return NextResponse.redirect(new URL('/settings?error=storage_failure', process.env.NEXT_PUBLIC_APP_URL || ''));
    }

    // Redirect back to settings page with success message
    return NextResponse.redirect(new URL('/settings?success=google_connected', process.env.NEXT_PUBLIC_APP_URL || ''));
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    return NextResponse.redirect(new URL('/settings?error=unknown', process.env.NEXT_PUBLIC_APP_URL || ''));
  }
} 