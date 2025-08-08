'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Lock, 
  Clock,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserStatusBadgeProps {
  status: 'active' | 'inactive' | 'suspended' | 'locked';
  role: 'user' | 'facility_manager' | 'admin';
  suspendedUntil?: string;
  lockedUntil?: string;
  suspensionReason?: string;
  className?: string;
  showRole?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function UserStatusBadge({ 
  status, 
  role,
  suspendedUntil, 
  lockedUntil, 
  suspensionReason,
  className,
  showRole = false,
  size = 'md'
}: UserStatusBadgeProps) {
  const getStatusConfig = () => {
    const now = new Date();
    
    // Check if suspension/lock has expired
    const isSuspensionExpired = suspendedUntil && isAfter(now, new Date(suspendedUntil));
    const isLockExpired = lockedUntil && isAfter(now, new Date(lockedUntil));
    
    switch (status) {
      case 'active':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
          icon: CheckCircle,
          label: 'Active',
          tooltip: 'User account is active and can access the system',
        };
      
      case 'inactive':
        return {
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
          icon: XCircle,
          label: 'Inactive',
          tooltip: 'User account is inactive and cannot access the system',
        };
      
      case 'suspended':
        return {
          variant: 'destructive' as const,
          className: cn(
            'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
            isSuspensionExpired && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
          ),
          icon: AlertTriangle,
          label: isSuspensionExpired ? 'Suspension Expired' : 'Suspended',
          tooltip: suspendedUntil 
            ? `Suspended until ${format(new Date(suspendedUntil), 'PPp')}${suspensionReason ? `. Reason: ${suspensionReason}` : ''}`
            : `Suspended indefinitely${suspensionReason ? `. Reason: ${suspensionReason}` : ''}`,
        };
      
      case 'locked':
        return {
          variant: 'destructive' as const,
          className: cn(
            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
            isLockExpired && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
          ),
          icon: Lock,
          label: isLockExpired ? 'Lock Expired' : 'Locked',
          tooltip: lockedUntil 
            ? `Account locked until ${format(new Date(lockedUntil), 'PPp')}`
            : 'Account locked indefinitely',
        };
      
      default:
        return {
          variant: 'outline' as const,
          className: '',
          icon: XCircle,
          label: status,
          tooltip: `Status: ${status}`,
        };
    }
  };

  const getRoleConfig = () => {
    switch (role) {
      case 'admin':
        return {
          className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
          icon: Shield,
          label: 'Admin',
          tooltip: 'Administrator with full system access',
        };
      
      case 'facility_manager':
        return {
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
          icon: Shield,
          label: 'Facility Manager',
          tooltip: 'Facility manager with limited administrative access',
        };
      
      default:
        return {
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
          icon: UserIcon,
          label: 'User',
          tooltip: 'Regular user with standard access',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const roleConfig = getRoleConfig();
  const StatusIcon = statusConfig.icon;
  const RoleIcon = roleConfig.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-1', className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={statusConfig.variant}
              className={cn(
                statusConfig.className,
                sizeClasses[size],
                'flex items-center gap-1 font-medium border'
              )}
            >
              <StatusIcon className={iconSizes[size]} />
              {statusConfig.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{statusConfig.tooltip}</p>
          </TooltipContent>
        </Tooltip>

        {showRole && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline"
                className={cn(
                  roleConfig.className,
                  sizeClasses[size],
                  'flex items-center gap-1 font-medium border'
                )}
              >
                <RoleIcon className={iconSizes[size]} />
                {roleConfig.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{roleConfig.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

// Simplified version for table cells
export function UserStatusIndicator({ 
  status, 
  suspendedUntil, 
  lockedUntil 
}: Pick<UserStatusBadgeProps, 'status' | 'suspendedUntil' | 'lockedUntil'>) {
  const now = new Date();
  const isSuspensionExpired = suspendedUntil && isAfter(now, new Date(suspendedUntil));
  const isLockExpired = lockedUntil && isAfter(now, new Date(lockedUntil));

  const getIndicatorConfig = () => {
    switch (status) {
      case 'active':
        return {
          color: 'text-green-600',
          icon: CheckCircle,
          label: 'Active',
        };
      case 'inactive':
        return {
          color: 'text-gray-600',
          icon: XCircle,
          label: 'Inactive',
        };
      case 'suspended':
        return {
          color: isSuspensionExpired ? 'text-yellow-600' : 'text-orange-600',
          icon: AlertTriangle,
          label: isSuspensionExpired ? 'Suspension Expired' : 'Suspended',
        };
      case 'locked':
        return {
          color: isLockExpired ? 'text-yellow-600' : 'text-red-600',
          icon: Lock,
          label: isLockExpired ? 'Lock Expired' : 'Locked',
        };
      default:
        return {
          color: 'text-gray-600',
          icon: XCircle,
          label: status,
        };
    }
  };

  const config = getIndicatorConfig();
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-1', config.color)}>
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}
