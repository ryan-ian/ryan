"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ResetPasswordForm } from "@/components/forms/reset-password-form"
import Image from "next/image"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

export default function ResetPasswordPage() {
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionEstablished, setSessionEstablished] = useState(false)

  useEffect(() => {
    const handleAuthSession = async () => {
      try {
        // Check both URL hash (fragment) and search params for tokens
        // Supabase ConfirmationURL might use either format
        let accessToken = null
        let refreshToken = null
        let type = null

        // Check URL hash first (fragment-based)
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          accessToken = hashParams.get('access_token')
          refreshToken = hashParams.get('refresh_token')
          type = hashParams.get('type')
        }

        // If not found in hash, check query parameters
        if (!accessToken) {
          const searchParams = new URLSearchParams(window.location.search)
          accessToken = searchParams.get('access_token')
          refreshToken = searchParams.get('refresh_token')
          type = searchParams.get('type')
        }

        // Also check for 'token' parameter (some Supabase configurations use this)
        if (!accessToken) {
          const searchParams = new URLSearchParams(window.location.search)
          accessToken = searchParams.get('token')
          type = searchParams.get('type') || 'recovery'
        }

        console.log('Extracted tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type })

        if (type !== 'recovery') {
          setSessionError("Invalid password reset link. Please request a new password reset.")
          setSessionLoading(false)
          return
        }

        if (!accessToken) {
          setSessionError("Invalid password reset link. Missing authentication token.")
          setSessionLoading(false)
          return
        }

        // Set the session with the tokens from the URL
        const sessionData: any = { access_token: accessToken }
        if (refreshToken) {
          sessionData.refresh_token = refreshToken
        }

        const { data, error } = await supabase.auth.setSession(sessionData)

        if (error) {
          console.error('Error setting session:', error)
          setSessionError("Failed to authenticate. Please request a new password reset.")
          setSessionLoading(false)
          return
        }

        if (data.session) {
          console.log('Session established successfully')
          setSessionEstablished(true)
        } else {
          setSessionError("Failed to establish session. Please request a new password reset.")
        }
      } catch (error) {
        console.error('Error handling auth session:', error)
        setSessionError("An unexpected error occurred. Please try again.")
      } finally {
        setSessionLoading(false)
      }
    }

    handleAuthSession()
  }, [])

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-600" />
          <p className="text-slate-600 dark:text-slate-400">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm dark:bg-slate-800/95">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Invalid Reset Link
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {sessionError}
              </p>
              <div className="space-y-3">
                <Link
                  href="/auth/forgot-password"
                  className="block w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300"
                >
                  Request New Reset Link
                </Link>
                <Link
                  href="/login"
                  className="block text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Left Side - Hero Section with Image and Branding */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        {/* Background Image with Blur Effect */}
        <div className="absolute inset-0">
          <Image
            src="/room-business-meeting.jpg"
            alt="Modern conference room"
            fill
            className="object-cover filter blur-[1px]"
            priority
          />
          {/* Enhanced Gradient Overlay - Responsive to theme */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-800/75 to-teal-900/80 dark:from-slate-950/90 dark:via-slate-900/85 dark:to-teal-950/85"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent dark:from-slate-950/95 dark:via-transparent dark:to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-20 text-white">
          {/* Logo and Brand */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-500/30">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-teal-200 bg-clip-text text-transparent">
                  Conference Hub
                </h1>
                <p className="text-teal-200 text-lg font-medium">Smart Room Booking Platform</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-md">
            <h2 className="text-5xl font-bold mb-8 leading-tight">
              Create New Password
            </h2>
            <p className="text-xl text-slate-200 mb-10 leading-relaxed">
              Choose a strong, secure password to protect your account and ensure seamless access to your workspace management tools.
            </p>

            {/* Feature List */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Strong Security</h3>
                  <p className="text-slate-300">Advanced encryption protects your new password</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Instant Access</h3>
                  <p className="text-slate-300">Immediately access your account after reset</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Password Guidelines</h3>
                  <p className="text-slate-300">Real-time validation helps create a secure password</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-slate-700/50">
            <p className="text-slate-400 text-sm mb-4">Trusted by teams at</p>
            <div className="flex gap-8 text-slate-500 text-sm font-medium">
              <span>Fortune 500 Companies</span>
              <span>•</span>
              <span>Startups</span>
              <span>•</span>
              <span>Universities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl shadow-slate-900/10 bg-white/95 backdrop-blur-sm dark:bg-slate-800/95 dark:shadow-slate-950/20">
            <CardHeader className="pb-8 pt-10 px-10">
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-center text-slate-900 mb-3 dark:text-slate-100">
                Set New Password
              </CardTitle>
              <CardDescription className="text-center text-slate-600 text-lg leading-relaxed dark:text-slate-400">
                Create a strong password for your account security
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10 px-10">
              <ResetPasswordForm />

              <div className="mt-8 pt-8 border-t border-slate-200 text-center space-y-6 dark:border-slate-600">
                <Link
                  href="/login"
                  className="inline-flex items-center text-slate-500 hover:text-slate-700 transition-colors gap-2 text-base font-medium dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
