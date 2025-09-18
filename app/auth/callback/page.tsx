"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { user, needsProfileCompletion, loading } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait for auth state to be determined
        if (loading) return

        if (!user) {
          // No user found after OAuth - something went wrong
          setStatus('error')
          setError('Authentication failed. Please try again.')
          return
        }

        // Auth successful
        setStatus('success')

        // Small delay for user feedback, then redirect
        setTimeout(() => {
          if (needsProfileCompletion) {
            // New user needs to complete profile
            router.push('/complete-profile')
          } else {
            // Existing user or profile complete - go to dashboard
            router.push('/conference-room-booking')
          }
        }, 1500)

      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setError('An unexpected error occurred during authentication.')
      }
    }

    handleCallback()
  }, [user, needsProfileCompletion, loading, router])

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Completing sign in...
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Please wait while we finish setting up your account.
              </p>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Sign in successful!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {needsProfileCompletion 
                  ? "Redirecting to complete your profile..." 
                  : "Redirecting to your dashboard..."
                }
              </p>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Sign in failed
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {error}
              </p>
              <button 
                onClick={() => router.push('/signin')}
                className="mt-4 text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Conference Hub
            </CardTitle>
            <CardDescription>
              Processing your authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
