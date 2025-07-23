'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, ReactNode } from 'react'

interface ReactQueryProviderProps {
  children: ReactNode
}

export default function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time of 5 minutes for all queries
        staleTime: 5 * 60 * 1000,
        // Cache data for 1 hour
        gcTime: 60 * 60 * 1000,
        // Retry failed queries 1 time
        retry: 1,
        // Don't refetch on window focus by default
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
} 