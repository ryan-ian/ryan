"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const handleThemeToggle = React.useCallback(() => {
    try {
      // Toggle logic based on current theme
      if (theme === "light") {
        setTheme("dark")
      } else if (theme === "dark") {
        setTheme("light")
      } else if (theme === "system") {
        // If system theme, toggle to the opposite of current system preference
        const currentSystemTheme = resolvedTheme
        if (currentSystemTheme === "light") {
          setTheme("dark")
        } else {
          setTheme("light")
        }
      } else {
        // Fallback: if theme is undefined or unknown, set to dark
        setTheme("dark")
      }
    } catch (error) {
      console.error('Theme toggle error:', error)
    }
  }, [theme, resolvedTheme, setTheme])

  return (
    <Button variant="outline" size="icon" onClick={handleThemeToggle}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}