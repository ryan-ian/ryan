'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

interface EnhancedThemeProviderProps extends ThemeProviderProps {
  children: React.ReactNode
}

export function EnhancedThemeProvider({ children, ...props }: EnhancedThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  // Ensure component is mounted before rendering to prevent hydration issues
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent theme-related hydration mismatches
  if (!mounted) {
    return (
      <div suppressHydrationWarning>
        {children}
      </div>
    )
  }

  return (
    <NextThemesProvider 
      {...props}
      // Enhanced configuration to prevent conflicts
      storageKey="conference-hub-theme"
      enableColorScheme={false}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  )
}
