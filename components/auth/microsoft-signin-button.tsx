"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

interface MicrosoftSignInButtonProps {
  className?: string
  disabled?: boolean
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  children?: React.ReactNode
}

export function MicrosoftSignInButton({ 
  className = "", 
  disabled = false, 
  variant = "outline",
  children 
}: MicrosoftSignInButtonProps) {
  const { signInWithMicrosoft } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleMicrosoftSignIn = async () => {
    try {
      setLoading(true)
      await signInWithMicrosoft()
      // The OAuth flow will redirect to Microsoft, then back to our callback
    } catch (error) {
      console.error('Microsoft sign-in failed:', error)
      toast.error('Failed to sign in with Microsoft. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleMicrosoftSignIn}
      disabled={disabled || loading}
      variant={variant}
      className={`w-full ${className}`}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
        </svg>
      )}
      {children || "Sign in with Microsoft"}
    </Button>
  )
}
