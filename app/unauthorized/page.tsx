'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const handleGoBack = () => {
    router.back();
  };
  
  const handleGoHome = () => {
    if (user?.role === 'admin') {
      router.push('/admin/conference/dashboard');
    } else if (user?.role === 'facility_manager') {
      router.push('/facility-manager');
    } else {
      router.push('/conference-room-booking');
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-yellow-100 p-4 dark:bg-yellow-900/30">
            <AlertTriangle className="h-12 w-12 text-yellow-600 dark:text-yellow-500" />
          </div>
        </div>
        
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Unauthorized Access</h1>
        
        <p className="mb-6 text-muted-foreground">
          You don't have permission to access this page. If you believe this is an error, please contact your administrator.
        </p>
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          <Button variant="outline" onClick={handleGoBack}>
            Go Back
          </Button>
          <Button onClick={handleGoHome}>
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
} 