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

// Scopes for Google Calendar API
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

/**
 * Generate authorization URL for Google OAuth
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate the authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: SCOPES,
      prompt: 'consent', // Force consent screen to get refresh token
      state: session.user.id, // Pass user ID in state parameter
    });

    // Redirect to Google authorization page
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    return NextResponse.json({ error: 'Failed to generate authorization URL' }, { status: 500 });
  }
}

/**
 * Handle callback from Google OAuth
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
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      return NextResponse.json({ error: 'Failed to get tokens' }, { status: 500 });
    }

    // Store tokens in database
    const integration = await storeCalendarIntegration(
      session.user.id,
      'google',
      tokens.access_token,
      tokens.refresh_token,
      new Date(tokens.expiry_date).toISOString()
    );

    if (!integration) {
      return NextResponse.json({ error: 'Failed to store calendar integration' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    return NextResponse.json({ error: 'Failed to process authorization' }, { status: 500 });
  }
} 