'use client';

import { useAuth } from '@/contexts/auth-context';
import { useMemo } from 'react';

export type Permission = 
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.suspend'
  | 'users.lock'
  | 'users.manage_roles'
  | 'rooms.view'
  | 'rooms.create'
  | 'rooms.edit'
  | 'rooms.delete'
  | 'bookings.view_all'
  | 'bookings.manage_all'
  | 'audit_logs.view'
  | 'system.admin';

export type Role = 'user' | 'facility_manager' | 'admin';

// Define role-based permissions
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  user: [
    'rooms.view',
  ],
  facility_manager: [
    'users.view',
    'users.create',
    'users.edit',
    'rooms.view',
    'rooms.create',
    'rooms.edit',
    'rooms.delete',
    'bookings.view_all',
    'bookings.manage_all',
  ],
  admin: [
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'users.suspend',
    'users.lock',
    'users.manage_roles',
    'rooms.view',
    'rooms.create',
    'rooms.edit',
    'rooms.delete',
    'bookings.view_all',
    'bookings.manage_all',
    'audit_logs.view',
    'system.admin',
  ],
};

export function useAuthorization() {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  }, [user]);

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(permission => hasPermission(permission));
  };

  const hasRole = (role: Role): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: Role[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  const isFacilityManager = (): boolean => {
    return hasRole('facility_manager');
  };

  const isUser = (): boolean => {
    return hasRole('user');
  };

  const canManageUsers = (): boolean => {
    return hasPermission('users.edit') || hasPermission('users.delete');
  };

  const canManageRooms = (): boolean => {
    return hasPermission('rooms.create') || hasPermission('rooms.edit') || hasPermission('rooms.delete');
  };

  const canViewAuditLogs = (): boolean => {
    return hasPermission('audit_logs.view');
  };

  const canSuspendUsers = (): boolean => {
    return hasPermission('users.suspend');
  };

  const canLockUsers = (): boolean => {
    return hasPermission('users.lock');
  };

  const canManageUserRoles = (): boolean => {
    return hasPermission('users.manage_roles');
  };

  const canDeleteUsers = (): boolean => {
    return hasPermission('users.delete');
  };

  const canCreateUsers = (): boolean => {
    return hasPermission('users.create');
  };

  const canViewAllBookings = (): boolean => {
    return hasPermission('bookings.view_all');
  };

  const canManageAllBookings = (): boolean => {
    return hasPermission('bookings.manage_all');
  };



  const getUserRole = (): Role | null => {
    return user?.role || null;
  };

  const getUserPermissions = (): Permission[] => {
    return permissions;
  };

  // Security helpers
  const canAccessAdminPanel = (): boolean => {
    return hasAnyRole(['admin', 'facility_manager']);
  };

  const canAccessUserManagement = (): boolean => {
    return hasPermission('users.view');
  };

  const canAccessRoomManagement = (): boolean => {
    return hasPermission('rooms.view');
  };

  const canPerformBulkUserActions = (): boolean => {
    return hasAnyPermission(['users.edit', 'users.delete', 'users.suspend']);
  };

  const canViewUserDetails = (targetUserId?: string): boolean => {
    if (!user) return false;

    // Admins can view any user
    if (isAdmin()) return true;

    // Facility managers can view users (with some restrictions)
    if (isFacilityManager()) return true;

    // Users can only view their own details
    return targetUserId === user.id;
  };

  const canEditUser = (targetUserId?: string): boolean => {
    if (!user) return false;

    // Admins can edit any user except they can't demote themselves
    if (isAdmin()) return true;

    // Facility managers can edit regular users
    if (isFacilityManager() && hasPermission('users.edit')) return true;

    // Users can edit their own profile (limited fields)
    return targetUserId === user.id;
  };

  const canDeleteUser = (targetUserId?: string): boolean => {
    if (!user) return false;

    // Can't delete yourself
    if (targetUserId === user.id) return false;

    // Only admins can delete users
    return isAdmin() && hasPermission('users.delete');
  };

  const canSuspendUser = (targetUserId?: string): boolean => {
    if (!user) return false;

    // Can't suspend yourself
    if (targetUserId === user.id) return false;

    // Only admins can suspend users
    return isAdmin() && hasPermission('users.suspend');
  };

  const canLockUser = (targetUserId?: string): boolean => {
    if (!user) return false;

    // Can't lock yourself
    if (targetUserId === user.id) return false;

    // Only admins can lock users
    return isAdmin() && hasPermission('users.lock');
  };

  const canChangeUserRole = (targetUserId?: string, newRole?: Role): boolean => {
    if (!user) return false;

    // Can't change your own role
    if (targetUserId === user.id) return false;

    // Only admins can change roles
    if (!isAdmin() || !hasPermission('users.manage_roles')) return false;

    // Additional check: can't promote someone to admin unless you're admin
    if (newRole === 'admin' && !isAdmin()) return false;

    return true;
  };

  return {
    // Basic permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    
    // Role checks
    isAdmin,
    isFacilityManager,
    isUser,
    
    // Feature-specific checks
    canManageUsers,
    canManageRooms,
    canViewAuditLogs,
    canSuspendUsers,
    canLockUsers,
    canManageUserRoles,
    canDeleteUsers,
    canCreateUsers,
    canViewAllBookings,
    canManageAllBookings,
    
    // User info
    getUserRole,
    getUserPermissions,
    
    // High-level access checks
    canAccessAdminPanel,
    canAccessUserManagement,
    canAccessRoomManagement,
    canPerformBulkUserActions,
    
    // User-specific checks
    canViewUserDetails,
    canEditUser,
    canDeleteUser,
    canSuspendUser,
    canLockUser,
    canChangeUserRole,
  };
}
