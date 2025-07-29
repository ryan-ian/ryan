import { NextRequest, NextResponse } from 'next/server';
import { storeCalendarIntegration } from '@/lib/calendar-integration';

/**
 * Handle callback from Microsoft OAuth
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
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID || '',
        client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
        code,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI || '',
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Error exchanging code for tokens:', error);
      return NextResponse.redirect(new URL('/settings?error=token_failure', process.env.NEXT_PUBLIC_APP_URL || ''));
    }

    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token || !tokens.refresh_token || !tokens.expires_in) {
      return NextResponse.redirect(new URL('/settings?error=invalid_tokens', process.env.NEXT_PUBLIC_APP_URL || ''));
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

    // Store tokens in database
    const integration = await storeCalendarIntegration(
      state, // state contains user ID
      'outlook',
      tokens.access_token,
      tokens.refresh_token,
      expiryDate.toISOString()
    );

    if (!integration) {
      return NextResponse.redirect(new URL('/settings?error=storage_failure', process.env.NEXT_PUBLIC_APP_URL || ''));
    }

    // Redirect back to settings page with success message
    return NextResponse.redirect(new URL('/settings?success=outlook_connected', process.env.NEXT_PUBLIC_APP_URL || ''));
  } catch (error) {
    console.error('Error handling Microsoft OAuth callback:', error);
    return NextResponse.redirect(new URL('/settings?error=unknown', process.env.NEXT_PUBLIC_APP_URL || ''));
  }
} 