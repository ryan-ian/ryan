"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, RefreshCw, CheckCircle, AlertCircle, Users, Loader2 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

function VerifyEmailContent() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailParam = searchParams.get('email')
    const storedEmail = localStorage.getItem('verification-email')
    
    if (emailParam) {
      setEmail(emailParam)
      localStorage.setItem('verification-email', emailParam)
    } else if (storedEmail) {
      setEmail(storedEmail)
    } else {
      // If no email found, redirect to signup
      router.push('/signup')
    }
  }, [searchParams, router])

  const handleResendVerification = async () => {
    if (!email) return
    
    setResendLoading(true)
    setMessage("")
    setError("")

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage("Verification email sent! Please check your inbox.")
      }
    } catch (err) {
      setError("Failed to resend verification email. Please try again.")
      console.error(err)
    }

    setResendLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-600 via-brand-navy-700 to-brand-navy-800">
          <div className="absolute inset-0 bg-[url('/images/conference-room-bg.jpg')] bg-cover bg-center opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-900/80 via-brand-navy-800/40 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-20 text-white">
          <div className="max-w-lg space-y-8 animate-fadeIn">
            {/* Logo/Brand */}
            <div className="flex items-center gap-4 mb-12">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-400/20 to-teal-600/20 backdrop-blur-md border border-white/10 shadow-2xl">
                <Users className="h-10 w-10 text-teal-300" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Conference Hub</h1>
                <p className="text-teal-200 text-base font-medium">Smart Room Booking Platform</p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Almost there!</h2>
              <p className="text-lg text-slate-200 leading-relaxed">
                We've sent a verification email to secure your account. Once verified, you'll have access to:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                  <CheckCircle className="h-6 w-6 text-teal-300 flex-shrink-0" />
                  <span className="text-white font-medium">Book conference rooms instantly</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                  <CheckCircle className="h-6 w-6 text-teal-300 flex-shrink-0" />
                  <span className="text-white font-medium">Manage your bookings</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                  <CheckCircle className="h-6 w-6 text-teal-300 flex-shrink-0" />
                  <span className="text-white font-medium">Real-time room availability</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Verification Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-brand-navy-500 to-brand-navy-600 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-brand-navy-900 dark:text-white">Conference Hub</h1>
                <p className="text-brand-navy-600 dark:text-slate-400 text-sm">Smart Room Booking</p>
              </div>
            </div>
          </div>

          <Card className="border-0 shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md">
            <CardHeader className="text-center pb-8 pt-10 px-10">
              <div className="mx-auto mb-6 p-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                <Mail className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Check Your Email</CardTitle>
              <CardDescription className="text-slate-600 text-lg font-medium dark:text-slate-300 mt-3">
                We've sent a verification link to your email address
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-10 px-10 space-y-6">
              {/* Email Display */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Email sent to:</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white break-all">{email}</p>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">Next steps:</h3>
                <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Check your email inbox for a message from Conference Hub</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Click the verification link in the email</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>You'll be redirected back to Conference Hub to complete setup</span>
                  </li>
                </ol>
              </div>

              {/* Messages */}
              {message && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Resend Button */}
              <Button
                onClick={handleResendVerification}
                disabled={resendLoading}
                variant="outline"
                className="w-full h-12 text-base font-semibold border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400"
              >
                {resendLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Resend Verification Email
                  </>
                )}
              </Button>

              {/* Help Text */}
              <div className="text-center space-y-3 pt-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Didn't receive the email? Check your spam folder or try resending.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Wrong email address?{" "}
                  <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Sign up again
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md">
          <CardContent className="p-10 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
