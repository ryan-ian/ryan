'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function DisplaysStyleHandler() {
  const pathname = usePathname()
  const isDisplaysRoute = pathname?.includes('/displays')
  
  useEffect(() => {
    if (isDisplaysRoute) {
      document.documentElement.classList.add('h-full')
      document.body.classList.add('h-full', 'overflow-hidden')
    } else {
      document.documentElement.classList.remove('h-full')
      document.body.classList.remove('h-full', 'overflow-hidden')
    }
    
    return () => {
      document.documentElement.classList.remove('h-full')
      document.body.classList.remove('h-full', 'overflow-hidden')
    }
  }, [isDisplaysRoute])
  
  return null
} 