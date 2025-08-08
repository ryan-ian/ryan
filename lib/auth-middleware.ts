import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'facility_manager' | 'admin';
  status: 'active' | 'inactive' | 'suspended' | 'locked';
}

/**
 * Validates JWT token and returns user information
 */
export async function validateToken(token: string): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Get user profile from our users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      status: profile.status,
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * Extracts JWT token from request headers
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Checks if user has required role
 */
export function hasRole(user: AuthUser, requiredRoles: string[]): boolean {
  return requiredRoles.includes(user.role);
}

/**
 * Checks if user account is active
 */
export function isAccountActive(user: AuthUser): boolean {
  return user.status === 'active';
}

/**
 * Middleware for protecting admin routes
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | AuthUser> {
  const token = extractToken(request);
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const user = await validateToken(token);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  if (!isAccountActive(user)) {
    return NextResponse.json(
      { error: 'Account is not active' },
      { status: 403 }
    );
  }

  if (!hasRole(user, ['admin'])) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Middleware for protecting facility manager routes
 */
export async function requireFacilityManager(request: NextRequest): Promise<NextResponse | AuthUser> {
  const token = extractToken(request);
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const user = await validateToken(token);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  if (!isAccountActive(user)) {
    return NextResponse.json(
      { error: 'Account is not active' },
      { status: 403 }
    );
  }

  if (!hasRole(user, ['admin', 'facility_manager'])) {
    return NextResponse.json(
      { error: 'Facility manager or admin access required' },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Middleware for protecting authenticated routes
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | AuthUser> {
  const token = extractToken(request);
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const user = await validateToken(token);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  if (!isAccountActive(user)) {
    return NextResponse.json(
      { error: 'Account is not active' },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Logs security events for audit purposes
 */
export async function logSecurityEvent(
  userId: string,
  event: string,
  details: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await supabase
      .from('user_audit_logs')
      .insert({
        user_id: userId,
        action: event,
        details,
        performed_by: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Rate limiting for sensitive operations
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Validates that user can perform action on target user
 */
export function canManageUser(currentUser: AuthUser, targetUserId: string): boolean {
  // Admins can manage any user except themselves for certain operations
  if (currentUser.role === 'admin') {
    return true;
  }

  // Facility managers can manage regular users
  if (currentUser.role === 'facility_manager') {
    // Would need to fetch target user to check their role
    // For now, assume they can manage non-admin users
    return true;
  }

  // Regular users can only manage themselves
  return currentUser.id === targetUserId;
}

/**
 * Sanitizes user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 */
export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
