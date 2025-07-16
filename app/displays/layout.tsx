"use client"

import { useEffect } from "react"
import "../globals.css"

export default function DisplaysLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Prevent screen from sleeping when display is active
  useEffect(() => {
    // Request a wake lock to keep screen on
    const requestWakeLock = async () => {
      try {
        // @ts-ignore - WakeLock API is not fully typed in TypeScript yet
        if ('wakeLock' in navigator) {
          // @ts-ignore
          const wakeLock = await navigator.wakeLock.request('screen')
          
          // Release wake lock when page is hidden
          const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && wakeLock) {
              wakeLock.release()
                .then(() => console.log('Wake lock released'))
                .catch((err) => console.error(`Failed to release wake lock: ${err.name}, ${err.message}`))
            } else if (document.visibilityState === 'visible') {
              requestWakeLock()
            }
          }
          
          document.addEventListener('visibilitychange', handleVisibilityChange)
          
          return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            if (wakeLock) {
              wakeLock.release()
                .then(() => console.log('Wake lock released on cleanup'))
                .catch((err) => console.error(`Failed to release wake lock on cleanup: ${err.name}, ${err.message}`))
            }
          }
        }
      } catch (err) {
        console.error(`Failed to request wake lock: ${err}`)
      }
    }
    
    requestWakeLock()
  }, [])
  
  return (
    <div className="h-full w-full overflow-hidden bg-background text-foreground">
      {children}
    </div>
  )
} 