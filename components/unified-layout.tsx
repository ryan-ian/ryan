'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '@/components/unified-sidebar';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';
import { ProtectedRoute } from '@/components/protected-route';
import { getRoleFromPathname } from '@/lib/navigation-config';
import { Menu, X } from 'lucide-react';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  requireAuth?: boolean;
}

export function UnifiedLayout({ 
  children, 
  showHeader = true,
  requireAuth = true
}: UnifiedLayoutProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    // Load sidebar state from localStorage
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null && !isMobile) {
      setSidebarCollapsed(savedState === 'true');
    }
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed));
    }
  }, [sidebarCollapsed, isMobile]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  // Calculate sidebar width for main content margin
  const sidebarWidth = sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64';
  
  // Determine the required role based on pathname
  const currentRole = getRoleFromPathname(pathname || '');
  
  const content = (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <UnifiedSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggleCollapse={toggleSidebar}
        />
      </div>
      
      {/* Mobile Sidebar */}
      {isMobile && (
        <>
          {/* Mobile sidebar toggle button */}
          <button
            onClick={toggleMobileSidebar}
            className="fixed top-4 left-4 z-50 p-2 bg-background border rounded-md shadow-sm lg:hidden"
            aria-label="Toggle sidebar"
          >
            {mobileSidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          
          {/* Mobile sidebar overlay */}
          {mobileSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={toggleMobileSidebar}
              aria-hidden="true"
            />
          )}
          
          {/* Mobile sidebar */}
          <div className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-background transform transition-transform duration-300 ease-in-out lg:hidden",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <UnifiedSidebar />
          </div>
        </>
      )}
      
      {/* Main content */}
      <div className={cn(
        "flex flex-col flex-1 w-full transition-all duration-300",
        sidebarWidth
      )}>
        {showHeader && <Header />}
        <main className="flex-1">
          <div className="container py-6 max-w-7xl mx-auto px-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
  
  // Wrap with ProtectedRoute if authentication is required
  if (requireAuth) {
    return (
      <ProtectedRoute requiredRole={currentRole}>
        {content}
      </ProtectedRoute>
    );
  }
  
  return content;
} 