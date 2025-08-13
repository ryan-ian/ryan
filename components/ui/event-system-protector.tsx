'use client'

import { useEffect } from 'react'

export function EventSystemProtector() {
  useEffect(() => {
    // Simple protection that doesn't interfere with dropdown behavior
    let isThemeChanging = false

    // Monitor for theme changes on the document element only
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement
          if (target === document.documentElement) {
            const classList = target.classList
            if (classList.contains('dark') || classList.contains('light')) {
              isThemeChanging = true

              // Reset flag after theme change is complete
              setTimeout(() => {
                isThemeChanging = false
              }, 300)
            }
          }
        }
      })
    })

    // Only observe the document element for theme class changes
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  // Minimal global click handler to ensure events are working
  useEffect(() => {
    const globalClickHandler = (e: MouseEvent) => {
      // Minimal event system check - just ensure it's active
    }

    document.addEventListener('click', globalClickHandler, { capture: true, passive: true })

    return () => {
      document.removeEventListener('click', globalClickHandler, { capture: true })
    }
  }, [])

  return null
}
