export type CalendarProvider = 'google' | 'outlook' | 'none';

export interface CalendarIntegration {
  id: string;
  user_id: string;
  provider: CalendarProvider;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  calendar_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  booking_id: string;
  user_id: string;
  provider: CalendarProvider;
  event_id: string;
  created_at: string;
  updated_at: string;
} 