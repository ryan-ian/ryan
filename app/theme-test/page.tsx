"use client"

import React from 'react'
import { ThemeDebug } from '@/components/ui/theme-debug'
import { ThemeTest } from '@/components/ui/theme-test'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function ThemeTestPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">🔄 Theme Toggle Test Lab</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This page is designed to test the new theme toggle functionality.
          The theme switcher now uses a simple toggle behavior instead of a dropdown menu.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <div className="text-sm text-muted-foreground">
            Theme switcher is now in the header →
          </div>
          <Button asChild variant="outline">
            <Link href="/">← Back to Home</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        {/* Debug Tool */}
        <ThemeDebug />
        
        {/* Original Test Component */}
        <ThemeTest />
      </div>

      {/* Additional Test Elements */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Additional UI Tests</CardTitle>
          <CardDescription>
            Test various UI elements to ensure they remain interactive after theme changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="Test input field"
              className="w-full p-2 border rounded-md bg-background text-foreground"
            />
            <select className="w-full p-2 border rounded-md bg-background text-foreground">
              <option>Test select option 1</option>
              <option>Test select option 2</option>
            </select>
            <textarea 
              placeholder="Test textarea"
              className="w-full p-2 border rounded-md bg-background text-foreground"
              rows={3}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="#" className="text-blue-600 hover:underline">Test Link 1</Link>
            <Link href="#" className="text-blue-600 hover:underline">Test Link 2</Link>
            <Link href="#" className="text-blue-600 hover:underline">Test Link 3</Link>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>Locate Theme Toggle:</strong> Look in the header (top-right area) for the sun/moon icon button - it's now a simple toggle button
            </li>
            <li>
              <strong>Test Toggle Action:</strong> Click the theme switcher icon and verify it instantly switches between light and dark themes
            </li>
            <li>
              <strong>Toggle Logic Test:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Light theme → Click → Dark theme</li>
                <li>Dark theme → Click → Light theme</li>
                <li>System theme → Click → Opposite of system preference</li>
              </ul>
            </li>
            <li>
              <strong>Post-Toggle Test:</strong> After each theme toggle, test all interactive elements on this page to ensure they remain responsive
            </li>
            <li>
              <strong>Multiple Toggles:</strong> Click the toggle multiple times rapidly to test consistency and performance
            </li>
            <li>
              <strong>Console Check:</strong> Open browser dev tools and check for any JavaScript errors
            </li>
            <li>
              <strong>Cross-Page Test:</strong> Navigate to other pages and test the header theme toggle there too
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
