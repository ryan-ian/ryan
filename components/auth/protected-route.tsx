'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useAuthorization, type Permission, type Role } from '@/hooks/use-authorization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Lock,
  ArrowLeft,
  Home,
} from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: Permission[];
  requiredRoles?: Role[];
  requireAnyPermission?: boolean; // If true, user needs ANY of the permissions, not ALL
  requireAnyRole?: boolean; // If true, user needs ANY of the roles, not ALL
  fallbackPath?: string;
  showFallback?: boolean;
  customFallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAnyPermission = false,
  requireAnyRole = false,
  fallbackPath = '/conference-room-booking',
  showFallback = true,
  customFallback,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
  } = useAuthorization();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requireAnyRole 
      ? hasAnyRole(requiredRoles)
      : requiredRoles.every(role => hasRole(role));

    if (!hasRequiredRole) {
      if (!showFallback) {
        router.push(fallbackPath);
        return null;
      }

      if (customFallback) {
        return <>{customFallback}</>;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-orange-800 dark:text-orange-400">
                Insufficient Privileges
              </CardTitle>
              <CardDescription>
                You don't have the required role to access this area.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Required Role(s): <strong>{requiredRoles.join(', ')}</strong>
                  <br />
                  Your Role: <strong>{user.role}</strong>
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push(fallbackPath)} className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="outline" onClick={() => router.back()} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAnyPermission
      ? hasAnyPermission(requiredPermissions)
      : hasAllPermissions(requiredPermissions);

    if (!hasRequiredPermissions) {
      if (!showFallback) {
        router.push(fallbackPath);
        return null;
      }

      if (customFallback) {
        return <>{customFallback}</>;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-red-800 dark:text-red-400">
                Access Denied
              </CardTitle>
              <CardDescription>
                You don't have the required permissions to access this area.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Required Permission(s): <strong>{requiredPermissions.join(', ')}</strong>
                  <br />
                  Contact your administrator if you believe you should have access.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push(fallbackPath)} className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="outline" onClick={() => router.back()} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Convenience components for common protection patterns
export function AdminOnlyRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute requiredRoles={['admin']} {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function FacilityManagerRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute requiredRoles={['admin', 'facility_manager']} requireAnyRole={true} {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function UserManagementRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredPermissions'>) {
  return (
    <ProtectedRoute requiredPermissions={['users.view']} {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function AuditLogsRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredPermissions'>) {
  return (
    <ProtectedRoute requiredPermissions={['audit_logs.view']} {...props}>
      {children}
    </ProtectedRoute>
  );
}
