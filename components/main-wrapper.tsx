'use client'

import { usePathname } from 'next/navigation'

interface MainWrapperProps {
  children: React.ReactNode
}

export function MainWrapper({ children }: MainWrapperProps) {
  const pathname = usePathname()
  const isDisplaysRoute = pathname?.includes('/displays')
  
  return (
    <main className={isDisplaysRoute ? "h-full" : "min-h-screen"}>
      {children}
    </main>
  )
} 