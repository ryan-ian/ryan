"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './auth-context'

type UserRole = 'user' | 'admin' | 'facility_manager'

interface ThemeContextType {
  role: UserRole
  setThemeRole: (role: UserRole) => void
  getThemeClass: () => string
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [role, setRole] = useState<UserRole>('user')

  useEffect(() => {
    if (user?.role) {
      // Map user roles to theme roles
      const themeRole = user.role === 'facility_manager' ? 'facility_manager' : 
                       user.role === 'admin' ? 'admin' : 'user'
      setRole(themeRole)
    }
  }, [user?.role])

  const setThemeRole = (newRole: UserRole) => {
    setRole(newRole)
  }

  const getThemeClass = () => {
    switch (role) {
      case 'admin':
        return 'theme-admin'
      case 'facility_manager':
        return 'theme-manager'
      case 'user':
      default:
        return 'theme-user'
    }
  }

  useEffect(() => {
    // Apply theme class to document body
    const themeClass = getThemeClass()
    document.body.classList.remove('theme-user', 'theme-admin', 'theme-manager')
    document.body.classList.add(themeClass)
    
    return () => {
      document.body.classList.remove('theme-user', 'theme-admin', 'theme-manager')
    }
  }, [role])

  return (
    <ThemeContext.Provider value={{ role, setThemeRole, getThemeClass }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Role-based color utilities
export const getRoleColors = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return {
        primary: 'bg-red-600 hover:bg-red-700',
        secondary: 'bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        ring: 'ring-red-500',
        badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }
    case 'facility_manager':
      return {
        primary: 'bg-amber-600 hover:bg-amber-700',
        secondary: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        ring: 'ring-amber-500',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
      }
    case 'user':
    default:
      return {
        primary: 'bg-brand-teal-500 hover:bg-brand-teal-600',
        secondary: 'bg-brand-teal-50 hover:bg-brand-teal-100 dark:bg-brand-teal-950 dark:hover:bg-brand-teal-900',
        text: 'text-brand-teal-600 dark:text-brand-teal-400',
        border: 'border-brand-teal-200 dark:border-brand-teal-800',
        ring: 'ring-brand-teal-500',
        badge: 'bg-brand-teal-100 text-brand-teal-800 dark:bg-brand-teal-900 dark:text-brand-teal-200'
      }
  }
}