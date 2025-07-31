import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface RoleBadgeProps {
  role: 'user' | 'admin' | 'facility_manager'
  variant?: 'default' | 'secondary' | 'outline'
  className?: string
}

export function RoleBadge({ role, variant = 'default', className }: RoleBadgeProps) {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator'
      case 'facility_manager':
        return 'Facility Manager'
      case 'user':
      default:
        return 'User'
    }
  }

  const getRoleStyles = (role: string, variant: string) => {
    const baseStyles = 'font-medium'
    
    if (variant === 'outline') {
      switch (role) {
        case 'admin':
          return cn(baseStyles, 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-300')
        case 'facility_manager':
          return cn(baseStyles, 'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300')
        case 'user':
        default:
          return cn(baseStyles, 'border-brand-teal-200 text-brand-teal-700 dark:border-brand-teal-800 dark:text-brand-teal-300')
      }
    }
    
    if (variant === 'secondary') {
      switch (role) {
        case 'admin':
          return cn(baseStyles, 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200')
        case 'facility_manager':
          return cn(baseStyles, 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200')
        case 'user':
        default:
          return cn(baseStyles, 'bg-brand-teal-100 text-brand-teal-800 dark:bg-brand-teal-900 dark:text-brand-teal-200')
      }
    }
    
    // Default variant
    switch (role) {
      case 'admin':
        return cn(baseStyles, 'bg-red-600 text-white dark:bg-red-700')
      case 'facility_manager':
        return cn(baseStyles, 'bg-amber-600 text-white dark:bg-amber-700')
      case 'user':
      default:
        return cn(baseStyles, 'bg-brand-teal-600 text-white dark:bg-brand-teal-700')
    }
  }

  return (
    <Badge 
      variant={variant}
      className={cn(getRoleStyles(role, variant), className)}
    >
      {getRoleLabel(role)}
    </Badge>
  )
}