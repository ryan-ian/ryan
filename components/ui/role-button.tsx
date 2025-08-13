import React from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRoleTheme, getRoleColors } from '@/contexts/theme-context'

interface RoleButtonProps extends ButtonProps {
  useRoleColors?: boolean
}

export function RoleButton({ 
  useRoleColors = false, 
  className, 
  variant = 'default',
  ...props 
}: RoleButtonProps) {
  const { role } = useRoleTheme()
  
  if (!useRoleColors) {
    return <Button variant={variant} className={className} {...props} />
  }

  const roleColors = getRoleColors(role)
  
  const getRoleButtonStyles = () => {
    switch (variant) {
      case 'outline':
        return cn(
          'border-2',
          roleColors.border,
          roleColors.text,
          'hover:bg-opacity-10 hover:bg-current'
        )
      case 'secondary':
        return cn(roleColors.secondary, roleColors.text)
      case 'ghost':
        return cn(
          'hover:bg-opacity-10 hover:bg-current',
          roleColors.text
        )
      case 'link':
        return cn(roleColors.text, 'underline-offset-4 hover:underline')
      case 'default':
      default:
        return roleColors.primary
    }
  }

  return (
    <Button 
      variant={variant}
      className={cn(getRoleButtonStyles(), className)} 
      {...props} 
    />
  )
}