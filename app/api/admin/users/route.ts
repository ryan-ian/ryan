import { NextRequest, NextResponse } from 'next/server';
import { 
  requireAdmin, 
  logSecurityEvent, 
  checkRateLimit, 
  sanitizeInput,
  isValidEmail,
  isValidPassword 
} from '@/lib/auth-middleware';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  type UserFormData 
} from '@/lib/admin-data';

/**
 * GET /api/admin/users
 * Fetch all users (admin only)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult;

  try {
    // Check rate limit
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`get-users-${user.id}`, 100, 60000)) { // 100 requests per minute
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { users } = await getUsers(1, 1000); // Get up to 1000 users for admin

    // Log the access
    await logSecurityEvent(
      user.id,
      'users_accessed',
      { action: 'fetch_all_users', count: users.length },
      clientIp,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    
    await logSecurityEvent(
      user.id,
      'users_access_failed',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult;

  try {
    // Check rate limit for user creation
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`create-user-${user.id}`, 10, 60000)) { // 10 creations per minute
      return NextResponse.json(
        { error: 'Rate limit exceeded for user creation' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate and sanitize input
    const userData: UserFormData = {
      name: sanitizeInput(body.name || ''),
      email: sanitizeInput(body.email || '').toLowerCase(),
      role: body.role,
      status: body.status || 'active',
      department: body.department ? sanitizeInput(body.department) : undefined,
      position: body.position ? sanitizeInput(body.position) : undefined,
      phone: body.phone ? sanitizeInput(body.phone) : undefined,
      password: body.password,
    };

    // Validation
    const validationErrors: string[] = [];

    if (!userData.name || userData.name.length < 2) {
      validationErrors.push('Name must be at least 2 characters long');
    }

    if (!userData.email || !isValidEmail(userData.email)) {
      validationErrors.push('Valid email address is required');
    }

    if (!['user', 'facility_manager', 'admin'].includes(userData.role)) {
      validationErrors.push('Invalid role specified');
    }

    if (!['active', 'inactive', 'suspended', 'locked'].includes(userData.status)) {
      validationErrors.push('Invalid status specified');
    }

    if (userData.password) {
      const passwordValidation = isValidPassword(userData.password);
      if (!passwordValidation.valid) {
        validationErrors.push(...passwordValidation.errors);
      }
    } else {
      validationErrors.push('Password is required for new users');
    }

    // Additional security check: prevent creating admin users unless current user is admin
    if (userData.role === 'admin' && user.role !== 'admin') {
      validationErrors.push('Only admins can create admin users');
    }

    if (validationErrors.length > 0) {
      await logSecurityEvent(
        user.id,
        'user_creation_failed',
        { 
          errors: validationErrors,
          attempted_email: userData.email,
          attempted_role: userData.role 
        },
        clientIp,
        request.headers.get('user-agent') || undefined
      );

      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Create the user
    const newUser = await createUser(userData);

    // Log successful creation
    await logSecurityEvent(
      user.id,
      'user_created',
      { 
        created_user_id: newUser.id,
        created_user_email: newUser.email,
        created_user_role: newUser.role 
      },
      clientIp,
      request.headers.get('user-agent') || undefined
    );

    // Remove sensitive data from response
    const { ...safeUser } = newUser;
    
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    
    await logSecurityEvent(
      user.id,
      'user_creation_error',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users
 * Update an existing user (admin only)
 */
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult;

  try {
    // Check rate limit
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`update-user-${user.id}`, 20, 60000)) { // 20 updates per minute
      return NextResponse.json(
        { error: 'Rate limit exceeded for user updates' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Sanitize input data
    const sanitizedData: Partial<UserFormData> = {};
    
    if (updateData.name) {
      sanitizedData.name = sanitizeInput(updateData.name);
    }
    
    if (updateData.email) {
      sanitizedData.email = sanitizeInput(updateData.email).toLowerCase();
      if (!isValidEmail(sanitizedData.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    if (updateData.role) {
      if (!['user', 'facility_manager', 'admin'].includes(updateData.role)) {
        return NextResponse.json(
          { error: 'Invalid role specified' },
          { status: 400 }
        );
      }
      sanitizedData.role = updateData.role;
    }

    if (updateData.status) {
      if (!['active', 'inactive', 'suspended', 'locked'].includes(updateData.status)) {
        return NextResponse.json(
          { error: 'Invalid status specified' },
          { status: 400 }
        );
      }
      sanitizedData.status = updateData.status;
    }

    if (updateData.organization) {
      sanitizedData.organization = sanitizeInput(updateData.organization);
    }

    if (updateData.position) {
      sanitizedData.position = sanitizeInput(updateData.position);
    }

    if (updateData.phone) {
      sanitizedData.phone = sanitizeInput(updateData.phone);
    }

    // Security check: prevent self-demotion from admin
    if (userId === user.id && updateData.role && updateData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot change your own admin role' },
        { status: 403 }
      );
    }

    // Update the user
    const updatedUser = await updateUser(userId, sanitizedData);

    // Log the update
    await logSecurityEvent(
      user.id,
      'user_updated',
      { 
        updated_user_id: userId,
        changes: sanitizedData 
      },
      clientIp,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    
    await logSecurityEvent(
      user.id,
      'user_update_error',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users
 * Delete a user (admin only)
 */
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult;

  try {
    // Check rate limit for deletions
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`delete-user-${user.id}`, 5, 60000)) { // 5 deletions per minute
      return NextResponse.json(
        { error: 'Rate limit exceeded for user deletions' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Security check: prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }

    // Delete the user
    await deleteUser(userId, user.id);

    // Log the deletion
    await logSecurityEvent(
      user.id,
      'user_deleted',
      { deleted_user_id: userId },
      clientIp,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    
    await logSecurityEvent(
      user.id,
      'user_deletion_error',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
