"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from 'next-themes'
import { useRoleTheme } from '@/contexts/theme-context'

interface DebugInfo {
  lastClick?: string
  clicksWorking?: boolean
  bodyClasses?: string
  htmlClasses?: string
  pointerEvents?: string
  zIndex?: string
  position?: string
  overflow?: string
  themeChangeTime?: string
  currentTheme?: string
  resolvedTheme?: string
  systemTheme?: string
  role?: string
}

export function ThemeDebug() {
  const [clickCount, setClickCount] = useState(0)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({})
  const [eventListeners, setEventListeners] = useState<number>(0)
  const { theme, systemTheme, resolvedTheme, setTheme } = useTheme()
  const { role } = useRoleTheme()

  const handleTestClick = () => {
    setClickCount(prev => prev + 1)
    console.log('✅ Theme test button clicked:', clickCount + 1)

    // Check if event handling is working
    const now = new Date().toLocaleTimeString()
    setDebugInfo((prev: DebugInfo) => ({
      ...prev,
      lastClick: now,
      clicksWorking: true
    }))
  }

  const handleDirectThemeChange = (newTheme: string) => {
    console.log('🎨 Direct theme change to:', newTheme)
    setTheme(newTheme)
  }

  const handleToggleTest = () => {
    console.log('🔄 Testing theme toggle behavior')
    // This will test the same toggle logic as the header component
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("light")
    } else if (theme === "system") {
      const currentSystemTheme = resolvedTheme
      if (currentSystemTheme === "light") {
        setTheme("dark")
      } else {
        setTheme("light")
      }
    } else {
      setTheme("dark")
    }
  }

  // Monitor DOM and event system
  useEffect(() => {
    const checkEventSystem = () => {
      try {
        // Check if document has event listeners
        const bodyListeners = (document.body as any)._events || {}
        const docListeners = (document as any)._events || {}
        
        setEventListeners(Object.keys(bodyListeners).length + Object.keys(docListeners).length)
        
        // Check DOM state
        setDebugInfo((prev: DebugInfo) => ({
          ...prev,
          bodyClasses: document.body.className,
          htmlClasses: document.documentElement.className,
          pointerEvents: window.getComputedStyle(document.body).pointerEvents,
          zIndex: window.getComputedStyle(document.body).zIndex,
          position: window.getComputedStyle(document.body).position,
          overflow: window.getComputedStyle(document.body).overflow
        }))
      } catch (error) {
        console.error('Debug check error:', error)
      }
    }

    checkEventSystem()
    const interval = setInterval(checkEventSystem, 1000)

    return () => clearInterval(interval)
  }, [theme])

  // Monitor theme changes
  useEffect(() => {
    console.log('🔄 Theme changed:', { theme, resolvedTheme, systemTheme, role })
    
    setDebugInfo((prev: DebugInfo) => ({
      ...prev,
      themeChangeTime: new Date().toLocaleTimeString(),
      currentTheme: theme,
      resolvedTheme,
      systemTheme,
      role
    }))
  }, [theme, resolvedTheme, systemTheme, role])

  const currentTheme = theme === 'system' ? systemTheme : theme

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Theme Switching Debug Tool</CardTitle>
        <CardDescription>
          Monitor theme changes and UI responsiveness
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Current Theme: {currentTheme}</p>
            <p className="text-sm text-muted-foreground">Role: {role}</p>
            <p className="text-sm text-muted-foreground">Resolved: {resolvedTheme}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Click Count: {clickCount}</p>
            <p className="text-sm text-muted-foreground">Event Listeners: {eventListeners}</p>
            <p className="text-sm text-muted-foreground">
              Last Click: {debugInfo.lastClick || 'None'}
            </p>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleTestClick}
            className="w-full"
            variant="default"
          >
            🧪 Test Click Responsiveness (Count: {clickCount})
          </Button>

          <Button
            onClick={handleToggleTest}
            className="w-full"
            variant="secondary"
          >
            🔄 Test Theme Toggle (Same as Header)
          </Button>

          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => handleDirectThemeChange("light")}
              variant="outline"
              size="sm"
            >
              ☀️ Light
            </Button>
            <Button
              onClick={() => handleDirectThemeChange("dark")}
              variant="outline"
              size="sm"
            >
              🌙 Dark
            </Button>
            <Button
              onClick={() => handleDirectThemeChange("system")}
              variant="outline"
              size="sm"
            >
              💻 System
            </Button>
          </div>
        </div>

        {/* Debug Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">🔍 Debug Information:</h4>
          <div className="text-xs bg-muted p-3 rounded-lg font-mono">
            <div>Body Classes: {debugInfo.bodyClasses}</div>
            <div>HTML Classes: {debugInfo.htmlClasses}</div>
            <div>Pointer Events: {debugInfo.pointerEvents}</div>
            <div>Z-Index: {debugInfo.zIndex}</div>
            <div>Position: {debugInfo.position}</div>
            <div>Overflow: {debugInfo.overflow}</div>
            <div>Theme Change Time: {debugInfo.themeChangeTime}</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
          <p className="font-medium mb-1">🧪 Testing Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click the test button to verify responsiveness</li>
            <li>Use direct theme buttons to change themes</li>
            <li>Check if click count still increases after theme change</li>
            <li>Monitor debug info for any anomalies</li>
            <li>Check browser console for errors</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
