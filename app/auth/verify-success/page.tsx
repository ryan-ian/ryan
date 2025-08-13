"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Users, ArrowRight, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function VerifySuccessPage() {
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get the token from URL hash or search params
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        if (type === 'signup' && accessToken && refreshToken) {
          // Set the session with the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error('Error setting session:', error)
            setError('Failed to verify email. Please try again.')
          } else {
            setVerified(true)
            // Clear any stored verification email
            localStorage.removeItem('verification-email')
          }
        } else {
          // Check if user is already verified
          const { data: { user } } = await supabase.auth.getUser()
          if (user && user.email_confirmed_at) {
            setVerified(true)
          } else {
            setError('Invalid verification link or email not verified.')
          }
        }
      } catch (err) {
        console.error('Verification error:', err)
        setError('An error occurred during verification.')
      } finally {
        setLoading(false)
      }
    }

    handleEmailVerification()
  }, [])

  const handleContinueToLogin = () => {
    router.push('/login')
  }

  const handleGoToDashboard = () => {
    router.push('/conference-room-booking')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md">
          <CardContent className="p-10 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Verifying your email...</p>
          </CardContent>
        </Card>
      </div>
    )
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

            {/* Success Message */}
            {verified ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Welcome to Conference Hub!</h2>
                <p className="text-lg text-slate-200 leading-relaxed">
                  Your email has been verified successfully. You now have full access to our platform and can start booking conference rooms right away.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                    <CheckCircle className="h-6 w-6 text-teal-300 flex-shrink-0" />
                    <span className="text-white font-medium">Email verified ✓</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                    <CheckCircle className="h-6 w-6 text-teal-300 flex-shrink-0" />
                    <span className="text-white font-medium">Account activated ✓</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                    <CheckCircle className="h-6 w-6 text-teal-300 flex-shrink-0" />
                    <span className="text-white font-medium">Ready to book rooms ✓</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Verification Issue</h2>
                <p className="text-lg text-slate-200 leading-relaxed">
                  There was an issue verifying your email address. Please try the verification process again or contact support if the problem persists.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Success/Error Content */}
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
            {verified ? (
              <>
                <CardHeader className="text-center pb-8 pt-10 px-10">
                  <div className="mx-auto mb-6 p-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Email Verified!</CardTitle>
                  <CardDescription className="text-slate-600 text-lg font-medium dark:text-slate-300 mt-3">
                    Your account has been successfully verified
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-10 px-10 space-y-6">
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      Your email has been verified successfully. You can now access all features of Conference Hub.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <Button
                      onClick={handleGoToDashboard}
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>

                    <Button
                      onClick={handleContinueToLogin}
                      variant="outline"
                      className="w-full h-12 text-base font-semibold border-2 border-slate-300 dark:border-slate-600"
                    >
                      Continue to Login
                    </Button>
                  </div>

                  <div className="text-center pt-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Need help getting started?{" "}
                      <Link href="/help" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                        View our guide
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader className="text-center pb-8 pt-10 px-10">
                  <div className="mx-auto mb-6 p-4 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30">
                    <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Verification Failed</CardTitle>
                  <CardDescription className="text-slate-600 text-lg font-medium dark:text-slate-300 mt-3">
                    There was an issue verifying your email
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-10 px-10 space-y-6">
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertDescription className="text-red-700 dark:text-red-300">
                      {error || "The verification link may be invalid or expired."}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <Button
                      onClick={() => router.push('/signup')}
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                    >
                      Try Signing Up Again
                    </Button>

                    <Button
                      onClick={handleContinueToLogin}
                      variant="outline"
                      className="w-full h-12 text-base font-semibold border-2 border-slate-300 dark:border-slate-600"
                    >
                      Go to Login
                    </Button>
                  </div>

                  <div className="text-center pt-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Need help?{" "}
                      <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                        Contact support
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
