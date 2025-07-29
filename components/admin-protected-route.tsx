'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // If authentication is complete (not loading) and user is not an admin, redirect
    if (!loading) {
      if (!user) {
        // No user, redirect to login
        router.push('/login');
      } else if (user.role !== 'admin') {
        // User is not an admin, redirect to unauthorized page or home
        router.push('/unauthorized');
      } else {
        // User is an admin, allow access
        setIsAuthorized(true);
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading || !isAuthorized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized as admin
  return <>{children}</>;
}

// Create a similar component for facility manager routes
export function FacilityManagerProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // If authentication is complete (not loading) and user is not a facility manager, redirect
    if (!loading) {
      if (!user) {
        // No user, redirect to login
        router.push('/login');
      } else if (user.role !== 'facility_manager' && user.role !== 'admin') {
        // User is not a facility manager or admin, redirect to unauthorized page or home
        router.push('/unauthorized');
      } else {
        // User is a facility manager or admin, allow access
        setIsAuthorized(true);
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading || !isAuthorized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized as facility manager or admin
  return <>{children}</>;
} 