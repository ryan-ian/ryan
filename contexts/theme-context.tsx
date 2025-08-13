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

export function RoleThemeProvider({ children }: { children: React.ReactNode }) {
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
    // Apply theme class to document body with proper cleanup
    const themeClass = getThemeClass()
    const allThemeClasses = ['theme-user', 'theme-admin', 'theme-manager']

    // Use multiple strategies to ensure DOM manipulation doesn't interfere with event handling
    const applyTheme = () => {
      try {
        // Batch DOM operations to minimize reflows
        const body = document.body
        const currentClasses = body.className.split(' ')

        // Remove old theme classes
        const newClasses = currentClasses.filter(cls => !allThemeClasses.includes(cls))

        // Add new theme class
        if (!newClasses.includes(themeClass)) {
          newClasses.push(themeClass)
        }

        // Apply all changes at once
        body.className = newClasses.join(' ')
      } catch (error) {
        console.error('Theme application error:', error)
        // Fallback to individual operations
        allThemeClasses.forEach(cls => document.body.classList.remove(cls))
        document.body.classList.add(themeClass)
      }
    }

    // Use both setTimeout and requestAnimationFrame for maximum compatibility
    const timeoutId = setTimeout(() => {
      const frameId = requestAnimationFrame(applyTheme)

      return () => {
        cancelAnimationFrame(frameId)
      }
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      // Clean up theme classes on unmount
      try {
        allThemeClasses.forEach(cls => document.body.classList.remove(cls))
      } catch (error) {
        console.error('Theme cleanup error:', error)
      }
    }
  }, [role])

  return (
    <ThemeContext.Provider value={{ role, setThemeRole, getThemeClass }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useRoleTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useRoleTheme must be used within a RoleThemeProvider')
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