'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { navigationConfig, getRoleFromPathname, type NavItem } from '@/lib/navigation-config';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function UnifiedSidebar({ className, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  
  // Determine current role based on pathname or user role
  const currentRole = getRoleFromPathname(pathname || '');
  const navItems = navigationConfig[user?.role || currentRole] || [];

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  if (!user) return null;

  // Function to render nav items
  const renderNavItems = (items: NavItem[]) => {
    return items.map((item) => {
      // Fix: don't treat the root dashboard as active for every nested route
      const isRootDashboard = item.href === '/facility-manager'
      const isActive = pathname === item.href || (!isRootDashboard && pathname?.startsWith(`${item.href}/`))

      return (
        <li key={item.href}>
          {isCollapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-md",
                      isActive
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 font-medium border-l-2 border-emerald-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          )}
        </li>
      );
    });
  };

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  return (
    <aside
      className={cn(
        "fixed top-0 bottom-0 left-0 z-30 flex flex-col border-r bg-background transition-all duration-300",
        sidebarWidth,
        className
      )}
    >
      <div className="flex flex-col h-full">
        <div className={cn(
          "flex items-center border-b p-4",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <>
              <div>
                <h2 className="text-xl font-bold">
                  {currentRole === 'admin' && "Admin"}
                  {currentRole === 'facility_manager' && "Facility"}
                  {currentRole === 'user' && "User"}
                </h2>
                <p className="text-sm text-muted-foreground">Conference Hub</p>
              </div>
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  className="h-8 w-8"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </Button>
              )}
            </>
          )}
          
          {isCollapsed && !isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
          )}
        </div>
        
        <nav className={cn(
          "flex-1 overflow-y-auto py-4",
          isCollapsed ? "px-2" : "px-4"
        )}>
          <ul className="space-y-2">
            {renderNavItems(navItems)}
          </ul>
        </nav>
        
        <div className={cn(
          "border-t p-4",
          isCollapsed ? "flex justify-center" : ""
        )}>
          {isCollapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={logout} className="h-10 w-10">
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Log out</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Log out</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 flex-shrink-0">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
} 