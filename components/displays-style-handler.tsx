'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function DisplaysStyleHandler() {
  const pathname = usePathname()
  const isDisplaysRoute = pathname?.includes('/displays')
  
  useEffect(() => {
    // Use multiple strategies to prevent conflicts with theme switching
    const applyStyles = () => {
      try {
        if (isDisplaysRoute) {
          document.documentElement.classList.add('h-full')
          document.body.classList.add('h-full', 'overflow-hidden')
        } else {
          document.documentElement.classList.remove('h-full')
          document.body.classList.remove('h-full', 'overflow-hidden')
        }
      } catch (error) {
        console.error('Display styles error:', error)
      }
    }

    // Delay to avoid conflicts with theme changes
    const timeoutId = setTimeout(() => {
      const frameId = requestAnimationFrame(applyStyles)

      return () => {
        cancelAnimationFrame(frameId)
      }
    }, 10)

    return () => {
      clearTimeout(timeoutId)
      // Clean up on unmount
      try {
        document.documentElement.classList.remove('h-full')
        document.body.classList.remove('h-full', 'overflow-hidden')
      } catch (error) {
        console.error('Display styles cleanup error:', error)
      }
    }
  }, [isDisplaysRoute])
  
  return null
} 