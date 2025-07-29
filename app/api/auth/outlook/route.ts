import { NextRequest, NextResponse } from 'next/server';
import { storeCalendarIntegration } from '@/lib/calendar-integration';
import { supabase } from '@/lib/supabase';

// Microsoft Graph API scopes
const SCOPES = ['Calendars.ReadWrite', 'offline_access'];

/**
 * Generate authorization URL for Microsoft OAuth
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Microsoft OAuth parameters
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI;
    const state = session.user.id; // Pass user ID in state parameter

    // Generate the authorization URL
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.append('client_id', clientId || '');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri || '');
    authUrl.searchParams.append('scope', SCOPES.join(' '));
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('prompt', 'consent');

    // Return the authorization URL
    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('Error generating Microsoft auth URL:', error);
    return NextResponse.json({ error: 'Failed to generate authorization URL' }, { status: 500 });
  }
}

/**
 * Handle callback from Microsoft OAuth
 */
export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();
    
    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state parameter' }, { status: 400 });
    }

    // Get the session to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify state matches user ID
    if (state !== session.user.id) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
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
      return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 500 });
    }

    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token || !tokens.refresh_token || !tokens.expires_in) {
      return NextResponse.json({ error: 'Invalid token response' }, { status: 500 });
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

    // Store tokens in database
    const integration = await storeCalendarIntegration(
      session.user.id,
      'outlook',
      tokens.access_token,
      tokens.refresh_token,
      expiryDate.toISOString()
    );

    if (!integration) {
      return NextResponse.json({ error: 'Failed to store calendar integration' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling Microsoft OAuth callback:', error);
    return NextResponse.json({ error: 'Failed to process authorization' }, { status: 500 });
  }
} 