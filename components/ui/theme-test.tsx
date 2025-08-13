"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { useTheme } from 'next-themes'
import { useRoleTheme } from '@/contexts/theme-context'

export function ThemeTest() {
  const [clickCount, setClickCount] = useState(0)
  const { theme, systemTheme } = useTheme()
  const { role } = useRoleTheme()

  const handleTestClick = () => {
    setClickCount(prev => prev + 1)
    console.log('Theme test button clicked:', clickCount + 1)
  }

  const currentTheme = theme === 'system' ? systemTheme : theme

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Theme Switching Test</CardTitle>
        <CardDescription>
          Test that theme switching doesn't break UI interactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Theme Info */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium">Current Theme: {currentTheme}</p>
          <p className="text-sm text-muted-foreground">Role Theme: {role}</p>
        </div>

        {/* Theme Switcher Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">🔄 Theme Toggle Behavior</p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            The theme switcher is now a simple toggle button in the header (top-right area).
            Click it to cycle between light and dark themes instantly - no dropdown menu!
          </p>
        </div>

        {/* Toggle Test Instructions */}
        <div className="text-xs text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-950/20 rounded">
          <p className="font-medium">✨ Toggle Test:</p>
          <p>Click the sun/moon icon in the header to instantly switch between light and dark themes.</p>
        </div>

        {/* Additional Theme Switcher for Testing */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Test Theme Switcher (Standalone):</span>
          <ThemeSwitcher />
        </div>

        {/* Test Button */}
        <Button 
          onClick={handleTestClick}
          className="w-full"
          variant="default"
        >
          Test Click (Count: {clickCount})
        </Button>

        {/* Additional Test Elements */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full">
            Outline Button Test
          </Button>
          <Button variant="secondary" className="w-full">
            Secondary Button Test
          </Button>
          <Button variant="ghost" className="w-full">
            Ghost Button Test
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
          <p className="font-medium mb-1">Test Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click the theme switcher to change themes</li>
            <li>Try clicking all buttons after theme change</li>
            <li>Verify all interactions still work</li>
            <li>Check that click count increases</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
