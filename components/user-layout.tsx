'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { ProtectedRoute } from '@/components/protected-route';

interface UserLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function UserLayout({ 
  children, 
  requireAuth = true
}: UserLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  const content = (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-6 max-w-7xl mx-auto px-4 sm:px-6">
          {children}
        </div>
      </main>
    </div>
  );
  
  // Wrap with ProtectedRoute if authentication is required
  if (requireAuth) {
    return (
      <ProtectedRoute requiredRole="user">
        {content}
      </ProtectedRoute>
    );
  }
  
  return content;
}